"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, ROUND_SECONDS } from "@/lib/supabase";
import type { Choice, Game, Round } from "@/lib/types";

export function PlayClient({ code }: { code: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [joining, setJoining] = useState(false);

  const storageKey = `cvm:${code}`;

  useEffect(() => {
    setPlayerId(localStorage.getItem(storageKey));
  }, [storageKey]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: g } = await supabase.from("games").select("*").eq("code", code).maybeSingle();
      if (!alive) return;
      if (!g) {
        setError(`No room ${code}. Check the code on the screen.`);
        return;
      }
      setError(null);
      setGame(g as Game);
      const { data: r } = await supabase.from("rounds").select("*").eq("game_id", g.id).order("idx");
      if (alive) setRounds((r ?? []) as Round[]);
    }
    load();
    const poll = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [code]);

  useEffect(() => {
    if (!game?.id) return;
    const channel = supabase
      .channel(`play:${game.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${game.id}` },
        (payload) => setGame(payload.new as Game)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id]);

  const round = useMemo(
    () => rounds.find((r) => r.idx === game?.current_round) ?? null,
    [rounds, game?.current_round]
  );

  // A new round clears the previous answer.
  useEffect(() => setChoice(null), [round?.id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  async function join() {
    if (!game || nickname.trim().length === 0 || joining) return;
    setJoining(true);
    const { data, error: err } = await supabase
      .from("players")
      .insert({ game_id: game.id, nickname: nickname.trim().slice(0, 16) })
      .select()
      .single();
    setJoining(false);
    if (err || !data) {
      setError("Could not join. Try again.");
      return;
    }
    localStorage.setItem(storageKey, data.id);
    setPlayerId(data.id);
  }

  async function vote(c: Choice) {
    if (!round || !playerId || choice || game?.status !== "question") return;
    setChoice(c);
    const { error: err } = await supabase
      .from("votes")
      .insert({ round_id: round.id, player_id: playerId, choice: c });
    if (err && err.code !== "23505") {
      setChoice(null);
      setError("That did not send. Tap again.");
    }
  }

  const secondsLeft =
    game?.status === "question" && game.round_started_at
      ? Math.max(0, ROUND_SECONDS - Math.floor((now - new Date(game.round_started_at).getTime()) / 1000))
      : null;

  if (error) return <Frame><p className="text-center text-lg text-paper">{error}</p></Frame>;
  if (!game) return <Frame><p className="eyebrow">Connecting…</p></Frame>;

  if (!playerId) {
    return (
      <Frame>
        <p className="eyebrow mb-2">Room {code}</p>
        <h1 className="display mb-8 text-5xl text-paper">Pick a name</h1>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && join()}
          maxLength={16}
          autoFocus
          placeholder="e.g. ali"
          className="w-full rounded bg-slab px-4 py-4 text-2xl text-paper placeholder:text-dim"
        />
        <button
          onClick={join}
          disabled={nickname.trim().length === 0 || joining}
          className="mt-4 w-full rounded bg-amber px-4 py-4 text-2xl font-semibold text-ink disabled:opacity-40"
        >
          {joining ? "Joining…" : "Join"}
        </button>
      </Frame>
    );
  }

  if (game.status === "question" && round) {
    if (choice) {
      return (
        <Frame>
          <p className="eyebrow mb-3">Locked in</p>
          <p className="display text-6xl" style={{ color: choice === "person" ? "var(--amber)" : "var(--signal)" }}>
            {choice === "person" ? "Person" : "Model"}
          </p>
          <p className="mt-6 text-dim">Watch the screen.</p>
        </Frame>
      );
    }
    return (
      <main className="flex h-dvh flex-col">
        <div className="h-2 w-full bg-slab">
          <div
            className="h-full bg-amber transition-[width] duration-500"
            style={{ width: `${((secondsLeft ?? 0) / ROUND_SECONDS) * 100}%` }}
          />
        </div>
        <button
          onClick={() => vote("person")}
          className="flex flex-1 items-center justify-center bg-amber text-ink display text-6xl active:opacity-80"
        >
          Person
        </button>
        <button
          onClick={() => vote("model")}
          className="flex flex-1 items-center justify-center bg-signal text-ink display text-6xl active:opacity-80"
        >
          Model
        </button>
      </main>
    );
  }

  if (game.status === "reveal" && round) {
    const right = choice !== null && choice === round.truth;
    return (
      <Frame>
        <p className="eyebrow mb-3">Round {round.idx}</p>
        <p className="display text-5xl text-paper">It was {round.truth}.</p>
        {choice !== null && (
          <p className="mt-4 text-xl" style={{ color: right ? "var(--signal)" : "var(--dim)" }}>
            {right ? "You got it." : "Not this time."}
          </p>
        )}
      </Frame>
    );
  }

  if (game.status === "final") {
    return (
      <Frame>
        <p className="eyebrow mb-3">Final</p>
        <p className="display text-5xl text-paper">
          Crowd {game.crowd_score} — Model {game.model_score}
        </p>
        <p className="mt-6 text-dim">Thanks for playing.</p>
      </Frame>
    );
  }

  return (
    <Frame>
      <p className="eyebrow mb-3">Room {code}</p>
      <p className="display text-5xl text-paper">You are in.</p>
      <p className="mt-6 text-dim">Waiting for the next round.</p>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-dvh flex-col justify-center px-6">
      <div className="w-full">{children}</div>
    </main>
  );
}
