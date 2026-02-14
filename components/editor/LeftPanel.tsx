// ============================================================================
// FILE: components/editor/LeftPanel.tsx
// PURPOSE: Modern, elegant sidebar with collapsible sections
// REWRITE: accessibility + smoother collapse animation + cleanup
// ============================================================================

"use client";

import React, { useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

interface LeftPanelProps {
  children: React.ReactNode;
}

export default function LeftPanel({ children }: LeftPanelProps) {
  return (
    <div className="left-panel">
      <style jsx>{`
        .left-panel {
          width: 380px;
          height: 100vh;
          background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
          border-right: 1px solid #e5e7eb;
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 2px 0 12px rgba(0, 0, 0, 0.04);
        }

        .left-panel::-webkit-scrollbar {
          width: 8px;
        }

        .left-panel::-webkit-scrollbar-track {
          background: transparent;
        }

        .left-panel::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .left-panel::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>

      {children}
    </div>
  );
}

// ============================================================================
// Collapsible Section Component
// ============================================================================

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accent?: "blue" | "purple" | "green" | "orange";
}

const ACCENT_COLORS: Record<NonNullable<SectionProps["accent"]>, string> = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  green: "#10b981",
  orange: "#f59e0b",
};

export function Section({
  title,
  icon,
  defaultOpen = true,
  children,
  accent = "blue",
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  const accentColor = useMemo(() => ACCENT_COLORS[accent], [accent]);

  const toggle = () => setIsOpen((v) => !v);

  return (
    <div className="section">
      <style jsx>{`
        .section {
          margin-bottom: 4px;
        }

        .section-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          background: transparent;
          border-top: none;
          border-right: none;
          border-bottom: none;
          text-align: left;
        }

        .section-header:hover {
          background: #f3f4f6;
          border-left-color: ${accentColor};
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
        }

        .section-icon {
          color: ${accentColor};
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .chevron {
          color: #6b7280;
          transition: transform 0.2s ease;
          transform: rotate(${isOpen ? 0 : -90}deg);
        }

        /* Use transitions instead of display:none so animation is smooth */
        .section-content {
          padding: 0 20px;
          overflow: hidden;
          max-height: ${isOpen ? "1200px" : "0px"};
          opacity: ${isOpen ? 1 : 0};
          transform: translateY(${isOpen ? "0px" : "-6px"});
          transition: max-height 0.25s ease, opacity 0.2s ease, transform 0.2s ease;
        }

        .section-content-inner {
          padding-bottom: 20px;
          padding-top: 2px;
        }
      `}</style>

      <button
        type="button"
        className="section-header"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <div className="section-title">
          {icon ? <span className="section-icon">{icon}</span> : null}
          {title}
        </div>

        <ChevronDown className="chevron" size={18} />
      </button>

      <div id={contentId} className="section-content">
        <div className="section-content-inner">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Divider Component
// ============================================================================

export function Divider() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 1,
        background: "linear-gradient(90deg, transparent, #e5e7eb 50%, transparent)",
        margin: "16px 0",
      }}
    />
  );
}
