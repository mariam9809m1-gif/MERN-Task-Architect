import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<"login" | "register">("login");

  // Aesthetic central applet loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="h-14 w-14 rounded-2xl bg-slate-950 border border-slate-800 text-white flex items-center justify-center shadow-2xl mb-4"
        >
          <Sparkles className="h-6 w-6 text-emerald-400 fill-emerald-400/20" />
        </motion.div>
        <span className="text-[10px] font-extrabold text-slate-800 tracking-widest uppercase animate-pulse">
          Seeding Bidding Ballroom...
        </span>
      </div>
    );
  }

  // Auth Gate
  if (!user) {
    if (currentView === "login") {
      return <Login onToggleView={() => setCurrentView("register")} />;
    } else {
      return <Register onToggleView={() => setCurrentView("login")} />;
    }
  }

  // Authenticated Auction Dashboard Workspace
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
