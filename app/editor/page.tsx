// ============================================================================
// FILE: app/editor/page.tsx (FIXED WITH AI BACKGROUND GENERATOR)
// PURPOSE: Integrated editor with ALL features including AI generation
// ============================================================================

"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// ✅ Import all components
import LeftPanel, { Section, Divider } from "@/components/editor/LeftPanel";
import FontStylePanel from "@/components/editor/FontStylePanel";
import ProjectModal from "@/components/editor/ProjectModal";
import CalendarPanel from "@/components/editor/CalendarPanel";

// Import icons
import { 
  Type, 
  Calendar, 
  Image as ImageIcon, 
  Sparkles, 
  Save, 
  FolderOpen,
  Upload,
  Sliders
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

  const personalImageInputRef = useRef<HTMLInputElement | null>(null);

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
  }, [session]);

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

      const response = await fetch("/api/dalle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          systemPrompt: AI_SYSTEM_PROMPT,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI generation failed");
      }

      const imageUrl = result.imageUrl;
      setAiRemaining(result.dailyLimit?.remaining ?? null);
      
      // Set as background
      await setBackgroundFromUrl(imageUrl);
      
      alert(`✅ AI Background Generated!\n\nDaily limit: ${result.dailyLimit?.remaining ?? 'N/A'}/${result.dailyLimit?.total ?? 10} remaining`);
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
          if (!img) {
            reject(new Error("Failed to load image"));
            return;
          }

          img.set({
            selectable: false,
            evented: false,
          });

          const iw = img.width || 1;
          const ih = img.height || 1;
          const scaleX = WIDTH / iw;
          const scaleY = HEIGHT / ih;
          const scale = Math.max(scaleX, scaleY);

          img.scale(scale);
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
  // IMAGE UPLOAD
  // ============================================================================
  const handlePersonalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current || !canvasRef.current) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const fabricMod = fabricRef.current;
        const canvas = canvasRef.current;

        fabricMod.Image.fromURL(
          dataUrl,
          (img: any) => {
            const maxWidth = 400;
            const maxHeight = 400;
            const iw = img.width || 1;
            const ih = img.height || 1;
            const scale = Math.min(maxWidth / iw, maxHeight / ih);

            img.scale(scale);
            img.set({
              left: 100,
              top: 100,
              selectable: true,
              evented: true,
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
          },
          { crossOrigin: "anonymous" }
        );
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert("Failed to upload image");
    }
  };

  // ============================================================================
  // SELECT BACKGROUND FOR EDITING
  // ============================================================================
  const selectBackgroundForEditing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.backgroundImage) {
      alert("No background image to select!");
      return;
    }
    setBackgroundSelected(true);
    setSelectedImage(null);
    setSelectedText(null);
    alert("✅ Background selected! You can now adjust filters.");
  };

  // ============================================================================
  // IMAGE FILTERS
  // ============================================================================
  const applyImageFilters = () => {
    const fabricMod = fabricRef.current;
    const canvas = canvasRef.current;
    if (!fabricMod || !canvas) return;

    const target = backgroundSelected ? canvas.backgroundImage : selectedImage;
    if (!target) return;

    const filters: any[] = [];

    if (brightness !== 0 && fabricMod.filters?.Brightness) {
      filters.push(new fabricMod.filters.Brightness({ brightness: brightness / 100 }));
    }
    if (contrast !== 0 && fabricMod.filters?.Contrast) {
      filters.push(new fabricMod.filters.Contrast({ contrast: contrast / 100 }));
    }
    if (saturation !== 0 && fabricMod.filters?.Saturation) {
      filters.push(new fabricMod.filters.Saturation({ saturation: saturation / 100 }));
    }

    target.filters = filters;

    if (typeof target.applyFilters === "function") {
      target.applyFilters();
    }

    canvas.renderAll();
  };

  const resetImageFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = backgroundSelected ? canvas.backgroundImage : selectedImage;
    if (!target) return;

    target.filters = [];
    if (typeof target.applyFilters === "function") {
      target.applyFilters();
    }

    canvas.renderAll();

    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  };

  // ============================================================================
  // PROJECT MANAGEMENT
  // ============================================================================
  const handleNewProject = () => {
    if (!canvasRef.current) return;
    
    canvasRef.current.clear();
    setProjectName("Untitled Project");
    setCurrentProject(null);
    setShowProjectModal(false);
    
    alert("✅ New project created!");
  };

  const handleOpenProject = async (project: any) => {
    if (!canvasRef.current) return;

    try {
      canvasRef.current.loadFromJSON(project.canvas_json, () => {
        canvasRef.current.renderAll();
      });
      
      setProjectName(project.project_name);
      setCurrentProject(project);
      setShowProjectModal(false);
      
      alert(`✅ Opened: ${project.project_name}`);
    } catch (error) {
      console.error("Failed to open project:", error);
      alert("❌ Failed to open project");
    }
  };

  const handleSaveProject = async () => {
    if (!canvasRef.current || !session) return;

    try {
      const canvasJSON = canvasRef.current.toJSON();
      const thumbnail = canvasRef.current.toDataURL({ format: 'png', quality: 0.3 });

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName,
          canvas_json: canvasJSON,
          thumbnail_url: thumbnail,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert("✅ Project saved!");
        setCurrentProject(data.project);
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("❌ Save failed");
    }
  };

  // ============================================================================
  // CALENDAR EVENT HANDLER
  // ============================================================================
  const handleEventSelect = (event: any) => {
    if (!canvasRef.current || !fabricRef.current) return;

    const eventText = new fabricRef.current.Text(
      `${event.title}\n${new Date(event.start).toLocaleDateString()}\n${event.location || ''}`,
      {
        left: 100,
        top: 100,
        fontSize: 40,
        fill: "#ffffff",
        fontFamily: "Poppins",
        fontWeight: "bold",
      }
    );

    canvasRef.current.add(eventText);
    canvasRef.current.renderAll();
    
    alert(`✅ Added event: ${event.title}`);
  };

  // ============================================================================
  // UPDATE HANDLER FOR FONT PANEL
  // ============================================================================
  const handleFontUpdate = () => {
    if (canvasRef.current) {
      canvasRef.current.renderAll();
    }
  };

  // ============================================================================
  // SIGN IN/OUT
  // ============================================================================
  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
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
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <div style={{ fontSize: 24, fontWeight: 600 }}>Loading...</div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - NOT SIGNED IN
  // ============================================================================
  if (!session) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <div style={{
          background: "white",
          padding: 60,
          borderRadius: 20,
          textAlign: "center",
          maxWidth: 400
        }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
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
      {/* ✅ LEFT PANEL */}
      <LeftPanel>
        {/* Project Name */}
        <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600
            }}
          />
          
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => setShowProjectModal(true)}
              style={{
                flex: 1,
                padding: 10,
                background: "#f3f4f6",
                border: "2px solid #e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              <FolderOpen size={16} style={{ display: "inline", marginRight: 6 }} />
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
                fontWeight: 600
              }}
            >
              <Save size={16} style={{ display: "inline", marginRight: 6 }} />
              Save
            </button>
          </div>
        </div>

        {/* ✅ AI BACKGROUND GENERATOR SECTION */}
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
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
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
            placeholder="Describe your desired background..."
            style={{
              width: "100%",
              minHeight: 100,
              padding: 12,
              borderRadius: 8,
              border: "2px solid #e5e7eb",
              fontSize: 14,
              fontFamily: "inherit",
              marginBottom: 12,
              resize: "vertical",
            }}
          />

          <button
            onClick={generateAIBackground}
            disabled={generatingAI || !aiPrompt.trim()}
            style={{
              width: "100%",
              padding: 14,
              background: generatingAI ? "#ccc" : "linear-gradient(135deg, #8b5cf6, #6366f1)",
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

        {/* ✅ IMAGE CONTROLS SECTION */}
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
                  onChange={(e) => setSaturation(Number(e.target.value))}
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

        {/* ✅ FONT STYLING SECTION */}
        <Section title="Font Styling" icon={<Type />} accent="blue" defaultOpen={false}>
          <FontStylePanel 
            selectedText={selectedText} 
            onUpdate={handleFontUpdate}
          />
        </Section>

        <Divider />

        {/* ✅ GOOGLE CALENDAR SECTION */}
        <Section title="Google Calendar" icon={<Calendar />} accent="purple" defaultOpen={false}>
          <CalendarPanel onEventSelect={handleEventSelect} />
        </Section>

        <Divider />

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

      {/* ✅ CANVAS AREA */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#f3f4f6"
      }}>
        <canvas id="canvas" />
      </div>

      {/* ✅ PROJECT MODAL */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
      />
    </div>
  );
}
