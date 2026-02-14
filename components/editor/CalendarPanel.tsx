// ============================================================================
// FILE: components/editor/CalendarPanel.tsx
// PURPOSE: Google Calendar sync - auto-populate events into flyers
// REWRITE: safer async, better UX, no alerts, cleaner state handling
// ============================================================================

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ExternalLink, RefreshCw } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string; // ISO
  end: string;   // ISO
  allDay: boolean;
}

interface CalendarPanelProps {
  onEventSelect: (event: CalendarEvent) => void;
}

type StatusKind = "idle" | "info" | "success" | "error";
type StatusState = { kind: StatusKind; message: string };

function isCalendarEvent(x: any): x is CalendarEvent {
  return (
    x &&
    typeof x === "object" &&
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    typeof x.description === "string" &&
    typeof x.location === "string" &&
    typeof x.start === "string" &&
    typeof x.end === "string" &&
    typeof x.allDay === "boolean"
  );
}

function safeDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString();
}

export default function CalendarPanel({ onEventSelect }: CalendarPanelProps) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<StatusState>({ kind: "idle", message: "" });

  // Prevent setState after unmount
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const setSafe = useCallback(<T,>(fn: () => T) => {
    if (!aliveRef.current) return;
    fn();
  }, []);

  const setTransientStatus = useCallback((next: StatusState, ms = 3000) => {
    setSafe(() => setStatus(next));
    if (ms > 0) {
      window.setTimeout(() => {
        setSafe(() => setStatus({ kind: "idle", message: "" }));
      }, ms);
    }
  }, [setSafe]);

  const fetchJson = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(url, init);
    // Prefer a readable error
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  }, []);

  const loadEvents = useCallback(async () => {
    setSafe(() => setLoading(true));
    try {
      const data = await fetchJson<{ success?: boolean; events?: unknown[] }>("/api/calendar/events");
      const raw = Array.isArray(data.events) ? data.events : [];
      const parsed = raw.filter(isCalendarEvent);
      setSafe(() => setEvents(parsed));
      if (data.success === false) {
        setTransientStatus({ kind: "error", message: "Could not load events." });
      }
    } catch (err: any) {
      console.error("Failed to load events:", err);
      setTransientStatus({ kind: "error", message: "Failed to load events. Please try again." });
    } finally {
      setSafe(() => setLoading(false));
    }
  }, [fetchJson, setSafe, setTransientStatus]);

  const checkConnection = useCallback(async () => {
    try {
      const data = await fetchJson<{ connected?: boolean }>("/api/calendar/connection");
      const isConnected = Boolean(data.connected);
      setSafe(() => setConnected(isConnected));
      if (isConnected) {
        await loadEvents();
      }
    } catch (err) {
      console.error("Failed to check calendar connection:", err);
      setTransientStatus({ kind: "error", message: "Failed to check Calendar connection." });
    }
  }, [fetchJson, loadEvents, setSafe, setTransientStatus]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connectCalendar = useCallback(async () => {
    try {
      setTransientStatus({ kind: "info", message: "Redirecting to Google sign-in…" }, 1500);
      const data = await fetchJson<{ authUrl?: string }>("/api/calendar/connect");
      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      setTransientStatus({ kind: "error", message: "No auth URL received. Please try again." });
    } catch (err) {
      console.error("Failed to connect calendar:", err);
      setTransientStatus({ kind: "error", message: "Failed to start Calendar connection." });
    }
  }, [fetchJson, setTransientStatus]);

  const syncCalendar = useCallback(async () => {
    setSafe(() => setSyncing(true));
    try {
      const data = await fetchJson<{ success?: boolean }>("/api/calendar/sync", { method: "POST" });
      if (data.success) {
        await loadEvents();
        setTransientStatus({ kind: "success", message: "Calendar synced successfully." });
      } else {
        setTransientStatus({ kind: "error", message: "Sync failed. Please try again." });
      }
    } catch (err) {
      console.error("Sync failed:", err);
      setTransientStatus({ kind: "error", message: "Sync failed. Please try again." });
    } finally {
      setSafe(() => setSyncing(false));
    }
  }, [fetchJson, loadEvents, setSafe, setTransientStatus]);

  const headerLabel = useMemo(() => {
    if (!connected) return "";
    if (loading) return "Loading…";
    return `${events.length} upcoming events`;
  }, [connected, events.length, loading]);

  if (!connected) {
    return (
      <div className="calendar-empty">
        <style jsx>{`
          .calendar-empty {
            padding: 40px 20px;
            text-align: center;
          }

          .calendar-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .calendar-empty h3 {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 8px 0;
          }

          .calendar-empty p {
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 24px 0;
          }

          .connect-button {
            padding: 14px 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .connect-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
          }

          .status {
            margin-top: 14px;
            font-size: 13px;
            color: #6b7280;
          }
          .status.error {
            color: #b91c1c;
          }
        `}</style>

        <div className="calendar-icon">
          <Calendar size={40} />
        </div>

        <h3>Connect Google Calendar</h3>
        <p>Auto-populate events into your flyers</p>

        <button className="connect-button" onClick={connectCalendar}>
          <ExternalLink size={18} />
          Connect Calendar
        </button>

        {status.kind !== "idle" && (
          <div className={`status ${status.kind === "error" ? "error" : ""}`}>
            {status.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-panel">
      <style jsx>{`
        .calendar-panel {
          padding: 4px 0;
        }

        .sync-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .meta-label {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .sync-button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .sync-button:hover {
          background: #2563eb;
        }

        .sync-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .statusbar {
          margin-bottom: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #374151;
        }
        .statusbar.success {
          border-color: #86efac;
          background: #f0fdf4;
          color: #166534;
        }
        .statusbar.error {
          border-color: #fecaca;
          background: #fef2f2;
          color: #991b1b;
        }
        .statusbar.info {
          border-color: #bfdbfe;
          background: #eff6ff;
          color: #1e3a8a;
        }

        .event-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .event-card {
          padding: 14px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .event-card:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .event-title {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .event-meta {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .empty-events {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }
      `}</style>

      {status.kind !== "idle" && (
        <div className={`statusbar ${status.kind}`}>
          {status.message}
        </div>
      )}

      <div className="sync-header">
        <span className="meta-label">{headerLabel}</span>

        <button className="sync-button" onClick={syncCalendar} disabled={syncing || loading}>
          <RefreshCw size={14} className={syncing ? "spinning" : ""} />
          {syncing ? "Syncing..." : "Sync"}
        </button>
      </div>

      {loading ? (
        <div className="empty-events">Loading events...</div>
      ) : events.length > 0 ? (
        <div className="event-list">
          {events.map((event) => (
            <div
              key={event.id}
              className="event-card"
              onClick={() => onEventSelect(event)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onEventSelect(event);
              }}
              aria-label={`Select event ${event.title}`}
            >
              <p className="event-title">{event.title}</p>
              <div className="event-meta">
                <span>📅 {safeDateLabel(event.start)}</span>
                {event.location ? <span>📍 {event.location}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-events">
          <Calendar size={32} />
          <p>No upcoming events</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
