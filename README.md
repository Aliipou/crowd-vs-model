# Crowd vs Model

A live hackathon game. The whole room reads the same short text and decides: person or
model? The model answered too. Eight rounds, one scoreboard on the projector.

Built to win an audience vote: the people voting are inside the product during the demo.

## Three surfaces

| Route | Device | Job |
|---|---|---|
| `/` | Anywhere | Start a room, or join by code |
| `/host/CODE` | Presenter's phone or laptop | Start round, lock, reveal, next, reset |
| `/screen/CODE` | Projector | The show — QR, question, live bars, split-flap scoreboard |
| `/play/CODE` | Every phone in the room | Nickname, then two big buttons |

## Setup (about 10 minutes)

1. **Supabase** — create a free project. Open the SQL editor, paste all of
   `supabase/migration.sql`, run it. Then Database → Replication and confirm `games`,
   `votes` and `players` are in the `supabase_realtime` publication (the migration adds
   them; re-running it will error harmlessly on the `alter publication` lines).
2. **Env** — copy `.env.example` to `.env.local` and fill in the project URL and the
   **anon** key from Supabase → Project Settings → API.
3. **Run** — `npm install && npm run dev`, open http://localhost:3000
4. **Deploy** — push to GitHub, import in Vercel, add the same two env vars, deploy.
   No other configuration is needed.

There is no auth and RLS is off. That is deliberate for a one-evening event; do not leave
it running afterwards.

## Demo mode

`/screen/ANY?demo=1` runs the entire game against ~60 simulated voters with no database,
no phones and no internet. Space or click advances. Use it if the venue wifi dies, and use
it to rehearse.

## Replace the content before the event

`src/lib/rounds.ts` ships with eight placeholder texts written for this scaffold. The game
is only honest if the labels are real — collect genuine human writing, generate genuine
model output, and set `truth`, `model_answer` and `model_confidence` from what actually
happened. Keep each text under about 40 words so it reads from the back of the room.

## Design

Tokens live in `src/app/globals.css`: ink `#10141C`, amber `#FFB020` for the crowd, teal
`#4DE1C1` for the model. Archivo Narrow for display, IBM Plex Mono for numbers. The one
piece of motion is the split-flap flip on the scores — everything else stays still on
purpose.

## Running order on stage (3 minutes)

1. `/screen/CODE` is already open in lobby. "Scan the code." Wait 20 seconds and let the
   join counter climb — that is the pitch.
2. Round 1: read the text aloud, watch the bars move, reveal.
3. Rounds 2 and 3, faster.
4. Final score. One sentence on how it works. Stop talking.
