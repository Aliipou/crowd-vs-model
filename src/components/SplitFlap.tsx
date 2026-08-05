"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "0123456789";

/** A scoreboard digit that flips through a couple of values before landing. */
export function SplitFlap({ value, className = "" }: { value: number | string; className?: string }) {
  const target = String(value);
  const [shown, setShown] = useState(target);
  const [ticking, setTicking] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (target === shown) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setShown(target);
      return;
    }

    setTicking(true);
    timers.current.forEach(clearTimeout);
    timers.current = [];

    for (let step = 1; step <= 3; step++) {
      timers.current.push(
        setTimeout(() => {
          setShown(
            target
              .split("")
              .map((ch) => (/\d/.test(ch) ? GLYPHS[Math.floor(Math.random() * 10)] : ch))
              .join("")
          );
        }, step * 70)
      );
    }
    timers.current.push(
      setTimeout(() => {
        setShown(target);
        setTicking(false);
      }, 4 * 70)
    );

    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <span className={`flap mono ${ticking ? "flap-tick" : ""} ${className}`}>{shown}</span>
  );
}
