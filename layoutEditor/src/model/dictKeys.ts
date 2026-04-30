// Loads the global language-dictionary keys from js_bundles/Globals.js, served
// at /runtime/* by the editor's dev middleware. Top-level dict entries are
// indented with a single tab; nested per-language entries use two tabs.

import { useEffect, useState } from "react";

let cache: string[] | null = null;
let pending: Promise<string[]> | null = null;

export function loadDictKeys(): Promise<string[]> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;
  pending = fetch("/runtime/js_bundles/Globals.js")
    .then((r) => (r.ok ? r.text() : ""))
    .then((src) => {
      const keys: string[] = [];
      const re = /^\t([A-Za-z_][A-Za-z0-9_]*)\s*:\s*\{/gm;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) keys.push(m[1]);
      cache = Array.from(new Set(keys)).sort();
      pending = null;
      return cache;
    })
    .catch(() => { pending = null; return [] as string[]; });
  return pending;
}

export function useDictKeys(): string[] {
  const [keys, setKeys] = useState<string[]>(cache ?? []);
  useEffect(() => {
    if (cache) return;
    let alive = true;
    loadDictKeys().then((k) => { if (alive) setKeys(k); });
    return () => { alive = false; };
  }, []);
  return keys;
}
