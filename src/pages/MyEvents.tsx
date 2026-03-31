import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { Calendar, Clock, Users, Ticket, FileText, Eye } from "lucide-react";
import { motion } from "motion/react";

export default function MyEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const data = await api.get("/my-events", token!);
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchMyEvents();
  }, [token]);

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
        <h1 className="text-3xl md:text-4xl font-bold text-cream">My Registered Events</h1>
        <p className="text-gold mt-2">Here are the events you've signed up for</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-gray-dark rounded-2xl shadow-2xl border border-dashed border-gold/20">
          <Ticket className="w-16 h-16 text-gold/30 mx-auto mb-4" />
          <p className="text-gold/50 text-xl">You haven't registered for any events yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-dark rounded-xl shadow-2xl overflow-hidden border border-gold/10 flex flex-col sm:flex-row"
            >
              <div className="w-full sm:w-1/3 h-44 sm:h-full sm:min-h-[160px]">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-full sm:w-2/3 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                  <h3 className="text-xl font-bold text-cream">{event.name}</h3>
                  <span className="bg-cream text-charcoal text-xs font-bold px-2 py-1 rounded">
                    {event.category}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gold">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gold" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gold" />
                    <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {event.team_name && (
                    <div className="flex items-center font-bold">
                      <Users className="w-4 h-4 mr-2 text-gold" />
                      <span>Team: {event.team_name}</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs opacity-70">
                    <Users className="w-4 h-4 mr-2 text-gold" />
                    <span>{event.player_count} Players Registered</span>
                  </div>
                  {event.rules_pdf && (
                    <div className="mt-4 p-2 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-between">
                      <div className="flex items-center text-gold">
                        <FileText className="w-3 h-3 mr-2" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Rules</span>
                      </div>
                      <a
                        href={event.rules_pdf}
                        target="_self"
                        className="flex items-center text-cream hover:text-gold transition text-[10px] font-bold"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Rules
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center text-gold font-semibold text-sm">
                  <div className="w-2 h-2 bg-gold rounded-full mr-2 animate-pulse" />
                  Confirmed Registration
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
