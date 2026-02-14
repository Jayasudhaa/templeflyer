// app/editor/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// Components
import LeftPanel, { Section, Divider } from "@/components/editor/LeftPanel";
import FontStylePanel from "@/components/editor/FontStylePanel";
import ProjectModal from "@/components/editor/ProjectModal";
import CalendarPanel from "@/components/editor/CalendarPanel";
import SocialSharingEnhanced from "@/components/SocialSharingEnhanced";
import LanguageSelector from "@/components/LanguageSelector";
import type { Language } from "@/lib/types";

// Icons
import {
  Type,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Save,
  FolderOpen,
  Upload,
  Sliders,
  Share2,
  Layout,
} from "lucide-react";

const LOCAL_STATE_KEY = "flyergen:lastState:v1";

const AI_SYSTEM_PROMPT = `You are a professional Indian background designer specializing in soft, aesthetic, minimal, and devotional backdrops.  
Your goal is to generate high-resolution, visually pleasing, culturally appropriate Indian Hindu festival backgrounds.

DESIGN PRINCIPLES:
- Always use soft, aesthetic, pastel color palettes (no harsh or neon colors).
- Use gentle gradients, diffused lighting, and subtle golden highlights.
- Keep the composition clean, minimal, and uncluttered with clear negative space for text.
- Avoid crowded visuals and busy patterns.
- Prefer subtle traditional motifs (mandala, kolam, lotus, temple outline, diya glow).
- Ensure a calm, devotional, and elegant mood (not loud or commercial).
- Maintain high visual quality suitable for posters, flyers, and social media.
- Style should be modern + traditional fusion, slightly painterly but photorealistic.
- Aspect ratio: 1080x1080 (square) unless specified otherwise.
- Avoid over-stylization, clipart look, or cartoonish elements.`;

const SAMPLE_PROMPTS = [
  "Create a soft aesthetic Hindu festival background for Diwali. Primary color tone: warm golden amber. Include subtle diyas, soft rangoli patterns, and lotus motifs. Clean minimal layout with space for text in center. Soft gradient background, gentle lighting, and golden accents. No clutter near edges.",
  "Create a soft aesthetic Hindu festival background for Shivaratri. Primary color tone: cool blue and silver. Include subtle Shiva linga silhouette, crescent moon, sacred ash patterns. Clean minimal layout with space for text in center. Soft gradient background, gentle lighting, and silver accents. No clutter near edges.",
  "Create a soft aesthetic Hindu festival background for Navratri. Primary color tone: vibrant yet soft pink and gold. Include subtle dandiya sticks, traditional lamps, goddess motifs. Clean minimal layout with space for text in center. Soft gradient background, gentle lighting, and golden accents. No clutter near edges.",
];

const WIDTH = 1080;
const HEIGHT = 1080;
const STANDARD_TEMPLATE = "/templates/svt-1080.png";

export default function EditorPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fabric + Canvas refs
  const canvasRef = useRef<any>(null);
  const fabricRef = useRef<any>(null);

  // UI state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedText, setSelectedText] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [backgroundSelected, setBackgroundSelected] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [language, setLanguage] = useState<Language>("en" as Language);

  // Event fields
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTimings, setEventTimings] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSponsorship, setEventSponsorship] = useState("");

  // AI
  const [aiPrompt, setAiPrompt] = useState(SAMPLE_PROMPTS[0]);
  const [showSamplePrompts, setShowSamplePrompts] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);

  // Image controls
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);

  // Template
  const [useTemplate, setUseTemplate] = useState(false);
  const [customTemplate, setCustomTemplate] = useState<string | null>(null);

  // Social sharing
  const [exportedPNGUrl, setExportedPNGUrl] = useState("");
  const [showSocialShare, setShowSocialShare] = useState(false);

  const personalImageInputRef = useRef<HTMLInputElement | null>(null);
  const templateInputRef = useRef<HTMLInputElement | null>(null);

  const getAuthToken = async (): Promise<string | null> => {
    const { data: sess } = await supabase.auth.getSession();
    return sess.session?.access_token || null;
  };

  const decodeHtmlEntities = (s: string) => {
    if (!s) return s;
    if (typeof window === "undefined") return s;
    const el = document.createElement("textarea");
    el.innerHTML = s;
    return el.value;
  };

  const persistLocalState = (canvasJsonOverride?: any) => {
    try {
      const canvas = canvasRef.current;
      const canvas_json = canvasJsonOverride ?? canvas?.toJSON();
      const payload = {
        v: 1,
        savedAt: new Date().toISOString(),
        projectName,
        currentProjectId: currentProject?.id ?? null,
        canvas_json,
        fields: { eventName, eventDate, eventTimings, eventDescription, eventSponsorship },
        language,
      };
      localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("persistLocalState failed:", e);
    }
  };

  const restoreLocalState = (canvas: any) => {
    try {
      const raw = localStorage.getItem(LOCAL_STATE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (!state?.canvas_json) return false;

      if (state.projectName) setProjectName(state.projectName);
      if (state.language) setLanguage(state.language);

      const f = state.fields || {};
      setEventName(f.eventName || "");
      setEventDate(f.eventDate || "");
      setEventTimings(f.eventTimings || "");
      setEventDescription(f.eventDescription || "");
      setEventSponsorship(f.eventSponsorship || "");

      canvas.loadFromJSON(state.canvas_json, () => canvas.renderAll());

      if (state.currentProjectId) {
        setCurrentProject((prev: any) => prev ?? { id: state.currentProjectId, project_name: state.projectName || "Untitled Project" });
      }

      setIsDirty(false);
      return true;
    } catch (e) {
      console.warn("restoreLocalState failed:", e);
      return false;
    }
  };

  const translateSelectedText = async () => {
    const canvas = canvasRef.current;
    const obj = selectedText;
    if (!canvas || !obj) return;

    const original = String(obj.text || "").trim();
    if (!original) return;

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: original, targetLang: language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Translation failed");
      const translated = decodeHtmlEntities(data?.translatedText || "");
      if (!translated) throw new Error("No translated text returned");

      obj.set({ text: translated });
      obj.set({
        fontFamily:
          "Noto Sans, Noto Sans Devanagari, Noto Sans Tamil, Noto Sans Telugu, Noto Sans Kannada, Arial, sans-serif",
      });

      canvas.setActiveObject(obj);
      canvas.renderAll();
      setIsDirty(true);
      persistLocalState(canvas.toJSON());
    } catch (e: any) {
      alert(`❌ Translate Error: ${e.message}`);
    }
  };

  // ---------------- AUTH CHECK ----------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) setShowProjectModal(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ---------------- TEMPLATE HELPERS ----------------
  const loadTemplate = async (url: string) => {
    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) return;

    return new Promise((resolve) => {
      fabricMod.Image.fromURL(
        url,
        (img: any) => {
          img.scaleToWidth(WIDTH);
          img.scaleToHeight(HEIGHT);
          canvas.setBackgroundImage(img, () => {
            canvas.renderAll();
            resolve(true);
          });
        },
        { crossOrigin: "anonymous" }
      );
    });
  };

  const setBackgroundFromUrl = async (url: string) => {
    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) return;

    return new Promise((resolve) => {
      fabricMod.Image.fromURL(
        url,
        (img: any) => {
          const scaleX = WIDTH / img.width;
          const scaleY = HEIGHT / img.height;
          const scale = Math.max(scaleX, scaleY);

          img.scale(scale);
          img.set({
            left: (WIDTH - img.width * scale) / 2,
            top: (HEIGHT - img.height * scale) / 2,
          });

          canvas.setBackgroundImage(img, () => {
            canvas.renderAll();
            resolve(true);
          });
        },
        { crossOrigin: "anonymous" }
      );
    });
  };

  // ---------------- CANVAS INIT (ONLY ONCE) ----------------
  useEffect(() => {
    if (!session) return;
    if (canvasRef.current) return; // ✅ prevent re-init

    let disposed = false;
    let saveTimer: any = null;

    const onBeforeUnload = () => {
      try {
        const c = canvasRef.current;
        if (c) persistLocalState(c.toJSON());
      } catch {}
    };

    (async () => {
      try {
        const fabricMod = await import("fabric");
        if (disposed) return;

        fabricRef.current = fabricMod;

        const canvas = new (fabricMod as any).Canvas("canvas", {
          width: WIDTH,
          height: HEIGHT,
          backgroundColor: "#ffffff",
        });

        canvasRef.current = canvas;

        // Restore last unsaved state
        restoreLocalState(canvas);

        // Selections (support i-text/textbox too)
        const handleSelection = (obj: any) => {
          if (!obj) return;
          const isTextLike = typeof obj.text === "string";
          const isImageLike = obj.type === "image" || obj._element != null;

          if (isTextLike) {
            setSelectedText(obj);
            setSelectedImage(null);
            setBackgroundSelected(false);
          } else if (isImageLike) {
            setSelectedImage(obj);
            setSelectedText(null);
            setBackgroundSelected(false);
          }
        };

        canvas.on("selection:created", (e: any) => handleSelection(e?.selected?.[0]));
        canvas.on("selection:updated", (e: any) => handleSelection(e?.selected?.[0]));
        canvas.on("selection:cleared", () => {
          setSelectedText(null);
          setSelectedImage(null);
          setBackgroundSelected(false);
        });

        // Local autosave
        const scheduleLocalSave = () => {
          setIsDirty(true);
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = setTimeout(() => {
            try {
              persistLocalState(canvas.toJSON());
            } catch {}
          }, 400);
        };

        canvas.on("object:modified", scheduleLocalSave);
        canvas.on("object:added", scheduleLocalSave);
        canvas.on("object:removed", scheduleLocalSave);

        // Some Fabric builds don’t emit "text:changed" reliably; object:modified covers most edits.
        try {
          canvas.on("text:changed", scheduleLocalSave);
        } catch {}

        window.addEventListener("beforeunload", onBeforeUnload);
      } catch (err) {
        console.error("Failed to initialize canvas:", err);
      }
    })();

    return () => {
      disposed = true;
      if (saveTimer) clearTimeout(saveTimer);
      window.removeEventListener("beforeunload", onBeforeUnload);
      try {
        canvasRef.current?.dispose();
      } catch {}
      canvasRef.current = null;
    };
  }, [session]);

  // ---------------- APPLY TEMPLATE WITHOUT RE-INIT ----------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    (async () => {
      // Custom template wins
      if (customTemplate) {
        await loadTemplate(customTemplate);
        return;
      }

      // Standard template only if enabled
      if (useTemplate) {
        await loadTemplate(STANDARD_TEMPLATE);
        return;
      }

      // If template disabled, clear background image (keep white)
      canvas.setBackgroundImage(null, () => canvas.renderAll());
    })();
  }, [useTemplate, customTemplate]);

  // ---------------- TEMPLATE UPLOAD ----------------
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      setCustomTemplate(imageUrl);
      await loadTemplate(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  // ---------------- AI BACKGROUND ----------------
  const generateAIBackground = async () => {
    if (!canvasRef.current || !fabricRef.current) {
      alert("Canvas not ready!");
      return;
    }
    if (!aiPrompt.trim()) {
      alert("Please enter a prompt!");
      return;
    }

    setError("");
    setGeneratingAI(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not logged in. Please sign in to generate images.");

      const response = await fetch("/api/generate-hero", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          festival: eventName || "Custom Event",
          userPrompt: aiPrompt,
          systemPrompt: AI_SYSTEM_PROMPT,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI generation failed");

      const imageUrl = `data:image/png;base64,${result.b64}`;
      setAiRemaining(result.remaining ?? null);
      await setBackgroundFromUrl(imageUrl);

      alert(`✅ AI Background Generated!\n\nDaily limit: ${result.remaining ?? "N/A"}/10 remaining`);
    } catch (err: any) {
      console.error("❌ AI Error:", err);
      setError(err.message);
      alert(`❌ AI Generation Error:\n\n${err.message}`);
    } finally {
      setGeneratingAI(false);
    }
  };

  // ---------------- IMAGE UPLOAD ----------------
  const handlePersonalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) {
      alert("Canvas not ready!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      fabricMod.Image.fromURL(
        imageUrl,
        (img: any) => {
          img.scaleToWidth(300);
          img.set({ left: 100, top: 100 });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.readAsDataURL(file);
  };

  const selectBackgroundForEditing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bgImage = canvas.backgroundImage;
    if (bgImage) {
      setSelectedImage(bgImage);
      setBackgroundSelected(true);
      alert("Background selected! Use sliders below to adjust.");
    } else {
      alert("No background image found!");
    }
  };

  // Fabric filter ctor resolver (v5/v6 safe-ish)
  const getFilterCtor = (name: "Brightness" | "Contrast" | "Saturation") => {
    const f = fabricRef.current;
    return f?.Image?.filters?.[name] ?? f?.filters?.[name] ?? null;
  };

  const applyImageFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = backgroundSelected ? canvas.backgroundImage : selectedImage;
    if (!target) {
      alert("No image selected!");
      return;
    }

    const filters: any[] = [];

    const BrightnessCtor = getFilterCtor("Brightness");
    const ContrastCtor = getFilterCtor("Contrast");
    const SaturationCtor = getFilterCtor("Saturation");

    if (brightness !== 0 && BrightnessCtor) filters.push(new BrightnessCtor({ brightness: brightness / 100 }));
    if (contrast !== 0 && ContrastCtor) filters.push(new ContrastCtor({ contrast: contrast / 100 }));
    if (saturation !== 0 && SaturationCtor) filters.push(new SaturationCtor({ saturation: saturation / 100 }));

    try {
      target.filters = filters;
      target.applyFilters?.();
      canvas.renderAll();
    } catch (e) {
      console.warn("applyImageFilters failed:", e);
      alert("Image filters failed (Fabric filters not available in this build).");
    }
  };

  const resetImageFilters = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = backgroundSelected ? canvas.backgroundImage : selectedImage;
    if (!target) return;

    try {
      target.filters = [];
      target.applyFilters?.();
      canvas.renderAll();
    } catch {}
  };

  // ---------------- ADD EVENT FIELDS ----------------
  const addEventFieldsToCanvas = () => {
    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) {
      alert("Canvas not ready!");
      return;
    }

    // Remove text-like objects (text/i-text/textbox)
    canvas.getObjects().forEach((obj: any) => {
      if (typeof obj.text === "string") canvas.remove(obj);
    });

    let yPos = 150;
    const xPos = WIDTH / 2;

    const addText = (txt: string, opts: any) => {
      const t = new fabricMod.Text(txt, { left: xPos, originX: "center", textAlign: "center", ...opts });
      canvas.add(t);
      return t;
    };

    if (eventName) {
      addText(eventName, {
        top: yPos,
        fontSize: 60,
        fill: "#d4af37",
        fontFamily: "Arial",
        fontWeight: "bold",
        shadow: "3px 3px 6px rgba(0,0,0,0.7)",
      });
      yPos += 100;
    }

    if (eventDate) {
      addText(eventDate, {
        top: yPos,
        fontSize: 40,
        fill: "#ffffff",
        fontFamily: "Arial",
        fontWeight: "600",
        shadow: "2px 2px 4px rgba(0,0,0,0.6)",
      });
      yPos += 70;
    }

    if (eventTimings) {
      addText(eventTimings, {
        top: yPos,
        fontSize: 32,
        fill: "#ffffff",
        fontFamily: "Arial",
        fontWeight: "500",
        shadow: "2px 2px 4px rgba(0,0,0,0.6)",
      });
      yPos += 60;
    }

    if (eventDescription) {
      addText(eventDescription, {
        top: yPos,
        fontSize: 28,
        fill: "#ffffff",
        fontFamily: "Arial",
        shadow: "2px 2px 4px rgba(0,0,0,0.6)",
      });
      yPos += 50;
    }

    if (eventSponsorship) {
      addText(eventSponsorship, {
        top: HEIGHT - 100,
        fontSize: 24,
        fill: "#d4af37",
        fontFamily: "Arial",
        fontWeight: "500",
        shadow: "2px 2px 4px rgba(0,0,0,0.6)",
      });
    }

    canvas.renderAll();
  };

  // ---------------- PROJECT MANAGEMENT ----------------
  const handleNewProject = () => {
    setProjectName("Untitled Project");
    setCurrentProject(null);
    setEventName("");
    setEventDate("");
    setEventTimings("");
    setEventDescription("");
    setEventSponsorship("");

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.discardActiveObject?.();
      canvas.getObjects().forEach((o: any) => canvas.remove(o));
      canvas.setBackgroundImage(null, () => {
        canvas.backgroundColor = "#ffffff";
        canvas.renderAll();
      });
    }

    setIsDirty(false);
    try { localStorage.removeItem(LOCAL_STATE_KEY); } catch {}
    setShowProjectModal(false);
  };

  const handleCloseProject = () => {
    const canvas = canvasRef.current;
    try {
      if (canvas) persistLocalState(canvas.toJSON());
    } catch {}

    setCurrentProject(null);
    setProjectName("Untitled Project");
    setEventName("");
    setEventDate("");
    setEventTimings("");
    setEventDescription("");
    setEventSponsorship("");

    if (canvas) {
      canvas.discardActiveObject?.();
      canvas.getObjects().forEach((o: any) => canvas.remove(o));
      canvas.setBackgroundImage(null, () => {
        canvas.backgroundColor = "#ffffff";
        canvas.renderAll();
      });
    }

    setIsDirty(false);
    try { localStorage.removeItem(LOCAL_STATE_KEY); } catch {}

    setShowProjectModal(true);
  };

  const handleOpenProject = async (project: any) => {
    setCurrentProject(project);
    setProjectName(project.project_name);

    const canvas = canvasRef.current;
    if (canvas && project.canvas_json) {
      canvas.loadFromJSON(project.canvas_json, () => canvas.renderAll());
    }

    setIsDirty(false);
    try { localStorage.removeItem(LOCAL_STATE_KEY); } catch {}
    setShowProjectModal(false);
  };

  const handleSaveProject = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready!");
      return;
    }

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        alert("Please sign in to save projects!");
        return;
      }

      const canvasJSON = canvas.toJSON();
      const thumbnail = canvas.toDataURL({ format: "png", quality: 0.3 });

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          project_name: projectName,
          canvas_json: canvasJSON,
          thumbnail_url: thumbnail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Project saved successfully!");
        setCurrentProject(result.project);
        setIsDirty(false);
        try { persistLocalState(canvasJSON); } catch {}
      } else {
        throw new Error(result.error || "Failed to save project");
      }
    } catch (error: any) {
      alert(`❌ Save Error: ${error.message}`);
    }
  };

  // ---------------- CALENDAR ----------------
  const handleEventSelect = (event: any) => {
    setEventName(event.title || "");
    setEventDate(new Date(event.start).toLocaleDateString() || "");
    setEventDescription(event.description || "");
    alert(`✅ Event "${event.title}" loaded from calendar!`);
  };

  // ---------------- FONT UPDATE ----------------
  const handleFontUpdate = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.renderAll();
  };

  const addCustomText = () => {
    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) {
      alert("Canvas not ready!");
      return;
    }

    const text = new fabricMod.Text("Your Text Here", {
      left: WIDTH / 2 - 100,
      top: HEIGHT / 2 - 20,
      fontSize: 40,
      fill: "#ffffff",
      fontFamily: "Arial",
      fontWeight: "bold",
      textAlign: "center",
      shadow: "2px 2px 4px rgba(0,0,0,0.5)",
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // ---------------- EXPORT + RSVP ----------------
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready!");
      return;
    }

    const dataURL = canvas.toDataURL({ format: "png", quality: 1, multiplier: 1 });
    setExportedPNGUrl(dataURL);

    const link = document.createElement("a");
    link.download = `${projectName || "flyer"}.png`;
    link.href = dataURL;
    link.click();

    setShowSocialShare(true);
  };

  const generateRSVPUrl = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready!");
      return;
    }

    try {
      const eventId = `event-${Date.now()}`;
      const params = new URLSearchParams({
        event: eventName || projectName || "Event",
        id: eventId,
        date: eventDate || new Date().toLocaleDateString(),
        time: eventTimings || "",
        desc: eventDescription || "",
      });

      const rsvpUrl = `${window.location.origin}/rsvp?${params.toString()}`;
      await navigator.clipboard.writeText(rsvpUrl);

      alert(`✅ RSVP URL copied to clipboard!\n\n${rsvpUrl}\n\nShare this link for event analytics!`);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // ---------------- AUTH HANDLERS ----------------
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/editor` },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // ---------------- RENDER ----------------
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <h2>Loading AI MITRA Editor...</h2>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div style={{ background: "white", padding: 60, borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center", maxWidth: 400 }}>
          <h1 style={{ fontSize: "2em", marginBottom: 16, color: "#333" }}>AI MITRA Editor</h1>
          <p style={{ marginBottom: 32, color: "#666" }}>Sign in to start creating beautiful flyers</p>
          <button
            onClick={handleSignIn}
            style={{ width: "100%", padding: "16px 32px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            🔐 Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <LeftPanel>
        {/* Project Name & Actions */}
        <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project Name"
            style={{ width: "100%", padding: 12, border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 16, fontWeight: 600, marginBottom: 12 }}
          />

          <div style={{ marginBottom: 12 }}>
            <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
            <button
              onClick={translateSelectedText}
              disabled={!selectedText}
              style={{
                width: "100%",
                padding: 10,
                background: selectedText ? "#111827" : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: selectedText ? "pointer" : "not-allowed",
                fontWeight: 700,
                fontSize: 13,
                marginTop: 8,
              }}
              title="Translate currently selected text box into the chosen language"
            >
              🌐 Translate Selected Text
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <button onClick={handleNewProject} style={{ padding: 10, background: "#f3f4f6", border: "2px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              ➕ New
            </button>
            <button onClick={() => setShowProjectModal(true)} style={{ padding: 10, background: "#f3f4f6", border: "2px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <FolderOpen size={14} style={{ display: "inline", marginRight: 6 }} />
              Open
            </button>
            <button onClick={handleSaveProject} style={{ padding: 10, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <Save size={14} style={{ display: "inline", marginRight: 6 }} />
              Save
            </button>
            <button onClick={handleCloseProject} style={{ padding: 10, background: "#111827", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              ✖ Close
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <button onClick={addCustomText} style={{ padding: 10, background: "#10b981", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              ➕ Add Text
            </button>
            <button onClick={exportPNG} style={{ padding: 10, background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              💾 Export PNG
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button onClick={addEventFieldsToCanvas} style={{ padding: 10, background: "#8b5cf6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              📋 Add Fields
            </button>
            <button onClick={generateRSVPUrl} style={{ padding: 10, background: "#ec4899", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              🔗 RSVP URL
            </button>
          </div>
        </div>

        {/* Event Details */}
        <Section title="Event Details" icon={<Layout />} accent="purple" defaultOpen={true}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>Event Name *</label>
              <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., Magha Shivaratri" style={{ width: "100%", padding: 10, border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14 }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>Date *</label>
              <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="e.g., Feb 15, 2026" style={{ width: "100%", padding: 10, border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14 }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>Timings</label>
              <input value={eventTimings} onChange={(e) => setEventTimings(e.target.value)} placeholder="e.g., 2 PM, 4 PM, 6 PM" style={{ width: "100%", padding: 10, border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14 }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>Description</label>
              <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="e.g., Night-long Abhishekam & Archana" style={{ width: "100%", padding: 10, border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14, minHeight: 60, fontFamily: "inherit" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>Sponsorship</label>
              <input value={eventSponsorship} onChange={(e) => setEventSponsorship(e.target.value)} placeholder="e.g., Abhishekam $51 • Kalyanam $116" style={{ width: "100%", padding: 10, border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14 }} />
            </div>

            <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>💡 Tip: Fill in fields, then click "📋 Add Fields" to add them to the canvas</p>
          </div>
        </Section>

        <Divider />

        {/* Template */}
        <Section title="Template" icon={<Layout />} accent="green" defaultOpen={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={useTemplate} onChange={(e) => setUseTemplate(e.target.checked)} />
              Use Standard Template
            </label>

            <input ref={templateInputRef} type="file" accept="image/*" onChange={handleTemplateUpload} style={{ display: "none" }} />

            <button onClick={() => templateInputRef.current?.click()} style={{ width: "100%", padding: 10, background: "#10b981", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <Upload size={14} style={{ display: "inline", marginRight: 6 }} />
              Upload Custom Template
            </button>

            {customTemplate && <p style={{ fontSize: 11, color: "#10b981", margin: 0 }}>✅ Custom template loaded</p>}
          </div>
        </Section>

        <Divider />

        {/* AI Background Generator */}
        <Section title="AI Background Generator" icon={<Sparkles />} accent="purple" defaultOpen={true}>
          <div style={{ marginBottom: 14, position: "relative" }}>
            <button
              onClick={() => setShowSamplePrompts(!showSamplePrompts)}
              style={{ width: "100%", padding: 12, background: "rgba(139, 92, 246, 0.1)", border: "2px solid rgba(139, 92, 246, 0.3)", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#8b5cf6" }}
            >
              💡 Sample Prompts {showSamplePrompts ? "▲" : "▼"}
            </button>

            {showSamplePrompts && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 8, background: "white", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", padding: 12, zIndex: 10, maxHeight: 300, overflowY: "auto" }}>
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAiPrompt(prompt);
                      setShowSamplePrompts(false);
                    }}
                    style={{ width: "100%", padding: 12, marginBottom: 8, background: "#f5f5f5", border: "2px solid #e0e0e0", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 13, lineHeight: 1.5 }}
                  >
                    {prompt.substring(0, 80)}...
                  </button>
                ))}
              </div>
            )}
          </div>

          <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe your background..." style={{ width: "100%", minHeight: 100, padding: 12, border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontFamily: "inherit", marginBottom: 14 }} />

          <button
            onClick={generateAIBackground}
            disabled={generatingAI || !aiPrompt.trim()}
            style={{ width: "100%", padding: 14, background: generatingAI ? "#9ca3af" : "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: generatingAI ? "not-allowed" : "pointer", fontSize: 15, marginBottom: aiRemaining !== null ? 10 : 0 }}
          >
            {generatingAI ? "🎨 Generating..." : "✨ Generate AI Background"}
          </button>

          {aiRemaining !== null && (
            <div style={{ padding: 8, background: "#eff6ff", borderRadius: 6, fontSize: 12, textAlign: "center", color: "#3b82f6", fontWeight: 600 }}>
              Daily Limit: {aiRemaining}/10 remaining
            </div>
          )}

          {error && (
            <div style={{ marginTop: 10, padding: 10, background: "#fee2e2", border: "1px solid #f87171", borderRadius: 6, color: "#dc2626", fontSize: 12 }}>
              ⚠️ {error}
            </div>
          )}
        </Section>

        <Divider />

        {/* Image Controls */}
        <Section title="Image Controls" icon={<ImageIcon />} accent="blue" defaultOpen={false}>
          <input ref={personalImageInputRef} type="file" accept="image/*" onChange={handlePersonalImageUpload} style={{ display: "none" }} />

          <button onClick={() => personalImageInputRef.current?.click()} style={{ width: "100%", padding: 12, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
            <Upload size={16} style={{ display: "inline", marginRight: 6 }} />
            Upload Personal Image
          </button>

          <button onClick={selectBackgroundForEditing} style={{ width: "100%", padding: 12, background: "#1e40af", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, marginBottom: 16, fontSize: 14 }}>
            <Sliders size={16} style={{ display: "inline", marginRight: 6 }} />
            Select Background
          </button>

          {(selectedImage || backgroundSelected) && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>🌞 Brightness: {brightness}</label>
                <input type="range" min="-100" max="100" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} style={{ width: "100%" }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>⚡ Contrast: {contrast}</label>
                <input type="range" min="-100" max="100" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} style={{ width: "100%" }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>🎨 Saturation: {saturation}</label>
                <input type="range" min="-100" max="100" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} style={{ width: "100%" }} />
              </div>

              <button onClick={applyImageFilters} style={{ width: "100%", padding: 10, background: "#10b981", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
                ✓ Apply Filters
              </button>
              <button onClick={resetImageFilters} style={{ width: "100%", padding: 10, background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                ↺ Reset Filters
              </button>
            </>
          )}
        </Section>

        <Divider />

        {/* Font Styling */}
        <Section title="Font Styling" icon={<Type />} accent="blue" defaultOpen={false}>
          <FontStylePanel selectedText={selectedText} onUpdate={handleFontUpdate} />
        </Section>

        <Divider />

        {/* Google Calendar */}
        <Section title="Google Calendar" icon={<Calendar />} accent="purple" defaultOpen={false}>
          <CalendarPanel onEventSelect={handleEventSelect} />
        </Section>

        <Divider />

        {/* Social Sharing */}
        {showSocialShare && exportedPNGUrl && (
          <>
            <Section title="Share on Social Media" icon={<Share2 />} accent="green" defaultOpen={true}>
              <SocialSharingEnhanced flyerUrl={exportedPNGUrl} eventName={eventName || projectName} language="en" />
            </Section>
            <Divider />
          </>
        )}

        <div style={{ padding: 20 }}>
          <button onClick={handleSignOut} style={{ width: "100%", padding: 12, background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
            🚪 Sign Out
          </button>
        </div>
      </LeftPanel>

      {/* Canvas area */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", padding: 20 }}>
        <canvas id="canvas" style={{ border: "2px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backgroundColor: "#ffffff" }} />
      </div>

      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        getAuthToken={getAuthToken}
      />
    </div>
  );
}
