import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, Sparkles, AlertCircle, Coins } from "lucide-react";
import { motion } from "motion/react";

interface RegisterProps {
  onToggleView: () => void;
}

export default function Register({ onToggleView }: RegisterProps) {
  const { register, error, clearError } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!username.trim() || !email.trim() || !password) {
      setLocalError("Please supply valid email, username, and password credentials.");
      return;
    }

    if (username.length < 3) {
      setLocalError("Client handles must be at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Security passcode must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(username.trim(), email.toLowerCase(), password);
    } catch (err: any) {
      setLocalError(err.message || "Failed to initialize ledger registration.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden px-4 font-sans selection:bg-slate-950 selection:text-white">
      {/* background circles decorative mesh */}
      <div className="absolute top-1/4 right-1/4 h-80 w-80 rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-emerald-100/30 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 space-y-5"
      >
        {/* Brand identity header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-11 w-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-md mb-4 group hover:rotate-6 transition duration-300">
            <Sparkles className="h-5 w-5 text-emerald-400 fill-emerald-400/20" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight uppercase">
            Create Ledger Profile
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-[270px] leading-relaxed">
            Gain real-time access to the elite bidding catalog and showcase rooms.
          </p>
        </div>

        {/* Promo Starting Wallet Benefit */}
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Coins className="h-4.5 w-4.5" />
          </div>
          <div className="text-left">
            <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Starting Benefit</h4>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">Free Starting Bid Balance: $50,000</p>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {localError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-red-600 leading-relaxed animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{localError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Client Username Handle
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400">
                <UserIcon className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                placeholder="e.g. KyotoNomad12"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-slate-950 text-xs rounded-xl transition font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                placeholder="collector@auctioncraft.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-slate-950 text-xs rounded-xl transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Security Passcode (6+ Characters)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-slate-950 text-xs rounded-xl transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-900 transition"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-950 text-white hover:bg-slate-900 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md cursor-pointer pt-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Seeding Credentials...
              </>
            ) : (
              "Initialize Wallet & Registrate"
            )}
          </button>
        </form>

        {/* Alternate log option */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Already registered on ledger?{" "}
            <button
              onClick={() => {
                clearError();
                onToggleView();
              }}
              type="button"
              className="text-slate-950 font-bold hover:underline"
            >
              Sign In to Your Room
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
