import { Router } from "express";
import { registerUser, loginUser, getMe } from "../controllers/userController";
import { protectRoute } from "../middlewares/authMiddleware";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/me", protectRoute, getMe);

export default router;
