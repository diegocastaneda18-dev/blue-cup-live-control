import * as React from "react";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #071426 0%, #0B203B 100%)" }}>
      {children}
    </div>
  );
}

export function Container({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>{children}</div>;
}

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

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const styles: React.CSSProperties =
    variant === "primary"
      ? { background: "#C9A24A", color: "#071426", border: "1px solid rgba(0,0,0,0.2)" }
      : { background: "transparent", color: "#EAF2FF", border: "1px solid rgba(255,255,255,0.18)" };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...styles,
        borderRadius: 10,
        padding: "10px 12px",
        fontWeight: 650,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1
      }}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ color: "#A8B6CC", fontSize: 12, fontWeight: 600 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.16)",
          background: "rgba(0,0,0,0.18)",
          color: "#EAF2FF",
          outline: "none"
        }}
      />
    </label>
  );
}

