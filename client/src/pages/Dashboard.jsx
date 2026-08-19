import {
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const SOCKET_URL = "http://localhost:5000";

function Dashboard() {
  const { user, logout } = useAuth();

  const socketRef = useRef(null);
  const conversationRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] =
    useState(null);
  const [conversation, setConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] =
    useState("");

  const [loadingUsers, setLoadingUsers] =
    useState(true);
  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [error, setError] = useState("");
  const [socketStatus, setSocketStatus] =
    useState("Connecting...");

  useEffect(() => {
    conversationRef.current =
      conversation;
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // SOCKET CONNECTION
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

      const currentConversation =
        conversationRef.current;

      if (currentConversation) {
        socket.emit(
          "joinConversation",
          currentConversation._id
        );
      }
    });

    socket.on("connect_error", (error) => {
      console.error(
        "Socket error:",
        error.message
      );

      setSocketStatus("Disconnected");
    });

    socket.on("disconnect", () => {
      setSocketStatus("Disconnected");
    });

    socket.on("newMessage", (message) => {
      const currentConversation =
        conversationRef.current;

      if (
        !currentConversation ||
        message.conversation !==
          currentConversation._id
      ) {
        return;
      }

      setMessages((previous) => {
        const exists = previous.some(
          (item) =>
            item._id === message._id
        );

        if (exists) {
          return previous;
        }

        return [...previous, message];
      });
    });

    socket.on("messageError", (data) => {
      setError(
        data?.message ||
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

        const response = await api.get(
          "/users"
        );

        setUsers(response.data.users);
      } catch (error) {
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
  const handleSelectUser = async (
    otherUser
  ) => {
    try {
      setSelectedUser(otherUser);
      setConversation(null);
      setMessages([]);
      setMessageText("");
      setError("");
      setLoadingMessages(true);

      const response = await api.post(
        "/conversations",
        {
          userId: otherUser._id,
        }
      );

      const newConversation =
        response.data.conversation;

      setConversation(
        newConversation
      );

      conversationRef.current =
        newConversation;

      if (socketRef.current?.connected) {
        socketRef.current.emit(
          "joinConversation",
          newConversation._id
        );
      }

      const messageResponse =
        await api.get(
          `/conversations/${newConversation._id}/messages`
        );

      setMessages(
        messageResponse.data.messages
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to open conversation"
      );
    } finally {
      setLoadingMessages(false);
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

    socketRef.current.emit(
      "sendMessage",
      {
        conversationId:
          conversation._id,
        text,
      }
    );

    setMessageText("");
    setError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(
      date
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
        <h1 className="text-2xl font-bold">
          Chat App
        </h1>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold">
              {user?.name}
            </p>

            <p className="text-xs text-gray-400">
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
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex h-[calc(100vh-73px)]">
        {/* SIDEBAR */}
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900 p-4">
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
            users.length === 0 && (
              <p className="text-sm text-gray-400">
                No other users found.
              </p>
            )}

          <div className="space-y-2">
            {users.map((otherUser) => {
              const selected =
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
                    selected
                      ? "bg-blue-600"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 font-semibold">
                    {otherUser.name
                      ?.charAt(0)
                      .toUpperCase()}

                    {otherUser.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-900 bg-green-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold">
                      {otherUser.name}
                    </p>

                    <p className="truncate text-xs text-gray-400">
                      {otherUser.isOnline
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CHAT */}
        <section className="flex min-w-0 flex-1 flex-col">
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
                  Select a user to start
                  chatting.
                </p>
              </div>
            </div>
          )}

          {selectedUser && (
            <>
              {/* CHAT HEADER */}
              <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900 px-6 py-4">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-semibold">
                  {selectedUser.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h2 className="font-semibold">
                    {selectedUser.name}
                  </h2>

                  <p className="text-xs text-gray-400">
                    {selectedUser.isOnline
                      ? "Online"
                      : selectedUser.email}
                  </p>
                </div>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingMessages && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-gray-400">
                      Loading messages...
                    </p>
                  </div>
                )}

                {!loadingMessages &&
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

                <div className="space-y-3">
                  {messages.map((message) => {
                    const senderId =
                      message.sender?._id ||
                      message.sender;

                    const currentUserId =
                      user?._id ||
                      user?.id;

                    const own =
                      senderId ===
                      currentUserId;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${
                          own
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            own
                              ? "rounded-br-sm bg-blue-600"
                              : "rounded-bl-sm bg-gray-800"
                          }`}
                        >
                          <p className="break-words text-sm">
                            {message.text}
                          </p>

                          <p className="mt-1 text-right text-[10px] opacity-60">
                            {formatTime(
                              message.createdAt
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* INPUT */}
              <div className="border-t border-gray-800 bg-gray-900 p-4">
                <div className="flex gap-3">
                  <textarea
                    rows="1"
                    value={messageText}
                    onChange={(e) =>
                      setMessageText(
                        e.target.value
                      )
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="max-h-32 min-h-[48px] flex-1 resize-none rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 outline-none placeholder:text-gray-500 focus:border-blue-500"
                  />

                  <button
                    onClick={
                      handleSendMessage
                    }
                    disabled={
                      !messageText.trim() ||
                      socketStatus !==
                        "Connected"
                    }
                    className="rounded-xl bg-blue-600 px-6 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Enter to send • Shift + Enter
                  for a new line
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