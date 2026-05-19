import { Sparkles, SparklesIcon } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ReducedMotionToggle() {
  const { reduced, pref, setPref } = useReducedMotion();
  const Icon = reduced ? SparklesIcon : Sparkles;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Motion preferences (currently ${reduced ? "reduced" : "full"})`}
        className="hover:text-bronze transition-colors"
      >
        <Icon className={`w-4 h-4 ${reduced ? "opacity-50" : ""}`} strokeWidth={1.25} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-[11px] uppercase tracking-[0.2em]">
        <DropdownMenuLabel className="text-[10px] tracking-[0.25em] text-muted-foreground">
          Motion
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setPref("system")} className={pref === "system" ? "text-bronze" : ""}>
          System default
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setPref("off")} className={pref === "off" ? "text-bronze" : ""}>
          Full motion
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setPref("on")} className={pref === "on" ? "text-bronze" : ""}>
          Reduced motion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
