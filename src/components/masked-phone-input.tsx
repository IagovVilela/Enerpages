"use client";

import { formatBrPhoneNational, formatWhatsAppDisplayInput } from "@/lib/br-input-masks";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** `whatsapp` aceita `+` internacional; `national` força máscara BR. */
  mode?: "whatsapp" | "national";
  className?: string;
  placeholder?: string;
  name?: string;
  required?: boolean;
  id?: string;
  autoComplete?: string;
};

export function MaskedPhoneInput({
  value,
  onChange,
  mode = "national",
  className,
  placeholder = "(11) 99999-0000",
  name,
  required,
  id,
  autoComplete = "tel",
}: Props) {
  const format = mode === "whatsapp" ? formatWhatsAppDisplayInput : formatBrPhoneNational;

  return (
    <input
      id={id}
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      required={required}
      value={value}
      placeholder={placeholder}
      maxLength={mode === "whatsapp" ? 20 : 15}
      onChange={(e) => onChange(format(e.target.value))}
      onBlur={(e) => onChange(format(e.target.value))}
      className={cn(className)}
    />
  );
}
