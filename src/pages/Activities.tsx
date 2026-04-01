import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";
import { Calendar, Info, Heart, User } from "lucide-react";

type Activity = {
  id: number;
  name: string;
  date: string;
  description: string;
  image: string;
  conducted_by: string;
  interestedCount: number;
  isInterested: boolean;
  status: "Upcoming" | "Completed";
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const fetchActivities = async () => {
    try {
      const data = await api.get("/activities", token || undefined);
      setActivities(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [token]);

  const openDetails = async (activityId: number) => {
    setDetailsLoading(true);
    try {
      const data = await api.get(`/activities/${activityId}`);
      const existing = activities.find((a) => a.id === activityId);
      setSelectedActivity({ ...data, isInterested: existing?.isInterested || false });
    } catch (err: any) {
      toast.error(err.message || "Failed to load activity details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const markInterested = async (activity: Activity) => {
    if (!user || !token) {
      toast.error("Please login before marking interest");
      navigate("/login");
      return;
    }

    if (activity.isInterested) {
      toast.error("You already marked as interested");
      return;
    }

    try {
      const res = await api.post(`/activities/${activity.id}/interested`, {}, token);
      const updated = activities.map((item) =>
        item.id === activity.id
          ? { ...item, isInterested: true, interestedCount: res.interestedCount }
          : item
      );
      setActivities(updated);
      setSelectedActivity((prev) =>
        prev && prev.id === activity.id
          ? { ...prev, isInterested: true, interestedCount: res.interestedCount }
          : prev
      );
      toast.success("Marked as interested");
    } catch (err: any) {
      toast.error(err.message || "Unable to mark interest");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[360px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-cream">Activities</h1>
        <p className="text-gold mt-2">Discover ongoing and upcoming community activities</p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16 bg-gray-dark rounded-2xl border border-gold/10">
          <p className="text-gold/60 text-lg">No activities available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-gray-dark rounded-xl shadow-2xl overflow-hidden border border-gold/10 flex flex-col"
            >
              <div className="relative h-52">
                <img
                  src={activity.image}
                  alt={activity.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                    activity.status === "Upcoming"
                      ? "bg-green-600 text-white"
                      : "bg-charcoal/90 text-cream"
                  }`}
                >
                  {activity.status}
                </span>
              </div>

              <div className="p-5 sm:p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-cream mb-3">{activity.name}</h3>
                <div className="flex items-center text-gold text-sm mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(activity.date).toLocaleString()}
                </div>
                <p className="text-cream/80 text-sm mb-5 flex-grow">
                  {activity.description.length > 130
                    ? `${activity.description.slice(0, 130)}...`
                    : activity.description}
                </p>
                <p className="text-sm text-gold/80 mb-4">{activity.interestedCount} users interested</p>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button
                    onClick={() => openDetails(activity.id)}
                    className="py-2.5 rounded-lg font-bold bg-charcoal text-cream border border-gold/20 hover:bg-gold/10 transition flex items-center justify-center"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    More
                  </button>
                  <button
                    onClick={() => markInterested(activity)}
                    className={`py-2.5 rounded-lg font-bold transition flex items-center justify-center ${
                      activity.isInterested
                        ? "bg-green-700 text-white"
                        : "bg-cream text-charcoal hover:bg-gold hover:text-white"
                    }`}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {activity.isInterested ? "Interested ✓" : "Interested"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedActivity && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-dark rounded-2xl max-w-2xl w-full overflow-hidden border border-gold/20 max-h-[90vh] overflow-y-auto">
            <img
              src={selectedActivity.image}
              alt={selectedActivity.name}
              className="w-full h-64 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold text-cream mb-3">{selectedActivity.name}</h3>
              <div className="space-y-2 text-cream/90 mb-5">
                <p className="flex items-center text-gold">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(selectedActivity.date).toLocaleString()}
                </p>
                <p className="flex items-center text-gold/90">
                  <User className="w-4 h-4 mr-2" />
                  Conducted By: {selectedActivity.conducted_by}
                </p>
                <p className="text-sm text-gold/80">{selectedActivity.interestedCount} users interested</p>
              </div>
              <p className="text-cream/90 leading-7">{selectedActivity.description}</p>
              <div className="flex justify-end gap-3 mt-7">
                <button
                  onClick={() => markInterested(selectedActivity)}
                  className={`px-4 py-2 rounded-lg font-bold transition ${
                    selectedActivity.isInterested
                      ? "bg-green-700 text-white"
                      : "bg-cream text-charcoal hover:bg-gold hover:text-white"
                  }`}
                >
                  {selectedActivity.isInterested ? "Interested ✓" : "Interested"}
                </button>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-4 py-2 rounded-lg border border-gold/20 text-gold hover:bg-gold/10 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailsLoading && (
        <div className="fixed bottom-6 right-6 bg-charcoal text-cream border border-gold/30 px-4 py-2 rounded-lg text-sm">
          Loading details...
        </div>
      )}
    </div>
  );
}
