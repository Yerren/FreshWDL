import type { ValidationIssue } from "../model/validation";

export function LogPanel({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div className="log">
      {issues.map((it, i) => (
        <div key={i} className={it.level === "error" ? "entry-error" : "entry-warn"}>
          [{it.level}] {it.instanceId ? `(${it.instanceId}${it.field ? "." + it.field : ""}) ` : ""}
          {it.message}
        </div>
      ))}
    </div>
  );
}
