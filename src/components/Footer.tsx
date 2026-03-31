import React, { useState } from "react";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useAuth } from "../lib/AuthContext";

export default function Footer() {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const committeeImageFiles = [
    "adesh_jawale-advisor.jpeg",
    "aryan_moon-technicalhead.jpeg",
    "ganesh_ingole-treasurer.jpeg",
    "onkar_satpute-secretary.jpeg",
    "raviraj_sarvade-president.jpeg",
    "sanket_bansode-Joint secretary.jpg",
    "shubham_pote-secretary.jpeg",
    "sumit_talwade-vicepresident.jpeg",
    "suraj_tayde-socialmediahead.jpg",
    "tanish_sidam-treasurer.jpeg",
    "yash_sawarkar-culturalhead.jpeg",
    "yuvraj_gaikwad-sportHead.jpeg",
  ];

  const formatTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const normalizePosition = (rawPosition: string) => {
    const withSpaces = rawPosition
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim();

    const lowered = withSpaces.toLowerCase().replace(/\s+/g, " ");
    const aliases: Record<string, string> = {
      vicepresident: "Vice President",
      "vice president": "Vice President",
      technicalhead: "Technical Head",
      "technical head": "Technical Head",
      socialmediahead: "Social Media Head",
      "social media head": "Social Media Head",
      culturalhead: "Cultural Head",
      "cultural head": "Cultural Head",
      sporthead: "Sport Head",
      "sport head": "Sport Head",
      jointsecretary: "Joint Secretary",
      "joint secretary": "Joint Secretary",
    };

    return aliases[lowered] || formatTitleCase(withSpaces);
  };

  const committeeMembers = committeeImageFiles.map((fileName) => {
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const [nameRaw, positionRaw = "Member"] = baseName.split(/-(.+)/);
    const name = formatTitleCase(nameRaw.replace(/[_-]+/g, " "));
    const position = normalizePosition(positionRaw);

    return {
      key: baseName,
      name,
      position,
      photo: `/committee/${encodeURIComponent(fileName)}`,
    };
  });

  const roleOrder = [
    "President",
    "Vice President",
    "Treasurer",
    "Secretary",
    "Joint Secretary",
    "Cultural Head",
    "Sport Head",
    "Technical Head",
    "Social Media Head",
    "Advisor",
  ];

  const roleRank = Object.fromEntries(roleOrder.map((role, index) => [role, index]));

  const sortedCommitteeMembers = [...committeeMembers].sort((a, b) => {
    const aRank = roleRank[a.position] ?? Number.MAX_SAFE_INTEGER;
    const bRank = roleRank[b.position] ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.name.localeCompare(b.name);
  });

  const [committeePhotos, setCommitteePhotos] = useState<Record<string, string>>(
    Object.fromEntries(committeeMembers.map((member) => [member.key, member.photo]))
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.mobile || !formData.message) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/messages", formData, token || undefined);
      toast.success("Message sent successfully!");
      setFormData({ name: "", mobile: "", message: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-gray-dark text-cream pt-12 md:pt-14 pb-6 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-10">
          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-gold/20 pb-2">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 mt-0.5 text-gold shrink-0" />
                <span className="text-gold/80">Samajkalyan Boys Hostel, Vishrantwadi Campus, Pune, 411015</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-gold" />
                <span className="text-gold/80">+91 8830957542</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-gold" />
                <span className="text-gold/80">shrinivaskumari03@gmail.com</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <Instagram className="w-6 h-6 text-gold hover:text-cream cursor-pointer transition" />
              </div>
            </div>
          </div>

          {/* Committee Members */}
          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-gold/20 pb-2">Committee Members</h3>
            <div className="space-y-4">
              {sortedCommitteeMembers.map((member) => (
                <div key={member.key} className="flex items-center gap-4">
                  <img
                    src={committeePhotos[member.key]}
                    alt={`${member.name} - ${member.position}`}
                    className="w-12 h-12 rounded-full object-cover border border-gold/20 shrink-0"
                    loading="lazy"
                    onError={() =>
                      setCommitteePhotos((current) => ({
                        ...current,
                        [member.key]: "/committee/default-avatar.svg",
                      }))
                    }
                  />
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-gold/70">{member.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Events Gallery */}
          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-gold/20 pb-2">Past Year Events</h3>
            <div className="grid grid-cols-2 gap-2">
              {pastEvents.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Past event ${idx + 1}`}
                  className="w-full h-24 object-cover rounded hover:opacity-75 transition cursor-pointer border border-gold/10"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-charcoal p-5 sm:p-8 rounded-lg mb-10 border border-gold/10">
          <h3 className="text-xl font-bold mb-5">Send us a Message</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-gray-dark border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-gold text-cream placeholder-gold/50"
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="bg-gray-dark border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-gold text-cream placeholder-gold/50"
            />
            <textarea
              placeholder="Your Message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="md:col-span-2 bg-gray-dark border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-gold text-cream h-24 placeholder-gold/50"
            ></textarea>
            <div className="md:col-span-2 flex justify-stretch md:justify-end">
              <button 
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-cream hover:bg-gold text-charcoal hover:text-white font-bold py-2 px-8 rounded-md transition disabled:opacity-50 min-w-[200px]"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-gold/50 text-sm border-t border-gold/10 pt-8">
          &copy; {new Date().getFullYear()} Bhim Jayanti Event Management. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
