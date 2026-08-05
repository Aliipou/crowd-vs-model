import type { Choice } from "./types";

/**
 * PLACEHOLDER CONTENT.
 * These eight texts were written for the scaffold so the game runs end to end.
 * Before the event, replace them with real samples: genuine human writing you
 * collected, and genuine model output. Set `truth` honestly, and set
 * `model_answer` / `model_confidence` from what a model actually answered.
 */
export type RoundSeed = {
  body: string;
  truth: Choice;
  model_answer: Choice;
  model_confidence: number;
  source_note: string;
};

export const ROUND_SEEDS: RoundSeed[] = [
  {
    body: "The coffee machine on floor two has been broken since March. Nobody has filed a ticket because everyone assumes someone else already did. I have started bringing a thermos instead.",
    truth: "person",
    model_answer: "model",
    model_confidence: 71,
    source_note: "Written by a person. The model was fooled by the tidy ending.",
  },
  {
    body: "Effective communication forms the cornerstone of any successful team. By fostering an environment of openness and mutual respect, organisations can unlock the full potential of their workforce and drive meaningful outcomes.",
    truth: "model",
    model_answer: "model",
    model_confidence: 88,
    source_note: "Model output. Abstract nouns, no specifics, nothing at stake.",
  },
  {
    body: "My grandmother kept every receipt from 1994 onward in a biscuit tin. When she died we found a note at the bottom that just said: the tin is worth more than what is in it.",
    truth: "person",
    model_answer: "person",
    model_confidence: 64,
    source_note: "Written by a person. Concrete detail plus an unresolved ending.",
  },
  {
    body: "Rain started around four. I moved the bikes under the stairs, which took longer than it should have because the lock was stiff again. Made soup. The neighbour's dog barked until eight.",
    truth: "model",
    model_answer: "person",
    model_confidence: 55,
    source_note: "Model output, prompted to imitate a diary. Low confidence, and wrong.",
  },
  {
    body: "honestly the deploy went fine?? like i had three fallback plans and used none of them. slightly annoyed about that tbh. anyway it is live, going to go lie down",
    truth: "person",
    model_answer: "model",
    model_confidence: 60,
    source_note: "Written by a person. Casual register is not a reliable signal.",
  },
  {
    body: "As we look toward the future, it becomes increasingly clear that innovation and sustainability are not competing priorities but complementary forces that will define the next chapter of our shared journey.",
    truth: "model",
    model_answer: "model",
    model_confidence: 92,
    source_note: "Model output. The highest-confidence call of the game.",
  },
  {
    body: "I have read the same paragraph four times and I still could not tell you what it says. The problem is not the paragraph. The problem is that I have not slept properly since Tuesday.",
    truth: "person",
    model_answer: "person",
    model_confidence: 77,
    source_note: "Written by a person.",
  },
  {
    body: "The train was late, so I counted the tiles on the platform. Two hundred and six, unless I miscounted around the bench, which I probably did. Nobody else looked up from their phone.",
    truth: "model",
    model_answer: "person",
    model_confidence: 51,
    source_note: "Model output. A coin flip for the model, and it lost.",
  },
];
