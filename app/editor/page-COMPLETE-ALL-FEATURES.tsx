// ============================================================================
// FILE: app/editor/page.tsx - COMPLETE FLYER EDITOR
// VERSION: 1.0 - All Features Included
// ============================================================================
// FEATURES:
// ✅ Event Fields (Name, Date, Timings, Description, Sponsorship)
// ✅ Calendar Auto-Populate
// ✅ AI Background Generation
// ✅ Template System (Standard + Upload)
// ✅ Image Upload & Processing
// ✅ Text Styling & Positioning
// ✅ Export PNG
// ✅ Social Media Sharing
// ✅ RSVP URL Generation with Analytics
// ============================================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// Components
import LeftPanel, { Section, Divider } from "@/components/editor/LeftPanel";
import FontStylePanel from "@/components/editor/FontStylePanel";
import ProjectModal from "@/components/editor/ProjectModal";
import CalendarPanel from "@/components/editor/CalendarPanel";
import SocialSharingEnhanced from "@/components/SocialSharingEnhanced";

// Icons
import { 
  Type, Calendar, Image as ImageIcon, Sparkles, Save, FolderOpen,
  Upload, Sliders, Download, Share2, Link as LinkIcon, Layout
} from "lucide-react";

// ============================================================================
// CONSTANTS
// ============================================================================

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

// Standard template (SVT - Sri Venkateswara Temple)
const STANDARD_TEMPLATE = "/templates/svt-1080.png";

export default function EditorPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Canvas refs
  const canvasRef = useRef<any>(null);
  const fabricRef = useRef<any>(null);
  
  // UI state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedText, setSelectedText] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [backgroundSelected, setBackgroundSelected] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [projectName, setProjectName] = useState("Untitled Project");

  // === EVENT FIELDS (NEW!) ===
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTimings, setEventTimings] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSponsorship, setEventSponsorship] = useState("");

  // AI Background Generation States
  const [aiPrompt, setAiPrompt] = useState(SAMPLE_PROMPTS[0]);
  const [showSamplePrompts, setShowSamplePrompts] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  // Image Controls
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

  // ============================================================================
  // AUTH CHECK
  // ============================================================================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      if (session) {
        setShowProjectModal(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================================
  // FABRIC CANVAS INITIALIZATION
  // ============================================================================
  useEffect(() => {
    if (!session) return;

    let disposed = false;

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

        // Load standard template if enabled
        if (useTemplate && !customTemplate) {
          loadTemplate(STANDARD_TEMPLATE);
        }

        // Track selections
        canvas.on("selection:created", (e: any) => {
          const obj = e?.selected?.[0];
          if (obj?.type === "text") {
            setSelectedText(obj);
            setSelectedImage(null);
            setBackgroundSelected(false);
          } else if (obj?.type === "image") {
            setSelectedImage(obj);
            setSelectedText(null);
            setBackgroundSelected(false);
          }
        });

        canvas.on("selection:updated", (e: any) => {
          const obj = e?.selected?.[0];
          if (obj?.type === "text") {
            setSelectedText(obj);
            setSelectedImage(null);
            setBackgroundSelected(false);
          } else if (obj?.type === "image") {
            setSelectedImage(obj);
            setSelectedText(null);
            setBackgroundSelected(false);
          }
        });

        canvas.on("selection:cleared", () => {
          setSelectedText(null);
          setSelectedImage(null);
          setBackgroundSelected(false);
        });

      } catch (error) {
        console.error("Failed to initialize canvas:", error);
      }
    })();

    return () => {
      disposed = true;
      canvasRef.current?.dispose();
    };
  }, [session, useTemplate, customTemplate]);

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================
  const loadTemplate = async (url: string) => {
    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) return;

    return new Promise((resolve, reject) => {
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

  // ============================================================================
  // AI BACKGROUND GENERATION
  // ============================================================================
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

      if (!token) {
        throw new Error("Not logged in. Please sign in to generate images.");
      }

      console.log("🎨 Generating AI image...");

      const response = await fetch("/api/generate-hero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          festival: eventName || "Custom Event",
          userPrompt: aiPrompt,
          systemPrompt: AI_SYSTEM_PROMPT,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI generation failed");
      }

      // API returns base64 image
      const imageUrl = `data:image/png;base64,${result.b64}`;
      setAiRemaining(result.remaining ?? null);
      
      // Set as background
      await setBackgroundFromUrl(imageUrl);
      
      console.log("✅ AI image generated successfully!");
      alert(`✅ AI Background Generated!\n\nDaily limit: ${result.remaining ?? 'N/A'}/10 remaining`);
    } catch (err: any) {
      console.error("❌ AI Error:", err);
      setError(err.message);
      alert(`❌ AI Generation Error:\n\n${err.message}`);
    } finally {
      setGeneratingAI(false);
    }
  };

  const setBackgroundFromUrl = async (url: string) => {
    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) return;

    return new Promise((resolve, reject) => {
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

  // ============================================================================
  // IMAGE UPLOAD & PROCESSING
  // ============================================================================
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
          img.set({
            left: 100,
            top: 100,
          });
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

  const applyImageFilters = () => {
    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) return;

    const target = backgroundSelected ? canvas.backgroundImage : selectedImage;
    if (!target) {
      alert("No image selected!");
      return;
    }

    const filters = [];
    
    if (brightness !== 0) {
      filters.push(new fabricMod.Image.filters.Brightness({ brightness: brightness / 100 }));
    }
    if (contrast !== 0) {
      filters.push(new fabricMod.Image.filters.Contrast({ contrast: contrast / 100 }));
    }
    if (saturation !== 0) {
      filters.push(new fabricMod.Image.filters.Saturation({ saturation: saturation / 100 }));
    }

    target.filters = filters;
    target.applyFilters();
    canvas.renderAll();
  };

  const resetImageFilters = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = backgroundSelected ? canvas.backgroundImage : selectedImage;
    if (!target) return;

    target.filters = [];
    target.applyFilters();
    canvas.renderAll();
  };

  // ============================================================================
  // EVENT FIELDS - ADD TO CANVAS
  // ============================================================================
  const addEventFieldsToCanvas = () => {
    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) {
      alert("Canvas not ready!");
      return;
    }

    // Clear existing text objects
    canvas.getObjects("text").forEach((obj: any) => canvas.remove(obj));

    let yPos = 150;
    const xPos = WIDTH / 2;

    // Event Name
    if (eventName) {
      const nameText = new fabricMod.Text(eventName, {
        left: xPos,
        top: yPos,
        fontSize: 60,
        fill: "#d4af37",
        fontFamily: "Arial",
        fontWeight: "bold",
        textAlign: "center",
        originX: "center",
        shadow: "3px 3px 6px rgba(0,0,0,0.7)",
      });
      canvas.add(nameText);
      yPos += 100;
    }

    // Date
    if (eventDate) {
      const dateText = new fabricMod.Text(eventDate, {
        left: xPos,
        top: yPos,
        fontSize: 40,
        fill: "#ffffff",
        fontFamily: "Arial",
        fontWeight: "600",
        textAlign: "center",
        originX: "center",
        shadow: "2px 2px 4px rgba(0,0,0,0.6)",
      });
      canvas.add(dateText);
      yPos += 70;
    }

    // Timings
    if (eventTimings) {
      const timingsText = new fabricMod.Text(eventTimings, {
        left: xPos,
        top: yPos,
        fontSize: 32,
        fill: "#ffffff",
        fontFamily: "Arial",
        fontWeight: "500",
        textAlign: "center",
        originX: "center",
        shadow: "2px 2px 4px rgba(0,0,0,0.6)",
      });
      canvas.add(timingsText);
      yPos += 60;
    }

    // Description
    if (eventDescription) {
      const descText = new fabricMod.Text(eventDescription, {
        left: xPos,
        top: yPos,
        fontSize: 28,
        fill: "#ffffff",
        fontFamily: "Arial",
        fontWeight: "normal",
        textAlign: "center",
        originX: "center",
        shadow: "2px 2px 4px rgba(0,0,0,0.6)",
      });
      canvas.add(descText);
      yPos += 50;
    }

    // Sponsorship
    if (eventSponsorship) {
      const sponsorText = new fabricMod.Text(eventSponsorship, {
        left: xPos,
        top: HEIGHT - 100,
        fontSize: 24,
        fill: "#d4af37",
        fontFamily: "Arial",
        fontWeight: "500",
        textAlign: "center",
        originX: "center",
        shadow: "2px 2px 4px rgba(0,0,0,0.6)",
      });
      canvas.add(sponsorText);
    }

    canvas.renderAll();
  };

  // ============================================================================
  // PROJECT MANAGEMENT
  // ============================================================================
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
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
    }
    
    setShowProjectModal(false);
  };

  const handleOpenProject = async (project: any) => {
    setCurrentProject(project);
    setProjectName(project.project_name);
    
    const canvas = canvasRef.current;
    if (canvas && project.canvas_json) {
      canvas.loadFromJSON(project.canvas_json, () => {
        canvas.renderAll();
      });
    }
    
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      } else {
        throw new Error(result.error || "Failed to save project");
      }
    } catch (error: any) {
      alert(`❌ Save Error: ${error.message}`);
    }
  };

  // ============================================================================
  // CALENDAR EVENT SELECTION
  // ============================================================================
  const handleEventSelect = (event: any) => {
    // Auto-populate fields from calendar event
    setEventName(event.title || "");
    setEventDate(new Date(event.start).toLocaleDateString() || "");
    setEventDescription(event.description || "");
    
    // You can add more field mappings here
    alert(`✅ Event "${event.title}" loaded from calendar!`);
  };

  // ============================================================================
  // TEXT & FONT MANAGEMENT
  // ============================================================================
  const handleFontUpdate = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.renderAll();
    }
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

  // ============================================================================
  // EXPORT & SHARING
  // ============================================================================
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready!");
      return;
    }

    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    setExportedPNGUrl(dataURL);

    const link = document.createElement("a");
    link.download = `${projectName || "flyer"}.png`;
    link.href = dataURL;
    link.click();

    // Show social share option
    setShowSocialShare(true);
  };

  const generateRSVPUrl = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready!");
      return;
    }

    try {
      // Export canvas
      const dataURL = canvas.toDataURL({ format: "png", quality: 1 });
      
      // Create event ID
      const eventId = `event-${Date.now()}`;
      
      // Build RSVP URL with all event data
      const params = new URLSearchParams({
        event: eventName || projectName || "Event",
        id: eventId,
        date: eventDate || new Date().toLocaleDateString(),
        time: eventTimings || "",
        desc: eventDescription || "",
      });
      
      const rsvpUrl = `${window.location.origin}/rsvp?${params.toString()}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(rsvpUrl);
      alert(`✅ RSVP URL copied to clipboard!\n\n${rsvpUrl}\n\nShare this link for event analytics!`);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // ============================================================================
  // AUTH HANDLERS
  // ============================================================================
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/editor`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // ============================================================================
  // RENDER - LOADING
  // ============================================================================
  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <h2>Loading AI MITRA Editor...</h2>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - NOT SIGNED IN
  // ============================================================================
  if (!session) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{
          background: "white",
          padding: 60,
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          textAlign: "center",
          maxWidth: 400,
        }}>
          <h1 style={{ fontSize: "2em", marginBottom: 16, color: "#333" }}>
            AI MITRA Editor
          </h1>
          <p style={{ marginBottom: 32, color: "#666" }}>
            Sign in to start creating beautiful flyers
          </p>
          <button
            onClick={handleSignIn}
            style={{
              width: "100%",
              padding: "16px 32px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🔐 Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - MAIN EDITOR
  // ============================================================================
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* LEFT PANEL */}
      <LeftPanel>
        {/* Project Name & Actions */}
        <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project Name"
            style={{
              width: "100%",
              padding: 12,
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 12,
            }}
          />
          
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => setShowProjectModal(true)}
              style={{
                flex: 1,
                padding: 10,
                background: "#f3f4f6",
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <FolderOpen size={14} style={{ display: "inline", marginRight: 6 }} />
              Open
            </button>
            <button
              onClick={handleSaveProject}
              style={{
                flex: 1,
                padding: 10,
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <Save size={14} style={{ display: "inline", marginRight: 6 }} />
              Save
            </button>
          </div>

          {/* Action Buttons Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <button
              onClick={addCustomText}
              style={{
                padding: 10,
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              ➕ Add Text
            </button>
            <button
              onClick={exportPNG}
              style={{
                padding: 10,
                background: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              💾 Export PNG
            </button>
          </div>

          {/* Action Buttons Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={addEventFieldsToCanvas}
              style={{
                padding: 10,
                background: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              📋 Add Fields
            </button>
            <button
              onClick={generateRSVPUrl}
              style={{
                padding: 10,
                background: "#ec4899",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              🔗 RSVP URL
            </button>
          </div>
        </div>

        {/* ===== EVENT FIELDS SECTION ===== */}
        <Section title="Event Details" icon={<Layout />} accent="purple" defaultOpen={true}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>
                Event Name *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., Magha Shivaratri"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "2px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>
                Date *
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="e.g., Feb 15, 2026"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "2px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>
                Timings
              </label>
              <input
                type="text"
                value={eventTimings}
                onChange={(e) => setEventTimings(e.target.value)}
                placeholder="e.g., 2 PM, 4 PM, 6 PM"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "2px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>
                Description
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="e.g., Night-long Abhishekam & Archana"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "2px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  minHeight: 60,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>
                Sponsorship
              </label>
              <input
                type="text"
                value={eventSponsorship}
                onChange={(e) => setEventSponsorship(e.target.value)}
                placeholder="e.g., Abhishekam $51 • Kalyanam $116"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "2px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>

            <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
              💡 Tip: Fill in fields, then click "📋 Add Fields" to add them to the canvas
            </p>
          </div>
        </Section>

        <Divider />

        {/* ===== TEMPLATE SECTION ===== */}
        <Section title="Template" icon={<Layout />} accent="green" defaultOpen={false}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                />
                Use Standard Template
              </label>
            </div>

            <input
              ref={templateInputRef}
              type="file"
              accept="image/*"
              onChange={handleTemplateUpload}
              style={{ display: "none" }}
            />

            <button
              onClick={() => templateInputRef.current?.click()}
              style={{
                width: "100%",
                padding: 10,
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <Upload size={14} style={{ display: "inline", marginRight: 6 }} />
              Upload Custom Template
            </button>

            {customTemplate && (
              <p style={{ fontSize: 11, color: "#10b981", margin: 0 }}>
                ✅ Custom template loaded
              </p>
            )}
          </div>
        </Section>

        <Divider />

        {/* AI BACKGROUND GENERATOR */}
        <Section title="AI Background Generator" icon={<Sparkles />} accent="purple" defaultOpen={true}>
          <div style={{ marginBottom: 14, position: "relative" }}>
            <button
              onClick={() => setShowSamplePrompts(!showSamplePrompts)}
              style={{
                width: "100%",
                padding: 12,
                background: "rgba(139, 92, 246, 0.1)",
                border: "2px solid rgba(139, 92, 246, 0.3)",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                color: "#8b5cf6",
              }}
            >
              💡 Sample Prompts {showSamplePrompts ? "▲" : "▼"}
            </button>
            
            {showSamplePrompts && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 8,
                background: "white",
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                padding: 12,
                zIndex: 10,
                maxHeight: 300,
                overflowY: "auto",
              }}>
                {SAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAiPrompt(prompt);
                      setShowSamplePrompts(false);
                    }}
                    style={{
                      width: "100%",
                      padding: 12,
                      marginBottom: 8,
                      background: "#f5f5f5",
                      border: "2px solid #e0e0e0",
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {prompt.substring(0, 80)}...
                  </button>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe your background..."
            style={{
              width: "100%",
              minHeight: 100,
              padding: 12,
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "inherit",
              marginBottom: 14,
            }}
          />

          <button
            onClick={generateAIBackground}
            disabled={generatingAI || !aiPrompt.trim()}
            style={{
              width: "100%",
              padding: 14,
              background: generatingAI ? "#9ca3af" : "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: generatingAI ? "not-allowed" : "pointer",
              fontSize: 15,
              marginBottom: aiRemaining !== null ? 10 : 0,
            }}
          >
            {generatingAI ? "🎨 Generating..." : "✨ Generate AI Background"}
          </button>

          {aiRemaining !== null && (
            <div style={{
              padding: 8,
              background: "#eff6ff",
              borderRadius: 6,
              fontSize: 12,
              textAlign: "center",
              color: "#3b82f6",
              fontWeight: 600,
            }}>
              Daily Limit: {aiRemaining}/10 remaining
            </div>
          )}

          {error && (
            <div style={{
              marginTop: 10,
              padding: 10,
              background: "#fee2e2",
              border: "1px solid #f87171",
              borderRadius: 6,
              color: "#dc2626",
              fontSize: 12,
            }}>
              ⚠️ {error}
            </div>
          )}
        </Section>

        <Divider />

        {/* IMAGE CONTROLS */}
        <Section title="Image Controls" icon={<ImageIcon />} accent="blue" defaultOpen={false}>
          <input
            ref={personalImageInputRef}
            type="file"
            accept="image/*"
            onChange={handlePersonalImageUpload}
            style={{ display: "none" }}
          />

          <button
            onClick={() => personalImageInputRef.current?.click()}
            style={{
              width: "100%",
              padding: 12,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            <Upload size={16} style={{ display: "inline", marginRight: 6 }} />
            Upload Personal Image
          </button>

          <button
            onClick={selectBackgroundForEditing}
            style={{
              width: "100%",
              padding: 12,
              background: "#1e40af",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            <Sliders size={16} style={{ display: "inline", marginRight: 6 }} />
            Select Background
          </button>

          {(selectedImage || backgroundSelected) && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  🌞 Brightness: {brightness}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  ⚡ Contrast: {contrast}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  🎨 Saturation: {saturation}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={saturation}
                  onChange={(e) => setSaturation(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <button
                onClick={applyImageFilters}
                style={{
                  width: "100%",
                  padding: 10,
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  marginBottom: 8,
                  fontSize: 13,
                }}
              >
                ✓ Apply Filters
              </button>
              <button
                onClick={resetImageFilters}
                style={{
                  width: "100%",
                  padding: 10,
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                ↺ Reset Filters
              </button>
            </>
          )}
        </Section>

        <Divider />

        {/* FONT STYLING */}
        <Section title="Font Styling" icon={<Type />} accent="blue" defaultOpen={false}>
          <FontStylePanel 
            selectedText={selectedText} 
            onUpdate={handleFontUpdate}
          />
        </Section>

        <Divider />

        {/* GOOGLE CALENDAR */}
        <Section title="Google Calendar" icon={<Calendar />} accent="purple" defaultOpen={false}>
          <CalendarPanel onEventSelect={handleEventSelect} />
        </Section>

        <Divider />

        {/* SOCIAL SHARING */}
        {showSocialShare && exportedPNGUrl && (
          <>
            <Section title="Share on Social Media" icon={<Share2 />} accent="green" defaultOpen={true}>
              <SocialSharingEnhanced
                flyerUrl={exportedPNGUrl}
                eventName={eventName || projectName}
                language="en"
              />
            </Section>
            <Divider />
          </>
        )}

        {/* Sign Out */}
        <div style={{ padding: 20 }}>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: 12,
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </LeftPanel>

      {/* CANVAS AREA */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#f3f4f6",
        padding: 20,
      }}>
        <canvas 
          id="canvas"
          style={{
            border: "2px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            backgroundColor: "#ffffff",
          }}
        />
      </div>

      {/* PROJECT MODAL */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
      />
    </div>
  );
}
