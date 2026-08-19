import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
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
          </div>

          <button
            onClick={logout}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex min-h-[calc(100vh-73px)]">

        {/* Sidebar */}
        <aside className="w-80 border-r border-gray-800 bg-gray-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">
            Conversations
          </h2>

          <div className="rounded-lg bg-gray-800 p-4">
            <p className="font-semibold">
              No conversation selected
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Select a user to start chatting.
            </p>
          </div>
        </aside>

        {/* Chat Area */}
        <section className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">
              Welcome, {user?.name}! 👋
            </h2>

            <p className="mt-2 text-gray-400">
              Select a conversation to start chatting.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}

export default Dashboard;