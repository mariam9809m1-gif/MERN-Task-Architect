export interface User {
  id: string;
  username: string;
  email: string;
  balance: number; // Virtual bidding wallet
  createdAt: string;
}

export type AuctionCategory = "watches" | "art" | "automobiles" | "hardware" | "minimalist";
export type AuctionPriority = "ultra_rare" | "featured" | "standard";

export interface Auction {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: AuctionCategory;
  startingPrice: number;
  currentPrice: number;
  buyNowPrice?: number;
  highestBidderId?: string;
  highestBidderName?: string;
  image: string;
  priority: AuctionPriority;
  status: "active" | "ended";
  endsAt: string; // ISO ends
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}
