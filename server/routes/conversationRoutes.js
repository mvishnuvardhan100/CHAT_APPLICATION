import express from "express";

import {
  createOrGetConversation,
  getMyConversations,
} from "../controllers/conversationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createOrGetConversation);

router.get("/", authMiddleware, getMyConversations);

export default router;