// components/editor/panels/canvasHelpers.ts
import type { Canvas, Object as FabricObject } from "fabric";

export type FieldKey = "event_name" | "date" | "timings" | "sponsorship" | "description";

export function getActiveObject(canvas: Canvas | null) {
  return canvas?.getActiveObject?.() ?? null;
}

export function removeActiveObject(canvas: Canvas | null) {
  if (!canvas) return;
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.remove(obj);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}

export function removeObjectsByPredicate(
  canvas: Canvas | null,
  pred: (o: FabricObject) => boolean
) {
  if (!canvas) return;
  canvas.getObjects().filter(pred).forEach((o) => canvas.remove(o));
  canvas.requestRenderAll();
}

export function findFirstObjectByDataKey(canvas: Canvas | null, key: FieldKey) {
  if (!canvas) return null;
  return canvas.getObjects().find((o: any) => o?.dataKey === key) ?? null;
}

export function ensureTopLeftSafePosition(canvas: Canvas | null, x = 80, y = 80) {
  if (!canvas) return { left: x, top: y };
  return { left: x, top: y };
}
