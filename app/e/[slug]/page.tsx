"use client";

import { useState, useEffect, useRef } from "react";

// ============================================================
// LIVING FLYER — The flyer IS the RSVP interface
//
// Flow:
// 1. Devotee receives link on WhatsApp → taps → sees beautiful flyer
// 2. Bottom: three reaction buttons (diya/maybe/blessings)
// 3. Tap "I'll be there" → flyer slides up, detail card appears
// 4. Fill minimal info → Confirm → "Add to Calendar" appears
// 5. Backend captures everything silently
// ============================================================

const SPONSORSHIPS = [
  { id: "abhishekam", label: "Abhishekam", price: "$51", emoji: "🙏" },
  { id: "kalyanam", label: "Kalyanam", price: "$116", emoji: "💐" },
  { id: "deepam", label: "Deepa Aradhana", price: "$21", emoji: "🪔" },
  { id: "annadanam", label: "Annadanam", price: "$251", emoji: "🍚" },
];

const EVENT = {
  title: "Diwali Celebration",
  subtitle: "Festival of Lights",
  main: "Sri Lakshmi Pooja & Abhishekam",
  date: "2026-11-15",
  dateDisplay: "Sunday, November 15, 2026",
  time: "6:00 PM Onwards",
  temple: "Sri Venkateswara Swamy Temple",
  location: "Castle Rock, Colorado",
  address: "1345 S. Perry St, Castle Rock, CO 80104",
  schedule: [
    { time: "6:00 PM", event: "Ganapathi Pooja & Lakshmi Abhishekam" },
    { time: "7:00 PM", event: "Sri Lakshmi Sahasranama Archana" },
    { time: "8:00 PM", event: "Deepa Aradhana & Maha Aarti" },
    { time: "8:30 PM", event: "Cultural Program & Annadanam" },
  ],
};

function generateCalendarLinks() {
  const start = "20261115T180000";
  const end = "20261115T220000";
  const title = encodeURIComponent(`${EVENT.title} — ${EVENT.temple}`);
  const details = encodeURIComponent(
    `${EVENT.main}\n\n${EVENT.schedule.map((s) => `${s.time} — ${s.event}`).join("\n")}\n\n${EVENT.address}`
  );
  const loc = encodeURIComponent(EVENT.address);

  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${loc}`,
    ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${EVENT.title} — ${EVENT.temple}`,
        `DESCRIPTION:${EVENT.main}\\n${EVENT.schedule.map((s) => `${s.time} — ${s.event}`).join("\\n")}`,
        `LOCATION:${EVENT.address}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n")
    )}`,
  };
}

export default function LivingFlyer() {
  const [phase, setPhase] = useState("flyer"); // flyer | form | submitting | done | declined
  const [rsvpType, setRsvpType] = useState("confirmed");
  const [form, setForm] = useState({
    name: "",
    guests: 1,
    food: "veg",
    sponsors: [],
  });
  const [error, setError] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const [diyaLit, setDiyaLit] = useState(false);
  const formRef = useRef(null);

  // Sparkle generator
  useEffect(() => {
    const arr = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
    }));
    setSparkles(arr);
  }, []);

  function handleReaction(type) {
    setRsvpType(type);
    setError(null);
    if (type === "blessings") {
      setPhase("declined");
    } else {
      setPhase("form");
      if (type === "confirmed") setDiyaLit(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter your name");
      return;
    }
    setPhase("submitting");
    // Simulate API call
    setTimeout(() => {
      setPhase("done");
    }, 1200);
  }

  function toggleSponsor(id) {
    setForm((p) => ({
      ...p,
      sponsors: p.sponsors.includes(id)
        ? p.sponsors.filter((s) => s !== id)
        : [...p.sponsors, id],
    }));
  }

  const cal = generateCalendarLinks();

  return (
    <div style={styles.page}>
      <style>{keyframes}</style>

      {/* Sparkles */}
      <div style={styles.sparkleLayer}>
        {sparkles.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: `rgba(255, ${180 + Math.random() * 40}, ${40 + Math.random() * 40}, 0.8)`,
              animation: `sparkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div style={styles.flyer}>
        {/* ---- TOP BORDER ---- */}
        <div style={styles.borderTop} />

        {/* ---- TEMPLE HEADER ---- */}
        <div style={styles.templeHeader}>
          <div style={styles.diyaRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  ...styles.diya,
                  animationDelay: `${i * 0.3}s`,
                  opacity: diyaLit ? 1 : 0.5,
                  filter: diyaLit ? "drop-shadow(0 0 8px rgba(255,200,60,0.8))" : "none",
                  transition: "all 0.6s ease",
                }}
              >
                🪔
              </span>
            ))}
          </div>
          <h2 style={styles.templeName}>{EVENT.temple}</h2>
          <p style={styles.templeLocation}>{EVENT.location}</p>
        </div>

        {/* ---- GOLD DIVIDER ---- */}
        <div style={styles.divider} />

        {/* ---- MAIN EVENT ---- */}
        <div style={styles.mainSection}>
          <h1 style={styles.eventTitle}>{EVENT.title}</h1>
          <p style={styles.eventSubtitle}>{EVENT.subtitle}</p>
          <div style={styles.thinDivider} />
          <p style={styles.eventMain}>{EVENT.main}</p>
          <div style={styles.dateBlock}>
            <p style={styles.dateText}>{EVENT.dateDisplay}</p>
            <p style={styles.timeText}>{EVENT.time}</p>
          </div>
        </div>

        {/* ---- SCHEDULE ---- */}
        <div style={styles.scheduleSection}>
          <h3 style={styles.scheduleTitle}>Event Schedule</h3>
          {EVENT.schedule.map((s, i) => (
            <div key={i} style={styles.scheduleRow}>
              <span style={styles.scheduleTime}>{s.time}</span>
              <span style={styles.scheduleDot}>•</span>
              <span style={styles.scheduleEvent}>{s.event}</span>
            </div>
          ))}
        </div>

        <div style={styles.divider} />

        {/* ==== REACTION BUTTONS ==== */}
        {(phase === "flyer" || phase === "form") && (
          <div
            style={{
              ...styles.reactionSection,
              animation: "fadeSlideUp 0.6s ease forwards",
            }}
          >
            <p style={styles.reactionPrompt}>Will you join us?</p>
            <div style={styles.reactionRow}>
              {/* Going */}
              <button
                onClick={() => handleReaction("confirmed")}
                style={{
                  ...styles.reactionBtn,
                  ...(rsvpType === "confirmed" && phase === "form"
                    ? styles.reactionBtnActiveGreen
                    : {}),
                }}
              >
                <span style={styles.reactionEmoji}>🪔</span>
                <span style={styles.reactionLabel}>I&apos;ll be there!</span>
              </button>

              {/* Maybe */}
              <button
                onClick={() => handleReaction("maybe")}
                style={{
                  ...styles.reactionBtn,
                  ...(rsvpType === "maybe" && phase === "form"
                    ? styles.reactionBtnActiveYellow
                    : {}),
                }}
              >
                <span style={styles.reactionEmoji}>🤔</span>
                <span style={styles.reactionLabel}>Maybe</span>
              </button>

              {/* Blessings */}
              <button
                onClick={() => handleReaction("blessings")}
                style={styles.reactionBtn}
              >
                <span style={styles.reactionEmoji}>🙏</span>
                <span style={styles.reactionLabel}>Send blessings</span>
              </button>
            </div>
          </div>
        )}

        {/* ==== EXPANDING DETAIL CARD ==== */}
        {phase === "form" && (
          <div ref={formRef} style={styles.detailCard}>
            <div style={styles.cardPullTab} />
            <form onSubmit={handleSubmit}>
              <h3 style={styles.cardTitle}>
                {rsvpType === "confirmed"
                  ? "Wonderful! Just a few details:"
                  : "Just in case you make it:"}
              </h3>

              {/* Name */}
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={styles.input}
                autoFocus
              />

              {/* Guest stepper */}
              <div style={styles.guestRow}>
                <span style={styles.guestLabel}>Number of guests</span>
                <div style={styles.stepper}>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, guests: Math.max(1, form.guests - 1) })
                    }
                    style={styles.stepBtn}
                  >
                    −
                  </button>
                  <span style={styles.stepVal}>{form.guests}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        guests: Math.min(20, form.guests + 1),
                      })
                    }
                    style={styles.stepBtn}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Food pills */}
              <div style={styles.pillSection}>
                <span style={styles.pillLabel}>Food preference</span>
                <div style={styles.pillRow}>
                  {[
                    ["veg", "🥬 Veg"],
                    ["vegan", "🌱 Vegan"],
                    ["none", "🚫 None"],
                  ].map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, food: val })}
                      style={{
                        ...styles.pill,
                        ...(form.food === val ? styles.pillActive : {}),
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sponsorship */}
              <div style={styles.sponsorSection}>
                <span style={styles.sponsorLabel}>
                  Interested in sponsorship?
                </span>
                <div style={styles.sponsorGrid}>
                  {SPONSORSHIPS.map((s) => {
                    const on = form.sponsors.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSponsor(s.id)}
                        style={{
                          ...styles.sponsorChip,
                          ...(on ? styles.sponsorChipOn : {}),
                        }}
                      >
                        <span>{s.emoji} {s.label}</span>
                        <span style={styles.sponsorPrice}>{s.price}</span>
                        {on && (
                          <span style={styles.sponsorCheck}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" style={styles.confirmBtn}>
                {rsvpType === "confirmed" ? "🪔 Confirm RSVP" : "Save as Maybe"}
              </button>
            </form>
          </div>
        )}

        {/* ==== SUBMITTING ==== */}
        {phase === "submitting" && (
          <div style={styles.loadingCard}>
            <div style={styles.loadingSpinner} />
            <p style={styles.loadingText}>Lighting your diya...</p>
          </div>
        )}

        {/* ==== SUCCESS ==== */}
        {phase === "done" && (
          <div style={styles.successCard}>
            <div style={styles.successGlow} />
            <div style={styles.successIcon}>🪔</div>
            <h2 style={styles.successTitle}>Hare Krishna!</h2>
            <p style={styles.successText}>
              You&apos;re{" "}
              {rsvpType === "confirmed" ? "confirmed" : "on the maybe list"}{" "}
              — <strong>{form.guests}</strong>{" "}
              {form.guests > 1 ? "guests" : "guest"}
            </p>

            {form.sponsors.length > 0 && (
              <p style={styles.successSponsor}>
                Thank you for your sponsorship interest! Temple team will reach
                out.
              </p>
            )}

            {/* ADD TO CALENDAR */}
            <div style={styles.calendarSection}>
              <p style={styles.calLabel}>Add to your calendar</p>
              <div style={styles.calBtns}>
                <a
                  href={cal.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.calBtn}
                >
                  📅 Google Calendar
                </a>
                <a href={cal.ics} download="diwali-2026.ics" style={styles.calBtn}>
                  📱 Apple / Outlook
                </a>
              </div>
            </div>

            {/* SHARE */}
            <div style={styles.shareSection}>
              <p style={styles.calLabel}>Share with friends</p>
              <div style={styles.calBtns}>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    const text = `Join us for ${EVENT.title} at ${EVENT.temple}! ${EVENT.dateDisplay} at ${EVENT.time}`;
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
                      "_blank"
                    );
                  }}
                  style={{ ...styles.calBtn, background: "rgba(37,211,102,0.15)", borderColor: "rgba(37,211,102,0.4)", color: "#25d366" }}
                >
                  💬 WhatsApp
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: EVENT.title,
                        text: `${EVENT.title} at ${EVENT.temple}`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied!");
                    }
                  }}
                  style={styles.calBtn}
                >
                  🔗 Copy Link
                </button>
              </div>
            </div>

            <p style={styles.blessings}>
              May the divine light of Lakshmi Devi illuminate your path.
            </p>
          </div>
        )}

        {/* ==== DECLINED ==== */}
        {phase === "declined" && (
          <div style={styles.declineCard}>
            <p style={styles.declineEmoji}>🙏</p>
            <p style={styles.declineText}>
              Your blessings have been received. We&apos;ll miss you!
            </p>
            <p style={styles.declineSub}>
              Hope to see you at our next event.
            </p>

            <div style={styles.calendarSection}>
              <p style={styles.calLabel}>Save the date just in case</p>
              <div style={styles.calBtns}>
                <a
                  href={cal.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.calBtn}
                >
                  📅 Add to Calendar
                </a>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <p style={styles.footer}>{EVENT.address}</p>
      </div>
    </div>
  );
}

// ============================================================
// ANIMATIONS
// ============================================================
const keyframes = `
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0.5); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes diyaGlow {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(255,200,60,0.4)); }
    50% { filter: drop-shadow(0 0 14px rgba(255,200,60,0.9)); }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(218,165,32,0.2); }
    50% { box-shadow: 0 0 40px rgba(218,165,32,0.5); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes successPulse {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
`;

// ============================================================
// STYLES
// ============================================================
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0202",
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: "relative",
    overflow: "hidden",
  },
  sparkleLayer: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
  flyer: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 480,
    minHeight: "100vh",
    background: "linear-gradient(180deg, #1a0505 0%, #2a0808 35%, #1e0606 70%, #120303 100%)",
    borderLeft: "1px solid rgba(218,165,32,0.15)",
    borderRight: "1px solid rgba(218,165,32,0.15)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 20px 40px",
  },
  borderTop: {
    width: "100%",
    height: 3,
    background: "linear-gradient(90deg, transparent 0%, #daa520 30%, #ffd966 50%, #daa520 70%, transparent 100%)",
    marginBottom: 24,
  },

  // Temple header
  templeHeader: { textAlign: "center", marginBottom: 8 },
  diyaRow: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
  },
  diya: {
    fontSize: 22,
    animation: "diyaGlow 2s ease-in-out infinite",
    display: "inline-block",
  },
  templeName: {
    color: "#e8d5b0",
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 4px 0",
    letterSpacing: 0.5,
    fontFamily: "'Trebuchet MS', 'Lucida Grande', sans-serif",
  },
  templeLocation: {
    color: "rgba(232,213,176,0.55)",
    fontSize: 13,
    margin: 0,
    letterSpacing: 1,
  },

  // Dividers
  divider: {
    width: "70%",
    height: 2,
    background: "linear-gradient(90deg, transparent, #daa520 40%, #daa520 60%, transparent)",
    margin: "18px auto",
    position: "relative",
  },
  thinDivider: {
    width: "30%",
    height: 1,
    background: "linear-gradient(90deg, transparent, rgba(218,165,32,0.5), transparent)",
    margin: "10px auto",
  },

  // Main event section
  mainSection: { textAlign: "center", padding: "4px 0 8px" },
  eventTitle: {
    color: "#ffd966",
    fontSize: 36,
    fontWeight: 700,
    margin: "0 0 4px 0",
    lineHeight: 1.15,
    textShadow: "0 2px 20px rgba(255,217,102,0.25)",
  },
  eventSubtitle: {
    color: "#e8d5b0",
    fontSize: 20,
    fontStyle: "italic",
    margin: "0 0 6px 0",
    opacity: 0.75,
  },
  eventMain: {
    color: "#daa520",
    fontSize: 18,
    fontWeight: 700,
    margin: "8px 0 14px 0",
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  dateBlock: {
    background: "rgba(218,165,32,0.08)",
    border: "1px solid rgba(218,165,32,0.2)",
    borderRadius: 12,
    padding: "12px 20px",
    display: "inline-block",
  },
  dateText: {
    color: "#ffd966",
    fontSize: 16,
    fontWeight: 700,
    margin: "0 0 2px 0",
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  timeText: {
    color: "#e8d5b0",
    fontSize: 14,
    margin: 0,
    opacity: 0.8,
  },

  // Schedule
  scheduleSection: { width: "100%", padding: "0 8px", marginBottom: 4 },
  scheduleTitle: {
    color: "#daa520",
    fontSize: 14,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  scheduleRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "5px 0",
    borderBottom: "1px solid rgba(218,165,32,0.07)",
  },
  scheduleTime: {
    color: "#daa520",
    fontSize: 13,
    fontWeight: 700,
    minWidth: 70,
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  scheduleDot: { color: "rgba(218,165,32,0.4)", fontSize: 10 },
  scheduleEvent: { color: "#cdb99a", fontSize: 14, flex: 1 },

  // Reaction section
  reactionSection: {
    width: "100%",
    textAlign: "center",
    padding: "4px 0 12px",
  },
  reactionPrompt: {
    color: "#e8d5b0",
    fontSize: 17,
    marginBottom: 14,
    fontStyle: "italic",
  },
  reactionRow: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
  },
  reactionBtn: {
    flex: 1,
    maxWidth: 130,
    padding: "14px 8px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(218,165,32,0.2)",
    borderRadius: 14,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    transition: "all 0.3s ease",
    animation: "pulseGlow 3s ease-in-out infinite",
  },
  reactionBtnActiveGreen: {
    background: "rgba(74,222,128,0.12)",
    borderColor: "rgba(74,222,128,0.5)",
    boxShadow: "0 0 20px rgba(74,222,128,0.2)",
    animation: "none",
  },
  reactionBtnActiveYellow: {
    background: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.5)",
    boxShadow: "0 0 20px rgba(251,191,36,0.2)",
    animation: "none",
  },
  reactionEmoji: { fontSize: 30 },
  reactionLabel: {
    color: "#e8d5b0",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Trebuchet MS', sans-serif",
  },

  // Detail card
  detailCard: {
    width: "100%",
    background: "linear-gradient(180deg, rgba(218,165,32,0.06) 0%, rgba(30,6,6,0.95) 100%)",
    border: "1px solid rgba(218,165,32,0.2)",
    borderRadius: 20,
    padding: "20px 18px 24px",
    marginTop: 8,
    animation: "fadeSlideUp 0.4s ease forwards",
  },
  cardPullTab: {
    width: 40,
    height: 4,
    background: "rgba(218,165,32,0.3)",
    borderRadius: 2,
    margin: "0 auto 14px",
  },
  cardTitle: {
    color: "#e8d5b0",
    fontSize: 16,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  input: {
    width: "100%",
    padding: "13px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(218,165,32,0.25)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 16,
    outline: "none",
    fontFamily: "'Georgia', serif",
    marginBottom: 14,
    boxSizing: "border-box",
  },

  // Guest stepper
  guestRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  guestLabel: {
    color: "#cdb99a",
    fontSize: 14,
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    border: "1px solid rgba(218,165,32,0.2)",
    overflow: "hidden",
  },
  stepBtn: {
    width: 40,
    height: 40,
    background: "rgba(218,165,32,0.1)",
    border: "none",
    color: "#daa520",
    fontSize: 20,
    cursor: "pointer",
    fontWeight: 700,
  },
  stepVal: {
    width: 48,
    textAlign: "center",
    color: "#ffd966",
    fontSize: 20,
    fontWeight: 700,
  },

  // Food pills
  pillSection: { marginBottom: 14 },
  pillLabel: {
    color: "#cdb99a",
    fontSize: 14,
    display: "block",
    marginBottom: 8,
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  pillRow: { display: "flex", gap: 8 },
  pill: {
    flex: 1,
    padding: "10px 6px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(218,165,32,0.2)",
    borderRadius: 10,
    color: "#aaa",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s",
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  pillActive: {
    background: "rgba(218,165,32,0.15)",
    borderColor: "#daa520",
    color: "#ffd966",
    fontWeight: 700,
  },

  // Sponsorship
  sponsorSection: { marginBottom: 16 },
  sponsorLabel: {
    color: "#cdb99a",
    fontSize: 14,
    display: "block",
    marginBottom: 8,
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  sponsorGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  sponsorChip: {
    position: "relative",
    padding: "10px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(218,165,32,0.15)",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    color: "#b0a080",
    fontSize: 13,
    fontFamily: "'Trebuchet MS', sans-serif",
  },
  sponsorChipOn: {
    background: "rgba(218,165,32,0.12)",
    borderColor: "rgba(218,165,32,0.5)",
    color: "#e8d5b0",
  },
  sponsorPrice: {
    color: "#daa520",
    fontWeight: 700,
    fontSize: 15,
  },
  sponsorCheck: {
    position: "absolute",
    top: 6,
    right: 8,
    color: "#4ade80",
    fontWeight: 700,
    fontSize: 13,
  },

  error: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10,
    padding: "8px 12px",
    color: "#fca5a5",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },

  confirmBtn: {
    width: "100%",
    padding: "15px 0",
    background: "linear-gradient(135deg, #b8860b 0%, #daa520 50%, #b8860b 100%)",
    border: "none",
    borderRadius: 14,
    color: "#1a0505",
    fontSize: 17,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: 0.5,
    fontFamily: "'Trebuchet MS', sans-serif",
    boxShadow: "0 4px 20px rgba(218,165,32,0.35)",
  },

  // Loading
  loadingCard: {
    textAlign: "center",
    padding: "30px 0",
    animation: "fadeSlideUp 0.3s ease",
  },
  loadingSpinner: {
    width: 36,
    height: 36,
    border: "3px solid rgba(218,165,32,0.2)",
    borderTop: "3px solid #daa520",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 12px",
  },
  loadingText: {
    color: "#daa520",
    fontSize: 15,
    fontStyle: "italic",
  },

  // Success
  successCard: {
    textAlign: "center",
    padding: "24px 16px",
    position: "relative",
    animation: "fadeSlideUp 0.5s ease",
  },
  successGlow: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: 200,
    height: 200,
    background: "radial-gradient(circle, rgba(218,165,32,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  successIcon: {
    fontSize: 52,
    animation: "successPulse 0.6s ease forwards",
    marginBottom: 8,
    filter: "drop-shadow(0 0 20px rgba(255,200,60,0.6))",
  },
  successTitle: {
    color: "#ffd966",
    fontSize: 28,
    fontWeight: 700,
    margin: "0 0 8px 0",
  },
  successText: {
    color: "#e8d5b0",
    fontSize: 16,
    margin: "0 0 6px 0",
    lineHeight: 1.5,
  },
  successSponsor: {
    color: "#daa520",
    fontSize: 13,
    fontStyle: "italic",
    margin: "0 0 16px 0",
  },

  // Calendar buttons
  calendarSection: {
    marginTop: 18,
    padding: "14px 0",
    borderTop: "1px solid rgba(218,165,32,0.1)",
  },
  calLabel: {
    color: "#b0a080",
    fontSize: 13,
    marginBottom: 10,
    fontFamily: "'Trebuchet MS', sans-serif",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  calBtns: { display: "flex", gap: 8, justifyContent: "center" },
  calBtn: {
    padding: "10px 16px",
    background: "rgba(218,165,32,0.08)",
    border: "1px solid rgba(218,165,32,0.25)",
    borderRadius: 10,
    color: "#daa520",
    fontSize: 14,
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "'Trebuchet MS', sans-serif",
    fontWeight: 600,
    transition: "all 0.2s",
    display: "inline-block",
  },

  // Share
  shareSection: {
    marginTop: 12,
    padding: "14px 0 0",
    borderTop: "1px solid rgba(218,165,32,0.07)",
  },

  blessings: {
    color: "rgba(232,213,176,0.4)",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 18,
  },

  // Declined
  declineCard: {
    textAlign: "center",
    padding: "24px 16px",
    animation: "fadeSlideUp 0.4s ease",
  },
  declineEmoji: { fontSize: 40, marginBottom: 8 },
  declineText: { color: "#e8d5b0", fontSize: 16, marginBottom: 4 },
  declineSub: { color: "rgba(232,213,176,0.5)", fontSize: 14, fontStyle: "italic" },

  footer: {
    color: "rgba(218,165,32,0.25)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 24,
    letterSpacing: 0.5,
  },
};
