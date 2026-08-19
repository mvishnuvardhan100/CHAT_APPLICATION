import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({
        message: "Conversation ID and message text are required",
      });
    }

    // Check conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Check if current user belongs to conversation
    const isParticipant = conversation.participants.some(
      (participant) =>
        participant.toString() === req.userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant in this conversation",
      });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.userId,
      text,
    });

    // Update last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate sender information
    await message.populate(
      "sender",
      "name email avatar"
    );

    res.status(201).json({
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(
      conversationId
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Check participant
    const isParticipant = conversation.participants.some(
      (participant) =>
        participant.toString() === req.userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not a participant in this conversation",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 });

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};