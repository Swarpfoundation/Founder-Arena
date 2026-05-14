import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function FounderArenaWordmark({ className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", className)}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
        <path d="M8 12L12 8L16 12" />
        <circle cx="12" cy="14" r="1.5" />
      </svg>
      <span className="text-gradient-cyan">Founder Arena</span>
    </span>
  );
}
