import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Users, ChevronRight, ChevronLeft, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/AuthContext";

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const slides = [
    {
      image: "https://raw.githubusercontent.com/shrinivaskumari/TalkChain/main/Baba%20Saheb.jpg",
      title: "Cultivation of mind should be the ultimate aim of human existence.",
      subtitle: "",
    },
    {
      image: "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/slideimages/download.jpg",
      title: "I like the religion that teaches liberty, equality and fraternity.",
      subtitle: "",
    },
    {
      image: "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/slideimages/image.png",
      title: "Life should be great rather than long.",
      subtitle: "",
    },
  ];

  const pastEvents = [
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/6.jpeg",
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/8.jpeg",
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/WhatsApp%20Image%202026-03-16%20at%2011.02.24%20AM.jpeg",
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/WhatsApp%20Image%202026-03-16%20at%2011.02.25%20AM%20(1).jpeg",
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/WhatsApp%20Image%202026-03-16%20at%2011.02.27%20AM.jpeg",
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/WhatsApp%20Image%202026-03-16%20at%2011.02.30%20AM.jpeg",
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/WhatsApp%20Image%202026-03-16%20at%2011.02.31%20AM.jpeg",
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/WhatsApp%20Image%202026-03-16%20at%2011.02.32%20AM%20(1).jpeg",
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/WhatsApp%20Image%202026-03-16%20at%2011.02.35%20AM%20(1).jpeg",
    "https://raw.githubusercontent.com/shrinivaskumari/bhimjayanti/main/past/WhatsApp%20Image%202026-03-16%20at%2011.02.59%20AM.jpeg",
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.get("/events", token);
        setEvents(data.slice(0, 6)); // Show first 6 active events
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, token]);

  const handleRegister = (category: string) => {
    navigate(`/category/${category}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <section className="relative h-[260px] sm:h-[380px] lg:h-[540px] overflow-hidden bg-charcoal">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
            >
              <div className="absolute inset-0 bg-charcoal/40 md:bg-charcoal/50" />
            </div>
            <div className="relative h-full flex flex-col items-center justify-end text-center text-cream px-4 pb-8 sm:pb-12 md:pb-20">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-base sm:text-xl md:text-4xl font-bold mb-2 md:mb-4 max-w-4xl italic px-2 sm:px-4 drop-shadow-lg"
              >
                "{slides[currentSlide].title}"
              </motion.h1>
              {slides[currentSlide].subtitle && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-sm md:text-xl mb-4 md:mb-8 text-gold"
                >
                  {slides[currentSlide].subtitle}
                </motion.p>
              )}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <Link
                  to="/register"
                  className="bg-cream hover:bg-gold text-charcoal hover:text-white px-6 py-2 md:px-8 md:py-3 rounded-full text-sm md:text-lg font-bold transition transform hover:scale-105 inline-block shadow-xl"
                >
                  Register Now
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-gold/20 hover:bg-gold/40 rounded-full text-cream transition z-10"
        >
          <ChevronLeft className="w-5 h-5 md:w-8 md:h-8" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-gold/20 hover:bg-gold/40 rounded-full text-cream transition z-10"
        >
          <ChevronRight className="w-5 h-5 md:w-8 md:h-8" />
        </button>
      </section>

      {/* Current Events Section */}
      <section className="py-12 md:py-16 bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-cream">Current Events</h2>
              <p className="text-gold mt-2">Don't miss out on these exciting opportunities</p>
            </div>
            <Link to="/category/Games" className="text-gold font-semibold flex items-center hover:text-cream transition">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ y: -10 }}
                className="bg-gray-dark rounded-xl shadow-2xl overflow-hidden border border-gold/10"
              >
                <div className="relative h-48">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-charcoal/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-cream shadow-sm border border-gold/20">
                    {event.category}
                  </div>
                  {event.isRegistered && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                      Registered
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-cream mb-2">{event.name}</h3>
                  <div className="flex items-center text-gold text-sm mb-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center text-cream/80">
                      <Users className="w-4 h-4 mr-2 text-gold" />
                      <span className="text-sm">
                        {event.registrationCount} / {event.max_teams} Teams
                      </span>
                    </div>
                    {event.isRegistered ? (
                      <span className="text-green-400 font-bold text-sm">Registered</span>
                    ) : event.registrationCount >= event.max_teams ? (
                      <span className="text-red-400 font-bold text-sm">Full</span>
                    ) : (
                      <span className="text-gold font-bold text-sm">
                        {event.max_teams - event.registrationCount} Slots Left
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRegister(event.category)}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      event.isRegistered
                        ? "bg-green-900/20 text-green-400 border border-green-400/20"
                        : event.registrationCount >= event.max_teams
                          ? "bg-charcoal text-gray-500 cursor-not-allowed"
                          : "bg-cream text-charcoal hover:bg-gold hover:text-white"
                    }`}
                  >
                    {event.isRegistered ? "Registered" : event.registrationCount >= event.max_teams ? "Full" : "Register Now"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events Gallery Section */}
      <section className="py-12 md:py-16 bg-gray-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-cream mb-8 md:mb-10 text-center">Past Event Highlights</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pastEvents.map((img, i) => (
              <div 
                key={i} 
                className="relative group overflow-hidden rounded-lg aspect-square border border-gold/10 cursor-pointer"
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={img}
                  alt={`Past Event ${i + 1}`}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-charcoal/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="text-cream font-bold">View Photo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/95 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center pt-8 sm:pt-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-0 right-0 sm:-top-12 text-cream hover:text-gold transition p-2"
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src={selectedImage}
                alt="Selected Event"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-gold/20"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
