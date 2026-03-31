import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";
import { Calendar, Users, Clock, User, Phone, X, FileText, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function EventCategory() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<any[]>([]);
  const { user, token } = useAuth();

  const fetchEvents = async () => {
    try {
      const data = await api.get(`/events?category=${category}`, token);
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category, token]);

  const openRegisterModal = async (event: any) => {
    if (!user) {
      toast.error("Please login to register for events");
      navigate("/login");
      return;
    }

    if (event.isRegistered) {
      toast.error("You have already registered for this event");
      return;
    }
    
    // Check deadline
    const eventDate = new Date(event.date);
    const deadline = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() - 1, 0, 0, 0);
    if (new Date() >= deadline) {
      toast.error("Registration is closed for this event");
      return;
    }

    // Check if full
    if (event.registrationCount >= event.max_teams) {
      toast.error("All slots are full for this event");
      return;
    }

    // Case 1: Single Player Event (players_per_team = 1)
    if (event.players_per_team === 1) {
      try {
        await api.post("/registrations", { 
          event_id: event.id, 
          team_name: `${user.firstName} ${user.lastName}`,
          players: [] // Backend will handle using user details
        }, token!);
        toast.success("You are successfully registered!");
        fetchEvents();
      } catch (err: any) {
        toast.error(err.message || "Registration failed");
      }
      return;
    }

    // Case 2: Team Event (players_per_team > 1)
    setSelectedEvent(event);
    setTeamName("");
    setPlayers(Array.from({ length: event.players_per_team }, () => ({ player_name: "", mobile_number: "" })));
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (players.some(p => !p.player_name || !p.mobile_number)) {
      toast.error("Please fill in all player details");
      return;
    }

    try {
      await api.post("/registrations", { 
        event_id: selectedEvent.id, 
        team_name: teamName,
        players 
      }, token!);
      toast.success("Successfully registered your team!");
      setSelectedEvent(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    }
  };

  const updatePlayer = (index: number, field: string, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  const isRegistrationClosed = (eventDateStr: string) => {
    const eventDate = new Date(eventDateStr);
    const deadline = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() - 1, 0, 0, 0);
    return new Date() >= deadline;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-cream">{category} Events</h1>
        <p className="text-gold mt-2">Explore and join our latest {category?.toLowerCase()} activities</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-gray-dark rounded-2xl border border-gold/10">
          <p className="text-gold/50 text-xl">No events found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-dark rounded-xl shadow-2xl overflow-hidden border border-gold/10 flex flex-col"
            >
              <div className="relative h-52 sm:h-56">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {event.isRegistered && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    Registered
                  </div>
                )}
              </div>
              <div className="p-5 sm:p-6 flex-grow flex flex-col">
                <h3 className="text-xl sm:text-2xl font-bold text-cream mb-4">{event.name}</h3>
                
                <div className="space-y-3 mb-6 flex-grow">
                  <div className="flex items-center text-cream/80">
                    <Calendar className="w-5 h-5 mr-3 text-gold" />
                    <span>{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
                  </div>
                  <div className="flex items-center text-cream/80">
                    <Clock className="w-5 h-5 mr-3 text-gold" />
                    <span>{new Date(event.date).toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center text-cream/80">
                    <Users className="w-5 h-5 mr-3 text-gold" />
                    <span>{event.registrationCount} / {event.max_teams} Teams</span>
                  </div>
                  <div className="flex items-center text-cream/80 text-sm">
                    <User className="w-4 h-4 mr-3 text-gold/60" />
                    <span>{event.players_per_team} Players per Team</span>
                  </div>
                  {event.isRegistered && event.rules_pdf && (
                    <div className="mt-4 p-3 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-between">
                      <div className="flex items-center text-gold min-w-0">
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Event Rules</span>
                      </div>
                      <a
                        href={event.rules_pdf}
                        target="_self"
                        className="flex items-center text-cream hover:text-gold transition text-xs font-bold"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Rules
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-bold ${
                      event.isRegistered 
                        ? 'text-green-400'
                        : (event.registrationCount >= event.max_teams || isRegistrationClosed(event.date)) 
                          ? 'text-red-400' 
                          : 'text-gold'
                    }`}>
                      {event.isRegistered 
                        ? 'Already Registered'
                        : isRegistrationClosed(event.date) 
                          ? 'Registration Closed' 
                          : event.registrationCount >= event.max_teams 
                            ? 'Slots Full' 
                            : 'Registration Open'}
                    </span>
                    <span className="text-xs sm:text-sm text-cream/60">
                      {event.max_teams - event.registrationCount} slots left
                    </span>
                  </div>
                  <button
                    onClick={() => openRegisterModal(event)}
                    disabled={event.isRegistered || event.registrationCount >= event.max_teams || isRegistrationClosed(event.date)}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      (event.isRegistered || event.registrationCount >= event.max_teams || isRegistrationClosed(event.date))
                        ? "bg-charcoal text-gray-500 cursor-not-allowed"
                        : "bg-cream text-charcoal hover:bg-gold hover:text-white"
                    }`}
                  >
                    {event.isRegistered 
                      ? "Registered"
                      : isRegistrationClosed(event.date) 
                        ? "Closed" 
                        : event.registrationCount >= event.max_teams 
                          ? "Full" 
                          : event.players_per_team === 1 ? "Register Now" : "Register Team"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {/* Registration Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-dark rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gold/20 shadow-2xl"
            >
              <div className="p-4 sm:p-6 border-b border-gold/10 flex justify-between items-center bg-charcoal">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-cream">Register Team</h3>
                  <p className="text-gold/60 text-sm">{selectedEvent.name}</p>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-gold hover:text-cream transition">
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <form onSubmit={handleRegisterSubmit} className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-grow bg-charcoal space-y-6 sm:space-y-8">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gold uppercase tracking-wider">Team Name (Optional)</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-dark border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                    placeholder="Enter your team name"
                  />
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-cream border-b border-gold/10 pb-2">Player Details</h4>
                  {players.map((player, idx) => (
                    <div key={idx} className="bg-gray-dark/50 p-4 sm:p-6 rounded-2xl border border-gold/5 space-y-4">
                      <div className="flex items-center space-x-2 text-gold mb-2">
                        <User className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Player {idx + 1} {idx === 0 ? "(Captain)" : ""}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40" />
                          <input
                            type="text"
                            required
                            value={player.player_name}
                            onChange={(e) => updatePlayer(idx, "player_name", e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/10 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40" />
                          <input
                            type="tel"
                            required
                            value={player.mobile_number}
                            onChange={(e) => updatePlayer(idx, "mobile_number", e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/10 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                            placeholder="Mobile Number"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-cream text-charcoal rounded-xl font-black text-lg hover:bg-gold hover:text-white transition shadow-xl transform active:scale-[0.98]"
                  >
                    Confirm Registration
                  </button>
                  <p className="text-center text-gold/40 text-xs mt-4">
                    By clicking confirm, you agree to the event rules and regulations.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
