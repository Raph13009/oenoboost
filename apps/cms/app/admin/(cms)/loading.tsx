export default function CmsLoading() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="w-[420px] shrink-0 border-r border-slate-200 bg-white p-3">
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-10 rounded border border-slate-100 bg-slate-100" />
          ))}
        </div>
      </div>
      <div className="min-w-0 flex-1 border-l border-slate-200 bg-white p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-1/3 rounded bg-slate-200" />
          <div className="h-10 w-full rounded bg-slate-100" />
          <div className="h-10 w-full rounded bg-slate-100" />
          <div className="h-24 w-full rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

