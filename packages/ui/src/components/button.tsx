import * as React from "react";

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
