"use client";

import { useState } from "react";

// A date input that shows a real text placeholder when empty (native
// <input type="date"> can't). It renders as text (with the placeholder) while
// empty and unfocused, and as a date picker once focused or filled.
export function DateField({
  value,
  onChange,
  placeholder,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [focused, setFocused] = useState(false);
  const asDate = focused || value !== "";

  return (
    <input
      type={asDate ? "date" : "text"}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
