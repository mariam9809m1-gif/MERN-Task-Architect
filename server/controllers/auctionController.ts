import { Response } from "express";
import { AuctionModel } from "../models/Auction";
import { BidModel } from "../models/Bid";
import { UserModel } from "../models/User";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// Helper to check if auction is expired
const updateAuctionStatusIfExpired = (auction: any): boolean => {
  if (auction.status === "active" && new Date(auction.endsAt).getTime() < Date.now()) {
    auction.status = "ended";
    AuctionModel.findByIdAndUpdate(auction.id, { status: "ended" });
    return true;
  }
  return false;
};

export const getAuctions = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const auctions = AuctionModel.find();
    
    // Auto-update any expired auctions before sending response
    auctions.forEach((auc) => {
      updateAuctionStatusIfExpired(auc);
    });

    // Option to filter by category or status if requested via query
    const { category, status, search } = req.query;
    let filtered = [...auctions];

    if (category && category !== "all") {
      filtered = filtered.filter((a) => a.category === category);
    }

    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }

    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }

    // Sort: Featured and Ultra Rare first, or newest active first
    filtered.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "active" ? -1 : 1; // Active first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return res.status(200).json(filtered);
  } catch (error) {
    console.error("getAuctions error:", error);
    return res.status(500).json({ message: "Failed to retrieve auction inventory." });
  }
};

export const getAuctionById = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const auction = AuctionModel.findById(id);

    if (!auction) {
      return res.status(404).json({ message: "Auction listing not found." });
    }

    // Update status check
    updateAuctionStatusIfExpired(auction);

    // Grab bid logs specifically for this auction, newest first
    const bids = BidModel.find((b) => b.auctionId === id);
    bids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({
      auction,
      bids,
    });
  } catch (error) {
    console.error("getAuctionById error:", error);
    return res.status(500).json({ message: "Failed to fetch auction details." });
  }
};

export const createAuction = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username;

    if (!userId || !username) {
      return res.status(401).json({ message: "Sellers must be fully authenticated." });
    }

    const { title, description, category, startingPrice, endsInHours, image, priority } = req.body;

    if (!title || !description || !category || startingPrice === undefined) {
      return res.status(400).json({ message: "Please provide all required asset details." });
    }

    const price = Number(startingPrice);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: "Starting price must be a valid positive amount." });
    }

    // Calculate dynamic countdown expiry
    const hours = Number(endsInHours) || 24;
    const endsAt = new Date(Date.now() + hours * 3600000).toISOString();

    const validCategories = ["watches", "art", "automobiles", "hardware", "minimalist"];
    const itemCategory = validCategories.includes(category) ? category : "minimalist";

    const validPriorities = ["ultra_rare", "featured", "standard"];
    const itemPriority = validPriorities.includes(priority) ? priority : "standard";

    // Set fallback image if user hasn't specified
    const defaultImages: Record<string, string> = {
      watches: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=600",
      art: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600",
      automobiles: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600",
      hardware: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=600",
      minimalist: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600"
    };
    const itemImage = image && image.trim() !== "" ? image.trim() : defaultImages[itemCategory];

    const newAuction = AuctionModel.create({
      sellerId: userId,
      sellerName: username,
      title: title.trim(),
      description: description.trim(),
      category: itemCategory as any,
      startingPrice: price,
      currentPrice: price,
      image: itemImage,
      priority: itemPriority as any,
      status: "active",
      endsAt,
    });

    return res.status(201).json(newAuction);
  } catch (error) {
    console.error("createAuction error:", error);
    return res.status(500).json({ message: "Failed to list high-value appraisal item." });
  }
};

export const placeBid = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username;

    if (!userId || !username) {
      return res.status(401).json({ message: "Authentication required to place online bids." });
    }

    const { id } = req.params; // Auction ID
    const { amount } = req.body;

    const bidAmount = Math.round(Number(amount));
    if (isNaN(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ message: "Bid amount must be a positive integer." });
    }

    // Retrieve live auction asset
    const auction = AuctionModel.findById(id);
    if (!auction) {
      return res.status(404).json({ message: "Auction listing not found." });
    }

    // Terminated checks
    if (updateAuctionStatusIfExpired(auction)) {
      return res.status(400).json({ message: "Bidding window has expired for this listing." });
    }
    if (auction.status === "ended") {
      return res.status(400).json({ message: "Bidding has already completed on this item." });
    }

    // Anti-seller bidding proxy block
    if (auction.sellerId === userId) {
      return res.status(403).json({ message: "Sellers are prohibited from bidding on their own listings." });
    }

    // Incremental threshold checks (minimum bid must beat current price + 1.5% minimum threshold increment)
    const bidThreshold = Math.round(auction.currentPrice * 1.015);
    const requiredMin = auction.currentPrice === auction.startingPrice && !auction.highestBidderId 
      ? auction.startingPrice 
      : bidThreshold;

    if (bidAmount < requiredMin) {
      return res.status(400).json({
        message: `Inadequate bid amount. Minimum acceptable bid is $${requiredMin.toLocaleString()}.`
      });
    }

    // User balance checks
    const bidderProfile = UserModel.findById(userId);
    if (!bidderProfile) {
      return res.status(404).json({ message: "Bidder profile not found." });
    }

    if (bidderProfile.balance < bidAmount) {
      return res.status(400).json({
        message: `Insufficient virtual ledger funds. Your balance is $${bidderProfile.balance.toLocaleString()}, but this bid requires $${bidAmount.toLocaleString()}`
      });
    }

    // Dynamic Bid Refund routine:
    // Refund the previous highest bidder if they exist and are an actual registered system user with a profile
    if (auction.highestBidderId && !auction.highestBidderId.startsWith("mock-usr-")) {
      const prevBidder = UserModel.findById(auction.highestBidderId);
      if (prevBidder) {
        UserModel.findByIdAndUpdate(auction.highestBidderId, {
          balance: prevBidder.balance + auction.currentPrice
        });
        console.log(`[LEDGER REFUND] Refunded $${auction.currentPrice.toLocaleString()} back to @${prevBidder.username}`);
      }
    }

    // Subtract bid balance from placing user
    UserModel.findByIdAndUpdate(userId, {
      balance: bidderProfile.balance - bidAmount
    });

    // Create Bid transaction log
    const newBidLog = BidModel.create({
      auctionId: id,
      bidderId: userId,
      bidderName: username,
      amount: bidAmount,
    });

    // Update Live Auction values
    const updatedAuction = AuctionModel.findByIdAndUpdate(id, {
      currentPrice: bidAmount,
      highestBidderName: username,
      highestBidderId: userId,
    });

    console.log(`[BID PLACED] Brand-new secure bid of $${bidAmount.toLocaleString()} successfully registered on "${auction.title}" by @${username}`);

    return res.status(201).json({
      message: "Bid registered successfully!",
      bid: newBidLog,
      auction: updatedAuction,
      newBalance: bidderProfile.balance - bidAmount,
    });
  } catch (error) {
    console.error("placeBid error:", error);
    return res.status(500).json({ message: "An error occurred while placing your bid." });
  }
};
