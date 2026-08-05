"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Href = ComponentProps<typeof Link>["href"];

export default function NavLink({
  href,
  children,
}: {
  href: Href;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`nav-link transition hover:text-judo-lilac ${active ? "nav-link-active" : ""}`}
    >
      {children}
    </Link>
  );
}
