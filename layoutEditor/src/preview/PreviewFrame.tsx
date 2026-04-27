import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { LayoutDoc } from "../model/types";
import { emitLayoutJs } from "../codegen/emitLayoutJs";

type Props = {
  doc: LayoutDoc;
  overlayMode?: boolean;
  style?: CSSProperties;
};

export function PreviewFrame({ doc, overlayMode, style }: Props) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  // Bumped on iframe resize so widgets re-init at the new canvas size — the
  // legacy runtime sizes its canvases once at construction and has no resize
  // hook, so we rebuild on resize to avoid widgets stuck at 0×0.
  const [sizeNonce, setSizeNonce] = useState(0);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data && e.data.type === "previewReady" && e.source === ref.current?.contentWindow) {
        setReady(true);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSizeNonce((n) => n + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const frame = ref.current;
    if (!frame || !frame.contentWindow) return;
    // Only render once the iframe actually has dimensions — otherwise the
    // legacy runtime initializes canvases at 0×0 and they stay invisible
    // until the next rebuild.
    if (frame.clientWidth < 4 || frame.clientHeight < 4) return;
    const send = () => {
      const dataUrlPrefix = doc.preview.source === "live"
        ? doc.preview.liveUrlPrefix
        : "/runtime/";
      frame.contentWindow!.postMessage({
        type: "render",
        layoutJsSource: emitLayoutJs(doc),
        dataUrlPrefix,
        overlayMode: !!overlayMode,
      }, "*");
    };
    // Debounce so dragging or rapid resizes don't tear down + rebuild widgets
    // on every event.
    const t = setTimeout(send, 150);
    return () => clearTimeout(t);
  }, [doc, ready, overlayMode, sizeNonce]);

  if (overlayMode) {
    return (
      <iframe
        ref={ref}
        src="/previewHost.html"
        style={{ border: 0, background: "transparent", ...style }}
      />
    );
  }
  return (
    <div className="canvas">
      <iframe
        ref={ref}
        src="/previewHost.html"
        style={{ width: "100%", height: "100%", border: 0, background: "#fff" }}
      />
    </div>
  );
}
