// ============================================================================
// FILE: components/editor/CalendarPanel.tsx
// PURPOSE: Google Calendar sync - auto-populate events into flyers
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { Calendar, RefreshCw, Download, ExternalLink } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
}

interface CalendarPanelProps {
  onEventSelect: (event: CalendarEvent) => void;
}

export default function CalendarPanel({ onEventSelect }: CalendarPanelProps) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/calendar/connection");
      const data = await response.json();
      setConnected(data.connected);
      if (data.connected) {
        loadEvents();
      }
    } catch (error) {
      console.error("Failed to check calendar connection:", error);
    }
  };

  const connectCalendar = async () => {
    try {
      // Initiate Google OAuth
      const response = await fetch("/api/calendar/connect");
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Failed to connect calendar:", error);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/calendar/events");
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncCalendar = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await response.json();
      
      if (data.success) {
        await loadEvents();
        alert("✅ Calendar synced successfully!");
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("❌ Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

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
          }
          
          .connect-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
          }
        `}</style>
        
        <div className="calendar-icon">
          <Calendar size={40} />
        </div>
        <h3>Connect Google Calendar</h3>
        <p>Auto-populate events into your flyers</p>
        <button className="connect-button" onClick={connectCalendar}>
          <ExternalLink size={18} style={{ display: 'inline', marginRight: 8 }} />
          Connect Calendar
        </button>
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
          margin-bottom: 16px;
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

      <div className="sync-header">
        <span style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>
          {events.length} upcoming events
        </span>
        <button 
          className="sync-button" 
          onClick={syncCalendar}
          disabled={syncing}
        >
          <RefreshCw size={14} className={syncing ? 'spinning' : ''} />
          {syncing ? 'Syncing...' : 'Sync'}
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
            >
              <p className="event-title">{event.title}</p>
              <div className="event-meta">
                <span>📅 {new Date(event.start).toLocaleDateString()}</span>
                {event.location && <span>📍 {event.location}</span>}
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
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
