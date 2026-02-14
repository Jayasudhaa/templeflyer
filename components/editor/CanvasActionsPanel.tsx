"use client";

import React from "react";

export default function CanvasActionsPanel(props: {
  onDeleteSelected: () => void;
  onClearCanvas: () => void;
  onBringForward: () => void;
  onSendBackwards: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button type="button" onClick={props.onDeleteSelected} style={dangerBtn}>
        🗑️ Delete Selected
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button type="button" onClick={props.onBringForward} style={btn}>
          ⬆️ Bring Forward
        </button>
        <button type="button" onClick={props.onSendBackwards} style={btn}>
          ⬇️ Send Backward
        </button>
      </div>

      <button type="button" onClick={props.onClearCanvas} style={btn}>
        🧹 Clear Canvas (keeps background)
      </button>

      <div style={{ fontSize: 12, color: "#6b7280" }}>
        Tip: Background/template is locked. Replace it from “Templates & Images”.
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "white",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "none",
  background: "#b91c1c",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};
