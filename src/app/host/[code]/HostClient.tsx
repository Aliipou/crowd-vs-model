"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, TOTAL_ROUNDS } from "@/lib/supabase";
import type { Game, Round } from "@/lib/types";

export function HostClient({ code }: { code: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [players, setPlayers] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: g } = await supabase.from("games").select("*").eq("code", code).maybeSingle();
      if (!alive || !g) return;
      setGame(g as Game);
      const [{ data: r }, { count }] = await Promise.all([
        supabase.from("rounds").select("*").eq("game_id", g.id).order("idx"),
        supabase.from("players").select("*", { count: "exact", head: true }).eq("game_id", g.id),
      ]);
      if (!alive) return;
      setRounds((r ?? []) as Round[]);
      setPlayers(count ?? 0);
    }
    load();
    const poll = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [code]);

  const round = useMemo(
    () => rounds.find((r) => r.idx === game?.current_round) ?? null,
    [rounds, game?.current_round]
  );

  async function patch(fields: Partial<Game>) {
    if (!game) return;
    setBusy(true);
    const { data } = await supabase.from("games").update(fields).eq("id", game.id).select().single();
    if (data) setGame(data as Game);
    setBusy(false);
  }

  async function startRound(idx: number) {
    setNote(null);
    await patch({ current_round: idx, status: "question", round_started_at: new Date().toISOString() });
  }

  async function reveal() {
    if (!game || !round) return;
    setBusy(true);
    const { data: votes } = await supabase.from("votes").select("choice").eq("round_id", round.id);
    const person = (votes ?? []).filter((v) => v.choice === "person").length;
    const model = (votes ?? []).length - person;
    const crowdChoice = person >= model ? "person" : "model";
    await supabase.rpc("score_round", { p_round: round.id });
    setBusy(false);
    await patch({
      status: "reveal",
      crowd_score: game.crowd_score + (crowdChoice === round.truth ? 1 : 0),
      model_score: game.model_score + (round.model_answer === round.truth ? 1 : 0),
    });
    setNote(`${person} person / ${model} model — truth was ${round.truth}`);
  }

  async function reset() {
    if (!game) return;
    await supabase.from("players").delete().eq("game_id", game.id);
    await patch({ status: "lobby", current_round: 0, crowd_score: 0, model_score: 0, round_started_at: null });
  }

  if (!game) {
    return (
      <main className="flex h-dvh items-center justify-center">
        <p className="eyebrow">Loading room {code}…</p>
      </main>
    );
  }

  const s = game.status;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-5 px-5 py-8">
      <header>
        <p className="eyebrow">Host</p>
        <h1 className="display text-6xl text-amber">{code}</h1>
        <p className="mt-2 mono text-sm text-dim">
          {s} · round {game.current_round}/{TOTAL_ROUNDS} · {players} players · crowd{" "}
          {game.crowd_score} — model {game.model_score}
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <a className="rounded bg-slab px-4 py-3 text-paper" href={`/screen/${code}`} target="_blank">
          Open the screen ↗
        </a>
        <a className="rounded bg-slab px-4 py-3 text-paper" href={`/play/${code}`} target="_blank">
          Open a player view ↗
        </a>
      </div>

      {round && (
        <p className="rounded bg-slab p-4 text-sm text-dim">
          <span className="text-paper">Round {round.idx}:</span> {round.body.slice(0, 90)}…
          <br />
          truth <span className="text-paper">{round.truth}</span> · model said{" "}
          <span className="text-paper">{round.model_answer}</span> ({round.model_confidence}%)
        </p>
      )}

      {note && <p className="mono text-sm text-signal">{note}</p>}

      <div className="mt-auto flex flex-col gap-3">
        {s === "lobby" && <Btn onClick={() => startRound(1)} busy={busy}>Start round 1</Btn>}
        {s === "question" && <Btn onClick={() => patch({ status: "locked" })} busy={busy}>Lock votes</Btn>}
        {(s === "question" || s === "locked") && <Btn onClick={reveal} busy={busy}>Reveal</Btn>}
        {s === "reveal" &&
          (game.current_round >= TOTAL_ROUNDS ? (
            <Btn onClick={() => patch({ status: "final" })} busy={busy}>Show final score</Btn>
          ) : (
            <Btn onClick={() => startRound(game.current_round + 1)} busy={busy}>
              Start round {game.current_round + 1}
            </Btn>
          ))}
        <button onClick={reset} className="rounded border border-slab px-4 py-3 text-dim">
          Reset room
        </button>
      </div>
    </main>
  );
}

function Btn({
  onClick,
  busy,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="rounded bg-amber px-4 py-5 text-xl font-semibold text-ink disabled:opacity-40"
    >
      {children}
    </button>
  );
}
