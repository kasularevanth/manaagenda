import type { ReactNode } from "react";

type Props = {
  /** Optional label shown before the dots (e.g. "Loading", "Checking authentication") */
  label?: ReactNode;
  /** Smaller dots for inline/button use */
  size?: "sm" | "md";
  className?: string;
};

export const LoadingDots = ({ label, size = "md", className = "" }: Props) => (
  <span className={`loading-dots loading-dots--${size} ${className}`.trim()} role="status" aria-live="polite">
    {label ? <span className="loading-dots-label">{label}</span> : null}
    <span className="loading-dots-bounce">
      <span />
      <span />
      <span />
    </span>
  </span>
);
