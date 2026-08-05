"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, newCode } from "@/lib/supabase";
import { ROUND_SEEDS } from "@/lib/rounds";

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [join, setJoin] = useState("");

  async function createRoom() {
    setBusy(true);
    setError(null);
    const code = newCode();
    const { data: game, error: gErr } = await supabase
      .from("games")
      .insert({ code })
      .select()
      .single();
    if (gErr || !game) {
      setBusy(false);
      setError("Could not reach the database. Check the Supabase env vars.");
      return;
    }
    const { error: rErr } = await supabase.from("rounds").insert(
      ROUND_SEEDS.map((r, i) => ({
        game_id: game.id,
        idx: i + 1,
        body: r.body,
        truth: r.truth,
        model_answer: r.model_answer,
        model_confidence: r.model_confidence,
        source_note: r.source_note,
      }))
    );
    if (rErr) {
      setBusy(false);
      setError("Room made, but the rounds failed to seed. Check the migration ran.");
      return;
    }
    router.push(`/host/${code}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 px-6">
      <div>
        <p className="eyebrow">Live game</p>
        <h1 className="display text-7xl text-paper">
          Crowd <span className="text-dim">vs</span> <span className="text-signal">Model</span>
        </h1>
        <p className="mt-4 text-dim">
          The whole room reads the same text and decides: person or model? The model answers
          too. Eight rounds, one scoreboard.
        </p>
      </div>

      <button
        onClick={createRoom}
        disabled={busy}
        className="rounded bg-amber px-6 py-5 text-xl font-semibold text-ink disabled:opacity-40"
      >
        {busy ? "Setting up…" : "Start a room"}
      </button>

      <div className="flex gap-2">
        <input
          value={join}
          onChange={(e) => setJoin(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="ROOM CODE"
          className="mono w-full rounded bg-slab px-4 py-4 text-paper placeholder:text-dim"
        />
        <button
          onClick={() => join.length === 4 && router.push(`/play/${join}`)}
          className="rounded border border-slab px-6 text-paper"
        >
          Join
        </button>
      </div>

      {error && <p className="text-sm text-amber">{error}</p>}
    </main>
  );
}
