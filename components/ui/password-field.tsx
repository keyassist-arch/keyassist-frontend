"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
};

export function PasswordField({
  className = "",
  id: idProp,
  label,
  labelClassName = "text-xs font-medium text-gray-500",
  wrapperClassName = "",
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const genId = useId();
  const inputId = idProp ?? genId;

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`.trim()}>
      {label ? (
        <label htmlFor={inputId} className={`block ${labelClassName}`}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className={`input w-full pr-11 ${className}`.trim()}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition hover:text-gray-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-shop-accent"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Eye className="h-4 w-4 shrink-0" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
