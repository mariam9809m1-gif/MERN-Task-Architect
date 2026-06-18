import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  Sparkles,
  Search,
  Plus,
  Loader2,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  Package,
  Clock,
  ExternalLink,
  Award,
  Wallet,
  BellRing
} from "lucide-react";
import { Auction } from "../types";
import CreateListingModal from "../components/CreateListingModal";
import AuctionDetailsModal from "../components/AuctionDetailsModal";
import { motion, AnimatePresence } from "motion/react";

export default function Dashboard() {
  const { user, logout, updateUserBalance, refreshUserProfile } = useAuth();
  
  // App UI State
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"catalog" | "my_listings">("catalog");
  const [recentBidsLogs, setRecentBidsLogs] = useState<Array<{ name: string; title: string; price: number }>>([]);

  // Modal Open states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);

  // Global event log polling reference
  const globalPollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all listings
  const fetchAuctions = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch("/api/auctions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("taskmaster_token")}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAuctions(data);

        // Map live logs dynamically from incoming items to build the platform ticker activity feed
        const generatedLogs: Array<{ name: string; title: string; price: number }> = [];
        data.forEach((auc: Auction) => {
          if (auc.highestBidderName) {
            generatedLogs.push({
              name: auc.highestBidderName,
              title: auc.title,
              price: auc.currentPrice
            });
          }
        });
        
        // Add random items to seed logs
        if (generatedLogs.length < 3) {
          generatedLogs.push(
            { name: "AestheticCollector", title: "Braun SK5 Turntable", price: 2150 },
            { name: "Satoshi_Curator", title: "Patek Philippe Aquanaut", price: 44500 }
          );
        }
        setRecentBidsLogs(generatedLogs.slice(0, 6));
      }
    } catch (err) {
      console.error("Dashboard list download failed:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions(true);

    // Dynamic Server Polling: Polls listings every 4 seconds to catch active, real-time simulated background bids
    globalPollRef.current = setInterval(() => {
      fetchAuctions(false);
    }, 4000);

    return () => {
      if (globalPollRef.current) {
        clearInterval(globalPollRef.current);
      }
    };
  }, []);

  // Update listings when user places bid in secondary window
  const handleBidRegistered = (updatedAuction: Auction, newBalance: number) => {
    updateUserBalance(newBalance);
    setAuctions((prev) => 
      prev.map((auc) => (auc.id === updatedAuction.id ? updatedAuction : auc))
    );
    // Silent refresh to update list models
    fetchAuctions(false);
  };

  // Filter listings based on user parameters
  const filteredAuctions = auctions.filter((auc) => {
    const matchesSearch = 
      auc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auc.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || auc.category === selectedCategory;

    const matchesOwner = activeTab === "catalog" || auc.sellerId === user?.id;

    return matchesSearch && matchesCategory && matchesOwner;
  });

  // Calculate high-level platform analytics for stats blocks
  const activeBallroomCount = auctions.filter((a) => a.status === "active").length;
  const personalListingsCount = auctions.filter((a) => a.sellerId === user?.id).length;
  const platformTotalVolume = auctions.reduce((acc, current) => acc + current.currentPrice, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col text-slate-900 selection:bg-slate-950 selection:text-white">
      
      {/* 1. DYNAMIC TICKER FEED BAR */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 shadow-sm border-b border-slate-800 z-10 flex items-center overflow-hidden">
        <div className="flex items-center gap-2 font-semibold text-emerald-400 uppercase tracking-wider shrink-0 text-[10px]">
          <BellRing className="h-3.5 w-3.5 animate-bounce shrink-0" />
          <span>Real-time Floor:</span>
        </div>
        
        {/* Horizontal scroll animation */}
        <div className="ml-4 w-full relative overflow-hidden h-4">
          <div className="flex gap-12 absolute whitespace-nowrap animate-marquee font-mono text-[11px] text-slate-300">
            {recentBidsLogs.map((log, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 hover:text-white transition">
                <span className="font-semibold text-white">@{log.name}</span> 
                bid 
                <span className="text-emerald-400 font-bold">${log.price.toLocaleString()}</span> 
                on 
                <span className="underline decoration-slate-600">{log.title}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-md">
              <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400/20" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-1.5 uppercase">
                AuctionCraft
                <span className="px-1.5 py-0.5 text-[8px] font-extrabold tracking-widest text-emerald-500 bg-emerald-500/10 rounded border border-emerald-500/10 uppercase">
                  SIM_LIVE
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 tracking-wide mt-0.5">High-End Real-time Marketplace</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Account pocket balance */}
            <div className="bg-slate-950 text-white rounded-2xl p-1 px-3.5 border border-slate-800 hidden md:flex items-center gap-3 shadow-md">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="text-left font-mono">
                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Ledger Wallet</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">
                  ${user?.balance?.toLocaleString() || "50,000"}
                </p>
              </div>
            </div>

            {/* Profile info block */}
            <div className="hidden sm:flex items-center gap-2.5 text-right bg-slate-50 border border-slate-200/60 p-2.5 rounded-full pl-4 pr-3">
              <div>
                <p className="text-[10px] font-bold text-slate-420 uppercase">BALLROOM PRO</p>
                <p className="text-xs font-bold text-slate-900 leading-tight block">@{user?.username || "Guest_Bidder"}</p>
              </div>
              <div className="h-8 w-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-xs uppercase">
                {(user?.username || "GB").substring(0, 2)}
              </div>
            </div>

            {/* Platform Exit trigger */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-3 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-150 border border-slate-200/50 rounded-2xl transition shadow-xs"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. PLATFORM CORE EXECUTIVE AREA */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full space-y-8">
        
        {/* MOBILE WALLET BALANCE PANEL */}
        <div className="md:hidden bg-slate-950 text-white rounded-2xl p-4 border border-slate-800 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Available Ledger Ledger</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">
                ${user?.balance?.toLocaleString() || "50,000"}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchAuctions(false)}
            className="px-3.5 py-1.5 text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white font-mono rounded-lg transition"
          >
            Ref: Me
          </button>
        </div>

        {/* STATS OVERVIEW BENTO BOXES */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs transition hover:border-slate-350">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Assets</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-3.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-950 font-mono">{activeBallroomCount}</span>
              <span className="text-[10px] font-bold text-slate-400">Items Listed</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs transition hover:border-slate-350">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Asset Appraisals</span>
              <span className="text-emerald-500 text-xs font-bold leading-none shrink-0">+18%</span>
            </div>
            <div className="mt-3.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-950 font-mono">
                ${(platformTotalVolume / 1000).toFixed(1)}k
              </span>
              <span className="text-[10px] font-bold text-slate-400">Total Bids Value</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs transition hover:border-slate-350 col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Listings</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 text-slate-700 font-bold uppercase">Seller</span>
            </div>
            <div className="mt-3.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-950 font-mono">{personalListingsCount}</span>
              <span className="text-[10px] font-bold text-slate-400">In Ballroom</span>
            </div>
          </div>

          {/* DYNAMIC BID PROBABILITY CHART CONTAINER */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs transition col-span-2 lg:col-span-1 hidden sm:block">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hot Area Activity</span>
            <div className="flex items-end gap-1.5 h-10 mt-3.5">
              {[35, 60, 40, 75, 45, 90, 65, 80, 50, 95].map((val, idx) => (
                <div key={idx} className="flex-1 bg-slate-100 hover:bg-slate-950 rounded-xs transition h-full relative" title={`Activity: ${val}%`}>
                  <div className="absolute bottom-0 inset-x-0 bg-emerald-400 hover:bg-emerald-500 transition rounded-xs" style={{ height: `${val}%` }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. FILTER CONTROLS NAVIGATION BAR */}
        <section className="bg-white border border-slate-200/80 rounded-3xl p-4 md:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Catalog vs Personal listing selectors */}
            <div className="flex bg-slate-50 p-1 rounded-2xl self-start">
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className={`px-4.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === "catalog"
                    ? "bg-slate-950 text-white shadow-xs"
                    : "text-slate-650 hover:text-slate-950"
                }`}
              >
                Ballroom Catalog
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("my_listings")}
                className={`px-4.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === "my_listings"
                    ? "bg-slate-950 text-white shadow-xs"
                    : "text-slate-650 hover:text-slate-950"
                }`}
              >
                My Collection ({personalListingsCount})
              </button>
            </div>

            {/* Center aligned Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 text-slate-400 h-4.5 w-4.5" />
              <input
                type="text"
                placeholder="Search collection listings, details, ids..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 focus:outline-hidden focus:border-slate-950 text-xs transition placeholder:text-slate-450"
              />
            </div>

            {/* List Asset button trigger */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 text-xs font-semibold rounded-2xl bg-slate-950 text-white hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-sm uppercase tracking-wide cursor-pointer text-center"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              List Custom Asset
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* Categories select options list */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {[
              { id: "all", label: "All Items" },
              { id: "minimalist", label: "Design Objects" },
              { id: "watches", label: "Fine Watches" },
              { id: "art", label: "Fine Art & Prints" },
              { id: "automobiles", label: "Automobiles" },
              { id: "hardware", label: "Tech Hardware" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-full text-xs font-medium shrink-0 transition ${
                  selectedCategory === cat.id
                    ? "bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs font-semibold"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-50 border border-transparent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* 5. LIVE BALLROOM CARDS FEED GRID */}
        {isLoading ? (
          <div className="py-24 text-center rounded-3xl border border-slate-150 bg-white flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-slate-950 mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Synchronizing active bid ledger...</p>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-slate-150 bg-white max-w-xl mx-auto p-8 shadow-xs">
            <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-950">No Auction Items Found</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
              There are no collections matching your filters in this Ballroom. List a new premium asset to start live bidding!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-5 px-4.5 py-2.5 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-900 rounded-xl transition"
            >
              List First Item
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auc) => {
              const isMine = auc.sellerId === user?.id;
              
              return (
                <motion.article
                  layout
                  key={auc.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden group hover:shadow-lg transition duration-300"
                >
                  
                  {/* Photo with dynamic timer ticker */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 border-b border-slate-100">
                    <img
                      src={auc.image}
                      alt={auc.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                    />
                    
                    {/* Expiry real-time countdown badge timer */}
                    <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-xs font-mono text-[10px] text-white px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 uppercase font-medium">
                      <Clock className="h-3.5 w-3.5 text-emerald-400 animate-pulse shrink-0" />
                      <LiveCountdown endsAt={auc.endsAt} onEndReached={() => fetchAuctions(false)} />
                    </div>

                    {/* Rare level priority indicators */}
                    {auc.priority === "ultra_rare" && (
                      <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl shadow-md border border-amber-300">
                        ⭐ Ultra Rare
                      </span>
                    )}

                    {/* Ownership overlay tag */}
                    {isMine && (
                      <span className="absolute bottom-4 left-4 text-[9px] font-extrabold uppercase bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-xl shadow-xs">
                        Host Listing
                      </span>
                    )}
                  </div>

                  {/* Descriptions block */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {auc.category} Catalog Item
                      </span>
                      <h3 className="text-base font-bold text-slate-950 tracking-tight leading-tight group-hover:text-slate-900 transition">
                        {auc.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2">
                        {auc.description}
                      </p>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100/80 flex items-center justify-between">
                      {/* Price stream */}
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block">CURRENT APPRAISAL</span>
                        <span className="text-lg font-black font-mono text-slate-950 tracking-tight block">
                          ${auc.currentPrice.toLocaleString()}
                        </span>
                      </div>

                      {/* Bidder name tag */}
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block">CHAMPION PLACE</span>
                        <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
                          {auc.highestBidderName ? `@${auc.highestBidderName}` : "Opening ledger"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Bids Buttons Drawer footer */}
                  <div className="px-6 pb-6 pt-1 bg-slate-50/50 flex gap-2 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => setSelectedAuctionId(auc.id)}
                      className="flex-1 py-3 text-xs font-bold text-slate-950 bg-white border border-slate-250 hover:border-slate-950 hover:bg-slate-50 rounded-2xl transition flex items-center justify-center gap-1 shadow-2xs"
                    >
                      Bidding History
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </button>

                    {auc.status === "ended" ? (
                      <span className="flex-1 py-3 text-center text-xs font-bold bg-slate-150 border border-slate-200 text-slate-500 rounded-2xl">
                        Awarded
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedAuctionId(auc.id)}
                        className="flex-1 py-3 text-xs font-bold tracking-wide uppercase bg-slate-950 text-white hover:bg-slate-900 rounded-2xl transition border border-transparent shadow-xs"
                      >
                        {isMine ? "View Status" : "Active Bid Now"}
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </section>
        )}
      </main>

      {/* CREATE NEW LISTING OVERLAY PORTAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <CreateListingModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onListingCreated={() => fetchAuctions(true)}
          />
        )}
      </AnimatePresence>

      {/* DETAILED BIDDING ROOM DIALOG PORTAL */}
      <AnimatePresence>
        {selectedAuctionId && (
          <AuctionDetailsModal
            auctionId={selectedAuctionId}
            currentUser={user}
            onClose={() => {
              setSelectedAuctionId(null);
              // Refresh everything on close
              fetchAuctions(false);
              refreshUserProfile();
            }}
            onBidPlaced={(updated, bal) => handleBidRegistered(updated, bal)}
          />
        )}
      </AnimatePresence>
      
      <footer className="bg-white border-t border-slate-150 py-8 px-6 mt-12 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-600">AuctionCraft Ledger Platform </p>
        <p className="text-[10px] mt-1 text-slate-400">
          All prices in virtual dollars. Simulated bidder threads generate live floor competition automatically.
        </p>
      </footer>
    </div>
  );
}

/**
 * Custom micro countdown widget that calculates ticking values every 1 second dynamically
 */
interface LiveCountdownProps {
  endsAt: string;
  onEndReached?: () => void;
}

function LiveCountdown({ endsAt, onEndReached }: LiveCountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const callbackCalledRef = useRef(false);

  useEffect(() => {
    function calculate() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        if (onEndReached && !callbackCalledRef.current) {
          callbackCalledRef.current = true;
          onEndReached();
        }
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
        setTimeLeft(`${secs}s`);
      }
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return <span>{timeLeft}</span>;
}
