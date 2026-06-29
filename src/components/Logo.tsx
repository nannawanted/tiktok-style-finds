export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black tracking-tight ${className}`}>
      <span className="text-foreground">Wanted</span>
      <span className="text-brand">Fashion</span>
    </span>
  );
}
