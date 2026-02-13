"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import RSVPWidget from "@/components/RSVPWidget";

export default function RSVPPage() {
  const searchParams = useSearchParams();
  const [eventData, setEventData] = useState({
    event: "",
    date: "",
    time: "",
    desc: "",
    id: "",
    flyerUrl: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const event = searchParams.get("event") || "";
    const date = searchParams.get("date") || "";
    const time = searchParams.get("time") || "";
    const desc = searchParams.get("desc") || "";
    const id = searchParams.get("id") || "";
    const flyerUrl = searchParams.get("flyer") || "";

    setEventData({ event, date, time, desc, id, flyerUrl });
    setLoading(false);

    // Track page view
    if (id) {
      trackView(id);
    }
  }, [searchParams]);

  const trackView = async (eventId: string) => {
    try {
      await fetch("/api/rsvp-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          action: "view",
        }),
      });
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading event...</div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        {/* Flyer Display */}
        <div style={styles.flyerContainer}>
          {eventData.flyerUrl ? (
            <img
              src={eventData.flyerUrl}
              alt={eventData.event}
              style={styles.flyerImage}
            />
          ) : (
            <div style={styles.placeholderFlyer}>
              <div style={styles.placeholderContent}>
                <div style={styles.placeholderIcon}>🕉️</div>
                <h2 style={styles.placeholderTitle}>{eventData.event}</h2>
                <p style={styles.placeholderDesc}>{eventData.desc}</p>
              </div>
            </div>
          )}
        </div>

        {/* RSVP Widget */}
        <RSVPWidget eventId={eventData.id} eventName={eventData.event} />

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>Powered by AI MITRA</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #2d1810 0%, #1a0f0a 100%)",
  },
  loadingText: {
    fontSize: 20,
    color: "#d4af37",
    fontWeight: 600,
  },
  pageContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #2d1810 0%, #1a0f0a 100%)",
    padding: "20px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  contentWrapper: {
    maxWidth: 650,
    margin: "0 auto",
  },
  flyerContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  flyerImage: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  placeholderFlyer: {
    aspectRatio: "1080 / 1920",
    background: "linear-gradient(135deg, #3d2414 0%, #2d1810 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  placeholderContent: {
    textAlign: "center" as const,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 32,
    fontWeight: 800,
    color: "#d4af37",
    marginBottom: 12,
    margin: 0,
  },
  placeholderDesc: {
    fontSize: 16,
    color: "#b8956f",
    margin: 0,
  },
  footer: {
    textAlign: "center" as const,
    marginTop: 32,
    paddingTop: 20,
    borderTop: "1px solid rgba(212,175,55,0.2)",
  },
  footerText: {
    fontSize: 13,
    color: "#6b5638",
    margin: 0,
  },
};
