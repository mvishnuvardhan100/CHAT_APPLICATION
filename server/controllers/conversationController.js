import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

// ==========================================
// CREATE OR GET CONVERSATION
// ==========================================
export const createOrGetConversation = async (
  req,
  res
) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (currentUserId === userId) {
      return res.status(400).json({
        message:
          "You cannot create a conversation with yourself",
      });
    }

    // Check if conversation already exists
    let conversation =
      await Conversation.findOne({
        participants: {
          $all: [currentUserId, userId],
          $size: 2,
        },
      }).populate(
        "participants",
        "-password"
      );

    // Create if it doesn't exist
    if (!conversation) {
      conversation =
        await Conversation.create({
          participants: [
            currentUserId,
            userId,
          ],
        });

      conversation =
        await conversation.populate(
          "participants",
          "-password"
        );
    }

    res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error(
      "Conversation error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL CONVERSATIONS
// ==========================================
export const getMyConversations = async (
  req,
  res
) => {
  try {
    const conversations =
      await Conversation.find({
        participants: req.userId,
      })
        .populate(
          "participants",
          "-password"
        )
        .populate("lastMessage")
        .sort({ updatedAt: -1 });

    res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET MESSAGES FOR A CONVERSATION
// ==========================================
export const getMessages = async (
  req,
  res
) => {
  try {
    const { conversationId } = req.params;

    // Find conversation
    const conversation =
      await Conversation.findById(
        conversationId
      );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Check whether the logged-in user
    // is a participant
    const isParticipant =
      conversation.participants.some(
        (participant) =>
          participant.toString() ===
          req.userId
      );

    if (!isParticipant) {
      return res.status(403).json({
        message:
          "You are not a participant in this conversation",
      });
    }

    // Get messages
    const messages =
      await Message.find({
        conversation: conversationId,
      })
        .populate(
          "sender",
          "name email avatar"
        )
        .sort({
          createdAt: 1,
        });

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};