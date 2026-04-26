import { useEffect, useRef, useState } from "react";
import type { LayoutDoc } from "../model/types";
import { emitLayoutJs } from "../codegen/emitLayoutJs";

export function PreviewFrame({ doc }: { doc: LayoutDoc }) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data && e.data.type === "previewReady") setReady(true);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const frame = ref.current;
    if (!frame || !frame.contentWindow) return;
    const dataUrlPrefix = doc.preview.source === "live"
      ? doc.preview.liveUrlPrefix
      : "/runtime/"; // sample clientraw files live next to the runtime
    frame.contentWindow.postMessage({
      type: "render",
      layoutJsSource: emitLayoutJs(doc),
      dataUrlPrefix,
    }, "*");
  }, [doc, ready]);

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
