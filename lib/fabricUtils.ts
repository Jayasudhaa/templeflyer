// Fabric.js canvas utility functions

import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";

/**
 * Load an image from URL and set it as canvas background
 */
export async function setCanvasBackground(
  fabricMod: any,
  canvas: any,
  url: string
): Promise<void> {
  const ImgClass = fabricMod.FabricImage ?? fabricMod.Image;
  if (!ImgClass?.fromURL) {
    throw new Error("FabricImage.fromURL not available");
  }

  const isDataUrl = url.startsWith("data:");
  const loadOpts: Record<string, any> = {};
  if (!isDataUrl) loadOpts.crossOrigin = "anonymous";

  const img = await ImgClass.fromURL(url, loadOpts, {
    selectable: false,
    evented: false,
    originX: "left",
    originY: "top",
  });

  if (!img) throw new Error("Image load returned null");

  img.scaleToWidth(CANVAS_WIDTH);
  img.scaleToHeight(CANVAS_HEIGHT);
  canvas.backgroundImage = img;
  canvas.renderAll();
}

/**
 * Add an image to canvas as a draggable object
 */
export async function addImageToCanvas(
  fabricMod: any,
  canvas: any,
  dataUrl: string,
  options: {
    label: string;
    maxWidth?: number;
    maxHeight?: number;
    top?: number;
    left?: number;
  }
): Promise<void> {
  const ImgClass = fabricMod.FabricImage ?? fabricMod.Image;
  if (!ImgClass?.fromURL) {
    throw new Error("FabricImage.fromURL not available");
  }

  const img = await ImgClass.fromURL(dataUrl, {}, {
    originX: "center",
    originY: "top",
    cornerColor: "#ffffff",
    borderColor: "#ffffff",
  });

  if (!img) {
    throw new Error(`Failed to load ${options.label} image`);
  }

  const maxW = options.maxWidth ?? 300;
  const maxH = options.maxHeight ?? 200;
  const scale = Math.min(maxW / img.width!, maxH / img.height!, 1);
  
  img.scale(scale);
  img.set({
    left: options.left ?? CANVAS_WIDTH / 2,
    top: options.top ?? 100,
  });
  img.data = { label: options.label };
  
  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.renderAll();
}

/**
 * Add text block to canvas
 */
export function addTextToCanvas(
  fabricMod: any,
  canvas: any,
  text: string,
  options: {
    fieldKey: string;
    fontSize?: number;
    fontWeight?: string;
    top?: number;
    left?: number;
    width?: number;
  }
): void {
  const TextboxCtor = fabricMod.Textbox;
  if (!TextboxCtor) {
    throw new Error("Fabric Textbox not found");
  }

  const textbox = new TextboxCtor(text, {
    left: options.left ?? 120,
    top: options.top ?? 220 + Math.random() * 200,
    width: options.width ?? 840,
    fontSize: options.fontSize ?? 28,
    fill: "#ffffff",
    fontWeight: options.fontWeight ?? "normal",
    textAlign: "center",
    editable: true,
    cornerColor: "#ffffff",
    borderColor: "#ffffff",
  });

  textbox.data = { fieldKey: options.fieldKey };
  canvas.add(textbox);
  canvas.setActiveObject(textbox);
  canvas.renderAll();
}

/**
 * Update all text objects on canvas with new field values
 */
export function syncCanvasText(canvas: any, fieldValues: Record<string, string>): void {
  canvas.getObjects().forEach((obj: any) => {
    if (obj?.type !== "textbox") return;
    const fieldKey = obj?.data?.fieldKey;
    if (!fieldKey || !fieldValues[fieldKey]) return;
    obj.set("text", fieldValues[fieldKey]);
  });
  canvas.renderAll();
}

/**
 * Delete selected object(s) from canvas
 */
export function deleteSelectedObjects(canvas: any): void {
  const active = canvas.getActiveObject();
  if (!active) {
    throw new Error("Nothing selected — click an object on the canvas first");
  }

  if (active.type === "activeselection" || active.type === "activeSelection") {
    (active as any).forEachObject((obj: any) => canvas.remove(obj));
    canvas.discardActiveObject();
  } else {
    canvas.remove(active);
  }
  canvas.renderAll();
}

/**
 * Export canvas as PNG data URL
 */
export function exportCanvasToPNG(canvas: any): string {
  return canvas.toDataURL({ format: "png", quality: 1.0, multiplier: 1 });
}

/**
 * Read File as data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
