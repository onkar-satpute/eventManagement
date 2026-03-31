import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Games", path: "/category/Games" },
    { name: "Cultural", path: "/category/Cultural" },
    { name: "Education", path: "/category/Education" },
  ];

  return (
    <nav className="bg-charcoal/80 backdrop-blur-md border-b border-gold/20 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center w-20 sm:w-24">
            <Link to="/" className="block">
              <img 
                src="https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/slideimages/logo.png" 
                alt="Logo" 
                className="h-14 sm:h-16 md:h-20 w-auto z-10 drop-shadow-md brightness-110 contrast-125"
                referrerPolicy="no-referrer"
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-cream/80 hover:text-cream font-medium transition"
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <Link
                to="/my-events"
                className="text-cream/80 hover:text-cream font-medium transition"
              >
                My Events
              </Link>
            )}
            
            <div className="flex items-center space-x-3 border-l border-gold/20 pl-6">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-cream/70 flex items-center">
                    <UserIcon className="w-4 h-4 mr-1 text-gold" />
                    {user.firstName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-sm text-red-400 hover:text-red-300 font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </button>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-sm text-gold font-bold hover:text-cream transition">Admin</Link>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-cream/80 hover:text-cream font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-cream text-charcoal px-4 py-2 rounded-md hover:bg-gold hover:text-white transition font-bold"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-cream/80 hover:text-cream"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-charcoal/95 backdrop-blur-lg border-t border-gold/20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-cream/80 hover:bg-gold/10 hover:text-cream rounded-md"
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <Link
                to="/my-events"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-cream/80 hover:bg-gold/10 hover:text-cream rounded-md"
              >
                My Events
              </Link>
            )}
            <div className="pt-4 pb-3 border-t border-gold/20">
              {user ? (
                <div className="px-3 space-y-1">
                  <p className="text-sm font-medium text-cream/60 px-3">
                    Hi, {user.firstName}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-md"
                  >
                    Logout
                  </button>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-gold font-bold">Admin Dashboard</Link>
                  )}
                </div>
              ) : (
                <div className="px-3 space-y-1">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-cream/80 hover:bg-gold/10 rounded-md"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 bg-cream text-charcoal font-bold rounded-md text-center"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
