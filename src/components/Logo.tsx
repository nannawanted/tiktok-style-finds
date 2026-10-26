export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo-sm.png"
      alt="WantedFashion"
      width={360}
      height={265}
      className={`h-14 w-auto object-contain ${className}`}
    />
  );
}
