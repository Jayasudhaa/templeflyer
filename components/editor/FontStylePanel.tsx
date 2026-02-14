// ============================================================================
// FILE: components/editor/FontStylePanel.tsx
// PURPOSE: Complete font styling controls (family, size, color, weight, etc.)
// REWRITE: supports Fabric text/i-text/textbox, sync state on selection change,
//          safer updates, no DOM getElementById hacks, better typing.
// ============================================================================

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Type, AlignLeft, AlignCenter, AlignRight, Italic } from "lucide-react";

interface FontStylePanelProps {
  selectedText: any; // Fabric text-ish object (text / i-text / textbox)
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
  "Abril Fatface",
] as const;

const FONT_WEIGHTS = [
  { label: "Thin", value: "100" },
  { label: "Light", value: "300" },
  { label: "Regular", value: "normal" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "bold" },
  { label: "Black", value: "900" },
] as const;

type TextAlign = "left" | "center" | "right" | "justify";

type FabricTextLike = {
  type?: string;
  set: (prop: string, value: any) => void;

  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string | number;
  textAlign?: TextAlign;
  lineHeight?: number;
  charSpacing?: number;
  underline?: boolean;
  linethrough?: boolean;
  fontStyle?: "normal" | "italic" | "oblique" | string;
};

const isTextLike = (obj: any): obj is FabricTextLike => {
  const t = obj?.type;
  // Fabric typically uses: "text", "i-text", "textbox"
  return !!obj && typeof obj?.set === "function" && (t === "text" || t === "i-text" || t === "textbox");
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export default function FontStylePanel({ selectedText, onUpdate }: FontStylePanelProps) {
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const textObj = useMemo(() => (isTextLike(selectedText) ? (selectedText as FabricTextLike) : null), [selectedText]);

  // Empty state
  if (!textObj) {
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

  // Local UI state (kept in sync with selection)
  const [fontFamily, setFontFamily] = useState<string>(textObj.fontFamily || "Arial");
  const [fontSize, setFontSize] = useState<number>(typeof textObj.fontSize === "number" ? textObj.fontSize : 40);
  const [fontColor, setFontColor] = useState<string>(typeof textObj.fill === "string" ? textObj.fill : "#000000");
  const [fontWeight, setFontWeight] = useState<string>(String(textObj.fontWeight ?? "normal"));
  const [textAlign, setTextAlign] = useState<TextAlign>((textObj.textAlign as TextAlign) || "left");
  const [lineHeight, setLineHeight] = useState<number>(typeof textObj.lineHeight === "number" ? textObj.lineHeight : 1.2);
  const [charSpacing, setCharSpacing] = useState<number>(typeof textObj.charSpacing === "number" ? textObj.charSpacing : 0);
  const [underline, setUnderline] = useState<boolean>(!!textObj.underline);
  const [linethrough, setLinethrough] = useState<boolean>(!!textObj.linethrough);
  const [italic, setItalic] = useState<boolean>(textObj.fontStyle === "italic");

  // IMPORTANT: resync panel controls when the user selects a different text object
  useEffect(() => {
    setFontFamily(textObj.fontFamily || "Arial");
    setFontSize(typeof textObj.fontSize === "number" ? textObj.fontSize : 40);
    setFontColor(typeof textObj.fill === "string" ? textObj.fill : "#000000");
    setFontWeight(String(textObj.fontWeight ?? "normal"));
    setTextAlign((textObj.textAlign as TextAlign) || "left");
    setLineHeight(typeof textObj.lineHeight === "number" ? textObj.lineHeight : 1.2);
    setCharSpacing(typeof textObj.charSpacing === "number" ? textObj.charSpacing : 0);
    setUnderline(!!textObj.underline);
    setLinethrough(!!textObj.linethrough);
    setItalic(textObj.fontStyle === "italic");
  }, [textObj]);

  const applyStyle = (property: string, value: any) => {
    textObj.set(property, value);
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

        .select-input,
        .color-input,
        .slider-input {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .select-input:hover,
        .select-input:focus {
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
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider-value {
          min-width: 55px;
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
          user-select: none;
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
            const v = e.target.value;
            setFontFamily(v);
            applyStyle("fontFamily", v);
          }}
        >
          {FONT_FAMILIES.map((font) => (
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
            min={8}
            max={200}
            value={fontSize}
            onChange={(e) => {
              const size = clamp(Number(e.target.value), 8, 200);
              setFontSize(size);
              applyStyle("fontSize", size);
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
            onClick={() => colorInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") colorInputRef.current?.click();
            }}
            aria-label="Pick text color"
          />
          <input
            ref={colorInputRef}
            type="color"
            value={fontColor}
            onChange={(e) => {
              const v = e.target.value;
              setFontColor(v);
              applyStyle("fill", v);
            }}
            style={{ display: "none" }}
          />
          <input
            type="text"
            className="select-input"
            value={fontColor}
            onChange={(e) => {
              const v = e.target.value;
              setFontColor(v);
              applyStyle("fill", v);
            }}
            style={{ flex: 1 }}
            placeholder="#000000"
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
            const v = e.target.value;
            setFontWeight(v);
            applyStyle("fontWeight", v);
          }}
        >
          {FONT_WEIGHTS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      {/* Text Alignment */}
      <div className="control-group">
        <label className="control-label">Text Alignment</label>
        <div className="button-group">
          <button
            type="button"
            className={`icon-button ${textAlign === "left" ? "active" : ""}`}
            onClick={() => {
              setTextAlign("left");
              applyStyle("textAlign", "left");
            }}
          >
            <AlignLeft size={18} />
          </button>
          <button
            type="button"
            className={`icon-button ${textAlign === "center" ? "active" : ""}`}
            onClick={() => {
              setTextAlign("center");
              applyStyle("textAlign", "center");
            }}
          >
            <AlignCenter size={18} />
          </button>
          <button
            type="button"
            className={`icon-button ${textAlign === "right" ? "active" : ""}`}
            onClick={() => {
              setTextAlign("right");
              applyStyle("textAlign", "right");
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
            min={0.5}
            max={3}
            step={0.1}
            value={lineHeight}
            onChange={(e) => {
              const v = clamp(Number(e.target.value), 0.5, 3);
              setLineHeight(v);
              applyStyle("lineHeight", v);
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
            min={-200}
            max={800}
            step={10}
            value={charSpacing}
            onChange={(e) => {
              const v = clamp(Number(e.target.value), -200, 800);
              setCharSpacing(v);
              applyStyle("charSpacing", v);
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
            type="button"
            className={`icon-button ${italic ? "active" : ""}`}
            onClick={() => {
              const next = !italic;
              setItalic(next);
              applyStyle("fontStyle", next ? "italic" : "normal");
            }}
            aria-label="Toggle italic"
          >
            <Italic size={18} />
          </button>

          <button
            type="button"
            className={`icon-button ${underline ? "active" : ""}`}
            onClick={() => {
              const next = !underline;
              setUnderline(next);
              applyStyle("underline", next);
            }}
            aria-label="Toggle underline"
            title="Underline"
          >
            U
          </button>

          <button
            type="button"
            className={`icon-button ${linethrough ? "active" : ""}`}
            onClick={() => {
              const next = !linethrough;
              setLinethrough(next);
              applyStyle("linethrough", next);
            }}
            aria-label="Toggle strikethrough"
            title="Strikethrough"
          >
            S
          </button>
        </div>
      </div>
    </div>
  );
}
