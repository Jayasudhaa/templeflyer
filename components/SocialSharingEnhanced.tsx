"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/utils";
import type { Language } from "@/lib/types";

interface SocialSharingProps {
  flyerUrl: string;
  eventName: string;
  language?: Language; // ✅ optional for safety
}

export default function SocialSharing({
  flyerUrl,
  eventName,
  language = "en",
}: SocialSharingProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(flyerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ✅ Optional basic localization
  const getMessage = () => {
    switch (language) {
      case "hi":
        return `हमारे कार्यक्रम में शामिल हों: ${eventName}\nRSVP यहाँ करें: ${flyerUrl}`;
      case "ta":
        return `எங்கள் நிகழ்வில் சேருங்கள்: ${eventName}\nஇங்கே RSVP செய்யவும்: ${flyerUrl}`;
      case "te":
        return `మా కార్యక్రమానికి రండి: ${eventName}\nఇక్కడ RSVP చేయండి: ${flyerUrl}`;
      default:
        return `Check out our event: ${eventName}\nRSVP here: ${flyerUrl}`;
    }
  };

  const encodedMsg = encodeURIComponent(getMessage());

  return (
    <div
      style={{
        background: "#fff",
        padding: "15px",
        borderRadius: "12px",
        border: "1px solid #eee",
      }}
    >
      <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
        Share Event
      </h4>

      <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
        <button
          onClick={() =>
            window.open(`https://wa.me/?text=${encodedMsg}`, "_blank")
          }
          style={{
            background: "#25D366",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          WhatsApp
        </button>

        <button
          onClick={handleCopy}
          style={{
            background: copied ? "#4CAF50" : "#6c757d",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {copied ? "Link Copied!" : "Copy RSVP Link"}
        </button>
      </div>
    </div>
  );
}
