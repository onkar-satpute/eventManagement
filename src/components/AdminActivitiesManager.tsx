import { useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, User, Users, Download } from "lucide-react";
import * as XLSX from "xlsx";

type ActivityForm = {
  name: string;
  date: string;
  description: string;
  image: string;
  conducted_by: string;
};

const initialForm: ActivityForm = {
  name: "",
  date: "",
  description: "",
  image: "",
  conducted_by: "",
};

export default function AdminActivitiesManager({ token }: { token: string }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ActivityForm>(initialForm);
  const [showInterestedModal, setShowInterestedModal] = useState(false);
  const [selectedInterested, setSelectedInterested] = useState<any | null>(null);

  const fetchActivities = async () => {
    try {
      const data = await api.get("/admin/activities", token);
      setActivities(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load activities");
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setShowFormModal(true);
  };

  const openEditModal = (activity: any) => {
    setEditingId(activity.id);
    setFormData({
      name: activity.name,
      date: activity.date,
      description: activity.description,
      image: activity.image,
      conducted_by: activity.conducted_by,
    });
    setShowFormModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/activities/${editingId}`, formData, token);
        toast.success("Activity updated successfully");
      } else {
        await api.post("/admin/activities", formData, token);
        toast.success("Activity added successfully");
      }
      setShowFormModal(false);
      setFormData(initialForm);
      setEditingId(null);
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || "Failed to save activity");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/activities/${id}`, token);
      toast.success("Activity deleted");
      setDeleteConfirmId(null);
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete activity");
    }
  };

  const openInterestedUsers = async (activityId: number) => {
    try {
      const data = await api.get(`/admin/activities/${activityId}/interested-users`, token);
      setSelectedInterested(data);
      setShowInterestedModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load interested users");
    }
  };

  const exportInterestedUsers = () => {
    if (!selectedInterested) return;

    const exportData = selectedInterested.users.map((u: any) => ({
      "Activity Name": selectedInterested.activityName,
      "First Name": u.firstName,
      "Last Name": u.lastName,
      "Mobile Number": u.mobile,
      "Marked At": new Date(u.created_at).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Interested Users");
    XLSX.writeFile(wb, `${selectedInterested.activityName}_interested_users.xlsx`);
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={openCreateModal}
          className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-bold flex items-center justify-center transition shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Activity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-gray-900 rounded-xl shadow-2xl p-6 border border-white/5">
            <div className="flex justify-between items-start mb-4 gap-4">
              <h3 className="text-xl font-bold text-white">{activity.name}</h3>
              <button
                onClick={() => setDeleteConfirmId(activity.id)}
                className="text-red-500 hover:text-red-400 p-1"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <img
              src={activity.image}
              alt={activity.name}
              className="w-full h-40 object-cover rounded-lg border border-white/10 mb-4"
              referrerPolicy="no-referrer"
            />

            <div className="space-y-2 text-sm text-gray-400 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(activity.date).toLocaleString()}
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Conducted By: {activity.conducted_by}
              </div>
              <div className="flex items-center text-gold/80">
                <Users className="w-4 h-4 mr-2" />
                {activity.interestedCount} interested users
              </div>
            </div>

            <p className="text-sm text-gray-300 mb-5 line-clamp-3">{activity.description}</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openEditModal(activity)}
                className="bg-white hover:bg-gray-200 text-black py-2 rounded-lg font-semibold transition"
              >
                Edit
              </button>
              <button
                onClick={() => openInterestedUsers(activity.id)}
                className="bg-black hover:bg-gray-800 text-white py-2 rounded-lg font-semibold transition border border-white/10"
              >
                Interested Users
              </button>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-white/5">
          <p className="text-gray-400">No activities created yet.</p>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-gray-dark rounded-2xl max-w-lg w-full overflow-hidden border border-gold/20 shadow-2xl">
            <div className="p-6 border-b border-gold/10 bg-charcoal flex justify-between items-center">
              <h3 className="text-2xl font-bold text-cream">{editingId ? "Edit Activity" : "Add Activity"}</h3>
              <button onClick={() => setShowFormModal(false)} className="text-gold hover:text-cream transition">
                <Plus className="w-8 h-8 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 bg-charcoal space-y-4">
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Activity Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Activity Details</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Image Link (URL)</label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-2">Conducted By</label>
                <input
                  type="text"
                  required
                  value={formData.conducted_by}
                  onChange={(e) => setFormData({ ...formData, conducted_by: e.target.value })}
                  className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold text-cream outline-none transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 px-4 py-3 border border-gold/20 rounded-xl text-gold/60 hover:bg-gold/10 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-cream text-charcoal rounded-xl font-black hover:bg-gold hover:text-white transition shadow-xl"
                >
                  {editingId ? "Update Activity" : "Create Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
          <div className="bg-gray-dark rounded-2xl max-w-sm w-full overflow-hidden border border-red-500/20 shadow-2xl">
            <div className="p-6 bg-charcoal text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-cream mb-2">Delete Activity?</h3>
              <p className="text-gold/60 text-sm mb-6">
                This action cannot be undone. All related interested records will also be deleted.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-3 border border-gold/20 rounded-xl text-gold/60 hover:bg-gold/10 transition font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-black hover:bg-red-600 transition shadow-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInterestedModal && selectedInterested && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-dark rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gold/20">
            <div className="p-6 border-b border-gold/10 flex justify-between items-center bg-charcoal">
              <div>
                <h3 className="text-xl font-bold text-cream">Interested Users</h3>
                <p className="text-gold/70 text-sm">{selectedInterested.activityName}</p>
              </div>
              <button
                onClick={() => {
                  setShowInterestedModal(false);
                  setSelectedInterested(null);
                }}
                className="text-gold hover:text-cream"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow bg-charcoal">
              <p className="text-gold mb-4 font-semibold">
                Total interested: {selectedInterested.interestedCount}
              </p>
              {selectedInterested.users.length === 0 ? (
                <p className="text-center text-gold/50 py-8">No users have marked interest yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedInterested.users.map((u: any) => (
                    <div key={u.id} className="bg-gray-dark rounded-lg border border-gold/10 px-4 py-3 flex justify-between items-center">
                      <p className="text-cream font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-gold/80 text-sm">{u.mobile}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gold/10 bg-charcoal flex justify-end">
              <button
                onClick={exportInterestedUsers}
                disabled={selectedInterested.users.length === 0}
                className="bg-cream hover:bg-gold text-charcoal hover:text-white px-6 py-2 rounded-lg font-bold flex items-center transition disabled:opacity-50"
              >
                <Download className="w-5 h-5 mr-2" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
