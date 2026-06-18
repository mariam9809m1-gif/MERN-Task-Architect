import { Router } from "express";
import { getAuctions, getAuctionById, createAuction, placeBid } from "../controllers/auctionController";
import { protectRoute } from "../middlewares/authMiddleware";

const router = Router();

// Publicly readable listings
router.get("/", getAuctions);
router.get("/:id", getAuctionById);

// Protected actions: requires valid login
router.post("/", protectRoute, createAuction);
router.post("/:id/bid", protectRoute, placeBid);

export default router;
