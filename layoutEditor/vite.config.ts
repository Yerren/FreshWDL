import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, join, extname } from "path";
import { createReadStream, statSync } from "fs";

const REPO_ROOT = resolve(__dirname, "..");

const MIME: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

// Dev-only middleware: serve the FreshWDL repo at /runtime/* so the preview
// iframe can load js_bundles/, css/, sprites/, sample clientraw files, etc.
function serveRuntime(): Plugin {
  return {
    name: "freshwdl-serve-runtime",
    configureServer(server) {
      server.middlewares.use("/runtime", (req, res, next) => {
        const url = (req.url ?? "/").split("?")[0];
        if (url.includes("..")) return next();
        const filePath = join(REPO_ROOT, decodeURIComponent(url));
        try {
          const st = statSync(filePath);
          if (!st.isFile()) return next();
          const mime = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
          res.setHeader("Content-Type", mime);
          res.setHeader("Cache-Control", "no-store");
          createReadStream(filePath).pipe(res);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveRuntime()],
});
