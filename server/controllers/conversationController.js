import Conversation from "../models/Conversation.js";

// Create or get a conversation between two users
export const createOrGetConversation = async (req, res) => {
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
        message: "You cannot create a conversation with yourself",
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
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
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
      });

      conversation = await conversation.populate(
        "participants",
        "-password"
      );
    }

    res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error("Conversation error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get all conversations for logged-in user
export const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .populate("participants", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};