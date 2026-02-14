"use client";

import React from "react";
import type { Canvas } from "fabric";

import type { FieldKey } from "./canvasHelpers";
import { ensureTopLeftSafePosition, findFirstObjectByDataKey, removeObjectsByPredicate } from "./canvasHelpers";

type Fields = {
  event_name: string;
  date: string;
  timings: string;
  sponsorship: string;
  description: string;
};

export default function FieldsPanel(props: {
  canvas: Canvas | null;
  fields: Fields;
  onChange: (patch: Partial<Fields>) => void;
}) {
  const { canvas, fields, onChange } = props;

  const addFieldToCanvas = async (key: FieldKey) => {
    if (!canvas) return;

    // lazy import fabric to avoid SSR / module init issues
    const fabric = await import("fabric");

    // If already exists, just select it
    const existing = findFirstObjectByDataKey(canvas, key);
    if (existing) {
      canvas.setActiveObject(existing as any);
      canvas.requestRenderAll();
      return;
    }

    const { left, top } = ensureTopLeftSafePosition(canvas, 100, 120);

    const labelMap: Record<FieldKey, string> = {
      event_name: fields.event_name || "Event Name",
      date: fields.date || "Date",
      timings: fields.timings || "Timings",
      sponsorship: fields.sponsorship || "Sponsorship",
      description: fields.description || "Description",
    };

    const t = new fabric.IText(labelMap[key], {
      left,
      top: top + Object.keys(labelMap).indexOf(key) * 70,
      fontSize: key === "event_name" ? 44 : 28,
      fontFamily: "Arial",
      fill: "#111827",
    });

    // tag for later find/remove
    (t as any).dataKey = key;

    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.requestRenderAll();
  };

  const deleteFieldFromCanvas = (key: FieldKey) => {
    if (!canvas) return;
    removeObjectsByPredicate(canvas, (o) => (o as any)?.dataKey === key);
  };

  const inputStyle: React.CSSProperties = {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
  };

  const rowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" };

  const smallBtn: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(
        [
          ["event_name", "Event Name"],
          ["date", "Date"],
          ["timings", "Timings"],
          ["sponsorship", "Sponsorship"],
          ["description", "Description"],
        ] as Array<[FieldKey, string]>
      ).map(([key, label]) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontWeight: 700, fontSize: 13 }}>{label}</label>

          <div style={rowStyle}>
            <input
              value={fields[key]}
              onChange={(e) => onChange({ [key]: e.target.value } as any)}
              style={inputStyle}
              placeholder={label}
            />

            <button type="button" style={smallBtn} onClick={() => addFieldToCanvas(key)}>
              Add
            </button>

            <button type="button" style={smallBtn} onClick={() => deleteFieldFromCanvas(key)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
