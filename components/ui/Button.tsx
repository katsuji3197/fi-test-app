import { forwardRef, type ButtonHTMLAttributes } from "react";

/** キーボードフォーカスを画面間で揃える共通リング（indigo-500、白地で 4.5:1 以上） */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-900";

const variants = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-700 disabled:shadow-none dark:bg-indigo-400 dark:text-slate-950 dark:shadow-none dark:hover:bg-indigo-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-300",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:border-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-400 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:disabled:text-slate-500",
} as const;

const sizes = {
  md: "min-h-11 rounded-lg px-4 text-sm",
  lg: "min-h-12 rounded-xl px-6 text-base",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 text-center font-semibold transition-colors disabled:cursor-not-allowed ${focusRing} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});

export default Button;
