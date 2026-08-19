import express from "express";

import {
  createOrGetConversation,
  getMyConversations,
  getMessages,
} from "../controllers/conversationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  createOrGetConversation
);

router.get(
  "/",
  authMiddleware,
  getMyConversations
);

router.get(
  "/:conversationId/messages",
  authMiddleware,
  getMessages
);

export default router;