import { Link } from "@tanstack/react-router";

export function EmptyBox({ text, action }: { text: string; action?: { to: "/login" | "/signup" | "/dashboard/post/new" | "/explorer"; label: string } }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      <p className="max-w-sm text-foreground/70">{text}</p>
      {action && (
        <Link to={action.to} className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-surface">
          {action.label}
        </Link>
      )}
    </div>
  );
}
