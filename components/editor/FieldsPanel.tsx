"use client";

import React from "react";

type FlyerFields = {
  event_name: string;
  date: string;
  timings: string;
  sponsorship: string;
  description: string;
};

type Props = {
  fields: FlyerFields;
  onChange: (patch: Partial<FlyerFields>) => void;
  onAddOrUpdate: (key: keyof FlyerFields) => void;
  onRemove: (key: keyof FlyerFields) => void;
};

export default function FieldsPanel({ fields, onChange, onAddOrUpdate, onRemove }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FieldRow
        label="Event Name"
        value={fields.event_name}
        onChange={(v) => onChange({ event_name: v })}
        onAdd={() => onAddOrUpdate("event_name")}
        onRemove={() => onRemove("event_name")}
      />

      <FieldRow
        label="Date"
        value={fields.date}
        onChange={(v) => onChange({ date: v })}
        onAdd={() => onAddOrUpdate("date")}
        onRemove={() => onRemove("date")}
      />

      <FieldRow
        label="Timings"
        value={fields.timings}
        onChange={(v) => onChange({ timings: v })}
        onAdd={() => onAddOrUpdate("timings")}
        onRemove={() => onRemove("timings")}
      />

      <FieldRow
        label="Sponsorship"
        value={fields.sponsorship}
        onChange={(v) => onChange({ sponsorship: v })}
        onAdd={() => onAddOrUpdate("sponsorship")}
        onRemove={() => onRemove("sponsorship")}
        multiline
      />

      <FieldRow
        label="Description"
        value={fields.description}
        onChange={(v) => onChange({ description: v })}
        onAdd={() => onAddOrUpdate("description")}
        onRemove={() => onRemove("description")}
        multiline
      />
    </div>
  );
}

function FieldRow(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  multiline?: boolean;
}) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 10, background: "white" }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{props.label}</div>

      {props.multiline ? (
        <textarea value={props.value} onChange={(e) => props.onChange(e.target.value)} style={{ ...input, minHeight: 70 }} />
      ) : (
        <input value={props.value} onChange={(e) => props.onChange(e.target.value)} style={input} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        <button type="button" onClick={props.onAdd} style={addBtn}>
          ➕ Add / Update on Canvas
        </button>
        <button type="button" onClick={props.onRemove} style={removeBtn}>
          🗑️ Remove from Canvas
        </button>
      </div>
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14,
};

const addBtn: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "none",
  background: "#111827",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const removeBtn: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "white",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};
