"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Shield, CreditCard, Receipt, Phone, Palette } from "lucide-react";
import { Navbar } from "~/components/navbar";

const SECTIONS = [
  { name: "Profile", href: "/settings", icon: User },
  { name: "Account", href: "/settings/account", icon: Shield },
  { name: "Billing", href: "/settings/billing", icon: CreditCard },
  { name: "Payments", href: "/settings/payments", icon: Receipt },
  { name: "Calls", href: "/settings/calls", icon: Phone },
  { name: "Appearance", href: "/settings/appearance", icon: Palette },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          Settings
        </h1>

        <div className="flex gap-8">
          <nav className="w-48 shrink-0">
            <div className="rounded border border-border bg-card p-2">
              <ul className="space-y-1">
                {SECTIONS.map((section) => {
                  const isActive =
                    section.href === "/settings"
                      ? pathname === "/settings"
                      : pathname.startsWith(section.href);
                  const Icon = section.icon;
                  return (
                    <li key={section.href}>
                      <Link
                        href={section.href}
                        className={`flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-accent text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {section.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
