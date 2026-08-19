import express from "express";

import {
  createOrGetConversation,
  getMyConversations,
  getMessages,
} from "../controllers/conversationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create or get conversation
router.post(
  "/",
  authMiddleware,
  createOrGetConversation
);

// Get current user's conversations
router.get(
  "/",
  authMiddleware,
  getMyConversations
);

// Get messages for a conversation
router.get(
  "/:conversationId/messages",
  authMiddleware,
  getMessages
);

export default router;