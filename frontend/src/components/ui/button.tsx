import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-saffron text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20",
  secondary:
    "bg-navy text-white hover:bg-slate-800 dark:bg-dark-text dark:text-dark-surface dark:hover:bg-dark-muted",
  outline:
    "border border-slate-300 bg-white text-navy hover:bg-slate-50 dark:border-dark-border dark:bg-transparent dark:text-dark-text dark:hover:bg-dark-border",
  ghost:
    "text-slate-700 hover:bg-slate-100 dark:text-dark-muted dark:hover:bg-dark-border",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn("inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition", variants[variant], className)}
      {...props}
    />
  );
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function LinkButton({ className, variant = "primary", href, children, ...props }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition", variants[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
