// Loads the clientraw* field specifications from the spec CSVs in
// layoutEditor/. Each row maps a numeric field index to a human-readable
// label, so the binding inspector can offer label-based search instead of
// requiring users to remember field numbers.

import { useEffect, useState } from "react";

export type ClientrawSource =
  | "clientraw"
  | "clientrawExtra"
  | "clientrawHour"
  | "clientrawDaily";

export type ClientrawSpecEntry = {
  spec: string;   // e.g. "clientraw[5]"
  label: string;
  unit: string;
  source: ClientrawSource;
};

const SOURCES: { url: string; specName: ClientrawSource }[] = [
  { url: "/runtime/layoutEditor/clientraw-spec.csv",      specName: "clientraw" },
  { url: "/runtime/layoutEditor/clientrawextra-spec.csv", specName: "clientrawExtra" },
  { url: "/runtime/layoutEditor/clientrawhour-spec.csv",  specName: "clientrawHour" },
  { url: "/runtime/layoutEditor/clientrawdaily-spec.csv", specName: "clientrawDaily" },
];

let cache: ClientrawSpecEntry[] | null = null;
let pending: Promise<ClientrawSpecEntry[]> | null = null;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += c;
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      out.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function parseSpecCsv(src: string, specName: ClientrawSource): ClientrawSpecEntry[] {
  if (src.charCodeAt(0) === 0xFEFF) src = src.slice(1);
  const out: ClientrawSpecEntry[] = [];
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (i === 0 && /^Field/i.test(line)) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 2) continue;
    const fieldNo = cols[0].trim();
    if (!/^-?\d+$/.test(fieldNo)) continue;
    const label = cols[1].trim();
    if (!label) continue;
    out.push({
      spec: `${specName}[${fieldNo}]`,
      label,
      unit: (cols[2] ?? "").trim(),
      source: specName,
    });
  }
  return out;
}

export function loadClientrawSpecs(): Promise<ClientrawSpecEntry[]> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;
  pending = Promise.all(SOURCES.map(async (s) => {
    try {
      const r = await fetch(s.url);
      if (!r.ok) return [];
      const text = await r.text();
      return parseSpecCsv(text, s.specName);
    } catch {
      return [];
    }
  })).then((arrs) => { cache = arrs.flat(); pending = null; return cache; })
     .catch(() => { pending = null; return [] as ClientrawSpecEntry[]; });
  return pending;
}

export function useClientrawSpecs(): ClientrawSpecEntry[] {
  const [entries, setEntries] = useState<ClientrawSpecEntry[]>(cache ?? []);
  useEffect(() => {
    if (cache) return;
    let alive = true;
    loadClientrawSpecs().then((e) => { if (alive) setEntries(e); });
    return () => { alive = false; };
  }, []);
  return entries;
}
