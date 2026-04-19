import * as React from "react";

export function Card({
  title,
  children,
  right
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: 16,
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(8px)"
      }}
    >
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          {title ? <div style={{ fontWeight: 650, color: "#EAF2FF" }}>{title}</div> : <div />}
          {right}
        </div>
      )}
      <div style={{ color: "#EAF2FF" }}>{children}</div>
    </div>
  );
}
