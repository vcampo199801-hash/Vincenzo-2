import Link from "next/link";

export function PageHeader({
  title,
  description,
  action,
  actionHref,
}: {
  title: string;
  description?: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          {action}
        </Link>
      )}
    </div>
  );
}
