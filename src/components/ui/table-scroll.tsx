"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Wraps a wide table (or any horizontally-scrollable block) so a fading
 * edge appears on narrow screens whenever there's more content to the
 * right — without it, a table wider than the phone screen just gets cut
 * off with no hint that you can swipe to see the rest. */
export function TableScroll({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      setCanScrollMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    }

    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className={`overflow-x-auto ${className}`}>
        {children}
      </div>
      {canScrollMore && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-xl bg-gradient-to-l from-white to-transparent sm:hidden"
        />
      )}
    </div>
  );
}
