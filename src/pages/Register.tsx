import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { toast } from "sonner";
import { UserPlus, User, Phone, Lock } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", formData);
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
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
          <h2 className="text-3xl font-bold text-cream">Create Account</h2>
          <p className="text-gold mt-2">Join us to explore and register for events</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cream/80 mb-1">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-charcoal border border-gold/20 rounded-lg focus:ring-2 focus:ring-gold outline-none text-cream placeholder-gold/30"
                  placeholder="John"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-cream/80 mb-1">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-charcoal border border-gold/20 rounded-lg focus:ring-2 focus:ring-gold outline-none text-cream placeholder-gold/30"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-cream/80 mb-1">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-charcoal border border-gold/20 rounded-lg focus:ring-2 focus:ring-gold outline-none text-cream placeholder-gold/30"
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-charcoal border border-gold/20 rounded-lg focus:ring-2 focus:ring-gold outline-none text-cream placeholder-gold/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cream hover:bg-gold text-charcoal hover:text-white font-bold py-3 rounded-lg transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-6 sm:mt-8 text-gold">
          Already have an account?{" "}
          <Link to="/login" className="text-cream font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
