export type Choice = "person" | "model";
export type GameStatus = "lobby" | "question" | "locked" | "reveal" | "final";

export type Game = {
  id: string;
  code: string;
  status: GameStatus;
  current_round: number;
  crowd_score: number;
  model_score: number;
  round_started_at: string | null;
};

export type Round = {
  id: string;
  game_id: string;
  idx: number;
  body: string;
  truth: Choice;
  model_answer: Choice;
  model_confidence: number;
  source_note: string | null;
};

export type Player = { id: string; game_id: string; nickname: string; score: number };
export type Vote = { id: string; round_id: string; player_id: string; choice: Choice };
