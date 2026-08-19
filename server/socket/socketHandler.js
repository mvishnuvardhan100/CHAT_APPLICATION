import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const socketHandler = (io) => {
  // ==============================
  // SOCKET AUTHENTICATION
  // ==============================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        console.log("Socket connection rejected: No token");
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      const user = await User.findById(decoded.userId);

      if (!user) {
        console.log(
          "Socket connection rejected: User not found"
        );

        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (error) {
      console.error(
        "Socket authentication error:",
        error.message
      );

      next(new Error("Invalid or expired token"));
    }
  });

  // ==============================
  // CONNECTION
  // ==============================
  io.on("connection", async (socket) => {
    console.log(
      `User connected: ${socket.user.name}`
    );

    console.log(
      `Socket ID: ${socket.id}`
    );

    // Update online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
    });

    // ==============================
    // PERSONAL USER ROOM
    // ==============================
    socket.join(socket.userId);

    console.log(
      `User room joined: ${socket.userId}`
    );

    // ==============================
    // DEBUG: LOG EVERY EVENT
    // ==============================
    socket.onAny((event, ...args) => {
      console.log(
        `Socket event received: ${event}`,
        args
      );
    });

    // ==============================
    // JOIN CONVERSATION
    // ==============================
    socket.on(
      "joinConversation",
      async (conversationId, callback) => {
        try {
          console.log(
            `Join conversation request: ${conversationId}`
          );

          if (!conversationId) {
            console.log(
              "No conversation ID provided"
            );

            if (callback) {
              callback({
                success: false,
                message:
                  "Conversation ID is required",
              });
            }

            return;
          }

          // Find conversation
          const conversation =
            await Conversation.findById(
              conversationId
            );

          if (!conversation) {
            console.log(
              "Conversation not found:",
              conversationId
            );

            socket.emit("messageError", {
              message:
                "Conversation not found",
            });

            if (callback) {
              callback({
                success: false,
                message:
                  "Conversation not found",
              });
            }

            return;
          }

          // Check participant
          const isParticipant =
            conversation.participants.some(
              (participant) =>
                participant.toString() ===
                socket.userId
            );

          if (!isParticipant) {
            console.log(
              `${socket.user.name} is not a participant`
            );

            socket.emit("messageError", {
              message:
                "You are not a participant in this conversation",
            });

            if (callback) {
              callback({
                success: false,
                message:
                  "You are not a participant in this conversation",
              });
            }

            return;
          }

          // Join conversation room
          socket.join(conversationId);

          console.log(
            `${socket.user.name} joined conversation ${conversationId}`
          );

          // Send acknowledgement to client
          if (callback) {
            callback({
              success: true,
              conversationId,
            });
          }
        } catch (error) {
          console.error(
            "Join conversation error:",
            error
          );

          if (callback) {
            callback({
              success: false,
              message: "Failed to join conversation",
            });
          }
        }
      }
    );

    // ==============================
    // SEND MESSAGE
    // ==============================
    socket.on(
      "sendMessage",
      async (data) => {
        try {
          console.log(
            "sendMessage received:",
            data
          );

          const {
            conversationId,
            text,
          } = data || {};

          if (
            !conversationId ||
            !text?.trim()
          ) {
            socket.emit("messageError", {
              message:
                "Conversation ID and message text are required",
            });

            return;
          }

          // Find conversation
          const conversation =
            await Conversation.findById(
              conversationId
            );

          if (!conversation) {
            socket.emit("messageError", {
              message:
                "Conversation not found",
            });

            return;
          }

          // Check participant
          const isParticipant =
            conversation.participants.some(
              (participant) =>
                participant.toString() ===
                socket.userId
            );

          if (!isParticipant) {
            socket.emit("messageError", {
              message:
                "You are not a participant in this conversation",
            });

            return;
          }

          // Make sure sender is inside
          // the conversation room
          socket.join(conversationId);

          // Create message
          const message =
            await Message.create({
              conversation: conversationId,
              sender: socket.userId,
              text: text.trim(),
            });

          // Update last message
          conversation.lastMessage =
            message._id;

          await conversation.save();

          // Populate sender
          await message.populate(
            "sender",
            "name email avatar"
          );

          console.log(
            "Message saved:",
            message._id
          );

          // Emit message to everyone
          // inside the conversation room
          io.to(conversationId).emit(
            "newMessage",
            message
          );

          console.log(
            `Message emitted to conversation ${conversationId}`
          );
        } catch (error) {
          console.error(
            "Socket message error:",
            error
          );

          socket.emit("messageError", {
            message:
              "Failed to send message",
          });
        }
      }
    );

    // ==============================
    // DISCONNECT
    // ==============================
    socket.on(
      "disconnect",
      async () => {
        console.log(
          `User disconnected: ${socket.user.name}`
        );

        await User.findByIdAndUpdate(
          socket.userId,
          {
            isOnline: false,
            lastSeen: new Date(),
          }
        );
      }
    );
  });
};

export default socketHandler;