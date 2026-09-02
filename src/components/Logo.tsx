export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="WantedFashion"
      className={`h-12 w-auto object-contain ${className}`}
    />
  );
}
