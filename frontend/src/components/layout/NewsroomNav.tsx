import Link from "next/link";
import { ArrowLeft, Home, Users, FileText, Activity } from "lucide-react";
import { cx } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/newsroom", icon: Home },
  { label: "Agents", href: "/newsroom/agents", icon: Users },
  { label: "Editions", href: "/newsroom/editions", icon: FileText },
  { label: "Activity", href: "/newsroom/activity", icon: Activity },
];

/** Section header shared by the newsroom pages (the campus itself is untouched). */
export default function NewsroomNav({ active }: { active: string }) {
  return (
    <header className="border-b border-white/8 bg-[#0b0f1a]/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-4">
        <Link
          href="/"
          className="mr-2 inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-sm text-[#f2f4ff] transition-colors hover:bg-white/5"
        >
          <ArrowLeft size={15} />
          Campus
        </Link>
        <nav aria-label="Newsroom sections" className="flex flex-wrap items-center gap-1">
          {TABS.map(({ label, href, icon: Icon }) => {
            const isActive = href === active;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-[#20294a] font-medium text-[#f2f4ff]"
                    : "text-[#b8c0dc] hover:bg-white/5 hover:text-[#f2f4ff]",
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
