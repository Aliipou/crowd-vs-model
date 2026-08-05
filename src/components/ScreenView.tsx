"use client";

import { QRCodeSVG } from "qrcode.react";
import { SplitFlap } from "./SplitFlap";
import type { Choice, GameStatus } from "@/lib/types";

export type ScreenState = {
  code: string;
  status: GameStatus;
  roundIdx: number;
  totalRounds: number;
  body: string | null;
  truth: Choice | null;
  modelAnswer: Choice | null;
  modelConfidence: number | null;
  sourceNote: string | null;
  tally: { person: number; model: number };
  playerCount: number;
  crowdScore: number;
  modelScore: number;
  secondsLeft: number | null;
  top: { nickname: string; score: number }[];
  joinUrl: string;
};

function pct(a: number, b: number) {
  const total = a + b;
  return total === 0 ? 50 : Math.round((a / total) * 100);
}

export function ScreenView(s: ScreenState) {
  const revealing = s.status === "reveal";
  const personPct = pct(s.tally.person, s.tally.model);
  const modelPct = 100 - personPct;
  const crowdChoice: Choice = s.tally.person >= s.tally.model ? "person" : "model";

  return (
    <main className="flex h-dvh w-full flex-col bg-ink p-[2vw]">
      {/* header */}
      <header className="flex items-baseline justify-between">
        <div className="eyebrow text-[1.1vw]">
          Room <span className="text-paper">{s.code}</span>
        </div>
        <div className="eyebrow text-[1.1vw]">
          {s.playerCount} joined
          {s.secondsLeft !== null && (
            <span className="ml-[2vw] text-amber">{s.secondsLeft}s</span>
          )}
        </div>
        <div className="eyebrow text-[1.1vw]">
          {s.status === "final" ? "Final" : `Round ${Math.max(s.roundIdx, 1)}/${s.totalRounds}`}
        </div>
      </header>

      {/* body */}
      {s.status === "lobby" ? (
        <section className="flex flex-1 items-center justify-center gap-[5vw]">
          <div className="rounded-[1vw] bg-paper p-[1.5vw]">
            <QRCodeSVG value={s.joinUrl} size={340} bgColor="#F2EFE6" fgColor="#10141C" />
          </div>
          <div>
            <p className="eyebrow text-[1.4vw]">Join at</p>
            <p className="display text-[4vw] text-paper">{s.joinUrl.replace(/^https?:\/\//, "")}</p>
            <p className="mt-[2vw] display text-[10vw] text-amber">{s.code}</p>
            <p className="mt-[1vw] text-[1.3vw] text-dim">Waiting for players — share the code.</p>
          </div>
        </section>
      ) : s.status === "final" ? (
        <section className="flex flex-1 flex-col items-center justify-center">
          <p className="eyebrow text-[1.4vw]">
            {s.crowdScore === s.modelScore
              ? "A draw"
              : s.crowdScore > s.modelScore
                ? "The room wins"
                : "The model wins"}
          </p>
          <div className="mt-[2vw] flex items-center gap-[4vw] display text-[12vw]">
            <span className="text-amber">
              <SplitFlap value={s.crowdScore} />
            </span>
            <span className="text-dim text-[6vw]">vs</span>
            <span className="text-signal">
              <SplitFlap value={s.modelScore} />
            </span>
          </div>
          {s.top.length > 0 && (
            <ol className="mt-[3vw] flex gap-[2.5vw] mono text-[1.6vw]">
              {s.top.map((p, i) => (
                <li key={p.nickname + i} className="text-dim">
                  <span className="text-paper">{p.nickname}</span> {p.score}
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : (
        <section className="flex flex-1 flex-col justify-center gap-[3vh]">
          <p className="eyebrow text-[1.3vw]">Who wrote this?</p>
          <p className="display max-w-[85vw] text-[3.6vw] text-paper">{s.body}</p>

          <div className="grid grid-cols-2 gap-[2vw]">
            {(["person", "model"] as Choice[]).map((side) => {
              const isPerson = side === "person";
              const share = isPerson ? personPct : modelPct;
              const colour = isPerson ? "var(--amber)" : "var(--signal)";
              const isTruth = revealing && s.truth === side;
              return (
                <div
                  key={side}
                  className="rounded-[0.4vw] bg-slab p-[1.2vw]"
                  style={{ outline: isTruth ? `0.3vw solid ${colour}` : "none" }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="display text-[2.6vw]" style={{ color: colour }}>
                      {isPerson ? "Person" : "Model"}
                    </span>
                    <span className="mono text-[2.2vw] text-paper">{share}%</span>
                  </div>
                  <div className="mt-[0.8vw] h-[1.6vw] w-full overflow-hidden rounded-[0.2vw] bg-ink">
                    <div
                      className="h-full transition-[width] duration-300"
                      style={{ width: `${share}%`, background: colour }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {revealing && (
            <div className="flex items-baseline justify-between gap-[2vw]">
              <p className="display text-[2.4vw] text-paper">
                It was <span className="text-amber">{s.truth}</span>.{" "}
                <span className="text-dim">
                  The room said {crowdChoice}, the model said {s.modelAnswer} at{" "}
                  {s.modelConfidence}%.
                </span>
              </p>
            </div>
          )}
          {revealing && s.sourceNote && (
            <p className="text-[1.2vw] text-dim">{s.sourceNote}</p>
          )}
        </section>
      )}

      {/* scoreboard */}
      {s.status !== "final" && (
        <footer className="flex items-center justify-between border-t border-slab pt-[1.2vw]">
          <div className="flex items-baseline gap-[1vw]">
            <span className="eyebrow text-[1.1vw]">Crowd</span>
            <span className="display text-[3.4vw] text-amber">
              <SplitFlap value={s.crowdScore} />
            </span>
          </div>
          {s.status !== "lobby" && (
            <div className="rounded-[0.6vw] bg-paper p-[0.5vw]">
              <QRCodeSVG value={s.joinUrl} size={72} bgColor="#F2EFE6" fgColor="#10141C" />
            </div>
          )}
          <div className="flex items-baseline gap-[1vw]">
            <span className="eyebrow text-[1.1vw]">Model</span>
            <span className="display text-[3.4vw] text-signal">
              <SplitFlap value={s.modelScore} />
            </span>
          </div>
        </footer>
      )}
    </main>
  );
}
