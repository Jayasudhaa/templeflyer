"use client";

import { useState } from "react";

interface RSVPWidgetProps {
  eventId: string;
  eventName: string;
}

type RSVPResponse = "confirmed" | "maybe" | "blessings";

export default function RSVPWidget({ eventId, eventName }: RSVPWidgetProps) {
  const [response, setResponse] = useState<RSVPResponse | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState("1");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResponseClick = (rsvp: RSVPResponse) => {
    setResponse(rsvp);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response || !name) {
      alert("Please provide your name");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          response,
          status: response, // confirmed, maybe, or blessings
          name,
          email,
          phone,
          guests: parseInt(guests) || 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit RSVP");
      }

      setSubmitted(true);
      
      // Track RSVP submission
      await fetch("/api/rsvp-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          action: `rsvp_${response}`,
        }),
      });

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.confirmationCard}>
        <div style={styles.confirmationIcon}>✅</div>
        <h3 style={styles.confirmationTitle}>
          {response === "blessings" ? "Blessings Sent!" : "RSVP Confirmed!"}
        </h3>
        <p style={styles.confirmationText}>
          Thank you, {name}!
        </p>
        <div style={styles.confirmationBadge}>
          <p style={styles.confirmationBadgeText}>
            {response === "confirmed" ? "I'll be there!" : 
             response === "maybe" ? "Maybe" : 
             "Sending blessings"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.widgetContainer}>
      {!showForm ? (
        <>
          <h3 style={styles.question}>Will you join us?</h3>
          
          <div style={styles.buttonGrid}>
            {/* I'll be there! button */}
            <button
              onClick={() => handleResponseClick("confirmed")}
              style={styles.buttonConfirmed}
            >
              <div style={styles.buttonIcon}>🪔</div>
              <div style={styles.buttonText}>I'll be there!</div>
            </button>

            {/* Maybe button */}
            <button
              onClick={() => handleResponseClick("maybe")}
              style={styles.buttonMaybe}
            >
              <div style={styles.buttonIcon}>🤔</div>
              <div style={styles.buttonText}>Maybe</div>
            </button>

            {/* Send blessings button */}
            <button
              onClick={() => handleResponseClick("blessings")}
              style={styles.buttonBlessings}
            >
              <div style={styles.buttonIcon}>🙏</div>
              <div style={styles.buttonText}>Send blessings</div>
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.selectedBadge}>
            <p style={styles.selectedText}>
              You selected:{" "}
              <span style={styles.selectedEmphasis}>
                {response === "confirmed" ? "I'll be there!" : 
                 response === "maybe" ? "Maybe" : 
                 "Send blessings"}
              </span>
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your full name"
              style={styles.input}
            />
          </div>

          {response !== "blessings" && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Number of Guests *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(123) 456-7890"
              style={styles.input}
            />
          </div>

          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setResponse(null);
              }}
              style={styles.backButton}
            >
              Back
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.submitButton,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  widgetContainer: {
    background: "rgba(61,36,20,0.6)",
    borderRadius: 16,
    padding: 32,
    border: "1px solid rgba(212,175,55,0.2)",
    backdropFilter: "blur(10px)",
  },
  question: {
    fontSize: 22,
    fontWeight: 700,
    color: "#d4af37",
    textAlign: "center" as const,
    marginBottom: 24,
    marginTop: 0,
    fontStyle: "italic",
  },
  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  buttonConfirmed: {
    background: "rgba(61,36,20,0.8)",
    border: "2px solid rgba(212,175,55,0.3)",
    borderRadius: 12,
    padding: "20px 16px",
    cursor: "pointer",
    transition: "all 0.3s",
    color: "#d4af37",
    fontWeight: 700,
    fontSize: 14,
  },
  buttonMaybe: {
    background: "rgba(61,36,20,0.8)",
    border: "2px solid rgba(251,191,36,0.3)",
    borderRadius: 12,
    padding: "20px 16px",
    cursor: "pointer",
    transition: "all 0.3s",
    color: "#fbbf24",
    fontWeight: 700,
    fontSize: 14,
  },
  buttonBlessings: {
    background: "rgba(61,36,20,0.8)",
    border: "2px solid rgba(192,132,252,0.3)",
    borderRadius: 12,
    padding: "20px 16px",
    cursor: "pointer",
    transition: "all 0.3s",
    color: "#c084fc",
    fontWeight: 700,
    fontSize: 14,
  },
  buttonIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 700,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  selectedBadge: {
    background: "rgba(212,175,55,0.15)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedText: {
    color: "#b8956f",
    fontSize: 14,
    margin: 0,
  },
  selectedEmphasis: {
    color: "#d4af37",
    fontWeight: 700,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#b8956f",
  },
  input: {
    padding: "12px 14px",
    borderRadius: 8,
    border: "2px solid rgba(212,175,55,0.2)",
    background: "rgba(61,36,20,0.5)",
    color: "#d4af37",
    fontSize: 15,
    fontWeight: 500,
    outline: "none",
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    padding: "14px 24px",
    borderRadius: 8,
    border: "2px solid rgba(212,175,55,0.2)",
    background: "rgba(61,36,20,0.5)",
    color: "#b8956f",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s",
  },
  submitButton: {
    flex: 1,
    padding: "14px 24px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #b8860b, #d4af37)",
    color: "#1a0f0a",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s",
  },
  confirmationCard: {
    background: "rgba(74,222,128,0.1)",
    border: "2px solid rgba(74,222,128,0.3)",
    borderRadius: 16,
    padding: 40,
    textAlign: "center" as const,
  },
  confirmationIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#4ade80",
    marginBottom: 12,
    marginTop: 0,
  },
  confirmationText: {
    fontSize: 16,
    color: "#86efac",
    marginBottom: 20,
  },
  confirmationBadge: {
    display: "inline-block",
    background: "rgba(74,222,128,0.15)",
    borderRadius: 8,
    padding: "10px 24px",
  },
  confirmationBadgeText: {
    color: "#4ade80",
    fontWeight: 700,
    fontSize: 15,
    margin: 0,
  },
};
