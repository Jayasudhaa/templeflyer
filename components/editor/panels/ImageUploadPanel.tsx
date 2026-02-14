"use client";

import React from "react";
import type { Canvas } from "fabric";

export default function ImageUploadPanel(props: { canvas: Canvas | null }) {
  const { canvas } = props;

  const onFile = async (file: File) => {
    if (!canvas) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    const imgEl = new Image();
    imgEl.src = dataUrl;

    imgEl.onload = async () => {
      const fabric = await import("fabric");

      const imgObj = new fabric.Image(imgEl, {
        left: 140,
        top: 140,
        selectable: true,
        evented: true,
      });

      // scale down if huge
      const cw = canvas.getWidth();
      const ch = canvas.getHeight();
      const maxW = cw * 0.6;
      const maxH = ch * 0.6;

      const w = imgEl.width || 1;
      const h = imgEl.height || 1;
      const s = Math.min(maxW / w, maxH / h, 1);

      imgObj.scale(s);

      (imgObj as any).dataKey = "uploaded_image";
      canvas.add(imgObj);
      canvas.setActiveObject(imgObj);
      canvas.requestRenderAll();
    };
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd", background: "#fff" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        style={inputStyle}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.currentTarget.value = ""; // allow re-upload same file
        }}
      />
      <div style={{ fontSize: 12, color: "#6b7280" }}>
        Uploads are added as a draggable layer on the canvas.
      </div>
    </div>
  );
}
