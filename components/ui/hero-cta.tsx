import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const heroCtaClassName =
  "inline-flex w-full min-h-[48px] max-w-full items-center justify-center whitespace-nowrap rounded-full bg-[#CCFF00] px-2 py-1 text-[clamp(7px,1.8cqw,9px)] font-bold uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(204,255,0,0.35)]";

type HeroCtaLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function HeroCtaLink({ href, children, className }: HeroCtaLinkProps) {
  return (
    <Link href={href} className={cn(heroCtaClassName, className)}>
      {children}
    </Link>
  );
}

type HeroCtaButtonProps = {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
};

export function HeroCtaButton({
  onClick,
  children,
  className,
  type = "button",
}: HeroCtaButtonProps) {
  return (
    <button type={type} onClick={onClick} className={cn(heroCtaClassName, className)}>
      {children}
    </button>
  );
}
