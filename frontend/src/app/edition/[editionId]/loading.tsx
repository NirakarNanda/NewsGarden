export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-10 w-2/3 rounded bg-white/10" />
          <div className="mt-3 h-4 w-1/3 rounded bg-white/8" />
          <div className="mt-8 space-y-4">
            <div className="h-48 rounded bg-white/6" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-32 rounded bg-white/6" />
              <div className="h-32 rounded bg-white/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
