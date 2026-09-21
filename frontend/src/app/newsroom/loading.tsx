export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      <div className="mx-auto max-w-6xl animate-pulse px-6 py-10">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="mt-2 h-4 w-96 rounded bg-white/8" />
        <div className="mt-8 space-y-3">
          <div className="h-20 rounded-lg bg-white/6" />
          <div className="h-20 rounded-lg bg-white/6" />
          <div className="h-20 rounded-lg bg-white/6" />
        </div>
      </div>
    </div>
  );
}
