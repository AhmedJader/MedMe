import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Priority = "overdue" | "due_soon" | "ok";

export function daysUntil(dateIso: string) {
  const d = new Date(dateIso).getTime();
  const t = new Date().setHours(0,0,0,0);
  return Math.ceil((d - t) / 86400000);
}

export function refillPriority(dateIso: string): Priority {
  const n = daysUntil(dateIso);
  if (n < 0) return "overdue";
  if (n <= 7) return "due_soon";
  return "ok";
}

export function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
}
