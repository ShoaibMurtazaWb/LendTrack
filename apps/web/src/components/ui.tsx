import Link from "next/link";

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800",
    returned: "bg-emerald-100 text-emerald-800",
    lost: "bg-slate-200 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        colors[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ message, href, linkLabel }: { message: string; href?: string; linkLabel?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="text-slate-600">{message}</p>
      {href && linkLabel && (
        <Link
          href={href}
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
