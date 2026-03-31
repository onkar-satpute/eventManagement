import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";
import { LogIn, Phone, Lock } from "lucide-react";

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post("/auth/login", { mobile, password });
      login(data.token, data.user);
      toast.success("Welcome back!");
      if (data.user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-charcoal px-4 py-8 sm:py-10">
      <div className="max-w-md w-full bg-gray-dark rounded-2xl shadow-2xl p-6 sm:p-8 border border-gold/10">
        <div className="text-center mb-6 sm:mb-8">
          <img 
            src="https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/slideimages/logo.png" 
            alt="Logo" 
            className="w-20 h-20 mx-auto mb-4 object-contain brightness-110 contrast-125"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-3xl font-bold text-cream">Welcome Back</h2>
          <p className="text-gold mt-2">Login to manage your events</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-cream/80 mb-1">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
              <input
                type="text"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-charcoal border border-gold/20 rounded-lg focus:ring-2 focus:ring-gold outline-none transition text-cream placeholder-gold/30"
                placeholder="Enter mobile number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-cream/80 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-charcoal border border-gold/20 rounded-lg focus:ring-2 focus:ring-gold outline-none transition text-cream placeholder-gold/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cream hover:bg-gold text-charcoal hover:text-white font-bold py-3 rounded-lg transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-6 sm:mt-8 text-gold">
          Don't have an account?{" "}
          <Link to="/register" className="text-cream font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
