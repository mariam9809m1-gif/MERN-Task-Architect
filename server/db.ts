import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export interface IUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  balance: number; // Virtual bidding currency (e.g., $50,000 starting wallet)
  createdAt: string;
}

export type IAuctionCategory = "watches" | "art" | "automobiles" | "hardware" | "minimalist";
export type IAuctionPriority = "ultra_rare" | "featured" | "standard";

export interface IAuction {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: IAuctionCategory;
  startingPrice: number;
  currentPrice: number;
  buyNowPrice?: number;
  highestBidderId?: string;
  highestBidderName?: string;
  image: string;
  priority: IAuctionPriority;
  status: "active" | "ended";
  endsAt: string; // ISO string expiration
  createdAt: string;
  updatedAt: string;
}

export interface IBid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
}

interface IDatabaseSchema {
  users: IUser[];
  auctions: IAuction[];
  bids: IBid[];
}

// Default initial database inventory items to populate the platform beautifully on startup
const DEFAULT_AUCTIONS_SEED = (): Omit<IAuction, "sellerId" | "sellerName">[] => {
  const futureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  return [
    {
      id: "auc-1",
      title: "Patek Philippe Aquanaut Ref. 5167A",
      description: "Exquisite hand-finished automatic luxury sports watch. Unworn with box and papers. Features standard signature black embossed dial and tropical rubber strap.",
      category: "watches",
      startingPrice: 42000,
      currentPrice: 44500,
      image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=600",
      priority: "ultra_rare",
      status: "active",
      endsAt: futureDate(1.5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "auc-2",
      title: "Dieter Rams Braun SK5 Radio & Turntable",
      description: "Iconic 1958 Braun SK5 (Snow White's Coffin) design by Dieter Rams and Hans Gugelot. Fully restored circuitry. Perfect audio output.",
      category: "minimalist",
      startingPrice: 1800,
      currentPrice: 2150,
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
      priority: "featured",
      status: "active",
      endsAt: futureDate(3.2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "auc-3",
      title: "Mid-Century Bauhaus Lounge Chair Frame",
      description: "Original chrome circular steel-tubed lounge chair. Full-grain whiskey Italian leather upholstery. Seamless brutalist geometric curves.",
      category: "minimalist",
      startingPrice: 3200,
      currentPrice: 3200,
      image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=600",
      priority: "standard",
      status: "active",
      endsAt: futureDate(5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "auc-4",
      title: "Brutalist Monochrome Raw Canvas Portrait",
      description: "Atmospheric multi-layered dark acrylic painting titled 'Resonance' (2025). Heavy impasto texture on physical natural linen core.",
      category: "art",
      startingPrice: 7500,
      currentPrice: 8100,
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600",
      priority: "featured",
      status: "active",
      endsAt: futureDate(0.4), // Ends very soon (within today) for dynamic tracking
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
};

class LocalDatabase {
  private data: IDatabaseSchema = { users: [], auctions: [], bids: [] };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      this.populateDefaultInitialData();
    } else {
      try {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
        this.verifyAndSeedEmptyAuctions();
      } catch (error) {
        console.error("Error reading database file, resetting database:", error);
        this.populateDefaultInitialData();
      }
    }
    this.startLiveBiddingSimulator();
  }

  private populateDefaultInitialData() {
    const freshData: IDatabaseSchema = {
      users: [
        {
          id: "usr-admin",
          username: "Satoshi_Curator",
          email: "curator@auctioncraft.com",
          passwordHash: "$2a$10$U6U88PZp.0aXz123456789.h8V65UoTjJ2H3Keq4.tJ.n9P6L9mE6", // Placeholder hash
          balance: 1000000,
          createdAt: new Date().toISOString(),
        }
      ],
      auctions: [],
      bids: []
    };

    // Seed auctions owned by the platform curator
    const defaults = DEFAULT_AUCTIONS_SEED();
    freshData.auctions = defaults.map((auc) => ({
      ...auc,
      sellerId: "usr-admin",
      sellerName: "Satoshi_Curator",
    })) as IAuction[];

    // Seed pre-existing minor bids
    freshData.bids = [
      {
        id: "bid-1",
        auctionId: "auc-1",
        bidderId: "usr-mock-1",
        bidderName: "ArtCryptoCollector",
        amount: 43500,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "bid-2",
        auctionId: "auc-1",
        bidderId: "usr-mock-2",
        bidderName: "GenevaDandy",
        amount: 44500,
        createdAt: new Date(Date.now() - 1200000).toISOString()
      },
      {
        id: "bid-3",
        auctionId: "auc-2",
        bidderId: "usr-mock-3",
        bidderName: "DieterLover",
        amount: 21500,
        createdAt: new Date(Date.now() - 950000).toISOString()
      }
    ];

    // Set highest bidder info
    freshData.auctions[0].highestBidderId = "usr-mock-2";
    freshData.auctions[0].highestBidderName = "GenevaDandy";
    freshData.auctions[1].highestBidderId = "usr-mock-3";
    freshData.auctions[1].highestBidderName = "DieterLover";

    this.data = freshData;
    this.save();
  }

  private verifyAndSeedEmptyAuctions() {
    if (this.data.auctions.length === 0) {
      const defaults = DEFAULT_AUCTIONS_SEED();
      this.data.auctions = defaults.map((auc) => ({
        ...auc,
        sellerId: "usr-admin",
        sellerName: "Satoshi_Curator",
      })) as IAuction[];
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save database:", error);
    }
  }

  public get users() {
    return this.data.users;
  }

  public get auctions() {
    return this.data.auctions;
  }

  public get bids() {
    return this.data.bids;
  }

  /**
   * Real-time Multi-User Bidding Simulation Engine
   * Initiates periodic automated bids placement simulation to replicate an active high-volume platform.
   */
  private startLiveBiddingSimulator() {
    const simulatedBidders = [
      "AestheticCollector",
      "KyotoZenModern",
      "DieterCapsule",
      "Chronos_Broker",
      "BaselHustler",
      "MinimalistNomad",
      "BauhausWorship",
      "VaultPurist"
    ];

    setInterval(() => {
      try {
        // Find all active auctions that haven't expired
        const activeAuctions = this.data.auctions.filter((auc) => {
          const isNotExpired = new Date(auc.endsAt).getTime() > Date.now();
          return auc.status === "active" && isNotExpired;
        });

        if (activeAuctions.length === 0) return;

        // Pick one target auction randomly
        const targetAuction = activeAuctions[Math.floor(Math.random() * activeAuctions.length)];

        // Generate dynamic bidding increment
        const incrementPercent = 0.02 + Math.random() * 0.03; // 2% to 5% increase
        const minimumBidIncrement = targetAuction.currentPrice * 0.015;
        const finalBidAmount = Math.round(targetAuction.currentPrice + Math.max(minimumBidIncrement, Math.round(targetAuction.currentPrice * incrementPercent)));

        // Select mock bidder username
        const mockBidderName = simulatedBidders[Math.floor(Math.random() * simulatedBidders.length)];
        const mockBidderId = `mock-usr-${Math.floor(Math.random() * 1000 + 1)}`;

        // Place simulated bid
        const newMockBid: IBid = {
          id: `sim-bid-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          auctionId: targetAuction.id,
          bidderId: mockBidderId,
          bidderName: mockBidderName,
          amount: finalBidAmount,
          createdAt: new Date().toISOString()
        };

        // Append to bid log
        this.data.bids.push(newMockBid);

        // Update target auction current high bid parameters
        targetAuction.currentPrice = finalBidAmount;
        targetAuction.highestBidderId = mockBidderId;
        targetAuction.highestBidderName = mockBidderName;
        targetAuction.updatedAt = new Date().toISOString();

        this.save();
        console.log(`[REAL-TIME SIMULATED BID] Bid of $${finalBidAmount.toLocaleString()} placed on "${targetAuction.title}" by @${mockBidderName}`);
      } catch (err) {
        console.error("Live bidding simulator loop error ignored gracefully:", err);
      }
    }, 12000); // Trigger dynamic external bid events every 12 seconds
  }
}

export const dbSource = new LocalDatabase();

export class Model<T extends { id: string; createdAt: string; updatedAt?: string }> {
  private key: keyof IDatabaseSchema;

  constructor(key: keyof IDatabaseSchema) {
    this.key = key;
  }

  private get list(): T[] {
    return dbSource[this.key] as unknown as T[];
  }

  public find(filter?: (item: T) => boolean): T[] {
    if (!filter) return [...this.list];
    return this.list.filter(filter);
  }

  public findOne(filter: (item: T) => boolean): T | null {
    const item = this.list.find(filter);
    return item ? { ...item } : null;
  }

  public findById(id: string): T | null {
    return this.findOne((item) => item.id === id);
  }

  public create(itemData: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: string; updatedAt?: string }): T {
    const timestamp = new Date().toISOString();
    const id = itemData.id || Math.random().toString(36).substring(2, 11);
    
    const newItem = {
      ...itemData,
      id,
      createdAt: itemData.createdAt || timestamp,
      updatedAt: itemData.updatedAt || timestamp,
    } as unknown as T;

    this.list.push(newItem);
    dbSource.save();
    return newItem;
  }

  public findByIdAndUpdate(id: string, updateData: Partial<Omit<T, "id" | "createdAt"> & { updatedAt?: string }>): T | null {
    const index = this.list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const existingItem = this.list[index];
    const timestamp = new Date().toISOString();
    
    const updatedItem = {
      ...existingItem,
      ...updateData,
      updatedAt: updateData.updatedAt || timestamp,
    } as T;

    this.list[index] = updatedItem;
    dbSource.save();
    return updatedItem;
  }

  public findByIdAndDelete(id: string): boolean {
    const index = this.list.findIndex((item) => item.id === id);
    if (index === -1) return false;

    this.list.splice(index, 1);
    dbSource.save();
    return true;
  }
}
