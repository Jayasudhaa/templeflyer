// ============================================================================
// FILE: components/editor/FontStylePanel.tsx
// PURPOSE: Complete font styling controls (family, size, color, weight, etc.)
// ============================================================================

"use client";

import { useState, useEffect } from "react";
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";

interface FontStylePanelProps {
  selectedText: any; // Fabric text object
  onUpdate: () => void;
}

// Google Fonts list (popular choices for Indian temple flyers)
const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Courier New",
  "Lato",
  "Montserrat",
  "Open Sans",
  "Roboto",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "Raleway",
  "Ubuntu",
  "Noto Sans",
  "Noto Serif",
  "Dancing Script",
  "Pacifico",
  "Abril Fatface"
];

const FONT_WEIGHTS = [
  { label: "Thin", value: "100" },
  { label: "Light", value: "300" },
  { label: "Regular", value: "normal" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "bold" },
  { label: "Black", value: "900" }
];

export default function FontStylePanel({ selectedText, onUpdate }: FontStylePanelProps) {
  if (!selectedText || selectedText.type !== 'text') {
    return (
      <div className="no-selection">
        <Type size={40} color="#9ca3af" />
        <p>Select a text object to style it</p>
        
        <style jsx>{`
          .no-selection {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #6b7280;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  const [fontFamily, setFontFamily] = useState(selectedText.fontFamily || "Arial");
  const [fontSize, setFontSize] = useState(selectedText.fontSize || 40);
  const [fontColor, setFontColor] = useState(selectedText.fill || "#000000");
  const [fontWeight, setFontWeight] = useState(selectedText.fontWeight || "normal");
  const [textAlign, setTextAlign] = useState(selectedText.textAlign || "left");
  const [lineHeight, setLineHeight] = useState(selectedText.lineHeight || 1.2);
  const [charSpacing, setCharSpacing] = useState(selectedText.charSpacing || 0);
  const [underline, setUnderline] = useState(selectedText.underline || false);
  const [linethrough, setLinethrough] = useState(selectedText.linethrough || false);
  const [italic, setItalic] = useState(selectedText.fontStyle === "italic");

  // Apply changes to selected text
  const applyStyle = (property: string, value: any) => {
    if (!selectedText) return;
    selectedText.set(property, value);
    onUpdate();
  };

  return (
    <div className="font-panel">
      <style jsx>{`
        .font-panel {
          padding: 4px 0;
        }
        
        .control-group {
          margin-bottom: 20px;
        }
        
        .control-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        
        .select-input, .color-input, .slider-input {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .select-input:hover, .select-input:focus {
          border-color: #3b82f6;
          outline: none;
        }
        
        .slider-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .slider-input {
          flex: 1;
          padding: 0;
          height: 6px;
          border: none;
          background: #e5e7eb;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .slider-input::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .slider-value {
          min-width: 45px;
          text-align: right;
          font-size: 14px;
          font-weight: 600;
          color: #3b82f6;
        }
        
        .button-group {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        
        .icon-button {
          padding: 10px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .icon-button:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        
        .icon-button.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }
        
        .color-picker-wrapper {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .color-preview {
          width: 50px;
          height: 38px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .color-preview:hover {
          border-color: #3b82f6;
          transform: scale(1.05);
        }
      `}</style>

      {/* Font Family */}
      <div className="control-group">
        <label className="control-label">Font Family</label>
        <select
          className="select-input"
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            applyStyle('fontFamily', e.target.value);
          }}
        >
          {FONT_FAMILIES.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className="control-group">
        <label className="control-label">Font Size</label>
        <div className="slider-container">
          <input
            type="range"
            className="slider-input"
            min="8"
            max="200"
            value={fontSize}
            onChange={(e) => {
              const size = Number(e.target.value);
              setFontSize(size);
              applyStyle('fontSize', size);
            }}
          />
          <span className="slider-value">{fontSize}px</span>
        </div>
      </div>

      {/* Font Color */}
      <div className="control-group">
        <label className="control-label">Text Color</label>
        <div className="color-picker-wrapper">
          <div 
            className="color-preview" 
            style={{ background: fontColor }}
            onClick={() => document.getElementById('font-color-picker')?.click()}
          />
          <input
            id="font-color-picker"
            type="color"
            value={fontColor}
            onChange={(e) => {
              setFontColor(e.target.value);
              applyStyle('fill', e.target.value);
            }}
            style={{ display: 'none' }}
          />
          <input
            type="text"
            className="select-input"
            value={fontColor}
            onChange={(e) => {
              setFontColor(e.target.value);
              applyStyle('fill', e.target.value);
            }}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Font Weight */}
      <div className="control-group">
        <label className="control-label">Font Weight</label>
        <select
          className="select-input"
          value={fontWeight}
          onChange={(e) => {
            setFontWeight(e.target.value);
            applyStyle('fontWeight', e.target.value);
          }}
        >
          {FONT_WEIGHTS.map(weight => (
            <option key={weight.value} value={weight.value}>
              {weight.label}
            </option>
          ))}
        </select>
      </div>

      {/* Text Alignment */}
      <div className="control-group">
        <label className="control-label">Text Alignment</label>
        <div className="button-group">
          <button
            className={`icon-button ${textAlign === 'left' ? 'active' : ''}`}
            onClick={() => {
              setTextAlign('left');
              applyStyle('textAlign', 'left');
            }}
          >
            <AlignLeft size={18} />
          </button>
          <button
            className={`icon-button ${textAlign === 'center' ? 'active' : ''}`}
            onClick={() => {
              setTextAlign('center');
              applyStyle('textAlign', 'center');
            }}
          >
            <AlignCenter size={18} />
          </button>
          <button
            className={`icon-button ${textAlign === 'right' ? 'active' : ''}`}
            onClick={() => {
              setTextAlign('right');
              applyStyle('textAlign', 'right');
            }}
          >
            <AlignRight size={18} />
          </button>
        </div>
      </div>

      {/* Line Height */}
      <div className="control-group">
        <label className="control-label">Line Height</label>
        <div className="slider-container">
          <input
            type="range"
            className="slider-input"
            min="0.5"
            max="3"
            step="0.1"
            value={lineHeight}
            onChange={(e) => {
              const height = Number(e.target.value);
              setLineHeight(height);
              applyStyle('lineHeight', height);
            }}
          />
          <span className="slider-value">{lineHeight.toFixed(1)}</span>
        </div>
      </div>

      {/* Character Spacing */}
      <div className="control-group">
        <label className="control-label">Letter Spacing</label>
        <div className="slider-container">
          <input
            type="range"
            className="slider-input"
            min="-200"
            max="800"
            step="10"
            value={charSpacing}
            onChange={(e) => {
              const spacing = Number(e.target.value);
              setCharSpacing(spacing);
              applyStyle('charSpacing', spacing);
            }}
          />
          <span className="slider-value">{charSpacing}</span>
        </div>
      </div>

      {/* Text Decorations */}
      <div className="control-group">
        <label className="control-label">Text Style</label>
        <div className="button-group">
          <button
            className={`icon-button ${italic ? 'active' : ''}`}
            onClick={() => {
              const newItalic = !italic;
              setItalic(newItalic);
              applyStyle('fontStyle', newItalic ? 'italic' : 'normal');
            }}
          >
            <Italic size={18} />
          </button>
          <button
            className={`icon-button ${underline ? 'active' : ''}`}
            onClick={() => {
              const newUnderline = !underline;
              setUnderline(newUnderline);
              applyStyle('underline', newUnderline);
            }}
          >
            U
          </button>
          <button
            className={`icon-button ${linethrough ? 'active' : ''}`}
            onClick={() => {
              const newLinethrough = !linethrough;
              setLinethrough(newLinethrough);
              applyStyle('linethrough', newLinethrough);
            }}
          >
            S
          </button>
        </div>
      </div>
    </div>
  );
}
