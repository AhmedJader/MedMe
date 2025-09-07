import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import type { Priority } from "../lib/utils";
import { flagReason } from "../lib/utils";
import { twMerge as cn } from "tailwind-merge";

export function StatusBadge({
  priority,
  dateIso,
}: { priority: Priority; dateIso: string }) {
  const label = { overdue: "Overdue", due_soon: "Due soon", ok: "OK" }[priority];
  const cls = {
    overdue: "bg-red-50 text-red-700 border border-red-200",
    due_soon: "bg-amber-50 text-amber-800 border border-amber-200",
    ok: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  }[priority];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            aria-label={`${label}. ${flagReason(dateIso)}`}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              cls
            )}
          >
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {flagReason(dateIso)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
