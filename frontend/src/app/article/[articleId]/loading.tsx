export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <div className="mx-auto max-w-3xl animate-pulse px-6 py-16">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="mt-4 h-10 w-full rounded bg-white/10" />
        <div className="mt-2 h-10 w-2/3 rounded bg-white/10" />
        <div className="mt-3 h-4 w-40 rounded bg-white/8" />
        <div className="mt-8 h-56 rounded bg-white/6" />
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full rounded bg-white/6" />
          <div className="h-4 w-full rounded bg-white/6" />
          <div className="h-4 w-5/6 rounded bg-white/6" />
        </div>
      </div>
    </div>
  );
}
