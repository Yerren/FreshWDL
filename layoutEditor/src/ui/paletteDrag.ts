// Shared state for palette drag-and-drop. The MIME type is the canonical
// dataTransfer key. The ref-style "current type" is needed because some
// browsers don't expose dataTransfer payloads during dragover (only on drop),
// so the canvas reads it here to drive the ghost preview.

export const PALETTE_DRAG_MIME = "application/x-freshwdl-widget-type";

let currentType: string | null = null;
export function setPaletteDragType(type: string | null) { currentType = type; }
export function getPaletteDragType(): string | null { return currentType; }
