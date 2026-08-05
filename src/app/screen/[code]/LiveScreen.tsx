"use client";

import { useEffect, useMemo, useState } from "react";
import { ScreenView, type ScreenState } from "@/components/ScreenView";
import { supabase, ROUND_SECONDS, TOTAL_ROUNDS } from "@/lib/supabase";
import type { Game, Player, Round, Vote } from "@/lib/types";

export function LiveScreen({ code }: { code: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [missing, setMissing] = useState(false);

  // Load + poll fallback. Realtime is the fast path, this is the safety net.
  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: g } = await supabase.from("games").select("*").eq("code", code).maybeSingle();
      if (!alive) return;
      if (!g) {
        setMissing(true);
        return;
      }
      setMissing(false);
      setGame(g as Game);
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.from("rounds").select("*").eq("game_id", g.id).order("idx"),
        supabase.from("players").select("*").eq("game_id", g.id),
      ]);
      if (!alive) return;
      setRounds((r ?? []) as Round[]);
      setPlayers((p ?? []) as Player[]);
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

  // Votes for the current round only.
  useEffect(() => {
    if (!round) {
      setVotes([]);
      return;
    }
    let alive = true;
    supabase
      .from("votes")
      .select("*")
      .eq("round_id", round.id)
      .then(({ data }) => alive && setVotes((data ?? []) as Vote[]));

    const channel = supabase
      .channel(`votes:${round.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `round_id=eq.${round.id}` },
        (payload) => setVotes((v) => [...v, payload.new as Vote])
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [round?.id]);

  // Game row + players.
  useEffect(() => {
    if (!game?.id) return;
    const channel = supabase
      .channel(`game:${game.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${game.id}` },
        (payload) => setGame(payload.new as Game)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "players", filter: `game_id=eq.${game.id}` },
        (payload) => setPlayers((p) => [...p, payload.new as Player])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [game?.id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  if (missing) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-4">
        <p className="display text-[6vw] text-paper">No room {code}</p>
        <p className="text-dim">Check the code, or start a new room from the home page.</p>
      </main>
    );
  }

  const tally = votes.reduce(
    (acc, v) => {
      if (v.choice === "person") acc.person += 1;
      else acc.model += 1;
      return acc;
    },
    { person: 0, model: 0 }
  );

  const secondsLeft =
    game?.status === "question" && game.round_started_at
      ? Math.max(0, ROUND_SECONDS - Math.floor((now - new Date(game.round_started_at).getTime()) / 1000))
      : null;

  const state: ScreenState = {
    code,
    status: game?.status ?? "lobby",
    roundIdx: game?.current_round ?? 0,
    totalRounds: TOTAL_ROUNDS,
    body: round?.body ?? null,
    truth: round?.truth ?? null,
    modelAnswer: round?.model_answer ?? null,
    modelConfidence: round?.model_confidence ?? null,
    sourceNote: round?.source_note ?? null,
    tally,
    playerCount: players.length,
    crowdScore: game?.crowd_score ?? 0,
    modelScore: game?.model_score ?? 0,
    secondsLeft,
    top: [...players].sort((a, b) => b.score - a.score).slice(0, 5),
    joinUrl: typeof window === "undefined" ? "" : `${window.location.origin}/play/${code}`,
  };

  return <ScreenView {...state} />;
}
