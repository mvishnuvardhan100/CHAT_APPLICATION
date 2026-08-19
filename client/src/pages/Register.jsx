import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Register({ onLogin }) {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(
        name,
        email,
        password
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl bg-gray-900 p-8 shadow-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Create Account
          </h1>

          <p className="mt-2 text-gray-400">
            Join the conversation.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Vishnu"
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="vishnu@test.com"
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Creating account..."
              : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <button
            onClick={onLogin}
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;