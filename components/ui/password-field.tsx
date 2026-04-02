"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordField({ className = "", id: idProp, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const genId = useId();
  const inputId = idProp ?? genId;

  return (
    <div className="relative">
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        className={`input pr-11 ${className}`.trim()}
      />
      <button
        type="button"
        className="absolute inset-e-0 top-0 flex h-full items-center px-3 text-black/45 transition hover:text-black/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-shop-accent"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={0}
      >
        {visible ? <EyeOff className="size-4 shrink-0" aria-hidden /> : <Eye className="size-4 shrink-0" aria-hidden />}
      </button>
    </div>
  );
}
