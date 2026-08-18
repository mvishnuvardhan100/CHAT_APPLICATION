import express from "express";

import {
  getMe,
  getUsers,
  getUserById,
} from "../controllers/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get logged-in user
router.get("/me", authMiddleware, getMe);

// Get all users except logged-in user
router.get("/", authMiddleware, getUsers);

// Get user by ID
router.get("/:id", authMiddleware, getUserById);

export default router;