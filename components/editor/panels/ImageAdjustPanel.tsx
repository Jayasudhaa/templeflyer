"use client";

import React, { useMemo, useState } from "react";
import type { Canvas, Object as FabricObject } from "fabric";

function isImage(obj: FabricObject | null) {
  return !!obj && (obj as any).type === "image";
}

export default function ImageAdjustPanel(props: { canvas: Canvas | null; selectedObj: FabricObject | null }) {
  const { canvas, selectedObj } = props;
  const enabled = useMemo(() => isImage(selectedObj), [selectedObj]);

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(false);

  const apply = async () => {
    if (!canvas || !enabled) return;
    const fabric = await import("fabric");
    const img = selectedObj as any;

    img.filters = [];

    if (grayscale) img.filters.push(new fabric.filters.Grayscale());
    if (brightness !== 0) img.filters.push(new fabric.filters.Brightness({ brightness }));
    if (contrast !== 0) img.filters.push(new fabric.filters.Contrast({ contrast }));
    if (saturation !== 0) img.filters.push(new fabric.filters.Saturation({ saturation }));
    if (blur !== 0) img.filters.push(new fabric.filters.Blur({ blur }));

    img.applyFilters();
    canvas.requestRenderAll();
  };

  const reset = async () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setBlur(0);
    setGrayscale(false);

    if (!canvas || !enabled) return;
    const img = selectedObj as any;
    img.filters = [];
    img.applyFilters();
    canvas.requestRenderAll();
  };

  const slider: React.CSSProperties = { width: "100%" };
  const btn: React.CSSProperties = { padding: 10, borderRadius: 10, border: "1px solid #ddd", cursor: "pointer", fontWeight: 800, background: "#fff" };

  if (!enabled) {
    return <div style={{ fontSize: 13, color: "#6b7280" }}>Select an image layer to adjust.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 700 }}>Brightness ({brightness.toFixed(2)})</label>
      <input style={slider} type="range" min={-1} max={1} step={0.05} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />

      <label style={{ fontSize: 13, fontWeight: 700 }}>Contrast ({contrast.toFixed(2)})</label>
      <input style={slider} type="range" min={-1} max={1} step={0.05} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />

      <label style={{ fontSize: 13, fontWeight: 700 }}>Saturation ({saturation.toFixed(2)})</label>
      <input style={slider} type="range" min={-1} max={1} step={0.05} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} />

      <label style={{ fontSize: 13, fontWeight: 700 }}>Blur ({blur.toFixed(2)})</label>
      <input style={slider} type="range" min={0} max={0.6} step={0.02} value={blur} onChange={(e) => setBlur(Number(e.target.value))} />

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
        <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} />
        Grayscale
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button type="button" style={btn} onClick={() => void apply()}>Apply</button>
        <button type="button" style={{ ...btn, background: "#FFF1F2", borderColor: "#FECDD3" }} onClick={() => void reset()}>
          Reset
        </button>
      </div>
    </div>
  );
}
