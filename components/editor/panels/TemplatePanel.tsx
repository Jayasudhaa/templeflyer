"use client";

import React, { useRef } from "react";
import type { Canvas } from "fabric";

const STANDARD_TEMPLATES = [
  { id: "svt-1080", name: "SVT Standard", url: "/templates/svt-1080.png" },
  { id: "shiva-dark", name: "Shiva Dark", url: "/templates/shiva-dark-1080.png" },
];

export default function TemplatePanel({ canvas }: { canvas: Canvas | null }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const setBackgroundFromUrl = async (url: string) => {
    if (!canvas) return;

    const fabricMod = await import("fabric");
    const ImageClass = (fabricMod as any).Image;

    // ✅ Fabric v6: fromURL returns a Promise
    const img = await ImageClass.fromURL(url, { crossOrigin: "anonymous" });
    if (!img) return;

    // Scale to canvas
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();

    img.set({
      selectable: false,
      evented: false,
      left: 0,
      top: 0,
      originX: "left",
      originY: "top",
    });

    img.scaleToWidth(cw);
    if (img.getScaledHeight() < ch) img.scaleToHeight(ch);

    // ✅ v6-safe: set background image via property (works even if setBackgroundImage is missing)
    (canvas as any).backgroundImage = img;

    // Optional: if you want to ensure it’s behind everything:
    // backgroundImage is always behind objects, so no sendToBack needed.

    canvas.requestRenderAll();
  };

  const onUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      await setBackgroundFromUrl(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, color: "#6b7280" }}>
        Choose a template background (standard) or upload your own.
      </div>

      {STANDARD_TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => void setBackgroundFromUrl(t.url)}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
            fontWeight: 800,
            textAlign: "left",
          }}
        >
          {t.name}
        </button>
      ))}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onUpload(f);
          e.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        style={{
          padding: 12,
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "#f9fafb",
          cursor: "pointer",
          fontWeight: 800,
        }}
      >
        Upload Template Image
      </button>
    </div>
  );
}
