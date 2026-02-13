// ============================================================================
// FILE: components/editor/LeftPanel.tsx
// PURPOSE: Modern, elegant sidebar with collapsible sections
// ============================================================================

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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

export function Section({ 
  title, 
  icon, 
  defaultOpen = true, 
  children,
  accent = "blue"
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const accentColors = {
    blue: "#3b82f6",
    purple: "#8b5cf6",
    green: "#10b981",
    orange: "#f59e0b"
  };

  return (
    <div className="section">
      <style jsx>{`
        .section {
          margin-bottom: 4px;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        
        .section-header:hover {
          background: #f3f4f6;
          border-left-color: ${accentColors[accent]};
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
          color: ${accentColors[accent]};
          width: 20px;
          height: 20px;
        }
        
        .chevron {
          color: #6b7280;
          transition: transform 0.2s ease;
          transform: ${isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'};
        }
        
        .section-content {
          padding: 0 20px 20px;
          display: ${isOpen ? 'block' : 'none'};
          animation: slideDown 0.2s ease;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div 
        className="section-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="section-title">
          {icon && <span className="section-icon">{icon}</span>}
          {title}
        </div>
        <ChevronDown className="chevron" size={18} />
      </div>
      
      <div className="section-content">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Divider Component
// ============================================================================

export function Divider() {
  return (
    <div style={{
      height: 1,
      background: "linear-gradient(90deg, transparent, #e5e7eb 50%, transparent)",
      margin: "16px 0"
    }} />
  );
}
