import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const SOCKET_URL = "http://localhost:5000";

function Dashboard() {
  const { user, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingConversation, setLoadingConversation] =
    useState(false);
  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [error, setError] = useState("");
  const [socketStatus, setSocketStatus] =
    useState("Connecting...");

  const socketRef = useRef(null);

  // ==========================================
  // CONNECT SOCKET.IO
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      setSocketStatus("Connected");
    });

    socket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message
      );

      setSocketStatus("Disconnected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");

      setSocketStatus("Disconnected");
    });

    // ========================================
    // RECEIVE NEW MESSAGE
    // ========================================
    socket.on("newMessage", (message) => {
      console.log(
        "New message received:",
        message
      );

      setMessages((previousMessages) => {
        // Prevent duplicate messages
        const alreadyExists =
          previousMessages.some(
            (existingMessage) =>
              existingMessage._id ===
              message._id
          );

        if (alreadyExists) {
          return previousMessages;
        }

        return [
          ...previousMessages,
          message,
        ];
      });
    });

    socket.on("messageError", (error) => {
      console.error(
        "Message error:",
        error
      );

      setError(
        error.message ||
          "Failed to send message"
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ==========================================
  // FETCH USERS
  // ==========================================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setError("");

        const response = await api.get("/users");

        setUsers(response.data.users);
      } catch (error) {
        console.error(
          "Failed to fetch users:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load users"
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // ==========================================
  // SELECT USER
  // ==========================================
  const handleSelectUser = async (otherUser) => {
    try {
      setSelectedUser(otherUser);
      setConversation(null);
      setMessages([]);
      setMessageText("");

      setLoadingConversation(true);
      setLoadingMessages(false);
      setError("");

      const response = await api.post(
        "/conversations",
        {
          userId: otherUser._id,
        }
      );

      const newConversation =
        response.data.conversation;

      setConversation(newConversation);

      // Join Socket.IO conversation room
      if (socketRef.current?.connected) {
        console.log(
          "Joining conversation:",
          newConversation._id
        );

        socketRef.current.emit(
          "joinConversation",
          newConversation._id
        );
      }

      // ========================================
      // FETCH MESSAGE HISTORY
      // ========================================
      try {
        setLoadingMessages(true);

        const messageResponse =
          await api.get(
            `/conversations/${newConversation._id}/messages`
          );

        setMessages(
          messageResponse.data.messages
        );
      } catch (error) {
        console.error(
          "Failed to load messages:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load messages"
        );
      } finally {
        setLoadingMessages(false);
      }
    } catch (error) {
      console.error(
        "Failed to get conversation:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to open conversation"
      );
    } finally {
      setLoadingConversation(false);
    }
  };

  // ==========================================
  // SEND MESSAGE
  // ==========================================
  const handleSendMessage = () => {
    const text = messageText.trim();

    if (!text) {
      return;
    }

    if (!conversation) {
      return;
    }

    if (!socketRef.current?.connected) {
      setError(
        "Socket is not connected"
      );

      return;
    }

    console.log(
      "Sending message:",
      text
    );

    socketRef.current.emit(
      "sendMessage",
      {
        conversationId:
          conversation._id,
        text,
      }
    );

    // Clear input
    setMessageText("");
  };

  // ==========================================
  // ENTER KEY
  // ==========================================
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      handleSendMessage();
    }
  };

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ======================================
          HEADER
      ====================================== */}
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">

        <h1 className="text-2xl font-bold">
          Chat App
        </h1>

        <div className="flex items-center gap-4">

          <div className="text-right">
            <p className="font-semibold">
              {user?.name}
            </p>

            <p className="text-sm text-gray-400">
              {user?.email}
            </p>

            <p
              className={`text-xs ${
                socketStatus === "Connected"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {socketStatus}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium transition hover:bg-red-700"
          >
            Logout
          </button>

        </div>

      </header>

      {/* ======================================
          MAIN
      ====================================== */}
      <main className="flex min-h-[calc(100vh-73px)]">

        {/* ====================================
            SIDEBAR
        ==================================== */}
        <aside className="w-80 border-r border-gray-800 bg-gray-900 p-5">

          <h2 className="mb-4 text-lg font-semibold">
            Users
          </h2>

          {loadingUsers && (
            <p className="text-sm text-gray-400">
              Loading users...
            </p>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {!loadingUsers &&
            !error &&
            users.length === 0 && (
              <p className="text-sm text-gray-400">
                No other users found.
              </p>
            )}

          <div className="space-y-2">

            {users.map((otherUser) => {
              const isSelected =
                selectedUser?._id ===
                otherUser._id;

              return (
                <button
                  key={otherUser._id}
                  onClick={() =>
                    handleSelectUser(
                      otherUser
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    isSelected
                      ? "bg-blue-600"
                      : "hover:bg-gray-800"
                  }`}
                >

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-lg font-semibold">
                    {otherUser.name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">

                    <p className="font-semibold">
                      {otherUser.name}
                    </p>

                    <p
                      className={`truncate text-sm ${
                        isSelected
                          ? "text-blue-100"
                          : "text-gray-400"
                      }`}
                    >
                      {otherUser.email}
                    </p>

                  </div>

                </button>
              );
            })}

          </div>

        </aside>

        {/* ====================================
            CHAT AREA
        ==================================== */}
        <section className="flex flex-1 flex-col">

          {/* No user selected */}
          {!selectedUser && (
            <div className="flex flex-1 items-center justify-center">

              <div className="text-center">

                <div className="mb-4 text-5xl">
                  💬
                </div>

                <h2 className="text-2xl font-semibold">
                  Welcome, {user?.name}! 👋
                </h2>

                <p className="mt-2 text-gray-400">
                  Select a user to start chatting.
                </p>

              </div>

            </div>
          )}

          {/* User selected */}
          {selectedUser && (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900 px-6 py-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold">
                  {selectedUser.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <h2 className="font-semibold">
                    {selectedUser.name}
                  </h2>

                  <p className="text-sm text-gray-400">
                    {selectedUser.email}
                  </p>

                </div>

              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">

                {loadingConversation && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-gray-400">
                      Opening conversation...
                    </p>
                  </div>
                )}

                {!loadingConversation &&
                  loadingMessages && (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-gray-400">
                        Loading messages...
                      </p>
                    </div>
                  )}

                {!loadingConversation &&
                  !loadingMessages &&
                  messages.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mb-3 text-4xl">
                          👋
                        </div>

                        <p className="text-gray-400">
                          No messages yet.
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Start the conversation!
                        </p>
                      </div>
                    </div>
                  )}

                {!loadingConversation &&
                  !loadingMessages &&
                  messages.length > 0 && (
                    <div className="space-y-4">

                      {messages.map(
                        (message) => {
                          const senderId =
                            message.sender?._id ||
                            message.sender;

                          const currentUserId =
                            user?._id ||
                            user?.id;

                          const isOwnMessage =
                            senderId ===
                            currentUserId;

                          return (
                            <div
                              key={
                                message._id
                              }
                              className={`flex ${
                                isOwnMessage
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >

                              <div
                                className={`max-w-md rounded-2xl px-4 py-3 ${
                                  isOwnMessage
                                    ? "bg-blue-600"
                                    : "bg-gray-800"
                                }`}
                              >

                                <p className="text-sm">
                                  {message.text}
                                </p>

                                <p className="mt-1 text-xs opacity-60">
                                  {new Date(
                                    message.createdAt
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  )}
                                </p>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

              </div>

              {/* =================================
                  MESSAGE INPUT
              ================================= */}
              <div className="border-t border-gray-800 bg-gray-900 p-4">

                <div className="flex gap-3">

                  <input
                    type="text"
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(
                        event.target.value
                      )
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
                  />

                  <button
                    onClick={
                      handleSendMessage
                    }
                    disabled={
                      !messageText.trim() ||
                      !conversation ||
                      socketStatus !==
                        "Connected"
                    }
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>

                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Press Enter to send
                </p>

              </div>
            </>
          )}

        </section>

      </main>
    </div>
  );
}

export default Dashboard;