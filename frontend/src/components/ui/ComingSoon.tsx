import Link from "next/link";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <main className="fixed inset-0 grid place-items-center bg-[#0b0f1a]">
      <div className="text-center">
        <h1 className="text-2xl font-light text-[#e6e9ff]">{title}</h1>
        <p className="mt-2 text-sm text-[#8f97b8]">Coming soon</p>
        <Link href="/" className="mt-6 inline-block text-sm text-[#b8c0dc] underline">
          Back to the office
        </Link>
      </div>
    </main>
  );
}
