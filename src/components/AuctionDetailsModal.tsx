import { useState, useEffect, useRef } from "react";
import { X, Clock, Award, History, ArrowUpRight, DollarSign, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { Auction, Bid, User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AuctionDetailsModalProps {
  auctionId: string | null;
  currentUser: User | null;
  onClose: () => void;
  onBidPlaced: (updatedAuction: Auction, newBalance: number) => void;
}

export default function AuctionDetailsModal({
  auctionId,
  currentUser,
  onClose,
  onBidPlaced,
}: AuctionDetailsModalProps) {
  const [data, setData] = useState<{ auction: Auction; bids: Bid[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load target item specifications
  const fetchDetails = async (showLoadingState = true) => {
    if (!auctionId) return;
    if (showLoadingState) setLoading(true);
    try {
      const response = await fetch(`/api/auctions/${auctionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("taskmaster_token")}`,
        },
      });
      if (response.ok) {
        const payload = await response.json();
        setData(payload);
        
        // Auto pre-populate minimum bid increment in input
        const minIncrement = Math.round(payload.auction.currentPrice * 1.015);
        setBidAmount(minIncrement.toString());
      }
    } catch (err) {
      console.error("Error fetching auction details:", err);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    if (auctionId) {
      fetchDetails(true);

      // Start SSE-style fast polling (polling every 3 seconds while modal is open to get instantaneous competitor bidding activity!)
      pollIntervalRef.current = setInterval(() => {
        fetchDetails(false);
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [auctionId]);

  // Real-time ticking down calendar handler
  useEffect(() => {
    if (!data?.auction) return;

    function calculateTime() {
      const end = new Date(data.auction.endsAt).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Auction Ended");
        return;
      }

      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      if (hrs > 0) {
        setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
      } else if (mins > 0) {
        setTimeLeft(`${mins}m ${secs}s`);
      } else {
        setTimeLeft(`${secs}s remaining`);
      }
    }

    calculateValueInterval();
    const interval = setInterval(calculateTime, 1000);

    function calculateValueInterval() {
      calculateTime();
    }

    return () => clearInterval(interval);
  }, [data?.auction]);

  if (!auctionId) return null;

  const handlePlaceBid = async (amount: number) => {
    if (!currentUser) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmittingBid(true);

    try {
      const response = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("taskmaster_token")}`,
        },
        body: JSON.stringify({ amount }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Failed to place bid on appraisal asset.");
      }

      setSuccessMsg(`Bid of $${amount.toLocaleString()} is active! Your ledger funds have been verified.`);
      
      // Instantly run internal UI sync
      onBidPlaced(body.auction, body.newBalance);
      
      // Reload detail tables locally
      fetchDetails(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Bidding rejected by matching engine.");
    } finally {
      setSubmittingBid(false);
    }
  };

  const currentPrice = data?.auction.currentPrice || 0;
  const minRequiredBid = Math.round(currentPrice * 1.015);
  const isSeller = currentUser?.id === data?.auction.sellerId;
  const isExpired = data?.auction ? new Date(data.auction.endsAt).getTime() < Date.now() : true;

  // Render priority names
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "ultra_rare":
        return "🔥 Ultra Rare Asset";
      case "featured":
        return "⭐ Featured Showcase";
      default:
        return "Standard Listing";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]"
      >
        {/* Toggle Closed button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-6 right-6 md:static m-3 md:hidden p-2 rounded-xl bg-white/70 backdrop-blur-xs text-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-sans p-8">
            <Loader2 className="h-9 w-9 animate-spin text-slate-900 mb-3" />
            <p className="text-xs tracking-wider uppercase font-medium">Downloading Ballroom Spec...</p>
          </div>
        ) : !data ? (
          <div className="flex-1 p-8 text-center flex flex-col items-center justify-center bg-slate-50 text-red-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">Failed to retrieve asset telemetry.</p>
          </div>
        ) : (
          <>
            {/* LEFT COLUMN: Large Preview and Specifications */}
            <div className="w-full md:w-[45%] bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden h-[40%] md:h-full">
              {/* background image overlay */}
              <div className="absolute inset-0 opacity-45 pointer-events-none">
                <img src={data.auction.image} alt={data.auction.title} className="w-full h-full object-cover filter blur-xs" />
              </div>

              {/* Header Content */}
              <div className="p-8 z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/10 rounded-full">
                    {data.auction.category}
                  </span>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                    data.auction.priority === "ultra_rare" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-white"
                  }`}>
                    {getPriorityLabel(data.auction.priority)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                    {data.auction.title}
                  </h2>
                  <p className="text-xs text-slate-300 font-mono">
                    Catalog ID: #{data.auction.id}
                  </p>
                </div>
              </div>

              {/* Product Visual Center */}
              <div className="flex-1 px-8 flex items-center justify-center z-10 max-h-[45%] md:max-h-none overflow-hidden my-2">
                <img
                  src={data.auction.image}
                  alt={data.auction.title}
                  referrerPolicy="no-referrer"
                  className="max-h-full rounded-2xl border border-white/10 shadow-2xl object-cover aspect-video md:aspect-square w-full"
                />
              </div>

              {/* Specifications Footer */}
              <div className="p-8 border-t border-white/15 bg-slate-950/80 backdrop-blur-md z-15">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Seller Account</span>
                    <span className="text-xs font-semibold text-slate-100">@{data.auction.sellerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Opening Price</span>
                    <span className="text-xs font-semibold text-slate-100">${data.auction.startingPrice.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-300 font-normal leading-relaxed line-clamp-3">
                    {data.auction.description}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Ledger & Bid Interaction */}
            <div className="flex-1 bg-white p-6 md:p-8 flex flex-col justify-between h-[60%] md:h-full overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current High Value</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl md:text-3xl font-extrabold text-slate-950 font-sans">
                      ${currentPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      +{Math.round((currentPrice - data.auction.startingPrice) / data.auction.startingPrice * 100 || 0)}%
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                  <Clock className={`h-4.5 w-4.5 ${isExpired ? "text-red-500" : "text-slate-900 animate-pulse"}`} />
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Remaining time</p>
                    <p className={`text-xs font-bold font-mono tracking-tight ${isExpired ? "text-red-600" : "text-slate-950"}`}>
                      {timeLeft}
                    </p>
                  </div>
                </div>

                {/* Deskop close */}
                <button
                  onClick={onClose}
                  type="button"
                  className="hidden md:block p-1 bg-slate-50 hover:bg-slate-150 text-slate-400 hover:text-slate-900 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Interactive Bid Ledger list */}
              <div className="flex-1 py-5 overflow-y-auto min-h-0 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Bidding History ({data.bids.length} entries)
                  </span>
                  <span>Ledger State</span>
                </div>

                {data.bids.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-150">
                    <Award className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium">Quiet Ballroom. No bids recorded yet.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Slight price starts at opening ${data.auction.startingPrice.toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.bids.map((bid, index) => {
                      const isUserBid = currentUser?.id === bid.bidderId;
                      const isSimulated = bid.id.startsWith("sim-bid");
                      const isHighest = index === 0;

                      return (
                        <div
                          key={bid.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                            isHighest 
                              ? "bg-slate-950/5 border-slate-950/10 shadow-xs" 
                              : "bg-white border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isUserBid 
                                ? "bg-slate-900 text-white" 
                                : isSimulated 
                                ? "bg-sky-50 text-sky-700" 
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {bid.bidderName.substring(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                                @{bid.bidderName}
                                {isUserBid && (
                                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-900 text-white rounded uppercase tracking-wider">
                                    You
                                  </span>
                                )}
                                {isSimulated && (
                                  <span className="px-1.5 py-0.5 text-[8px] text-slate-500 bg-slate-100 rounded uppercase tracking-wider">
                                    Sim
                                  </span>
                                )}
                              </p>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs font-bold font-mono tracking-tight block ${
                              isHighest ? "text-slate-900" : "text-slate-600"
                            }`}>
                              ${bid.amount.toLocaleString()}
                            </span>
                            <span className="text-[8px] text-slate-400 block uppercase tracking-wider mt-0.5">
                              {isHighest ? "⭐ High Bid" : "Displaced"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Interactive Bid Placer Tray */}
              <div className="pt-4 border-t border-slate-100 space-y-3.5">
                {errorMsg && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl leading-relaxed flex items-start gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl leading-relaxed">
                    {successMsg}
                  </div>
                )}

                {isSeller ? (
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                    <p className="text-xs font-semibold text-amber-800">You are the seller of this listing.</p>
                    <p className="text-[10px] text-slate-500 mt-1">Sellers are barred from placing bids to maintain high appraisal integrity.</p>
                  </div>
                ) : isExpired ? (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-center text-red-700 font-semibold text-xs leading-relaxed">
                    ⏰ This auction has ended. No more bids can be registered on this asset ledger.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Presets Increase buttons */}
                    <div className="flex items-center gap-2">
                      {[100, 500, 1000, 5000].map((increment) => {
                        const targetVal = currentPrice + increment;
                        return (
                          <button
                            key={increment}
                            type="button"
                            onClick={() => {
                              setBidAmount(targetVal.toString());
                              handlePlaceBid(targetVal);
                            }}
                            disabled={submittingBid}
                            className="flex-1 py-2 text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl border border-slate-200 transition"
                          >
                            +${increment.toLocaleString()}
                          </button>
                        );
                      })}
                    </div>

                    {/* Input manual bid and button */}
                    <div className="flex gap-2.5">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-3 text-slate-400 font-medium text-xs">$</span>
                        <input
                          type="number"
                          placeholder={`${minRequiredBid}`}
                          value={bidAmount}
                          disabled={submittingBid}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full pl-8 pr-3 px-3.5 py-3 rounded-2xl border border-slate-250 text-xs font-semibold text-slate-950 font-mono focus:outline-hidden focus:border-slate-950 transition bg-slate-50/50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePlaceBid(Number(bidAmount))}
                        disabled={submittingBid || !bidAmount}
                        className="px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl bg-slate-950 text-white hover:bg-slate-900 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {submittingBid ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Bidding...
                          </>
                        ) : (
                          <>
                            Place Bid
                            <ArrowUpRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-center text-slate-400">
                      Standard min threshold required is <strong className="text-slate-600">${minRequiredBid.toLocaleString()}</strong> (current price + 1.5% appraisal increment).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
