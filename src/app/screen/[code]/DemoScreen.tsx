"use client";

/**
 * Offline fallback. Runs the whole game against a simulated crowd with no
 * database, no phones and no network. Press space to advance.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ScreenView, type ScreenState } from "@/components/ScreenView";
import { ROUND_SECONDS, TOTAL_ROUNDS } from "@/lib/supabase";
import { ROUND_SEEDS } from "@/lib/rounds";
import type { GameStatus } from "@/lib/types";

const BOTS = 62;

export function DemoScreen({ code }: { code: string }) {
  const [status, setStatus] = useState<GameStatus>("lobby");
  const [idx, setIdx] = useState(0);
  const [tally, setTally] = useState({ person: 0, model: 0 });
  const [playerCount, setPlayerCount] = useState(0);
  const [crowd, setCrowd] = useState(0);
  const [model, setModel] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Players trickle in during the lobby.
  useEffect(() => {
    if (status !== "lobby") return;
    const t = setInterval(() => setPlayerCount((n) => (n < BOTS ? n + 1 + Math.floor(Math.random() * 2) : n)), 400);
    return () => clearInterval(t);
  }, [status]);

  const startRound = useCallback((next: number) => {
    clearTimers();
    setIdx(next);
    setTally({ person: 0, model: 0 });
    setStatus("question");
    setSecondsLeft(ROUND_SECONDS);

    const seed = ROUND_SEEDS[next - 1];
    // Bias the simulated crowd toward the truth, but not too far.
    const leanPerson = seed.truth === "person" ? 0.63 : 0.41;
    for (let i = 0; i < BOTS; i++) {
      timers.current.push(
        setTimeout(
          () =>
            setTally((t) =>
              Math.random() < leanPerson
                ? { ...t, person: t.person + 1 }
                : { ...t, model: t.model + 1 }
            ),
          600 + Math.random() * 9000
        )
      );
    }
  }, []);

  useEffect(() => {
    if (status !== "question") return;
    const t = setInterval(() => setSecondsLeft((s) => (s === null ? null : Math.max(0, s - 1))), 1000);
    return () => clearInterval(t);
  }, [status]);

  const advance = useCallback(() => {
    if (status === "lobby") return startRound(1);
    if (status === "question" || status === "locked") {
      setSecondsLeft(null);
      const seed = ROUND_SEEDS[idx - 1];
      setTally((t) => {
        const crowdChoice = t.person >= t.model ? "person" : "model";
        if (crowdChoice === seed.truth) setCrowd((c) => c + 1);
        if (seed.model_answer === seed.truth) setModel((m) => m + 1);
        return t;
      });
      return setStatus("reveal");
    }
    if (status === "reveal") {
      return idx >= TOTAL_ROUNDS ? setStatus("final") : startRound(idx + 1);
    }
    if (status === "final") {
      clearTimers();
      setStatus("lobby");
      setIdx(0);
      setCrowd(0);
      setModel(0);
      setPlayerCount(0);
    }
  }, [status, idx, startRound]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  useEffect(() => clearTimers, []);

  const seed = idx > 0 ? ROUND_SEEDS[idx - 1] : null;
  const state: ScreenState = {
    code,
    status,
    roundIdx: idx,
    totalRounds: TOTAL_ROUNDS,
    body: seed?.body ?? null,
    truth: seed?.truth ?? null,
    modelAnswer: seed?.model_answer ?? null,
    modelConfidence: seed?.model_confidence ?? null,
    sourceNote: seed?.source_note ?? null,
    tally,
    playerCount,
    crowdScore: crowd,
    modelScore: model,
    secondsLeft,
    top: [],
    joinUrl: typeof window === "undefined" ? "" : `${window.location.origin}/play/${code}`,
  };

  return (
    <div onClick={advance} className="cursor-pointer">
      <ScreenView {...state} />
    </div>
  );
}
