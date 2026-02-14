"use client";

import React, { useState } from "react";
import type { Canvas } from "fabric";

function setCanvasBackground(canvas: Canvas, img: any) {
  // Fabric v6-safe
  (canvas as any).backgroundImage = img;
  canvas.requestRenderAll();
}

function sendObjectToBackSafe(canvas: Canvas, obj: any) {
  // Fabric v6-safe
  if ((canvas as any).sendObjectToBack) (canvas as any).sendObjectToBack(obj);
  else canvas.sendObjectToBack(obj);
}

export default function AIBackgroundPanel(props: {
  canvas: Canvas | null;
  getAuthToken?: () => Promise<string | null>;
  defaultFestival?: string;
}) {
  const { canvas, getAuthToken, defaultFestival } = props;

  const [festival, setFestival] = useState(defaultFestival || "Temple Event");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (mode: "background" | "layer") => {
    if (!canvas) return;
    setLoading(true);

    try {
      const token = getAuthToken ? await getAuthToken() : null;

      const res = await fetch("/api/generate-hero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          festival,
          userPrompt: prompt?.trim() ? prompt.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generate failed");

      const b64 = data?.b64;
      if (!b64) throw new Error("No image returned");

      const imgEl = new Image();
      imgEl.crossOrigin = "anonymous";
      imgEl.src = `data:image/png;base64,${b64}`;

      imgEl.onload = async () => {
        const fabricMod = await import("fabric");

        const FabricImageCtor =
          (fabricMod as any).FabricImage || (fabricMod as any).Image;

        const imgObj = new FabricImageCtor(imgEl, {
          left: 0,
          top: 0,
          originX: "left",
          originY: "top",
          selectable: mode === "layer",
          evented: mode === "layer",
        });

        // Fit to canvas
        const cw = canvas.getWidth();
        const ch = canvas.getHeight();
        const scale = Math.max(cw / (imgEl.width || 1), ch / (imgEl.height || 1));
        imgObj.scale(scale);

        if (mode === "background") {
          setCanvasBackground(canvas, imgObj);
        } else {
          (imgObj as any).dataKey = "ai_image";
          canvas.add(imgObj);
          sendObjectToBackSafe(canvas, imgObj);
          canvas.requestRenderAll();
        }
      };

      imgEl.onerror = () => {
        alert("Failed to load generated image");
      };
    } catch (e: any) {
      alert(e?.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    width: "100%",
    fontSize: 14,
  };

  const btn: React.CSSProperties = {
    padding: "12px 12px",
    borderRadius: 10,
    border: "none",
    background: "#4F46E5",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        style={inputStyle}
        value={festival}
        onChange={(e) => setFestival(e.target.value)}
        placeholder="Festival / Event theme"
      />

      <textarea
        style={{ ...inputStyle, minHeight: 90 }}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder='User prompt (optional): "golden temple silhouette, diyas, warm bokeh, minimal background"...'
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          type="button"
          style={{ ...btn, opacity: loading ? 0.7 : 1 }}
          onClick={() => void generate("background")}
          disabled={loading}
        >
          {loading ? "Generating..." : "Set as Background"}
        </button>

        <button
          type="button"
          style={{ ...btn, background: "#111827", opacity: loading ? 0.7 : 1 }}
          onClick={() => void generate("layer")}
          disabled={loading}
        >
          {loading ? "Generating..." : "Add as Layer"}
        </button>
      </div>
    </div>
  );
}
