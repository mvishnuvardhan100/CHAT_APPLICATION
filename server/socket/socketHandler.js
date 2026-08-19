import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      const user = await User.findById(
        decoded.userId
      );

      if (!user) {
        return next(
          new Error("User not found")
        );
      }

      socket.userId =
        user._id.toString();

      socket.user = user;

      next();
    } catch (error) {
      console.error(
        "Socket authentication error:",
        error.message
      );

      next(
        new Error(
          "Invalid or expired token"
        )
      );
    }
  });

  io.on("connection", async (socket) => {
    try {
      console.log(
        `User connected: ${socket.user.name}`
      );

      console.log(
        `Socket ID: ${socket.id}`
      );

      await User.findByIdAndUpdate(
        socket.userId,
        {
          isOnline: true,
        }
      );

      socket.join(socket.userId);

      io.emit("userStatus", {
        userId: socket.userId,
        isOnline: true,
      });

      // JOIN CONVERSATION
      socket.on(
        "joinConversation",
        async (conversationId) => {
          try {
            if (!conversationId) {
              return;
            }

            const conversation =
              await Conversation.findById(
                conversationId
              );

            if (!conversation) {
              socket.emit(
                "messageError",
                {
                  message:
                    "Conversation not found",
                }
              );

              return;
            }

            const isParticipant =
              conversation.participants.some(
                (participant) =>
                  participant.toString() ===
                  socket.userId
              );

            if (!isParticipant) {
              socket.emit(
                "messageError",
                {
                  message:
                    "You are not a participant in this conversation",
                }
              );

              return;
            }

            socket.join(
              conversationId
            );

            console.log(
              `${socket.user.name} joined conversation ${conversationId}`
            );
          } catch (error) {
            console.error(
              "Join conversation error:",
              error
            );
          }
        }
      );

      // SEND MESSAGE
      socket.on(
        "sendMessage",
        async (data) => {
          try {
            const {
              conversationId,
              text,
            } = data || {};

            if (
              !conversationId ||
              !text?.trim()
            ) {
              socket.emit(
                "messageError",
                {
                  message:
                    "Conversation ID and message text are required",
                }
              );

              return;
            }

            const conversation =
              await Conversation.findById(
                conversationId
              );

            if (!conversation) {
              socket.emit(
                "messageError",
                {
                  message:
                    "Conversation not found",
                }
              );

              return;
            }

            const isParticipant =
              conversation.participants.some(
                (participant) =>
                  participant.toString() ===
                  socket.userId
              );

            if (!isParticipant) {
              socket.emit(
                "messageError",
                {
                  message:
                    "You are not a participant in this conversation",
                }
              );

              return;
            }

            const message =
              await Message.create({
                conversation:
                  conversationId,
                sender: socket.userId,
                text: text.trim(),
              });

            conversation.lastMessage =
              message._id;

            await conversation.save();

            await message.populate(
              "sender",
              "name email avatar"
            );

            io.to(
              conversationId
            ).emit(
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

            socket.emit(
              "messageError",
              {
                message:
                  "Failed to send message",
              }
            );
          }
        }
      );

      // DISCONNECT
      socket.on(
        "disconnect",
        async () => {
          try {
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

            io.emit("userStatus", {
              userId: socket.userId,
              isOnline: false,
              lastSeen: new Date(),
            });
          } catch (error) {
            console.error(
              "Disconnect error:",
              error
            );
          }
        }
      );
    } catch (error) {
      console.error(
        "Socket connection error:",
        error
      );
    }
  });
};

export default socketHandler;