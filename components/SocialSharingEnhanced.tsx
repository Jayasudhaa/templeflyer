"use client";

import { useState } from "react";
import { generateShareUrls, copyToClipboard } from "@/lib/utils";
import { t } from "@/lib/utils";
import { Language } from "@/lib/types";

interface SocialSharingProps {
  flyerUrl: string;
  eventName: string;
  language: Language;
  showPreviewHint?: boolean;
  onSendWhatsAppMessage?: () => void;
}

export default function SocialSharing({
  flyerUrl,
  eventName,
  language,
  showPreviewHint = false,
  onSendWhatsAppMessage,
}: SocialSharingProps) {
  const [copied, setCopied] = useState(false);
  const shareUrls = generateShareUrls(flyerUrl, eventName);

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(flyerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleWhatsAppShare = () => {
    if (onSendWhatsAppMessage) {
      onSendWhatsAppMessage();
    } else {
      window.open(shareUrls.whatsapp, "_blank");
    }
  };

  const handleShare = (platform: string) => {
    if (showPreviewHint) {
      alert(`📤 Export your flyer first!\n\nClick "💾 Export PNG" above to download your flyer, then you can share it on ${platform}.`);
      return;
    }

    switch (platform) {
      case 'whatsapp':
        handleWhatsAppShare();
        break;
      case 'facebook':
        window.open(shareUrls.facebook, "_blank");
        break;
      case 'instagram':
        alert("📸 Download the image and share it on your Instagram story!");
        break;
    }
  };

  return (
    <div>
      <h4 style={{ marginBottom: 12, fontWeight: 600, fontSize: 16 }}>
        📱 Share Your Flyer
      </h4>

      {showPreviewHint && (
        <div style={{
          marginBottom: 12,
          padding: 10,
          background: "#fff3cd",
          borderRadius: 6,
          border: "1px solid #ffc107",
          fontSize: 12,
        }}>
          ℹ️ Export your flyer first to enable sharing
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        {/* WhatsApp Share Button */}
        <button
          onClick={() => handleShare('whatsapp')}
          disabled={showPreviewHint}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 14,
            background: showPreviewHint ? "#ccc" : "#25d366",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: showPreviewHint ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          WhatsApp
        </button>

        {/* Facebook Share Button */}
        <button
          onClick={() => handleShare('facebook')}
          disabled={showPreviewHint}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 14,
            background: showPreviewHint ? "#ccc" : "#1877f2",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: showPreviewHint ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>

        {/* Instagram Button */}
        <button
          onClick={() => handleShare('instagram')}
          disabled={showPreviewHint}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 14,
            background: showPreviewHint ? "#ccc" : "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: showPreviewHint ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
          </svg>
          Instagram
        </button>

        {/* Twitter/X Button */}
        <button
          onClick={() => !showPreviewHint && window.open(shareUrls.twitter, "_blank")}
          disabled={showPreviewHint}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 14,
            background: showPreviewHint ? "#ccc" : "#000000",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: showPreviewHint ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X / Twitter
        </button>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          disabled={showPreviewHint}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: 14,
            background: showPreviewHint ? "#ccc" : (copied ? "#4caf50" : "#6c757d"),
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: showPreviewHint ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "background 0.3s",
          }}
        >
          {copied ? "✓" : "🔗"} {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {/* WhatsApp Business API hint */}
      {!showPreviewHint && onSendWhatsAppMessage && (
        <div style={{
          marginTop: 12,
          padding: 10,
          background: "#fff",
          borderRadius: 6,
          border: "1px solid #e0e0e0",
          fontSize: 11,
        }}>
          <strong style={{ color: "#25d366" }}>💡 WhatsApp Pro:</strong>
          <p style={{ margin: "6px 0 0 0", lineHeight: 1.5 }}>
            Using WhatsApp Business API adds interactive buttons for RSVP, 
            calendar add, and volunteer sign-up!
          </p>
        </div>
      )}
    </div>
  );
}
