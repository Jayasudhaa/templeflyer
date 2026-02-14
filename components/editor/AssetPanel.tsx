"use client";

import React, { useMemo, useState } from "react";
import type { Image as FabricImageType } from "fabric";

type Props = {
  onSelectTemplate: (url: string) => void;
  onUploadTemplate: (file: File) => void;
  onUploadImage: (file: File) => void;

  onGenerateAIBackground: (festival: string, userPrompt: string) => Promise<number | undefined>;

  selectedImage: FabricImageType | null;
  onImageScaleChange: (scale: number) => void;
  onImageOpacityChange: (opacity: number) => void;
};

// Keep these in /public/templates/...
const STANDARD_TEMPLATES = [
  { id: "svt-1080", name: "SVT Standard", url: "/templates/svt-1080.png" },
  { id: "shiva-dark", name: "Shiva Dark", url: "/templates/shiva-dark-1080.png" },
  { id: "navratri", name: "Navratri", url: "/templates/navratri-1080.png" },
];

export default function AssetPanel({
  onSelectTemplate,
  onUploadTemplate,
  onUploadImage,
  onGenerateAIBackground,
  selectedImage,
  onImageOpacityChange,
  onImageScaleChange,
}: Props) {
  const [festival, setFestival] = useState("Temple Event");
  const [prompt, setPrompt] = useState("Warm festive temple backdrop with subtle diya glow, ornate borders, high contrast for readable text.");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const imageScale = useMemo(() => (selectedImage ? (selectedImage.scaleX ?? 1) : 1), [selectedImage]);
  const imageOpacity = useMemo(() => (selectedImage ? (selectedImage.opacity ?? 1) : 1), [selectedImage]);

  const runGenerate = async () => {
    setErr(null);
    setLoading(true);
    try {
      const left = await onGenerateAIBackground(festival, prompt);
      if (typeof left === "number") setRemaining(left);
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Standard templates */}
      <div>
        <div style={label}>Standard Templates</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {STANDARD_TEMPLATES.map((t) => (
            <button key={t.id} type="button" style={secondaryBtn} onClick={() => onSelectTemplate(t.url)}>
              {t.name}
            </button>
          ))}
        </div>
        <div style={hint}>Templates must exist under <code>/public/templates</code>.</div>
      </div>

      {/* Upload template */}
      <div>
        <div style={label}>Upload Template (PNG/JPG)</div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadTemplate(f);
            e.currentTarget.value = "";
          }}
        />
        <div style={hint}>Uploads become the locked background.</div>
      </div>

      {/* AI generate */}
      <div>
        <div style={label}>Generate AI Background</div>
        <input value={festival} onChange={(e) => setFestival(e.target.value)} placeholder="Festival / Event" style={input} />
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ ...input, minHeight: 70 }} />
        <button type="button" onClick={runGenerate} style={primaryBtn} disabled={loading}>
          {loading ? "Generating..." : "✨ Generate & Set Background"}
        </button>
        {remaining !== null && <div style={hint}>Remaining this month: {remaining}</div>}
        {err && <div style={{ color: "#b91c1c", fontSize: 13 }}>{err}</div>}
      </div>

      {/* Upload personal image */}
      <div>
        <div style={label}>Upload Personal / Temple Image (adds to canvas)</div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadImage(f);
            e.currentTarget.value = "";
          }}
        />
        <div style={hint}>This adds an editable image layer (move/resize/rotate).</div>
      </div>

      {/* Basic image processing for selected image */}
      <div>
        <div style={label}>Selected Image Controls</div>
        {selectedImage ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={row}>
              <span style={miniLabel}>Scale</span>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.05}
                value={imageScale}
                onChange={(e) => onImageScaleChange(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={value}>{imageScale.toFixed(2)}x</span>
            </div>

            <div style={row}>
              <span style={miniLabel}>Opacity</span>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={imageOpacity}
                onChange={(e) => onImageOpacityChange(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={value}>{Math.round(imageOpacity * 100)}%</span>
            </div>

            <div style={hint}>For cropping/removing background, we’ll add a dedicated crop tool next.</div>
          </div>
        ) : (
          <div style={hint}>Select an image on canvas to edit scale/opacity.</div>
        )}
      </div>
    </div>
  );
}

const label: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 6 };
const miniLabel: React.CSSProperties = { width: 60, fontSize: 12, color: "#374151", fontWeight: 600 };
const value: React.CSSProperties = { width: 52, textAlign: "right", fontSize: 12, color: "#374151", fontWeight: 700 };
const hint: React.CSSProperties = { marginTop: 6, fontSize: 12, color: "#6b7280" };
const input: React.CSSProperties = { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14 };
const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10 };

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: 11,
  background: "#4F46E5",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 800,
};

const secondaryBtn: React.CSSProperties = {
  padding: 10,
  background: "white",
  color: "#111827",
  border: "1px solid #ddd",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};
