## WhatsApp Support & Appointment Bot

A lightweight WhatsApp chatbot for support, FAQs, and appointment scheduling.
Built with @bot-whatsapp/bot (Baileys provider), natural-language date parsing, and optional Google Calendar + OpenAI integrations.

⚠️ Production note: This project uses an unofficial WhatsApp library (Baileys). For production or scale, consider the WhatsApp Business Platform and review WhatsApp’s Terms of Service.

## Features

-Welcome & menu flows (bilingual triggers supported).
-Appointment flow with natural-language dates (e.g., “next Monday at 9am”, “tomorrow 3 pm”).
-Confirmation + form flow to capture name, optional reference ID, and reason.
-Google Calendar integration (15-minute slots, configurable workdays/hours).
-FAQ flow and a simple “join as courier” info flow (brand-neutral).
-Voice notes → text via OpenAI Whisper (optional).
-Timezone & locale via env (TZ, LANG) — no hardcoded region.
-No secrets in code: .env + .gitignore included.

## Folder Structure

├─ app.js                      # Entry point, bot wiring
├─ flows/
│  ├─ welcome.flow.js          # Greeting + options
│  ├─ date.flow.js             # Date capture + availability + confirmation
│  ├─ form.flow.js             # Name / reference ID / reason + create event
├─ scripts/
│  ├─ calendar.js              # Google Calendar helpers (create/list/slots)
│  ├─ chatgpt.js               # OpenAI chat wrapper (optional)
│  ├─ utils.js                 # text2iso / iso2text using LLM + Luxon
│  └─ whisper.js               # Voice transcription (optional)
├─ .env.example                # Environment variable template (no secrets)
├─ .gitignore                  # Prevents committing secrets/sessions
└─ README.md


## Requirements

-Node.js 18+
-A WhatsApp account to pair via QR (Baileys).
-(Optional) Google Cloud service account with Calendar API enabled.
-(Optional) OpenAI API key for LLM date parsing and/or voice transcription.

# Quick Start

# 1) Clone
git clone <your-repo-url>
cd <your-repo>

# 2) Configure env
cp .env.example .env
# Edit .env with your values (see below)

# 3) Install
npm install

# 4) Run (dev)
node app.js
# A QR portal will open; scan it with the WhatsApp account used for the bot.


## Environment Variables (.env)

# --- Google Calendar ---
GOOGLE_APPLICATION_CREDENTIALS=./secrets/google.json  # path to your service account JSON
GOOGLE_CALENDAR_ID=primary                             # or your calendar ID

# --- Locale / Timezone ---
TZ=America/Santo_Domingo
LANG=en-US

# --- OpenAI (optional, for chat & whisper) ---
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini                # e.g., gpt-4o, gpt-3.5-turbo
OPENAI_TRANSCRIPTION_MODEL=whisper-1    # for voice transcription


## How It Works

Welcome flow → greets and offers menu options.

Menu flow → routes to:

Schedule appointment → date.flow.js

Uses scripts/utils.text2iso() to parse natural-language dates (via OpenAI if enabled).

Checks availability through scripts/calendar.js:

Workdays/hours configurable (default Mon–Fri, 09:00–17:00, 15-min slots).

Creates the calendar event with createEvent() after confirmation.

FAQs → predefined answers (brand-neutral).

Join → generic info; replace the signup link with your official URL.

Voice notes (optional) → scripts/whisper.js downloads audio, converts OGG→MP3, transcribes via OpenAI Whisper.
