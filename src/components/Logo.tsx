export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="WantedFashion"
      className={`h-16 w-auto object-contain ${className}`}
    />
  );
}
