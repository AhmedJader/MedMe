export function TopNav() {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">MedMe · Pharmacy Console</div>
        <div className="text-sm text-muted-foreground">MVP · Stage 1 (UI)</div>
      </div>
    </header>
  );
}
