import { cx } from "@/lib/utils";

export default function SectionHeader({ title, className }: { title: string; className?: string }) {
  return (
    <div className={cx("flex items-center gap-3", className)}>
      <div className="h-px flex-1 bg-[#221c12]/25" />
      <h3 className="font-serif text-sm font-bold uppercase tracking-[0.25em] text-[#221c12]">
        {title}
      </h3>
      <div className="h-px flex-1 bg-[#221c12]/25" />
    </div>
  );
}
