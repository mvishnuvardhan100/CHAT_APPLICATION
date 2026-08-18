# 💬 Chat App

A full-stack real-time chat application built with **React, Tailwind CSS, Node.js, Express, MongoDB, and Socket.IO**.

The project is being developed step-by-step with a focus on clean architecture, real-time communication, authentication, and a responsive user interface.

---

## 🚀 Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- React Router
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT
- bcryptjs
- CORS
- dotenv

---

## ✨ Features

### Authentication

- [ ] User registration
- [ ] User login
- [ ] JWT authentication
- [ ] Secure password hashing
- [ ] Protected routes
- [ ] Logout

### Chat

- [ ] One-to-one conversations
- [ ] Real-time messaging
- [ ] Message persistence
- [ ] Chat history
- [ ] Online/offline status
- [ ] Typing indicator
- [ ] Unread message count

### User Experience

- [ ] User profiles
- [ ] Search users
- [ ] Responsive UI
- [ ] Loading states
- [ ] Error handling

---

## 📁 Project Structure

```text
chat_app/
│
├── client/                         # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── server/                         # Node.js backend
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
```
