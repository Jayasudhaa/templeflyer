"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Admin RSVP Analytics — /admin/rsvp/[eventId]/page.tsx
 *
 * Real-time dashboard showing:
 * - Stat cards: views, confirmed, maybe, blessings, conversion rate
 * - Daily trend bar chart (CSS only, no chart lib)
 * - Food / device / sponsorship breakdowns
 * - Full attendee table with CSV export
 * - Auto-refreshes every 30 seconds
 */

export default function RSVPDashboard({ params }: { params: { eventId: string } }) {
  const eventId = params.eventId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { setErr("Please log in"); setLoading(false); return; }

      const r = await fetch(`/api/rsvp?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Fetch failed");
      setData(await r.json());
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  function exportCSV() {
    if (!data?.rsvps?.length) return;
    const h = ["Name","Guests","Food","Status","Source","Device","Sponsorship","Date"];
    const rows = data.rsvps.map((r: any) => [
      r.name, r.guests, r.food_pref, r.status, r.source, r.device_type || "",
      (r.sponsorship_interest || []).join("; "),
      new Date(r.created_at).toLocaleDateString(),
    ]);
    const csv = [h.join(","), ...rows.map((r: any) => r.map((c: any) => `"${c}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `rsvp-${eventId}.csv`;
    a.click();
  }

  if (loading) return <div style={S.page}><p style={S.msg}>Loading analytics...</p></div>;
  if (err) return <div style={S.page}><p style={{ ...S.msg, color: "#f87171" }}>{err}</p></div>;
  if (!data) return null;

  const { summary: sm, trend, conversion: cv, sponsorship: sp, rsvps } = data;
  const maxBar = Math.max(...(trend || []).map((d: any) => d.total_guests || 0), 1);

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        {/* Header */}
        <div style={S.header}>
          <h1 style={S.title}>RSVP Analytics</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} style={S.btn}>↻ Refresh</button>
            <button onClick={exportCSV} style={S.btnGold}>↓ Export CSV</button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={S.cardGrid}>
          <Card label="Flyer Views" val={cv?.total_views ?? 0} color="#60a5fa" />
          <Card label="Confirmed" val={sm?.confirmed_guests ?? 0} color="#4ade80" sub={`${sm?.confirmed_count ?? 0} RSVPs`} />
          <Card label="Maybe" val={sm?.maybe_guests ?? 0} color="#fbbf24" sub={`${sm?.maybe_count ?? 0} RSVPs`} />
          <Card label="Blessings" val={sm?.blessings_count ?? 0} color="#c084fc" />
          <Card label="Conversion" val={`${cv?.conversion_pct ?? 0}%`} color="#daa520" sub="views → RSVP" />
          <Card label="Total Guests" val={(sm?.confirmed_guests ?? 0) + (sm?.maybe_guests ?? 0)} color="#f0abfc" sub="confirmed + maybe" />
        </div>

        {/* Trend Chart */}
        {trend?.length > 0 && (
          <div style={S.section}>
            <h2 style={S.secTitle}>Daily Trend</h2>
            <div style={S.chart}>
              {trend.map((d: any) => (
                <div key={d.day} style={S.chartCol}>
                  <div style={S.barWrap}>
                    <div style={{ ...S.bar, height: `${(d.total_guests / maxBar) * 100}%` }}>
                      <span style={S.barNum}>{d.total_guests}</span>
                    </div>
                  </div>
                  <span style={S.barDate}>
                    {new Date(d.day + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breakdowns */}
        <div style={S.bkRow}>
          <div style={S.bkCard}>
            <h3 style={S.bkTitle}>Food (Confirmed)</h3>
            <Bar label="Vegetarian" val={sm?.food_veg ?? 0} total={(sm?.confirmed_guests ?? 1)} color="#4ade80" />
            <Bar label="Vegan" val={sm?.food_vegan ?? 0} total={(sm?.confirmed_guests ?? 1)} color="#a78bfa" />
            <Bar label="No Food" val={sm?.food_none ?? 0} total={(sm?.confirmed_guests ?? 1)} color="#94a3b8" />
          </div>
          <div style={S.bkCard}>
            <h3 style={S.bkTitle}>Device</h3>
            <Bar label="Mobile" val={sm?.from_mobile ?? 0} total={(sm?.total_responses ?? 1)} color="#fbbf24" />
            <Bar label="Desktop" val={sm?.from_desktop ?? 0} total={(sm?.total_responses ?? 1)} color="#60a5fa" />
          </div>
          <div style={S.bkCard}>
            <h3 style={S.bkTitle}>Sponsorship Interest</h3>
            {Object.keys(sp || {}).length === 0
              ? <p style={{ color: "#666", fontSize: 14 }}>None yet</p>
              : Object.entries(sp).map(([k, v]: any) => (
                <Bar key={k} label={k} val={v} total={sm?.total_responses ?? 1} color="#daa520" />
              ))
            }
          </div>
        </div>

        {/* Attendee Table */}
        <div style={S.section}>
          <h2 style={S.secTitle}>Attendees ({rsvps?.length ?? 0})</h2>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Name","Guests","Food","Status","Device","Sponsorship","Date"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(rsvps || []).map((r: any) => (
                  <tr key={r.id} style={S.tr}>
                    <td style={S.td}><strong>{r.name}</strong></td>
                    <td style={S.td}>{r.guests}</td>
                    <td style={S.td}>{r.food_pref}</td>
                    <td style={S.td}>
                      <span style={{
                        padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: r.status === "confirmed" ? "rgba(74,222,128,0.15)" :
                          r.status === "maybe" ? "rgba(251,191,36,0.15)" :
                          r.status === "blessings" ? "rgba(192,132,252,0.15)" : "rgba(248,113,113,0.15)",
                        color: r.status === "confirmed" ? "#4ade80" :
                          r.status === "maybe" ? "#fbbf24" :
                          r.status === "blessings" ? "#c084fc" : "#f87171",
                      }}>{r.status}</span>
                    </td>
                    <td style={S.td}>{r.device_type || "—"}</td>
                    <td style={S.td}>{r.sponsorship_interest?.length ? r.sponsorship_interest.join(", ") : "—"}</td>
                    <td style={S.td}>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, val, color, sub }: { label: string; val: any; color: string; sub?: string }) {
  return (
    <div style={S.card}>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase" as const, letterSpacing: 1, fontWeight: 600, marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Bar({ label, val, total, color }: { label: string; val: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#bbb", marginBottom: 3 }}>
        <span>{label}</span><span>{val} ({pct}%)</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0f1117", padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#e4e4e7" },
  msg: { textAlign: "center", padding: 60, color: "#daa520", fontSize: 18 },
  wrap: { maxWidth: 1100, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap" as const, gap: 12 },
  title: { fontSize: 26, fontWeight: 700, color: "#daa520", margin: 0 },
  btn: { padding: "8px 16px", background: "rgba(218,165,32,0.1)", border: "1px solid rgba(218,165,32,0.3)", borderRadius: 8, color: "#daa520", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  btnGold: { padding: "8px 16px", background: "linear-gradient(135deg, #b8860b, #daa520)", border: "none", borderRadius: 8, color: "#1a0505", fontSize: 13, cursor: "pointer", fontWeight: 700 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 14px", textAlign: "center" as const },
  section: { marginBottom: 28 },
  secTitle: { fontSize: 18, fontWeight: 700, color: "#daa520", marginBottom: 14 },
  chart: { display: "flex", gap: 4, alignItems: "flex-end", height: 160, padding: "8px 4px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" },
  chartCol: { flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", height: "100%", justifyContent: "flex-end", padding: "0 0 8px" },
  barWrap: { flex: 1, display: "flex", alignItems: "flex-end", width: "100%", justifyContent: "center" },
  bar: { width: "55%", minWidth: 10, background: "linear-gradient(to top, #b8860b, #daa520)", borderRadius: "4px 4px 0 0", position: "relative" as const, minHeight: 3, transition: "height 0.5s" },
  barNum: { position: "absolute" as const, top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#daa520", fontWeight: 700 },
  barDate: { fontSize: 10, color: "#777", marginTop: 4 },
  bkRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 28 },
  bkCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 },
  bkTitle: { fontSize: 13, fontWeight: 700, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 12 },
  tableWrap: { overflowX: "auto" as const, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 14 },
  th: { textAlign: "left" as const, padding: "10px 12px", background: "rgba(218,165,32,0.08)", color: "#daa520", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1 },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
  td: { padding: "8px 12px" },
};
