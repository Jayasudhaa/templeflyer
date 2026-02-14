"use client";

import dynamic from "next/dynamic";

const CanvasEditor = dynamic(() => import("@/components/FlyerEditor"), {
  ssr: false,
  loading: () => (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ fontSize: 18 }}>Loading editor…</div>
    </main>
  ),
});

export default function CanvasEditorClient() {
  return <CanvasEditor />;
}
