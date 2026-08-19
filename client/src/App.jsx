import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTg0MWFhYWFhMGM3Y2RjMjAyOGYzNGYiLCJpYXQiOjE3ODcwNjc0MjcsImV4cCI6MTc4NzY3MjIyN30.WY5X5jE2Ncp5u4-9n-6fvMJwLwnuX1j7TO8bU0EzPPw";

const CONVERSATION_ID =
  "6a8474fc81a1e96fafd7abe7";

function App() {
  const [status, setStatus] = useState("Connecting...");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: {
        token: TOKEN,
      },
    });

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      setStatus("Connected ✅");

      console.log(
        "About to join conversation:",
        CONVERSATION_ID
      );

      socket.emit(
        "joinConversation",
        CONVERSATION_ID,
        (response) => {
          console.log(
            "Join acknowledgement:",
            response
          );

          if (response?.success) {
            console.log(
              "Successfully joined conversation"
            );
          }
        }
      );

      setTimeout(() => {
        console.log(
          "Sending test message..."
        );

        socket.emit("sendMessage", {
          conversationId:
            CONVERSATION_ID,
          text:
            "Hello Rahul! This is a real-time message ⚡",
        });
      }, 2000);
    });

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message
        );

        setStatus(
          `Connection failed: ${error.message}`
        );
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "Socket disconnected"
        );

        setStatus("Disconnected");
      }
    );

    socket.on(
      "newMessage",
      (message) => {
        console.log(
          "New message received:",
          message
        );

        setMessages(
          (previousMessages) => [
            ...previousMessages,
            message,
          ]
        );
      }
    );

    socket.on(
      "messageError",
      (error) => {
        console.error(
          "Message error:",
          error
        );

        setStatus(
          `Message error: ${error.message}`
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-10 text-white">
      <div className="mx-auto max-w-2xl">

        <h1 className="mb-4 text-3xl font-bold">
          Socket.IO Test
        </h1>

        <div className="mb-6 rounded-lg bg-gray-800 p-4">
          <p className="text-lg">
            Status: {status}
          </p>
        </div>

        <div className="space-y-3">

          {messages.length === 0 ? (
            <p className="text-gray-400">
              Waiting for messages...
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className="rounded-lg bg-gray-800 p-4"
              >
                <p className="mb-1 font-semibold">
                  {message.sender.name}
                </p>

                <p className="text-gray-300">
                  {message.text}
                </p>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}

export default App;