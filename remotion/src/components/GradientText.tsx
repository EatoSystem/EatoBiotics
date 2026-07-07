import React from "react";
import { BRAND_GRADIENT } from "../lib/brand";

/**
 * Text with the EatoBiotics brand gradient clipped to the glyphs.
 * Mirrors `.brand-gradient-text` in the website's globals.css.
 */
export const GradientText: React.FC<{
  children: React.ReactNode;
  /** Override the gradient (defaults to the diagonal brand gradient). */
  gradient?: string;
  style?: React.CSSProperties;
}> = ({ children, gradient = BRAND_GRADIENT, style }) => {
  return (
    <span
      style={{
        backgroundImage: gradient,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        ...style,
      }}
    >
      {children}
    </span>
  );
};
