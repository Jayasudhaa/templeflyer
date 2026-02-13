// ============================================================================
// FILE: app/page.tsx (FIXED)
// PURPOSE: Landing page that redirects to the modular editor
// ============================================================================
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    // Automatically redirect to the editor page
    router.push("/editor");
  }, [router]);
  return (
    <main style={{ 
      minHeight: "100vh", 
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div style={{
        textAlign: "center",
        color: "white",
      }}>
        <h1 style={{ fontSize: "2.5em", margin: "10px 0" }}>
          🎨 AI MITRA Flyer Editor
        </h1>
        <p style={{ fontSize: "1.2em", opacity: 0.95, marginBottom: 30 }}>
          Redirecting to editor...
        </p>
      
        <div style={{
          animation: "spin 1s linear infinite",
          fontSize: "3em",
      }}>
          ⏳
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
