"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Canvas, IText, Object as FabricObject, Text, Textbox } from "fabric";

import LeftPanel, * as LeftPanelExports from "./editor/LeftPanel";
import FontStylePanel from "./editor/FontStylePanel";
import SocialSharing from "./SocialSharingEnhanced";
import LanguageSelector from "./LanguageSelector";

import TemplatePanel from "./editor/panels/TemplatePanel";
import FieldsPanel from "./editor/panels/FieldsPanel";
import { removeActiveObject } from "./editor/panels/canvasHelpers";

import { generateRSVPUrl } from "@/lib/utils";
import type { Language } from "@/lib/types";

type FlyerFields = {
  event_name: string;
  date: string;
  timings: string;
  sponsorship: string;
  description: string;
};

type FabricTextLike = IText | Textbox | Text;

function isFabricTextLike(obj: FabricObject | null): obj is FabricTextLike {
  const t = (obj as any)?.type;
  return !!obj && (t === "i-text" || t === "textbox" || t === "text");
}

function CollapsibleWrap(props: { title: string; openByDefault?: boolean; children: React.ReactNode }) {
  const AnySection = (LeftPanelExports as any).CollapsibleSection || (LeftPanelExports as any).Section;
  if (!AnySection) return <>{props.children}</>;

  const isLegacy = Boolean((LeftPanelExports as any).CollapsibleSection);

  return isLegacy ? (
    <AnySection title={props.title} isOpenDefault={props.openByDefault ?? true}>
      {props.children}
    </AnySection>
  ) : (
    <AnySection title={props.title} defaultOpen={props.openByDefault ?? true}>
      {props.children}
    </AnySection>
  );
}

export default function FlyerEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);

  const [selectedObj, setSelectedObj] = useState<FabricObject | null>(null);
  const selectedText = useMemo(() => (isFabricTextLike(selectedObj) ? selectedObj : null), [selectedObj]);

  const [rsvpUrl, setRsvpUrl] = useState("");
  const [language, setLanguage] = useState<Language>("en" as Language);

  const [fields, setFields] = useState<FlyerFields>({
    event_name: "Magha Shivaratri",
    date: "Feb 15, 2026",
    timings: "2 PM - 10 PM",
    sponsorship: "Sponsorship: Abhishekam $51",
    description: "Abhishekam & Archana",
  });

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      if (!canvasRef.current) return;
      if (fabricCanvasRef.current) return;

      const fabric = await import("fabric");
      if (!mounted || !canvasRef.current) return;

      const c = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 800,
        backgroundColor: "#fff",
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = c;

      const onSelectionCreated = (e: any) => setSelectedObj(e?.selected?.[0] || null);
      const onSelectionUpdated = (e: any) => setSelectedObj(e?.selected?.[0] || null);
      const onSelectionCleared = () => setSelectedObj(null);

      c.on("selection:created", onSelectionCreated);
      c.on("selection:updated", onSelectionUpdated);
      c.on("selection:cleared", onSelectionCleared);

      // Default text
      const welcomeText = new fabric.IText("Edit Me", {
        left: 100,
        top: 100,
        fontSize: 40,
        fontFamily: "Arial",
        fill: "#111827",
      });
      c.add(welcomeText);
      c.setActiveObject(welcomeText);
      c.renderAll();

      cleanup = () => {
        try {
          c.off("selection:created", onSelectionCreated);
          c.off("selection:updated", onSelectionUpdated);
          c.off("selection:cleared", onSelectionCleared);
          c.dispose();
        } finally {
          fabricCanvasRef.current = null;
        }
      };
    };

    void init();

    return () => {
      mounted = false;
      try {
        cleanup?.();
      } finally {
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  const updateFields = useCallback((patch: Partial<FlyerFields>) => {
    setFields((prev) => ({ ...prev, ...patch }));
  }, []);

  const renderCanvas = useCallback(() => {
    fabricCanvasRef.current?.renderAll();
  }, []);

  const handleExport = useCallback(() => {
    const payload = {
      eventName: fields.event_name,
      date: fields.date,
      timings: fields.timings,
      description: fields.description,
      sponsorship: fields.sponsorship,
    };
    const url = generateRSVPUrl(payload as any);
    setRsvpUrl(url);
  }, [fields]);

  const handleDeleteSelected = useCallback(() => {
    removeActiveObject(fabricCanvasRef.current);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f2f5" }}>
      <LeftPanel>
        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 20 }}>Editor Tools</h2>

          <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />

          <CollapsibleWrap title="Templates" openByDefault={true}>
            <TemplatePanel canvas={fabricCanvasRef.current} />
          </CollapsibleWrap>

          <CollapsibleWrap title="Temple Fields" openByDefault={true}>
            <FieldsPanel canvas={fabricCanvasRef.current} fields={fields} onChange={updateFields} />
          </CollapsibleWrap>

          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={handleDeleteSelected} style={dangerButtonStyle}>
              🗑️ Delete Selected
            </button>
          </div>

          {selectedText ? (
            <CollapsibleWrap title="Font Styling" openByDefault={true}>
              <FontStylePanel selectedText={selectedText} onUpdate={renderCanvas} />
            </CollapsibleWrap>
          ) : (
            <div style={{ padding: 16, color: "#666", fontSize: 13, textAlign: "center" }}>
              Click text on the flyer to edit font
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={handleExport} style={primaryButtonStyle}>
              💾 Generate RSVP Link
            </button>
          </div>

          {rsvpUrl && (
            <div style={{ marginTop: 20 }}>
              <SocialSharing flyerUrl={rsvpUrl} eventName={fields.event_name} />
            </div>
          )}
        </div>
      </LeftPanel>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <div style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.1)", background: "white" }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  background: "#4F46E5",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
};

const dangerButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold",
};
