import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, Users, Download, LayoutDashboard, Calendar, Image as ImageIcon, User as UserIcon, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import AdminActivitiesManager from "../components/AdminActivitiesManager";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"events" | "activities" | "users" | "messages">("events");
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [selectedEventUsers, setSelectedEventUsers] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    category: "Games",
    date: "",
    players_per_team: 1,
    max_teams: 10,
    image: "",
    rules_pdf: null as File | null,
  });
  const { token } = useAuth();

  const fetchEvents = async () => {
    try {
      const data = await api.get("/events");
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await api.get("/admin/messages", token!);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRegisteredUsers = async () => {
    try {
      const data = await api.get("/admin/users", token!);
      setRegisteredUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchMessages();
    fetchRegisteredUsers();
  }, []);

  const handleDeleteMessage = async (id: number) => {
    try {
      await api.delete(`/admin/messages/${id}`, token!);
      toast.success("Message deleted");
      fetchMessages();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete message");
    }
  };

  const handleAddEvent = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newEvent.name);
      formData.append("category", newEvent.category);
      formData.append("date", newEvent.date);
      formData.append("players_per_team", newEvent.players_per_team.toString());
      formData.append("max_teams", newEvent.max_teams.toString());
      formData.append("image", newEvent.image);
      if (newEvent.rules_pdf) {
        formData.append("rules_pdf", newEvent.rules_pdf);
      }

      if (editingEventId) {
        await api.put(`/events/${editingEventId}`, formData, token!);
        toast.success("Event updated successfully!");
      } else {
        await api.post("/events", formData, token!);
        toast.success("Event added successfully!");
      }

      setShowAddModal(false);
      setEditingEventId(null);
      setNewEvent({ name: "", category: "Games", date: "", players_per_team: 1, max_teams: 10, image: "", rules_pdf: null });
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || "Failed to save event");
    }
  };

  const handleEditClick = (event: any) => {
    setNewEvent({
      name: event.name,
      category: event.category,
      date: event.date,
      players_per_team: event.players_per_team,
      max_teams: event.max_teams,
      image: event.image,
      rules_pdf: null,
    });
    setEditingEventId(event.id);
    setShowAddModal(true);
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await api.delete(`/events/${id}`, token!);
      toast.success("Event deleted successfully!");
      setDeleteConfirmId(null);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete event");
    }
  };

  const viewUsers = async (eventId: number) => {
    try {
      const data = await api.get(`/admin/registrations/${eventId}`, token!);
      setSelectedEventUsers(data);
      setSelectedEventId(eventId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRegistration = async (registrationId: number) => {
    if (!selectedEventId) return;

    const shouldDelete = window.confirm("Delete this registration entry?");
    if (!shouldDelete) return;

    try {
      await api.delete(`/admin/registrations/${registrationId}`, token!);
      toast.success("Registration deleted");
      await viewUsers(selectedEventId);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete registration");
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    const shouldDelete = window.confirm(`Delete user ${userName}? This will also delete their event registrations.`);
    if (!shouldDelete) return;

    try {
      await api.delete(`/admin/users/${userId}`, token!);
      toast.success("User deleted successfully");

      if (selectedEventId) {
        await viewUsers(selectedEventId);
      }

      fetchRegisteredUsers();
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const exportToExcel = (eventId: number, eventName: string) => {
    const exportData: any[] = [];
    
    selectedEventUsers.forEach((team: any) => {
      team.players.forEach((player: any) => {
        exportData.push({
          "Event Name": eventName,
          "Team Name": team.team_name || "N/A",
          "Player Name": player.player_name,
          "Mobile Number": player.mobile_number,
          "Captain Name": `${team.firstName} ${team.lastName}`,
          "Captain Mobile": team.captain_mobile
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, `${eventName}_registrations.xlsx`);
  };

  const exportUsersToExcel = () => {
    const exportData = registeredUsers.map((user: any) => ({
      "First Name": user.firstName,
      "Last Name": user.lastName,
      "Mobile Number": user.mobile,
      Password: user.password || "Not available (registered before update)",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registered Users");
    XLSX.writeFile(wb, "registered_users.xlsx");
  };

  const categories = ["Games", "Cultural", "Education"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8 md:mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center">
            <LayoutDashboard className="w-8 h-8 md:w-10 md:h-10 mr-3 md:mr-4 text-white" />
            Admin Dashboard
          </h1>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => setActiveTab("events")}
              className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === "events" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === "activities" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
            >
              Manage Activities
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === "messages" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
            >
              Messages ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === "users" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
            >
              Registered Users ({registeredUsers.length})
            </button>
          </div>
        </div>
        {activeTab === "events" && (
          <button
            onClick={() => {
              setEditingEventId(null);
              setNewEvent({ name: "", category: "Games", date: "", players_per_team: 1, max_teams: 10, image: "", rules_pdf: null });
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-bold flex items-center justify-center transition shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Event
          </button>
        )}
      </div>

      {activeTab === "events" ? (
        /* Events List Category-wise */
        <div className="space-y-10">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2">{cat} Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events
                  .filter((e) => e.category === cat)
                  .map((event) => (
                    <div key={event.id} className="bg-gray-900 rounded-xl shadow-2xl p-6 border border-white/5">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-white">{event.name}</h3>
                        <button
                          onClick={() => setDeleteConfirmId(event.id)}
                          className="text-red-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm text-gray-400 mb-6">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(event.date).toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {event.registrationCount} / {event.max_teams} Teams
                        </div>
                        <div className="flex items-center text-xs text-gold/60">
                          <UserIcon className="w-3 h-3 mr-2" />
                          {event.players_per_team} Players per Team
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(event)}
                          className="flex-1 bg-white hover:bg-gray-200 text-black py-2 rounded-lg font-semibold flex items-center justify-center transition"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => viewUsers(event.id)}
                          className="flex-1 bg-black hover:bg-gray-800 text-white py-2 rounded-lg font-semibold flex items-center justify-center transition border border-white/10"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          View Users
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "activities" ? (
        <AdminActivitiesManager token={token!} />
      ) : activeTab === "messages" ? (
        /* Messages List */
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/50 text-gold text-xs uppercase tracking-wider">
                  <th className="px-4 sm:px-6 py-4 font-bold">Date</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">Name</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">Mobile</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">Message</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-gray-500">
                      No messages received yet.
                    </td>
                  </tr>
                ) : (
                  messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-white/5 transition">
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-bold text-white whitespace-nowrap">{msg.name}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-400 whitespace-nowrap">{msg.mobile}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-300 max-w-md min-w-[220px]">
                        <p className="line-clamp-2 hover:line-clamp-none cursor-help transition-all">
                          {msg.message}
                        </p>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-red-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-white/5">
          <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Registered Users</h2>
            <button
              onClick={exportUsersToExcel}
              disabled={registeredUsers.length === 0}
              className="bg-cream hover:bg-gold text-charcoal hover:text-white px-5 py-2 rounded-lg font-bold flex items-center transition disabled:opacity-50"
            >
              <Download className="w-5 h-5 mr-2" />
              Export to Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/50 text-gold text-xs uppercase tracking-wider">
                  <th className="px-4 sm:px-6 py-4 font-bold">First Name</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">Last Name</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">Mobile</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">Password</th>
                  <th className="px-4 sm:px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {registeredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-gray-500">
                      No registered users found.
                    </td>
                  </tr>
                ) : (
                  registeredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition">
                      <td className="px-4 sm:px-6 py-4 font-bold text-white whitespace-nowrap">{user.firstName}</td>
                      <td className="px-4 sm:px-6 py-4 font-bold text-white whitespace-nowrap">{user.lastName}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-300 whitespace-nowrap">{user.mobile}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-400 text-xs break-all">{user.password || "Not available (registered before update)"}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                          className="text-red-500 hover:text-red-400 transition"
                          title="Delete user"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Modal */}
      {selectedEventId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-dark rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gold/20">
            <div className="p-6 border-b border-gold/10 flex justify-between items-center bg-charcoal">
              <h3 className="text-xl font-bold text-cream">
                Registered Teams - {events.find((e) => e.id === selectedEventId)?.name}
              </h3>
              <button onClick={() => setSelectedEventId(null)} className="text-gold hover:text-cream">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow bg-charcoal">
              {selectedEventUsers.length === 0 ? (
                <p className="text-center text-gold/50 py-8">No registrations yet.</p>
              ) : (
                <div className="space-y-6">
                  {selectedEventUsers.map((team) => (
                    <div key={team.id} className="bg-gray-dark rounded-xl p-4 border border-gold/10">
                      <div className="flex justify-between items-center mb-4 border-b border-gold/10 pb-2">
                        <div>
                          <h4 className="text-lg font-bold text-cream">{team.team_name || "Unnamed Team"}</h4>
                          <p className="text-xs text-gold/70">Captain: {team.firstName} {team.lastName} ({team.captain_mobile})</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded">
                            {team.players.length} Players
                          </span>
                          <button
                            onClick={() => handleDeleteRegistration(team.id)}
                            className="text-red-500 hover:text-red-400 p-1 transition"
                            title="Delete registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {team.players.map((player: any, pIdx: number) => (
                          <div key={pIdx} className="flex items-center space-x-3 text-sm">
                            <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center text-gold text-xs font-bold">
                              {pIdx + 1}
                            </div>
                            <div>
                              <p className="text-cream font-medium">{player.player_name}</p>
                              <p className="text-gold/60 text-xs">{player.mobile_number}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gold/10 bg-charcoal flex justify-end">
              <button
                onClick={() => exportToExcel(selectedEventId, events.find((e) => e.id === selectedEventId)?.name)}
                disabled={selectedEventUsers.length === 0}
                className="bg-cream hover:bg-gold text-charcoal hover:text-white px-6 py-2 rounded-lg font-bold flex items-center transition disabled:opacity-50"
              >
                <Download className="w-5 h-5 mr-2" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-gray-dark rounded-2xl max-w-lg w-full overflow-hidden border border-gold/20 shadow-2xl">
            <div className="p-6 border-b border-gold/10 bg-charcoal flex justify-between items-center">
              <h3 className="text-2xl font-bold text-cream">{editingEventId ? "Edit Event" : "Add New Event"}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gold hover:text-cream transition">
                <Plus className="w-8 h-8 rotate-45" />
              </button>
            </div>
            <div className="p-5 sm:p-8 bg-charcoal">
            <form onSubmit={handleAddEvent} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Event Name</label>
                <input
                  type="text"
                  required
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                  placeholder="e.g. Football Tournament"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Category</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition appearance-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Date & Time</label>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40 group-focus-within:text-gold transition-colors pointer-events-none" />
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    onFocus={(e) => (e.target as any).showPicker?.()}
                    onClick={(e) => (e.target as any).showPicker?.()}
                    className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none cursor-pointer transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Players / Team</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newEvent.players_per_team}
                    onChange={(e) => setNewEvent({ ...newEvent, players_per_team: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Max Teams</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newEvent.max_teams}
                    onChange={(e) => setNewEvent({ ...newEvent, max_teams: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Image URL</label>
                <div className="relative group">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40 group-focus-within:text-gold transition-colors" />
                  <input
                    type="url"
                    required
                    value={newEvent.image}
                    onChange={(e) => setNewEvent({ ...newEvent, image: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Rules PDF (Optional)</label>
                <div className="relative group">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40 group-focus-within:text-gold transition-colors" />
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setNewEvent({ ...newEvent, rules_pdf: e.target.files?.[0] || null })}
                    className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gold/20 file:text-gold hover:file:bg-gold/30"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gold/20 rounded-xl text-gold/60 hover:bg-gold/10 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-cream text-charcoal rounded-xl font-black hover:bg-gold hover:text-white transition shadow-xl"
                >
                  {editingEventId ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
          <div className="bg-gray-dark rounded-2xl max-w-sm w-full overflow-hidden border border-red-500/20 shadow-2xl">
            <div className="p-6 bg-charcoal text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-cream mb-2">Delete Event?</h3>
              <p className="text-gold/60 text-sm mb-6">
                This action cannot be undone. All registrations for this event will also be deleted.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-3 border border-gold/20 rounded-xl text-gold/60 hover:bg-gold/10 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteEvent(deleteConfirmId)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-black hover:bg-red-600 transition shadow-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
