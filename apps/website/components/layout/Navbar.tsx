"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

const links = [
  { label: "Services",  href: "/services" },
  { label: "About",     href: "/about" },
  { label: "FAQ",       href: "/faq" },
  { label: "Tampa Bay", href: "/tampa" },
];

export default function Navbar() {
  const [open, setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "bg-cream/95 backdrop-blur-md border-b border-stone" : "bg-transparent"
      )}>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo with Image */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="FORMED"
                width={32}
                height={32}
                className="w-auto h-8 object-contain"
                priority
              />
              <span className={cn(
                "font-display font-medium text-lg tracking-wide2 transition-colors duration-300",
                scrolled ? "text-ink" : "text-cream"
              )}>
                FORMED
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-10">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={cn(
                  "nav-link text-[10px] tracking-ultra uppercase font-body font-medium transition-colors duration-300",
                  scrolled ? "text-muted hover:text-ink" : "text-cream/70 hover:text-cream"
                )}>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden lg:block">
              <Button href="/apply" size="sm" variant={scrolled ? "dark" : "light"}>
                Apply Now
              </Button>
            </div>

            {/* Mobile burger */}
            <button
              onClick={() => setOpen(!open)}
              className={cn(
                "lg:hidden flex flex-col gap-1.5 p-2",
                scrolled ? "text-ink" : "text-cream"
              )}
              aria-label="Menu"
            >
              <span className={cn("block h-px w-6 transition-all duration-300 bg-current", open && "rotate-45 translate-y-2")} />
              <span className={cn("block h-px w-6 transition-all duration-300 bg-current", open && "opacity-0")} />
              <span className={cn("block h-px w-6 transition-all duration-300 bg-current", open && "-rotate-45 -translate-y-2")} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={cn(
        "fixed inset-0 z-40 bg-ink flex flex-col justify-center px-8 transition-all duration-500",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <nav className="flex flex-col gap-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-5xl font-light text-cream/80 hover:text-cream transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-4">
            <Button href="/apply" size="lg" variant="light" onClick={() => setOpen(false)}>
              Apply for Membership
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}