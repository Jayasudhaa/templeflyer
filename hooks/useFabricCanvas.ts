import { useRef, useEffect, useState } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../lib/constants";
import { setCanvasBackground } from "../lib/fabricUtils";

export function useFabricCanvas(initialTemplate: string) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const fabricApiRef = useRef<any>(null);
  const fabricCanvasRef = useRef<any>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Fabric Canvas
  useEffect(() => {
    let disposed = false;
    let canvasElement: HTMLCanvasElement | null = null;

    (async () => {
      const container = wrapperRef.current;
      if (!container) return;

      try {
        const fabricMod = await import("fabric");
        if (disposed) return;
        
        fabricApiRef.current = fabricMod;
        const CanvasCtor = (fabricMod as any).Canvas;
        
        if (!CanvasCtor) {
          setError("Fabric Canvas constructor not found");
          return;
        }

        // Create fresh canvas element
        canvasElement = document.createElement("canvas");
        canvasElement.width = CANVAS_WIDTH;
        canvasElement.height = CANVAS_HEIGHT;
        canvasElement.style.border = "1px solid #ddd";
        canvasElement.style.borderRadius = "12px";

        container.innerHTML = "";
        container.appendChild(canvasElement);

        const canvas = new CanvasCtor(canvasElement, {
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: "#0b3a3b",
          selection: true,
          preserveObjectStacking: true,
        });

        if (disposed) {
          canvas.dispose();
          return;
        }

        fabricCanvasRef.current = canvas;

        // Style wrapper for responsive display
        const fabricWrapper = canvasElement.parentElement;
        if (fabricWrapper && fabricWrapper.getAttribute("data-fabric") === "wrapper") {
          fabricWrapper.style.maxWidth = "100%";
          fabricWrapper.style.height = "auto";
          fabricWrapper.style.aspectRatio = "1 / 1";
        }

        // Load initial template
        if (initialTemplate) {
          await setCanvasBackground(fabricMod, canvas, initialTemplate);
        }

        canvas.renderAll();
        setIsReady(true);
      } catch (e: any) {
        setError(e?.message ?? "Canvas initialization failed");
      }
    })();

    return () => {
      disposed = true;
      const c = fabricCanvasRef.current;
      if (c) {
        try { c.dispose(); } catch {}
      }
      fabricCanvasRef.current = null;
      fabricApiRef.current = null;
      if (wrapperRef.current) wrapperRef.current.innerHTML = "";
    };
  }, [initialTemplate]);

  return {
    wrapperRef,
    fabricApi: fabricApiRef.current,
    canvas: fabricCanvasRef.current,
    isReady,
    error,
  };
}
