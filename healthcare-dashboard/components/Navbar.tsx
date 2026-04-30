"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/patients", label: "Patients" },
  { href: "/today", label: "Today's Visits" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-[#080e24] border-b border-[#1a2f5a] px-8 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">CareIQ</span>
      </div>
      <div className="flex items-center gap-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              pathname === l.href
                ? "bg-blue-600/20 text-blue-300 border border-blue-700/50"
                : "text-blue-400/70 hover:text-white hover:bg-white/5"
            }`}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
