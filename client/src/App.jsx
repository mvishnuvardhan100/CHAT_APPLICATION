import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading } = useAuth();

  console.log("APP USER:", user);
  console.log("APP LOADING:", loading);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return <Login />;
}

export default App;