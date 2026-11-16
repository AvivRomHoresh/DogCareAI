# DogCareAI

DogCareAI is a full-stack web app for managing everyday dog care. Owners can keep profiles for multiple dogs, track upcoming care, and find nearby services. Doggy, the built-in AI assistant, uses the selected dog’s profile and relevant reminders to tailor its answers.

**[Try the live demo](https://dog-care-ai.vercel.app/)** · Sign in or create an account, add a sample dog and a care reminder, then open Doggy from the floating chat button and ask about that dog’s routine.

## Features

| Feature | What you can do |
| --- | --- |
| **Dog profiles and dashboard** | Create, edit, and archive profiles. Switch between dogs to see upcoming and overdue reminders for each one. |
| **Care reminders** | Create, edit, complete, and delete reminders. Connect Telegram to receive due reminders and send a test message to verify the connection. |
| **Doggy assistant** | Ask general care questions in a floating chat. The assistant uses the selected dog’s context, and the conversation stays in memory. |
| **Nearby places** | Find vets and other dog-related services using your device location or a place name. Results and response times depend on public OpenStreetMap services. |
| **Product recommendations** | Browse a curated catalog matched to the selected dog, see additional product details from Open Pet Food Facts for eligible items, and save favorites in the browser. |

## How it was built

**One active dog across the app.** A shared selection keeps the dashboard, reminders, recommendations, and chat focused on the same dog. The frontend uses React, TypeScript, Vite, Tailwind CSS, and React Router.

**AI with care context.** When the owner sends a question, the [assistant API](api/assistant.js) verifies the Supabase session and checks dog ownership. It builds a prompt from the dog’s profile and relevant reminders, then calls Gemini from a Vercel function. When emergency keywords trigger a rule, the function directs the user to a veterinarian and skips the model call. Mock mode lets developers try the chat flow without a Gemini API key.

**Accounts and data isolation.** Supabase Auth handles email/password and Google sign-in, with a dedicated password recovery flow. Supabase Postgres stores dog profiles, reminders, and notification settings. The [database migrations](supabase/migrations) define row-level security policies to restrict access to user-owned data.

**Reminders that run with the app closed.** An external scheduler calls a [Vercel function](api/telegram/reminders/scheduled-check.js) that looks up due reminders in Supabase and sends them through the Telegram Bot API. The function records deliveries to prevent duplicate notifications on subsequent checks.

## Run locally

You’ll need Node.js with npm and a Supabase project.

```bash
git clone https://github.com/AvivRomHoresh/DogCareAI.git
cd DogCareAI
npm ci
cp .env.example .env.local
```

On PowerShell, use `Copy-Item .env.example .env.local` for the copy step.

1. Apply the SQL files in [`supabase/migrations`](supabase/migrations) in filename order using the Supabase SQL Editor.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` using the project URL and public anon key.
3. In Supabase Auth, allow the local app URL and its `/update-password` URL as redirects. Enable email confirmation or configure the Google provider if you want to exercise those flows.
4. Run `npm run dev` and open the URL printed by Vite, typically `http://localhost:5173`.

To run the Assistant and Telegram API routes locally, link a Vercel project and start it with `vercel dev`. Add the local URL printed by the CLI and its `/update-password` URL to the Supabase Auth redirect allowlist. Use `MOCK_AI_MODE=true` for the Assistant demo. To enable Gemini, set `MOCK_AI_MODE=false` and supply `GEMINI_API_KEY` as a server-side environment variable. See [`.env.example`](.env.example) for available settings.

```bash
npm run lint   # TypeScript check
npm run build  # TypeScript check and production bundle
```
