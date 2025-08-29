# WhatsApp Support and Appointment Bot

A simple WhatsApp chatbot for support, FAQs, and appointment scheduling.
Built with @bot-whatsapp/bot (Baileys provider), optional Google Calendar, and optional OpenAI.

NOTE: This project uses an unofficial WhatsApp library (Baileys). For production, consider the WhatsApp Business Platform and review WhatsApp Terms of Service.

## Features

- Welcome and main menu flows
- Appointment flow with natural-language dates (e.g., "next Monday 9am", "tomorrow 3 pm")
- Confirmation + form flow (name, optional reference ID, reason)
- Google Calendar integration (15-minute slots, configurable workdays/hours)
- FAQ flow and a neutral "join as courier" info flow
- Voice notes to text via OpenAI Whisper (optional)
- Locale and timezone via environment variables (LANG, TZ)
- No secrets in code: .env.example + .gitignore included

## Project Structure

```
.
├─ app.js
├─ flows/
│  ├─ welcome.flow.js
│  ├─ date.flow.js
│  └─ form.flow.js
├─ scripts/
│  ├─ calendar.js
│  ├─ chatgpt.js
│  ├─ utils.js
│  └─ voice.js   (optional)
├─ .env.example
├─ .gitignore
└─ README.md
```

## Requirements

- Node.js 18 or newer
- A WhatsApp account to pair via QR (Baileys)
- (Optional) Google Cloud service account with Calendar API enabled
- (Optional) OpenAI API key for chat and/or transcription

## Quick Start

```bash
# 1) Clone
git clone <your-repo-url>
cd <your-repo>

# 2) Configure env
cp .env.example .env
# Edit .env with your values

# 3) Install
npm install

# 4) Run (dev)
node app.js
# A QR portal will open; scan it with the WhatsApp account you will use for the bot.
```

## Environment Variables (.env)

```ini
# Google Calendar
GOOGLE_APPLICATION_CREDENTIALS=./secrets/google.json   # path to your service account JSON
GOOGLE_CALENDAR_ID=primary                              # or your calendar ID

# Locale / Timezone
TZ=America/Santo_Domingo
LANG=en-US

# OpenAI (optional)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_TRANSCRIPTION_MODEL=whisper-1
```

Put your JSON at the path set in GOOGLE_APPLICATION_CREDENTIALS (for example: ./secrets/google.json).
Never commit secrets or session files. The .gitignore in this repo is configured to help.

## How It Works

- Welcome flow greets and offers options
- Menu flow routes to:
  - Schedule appointment -> flows/date.flow.js
    - Parses natural-language dates with scripts/utils.text2iso()
    - Checks availability with scripts/calendar.js (Mon-Fri, 09:00-17:00 by default, 15-min slots)
    - On confirmation, creates the event with createEvent()
  - FAQs -> predefined neutral answers
  - Join -> generic info; replace the signup link with your official URL
- Voice notes (optional) -> scripts/voice.js downloads audio, converts OGG to MP3, transcribes with Whisper

## Customization

- Working hours/days/slot size: edit rangeLimit and standardDurationMinutes in scripts/calendar.js
- Locale and timezone: set LANG and TZ in .env
- Calendar: set GOOGLE_CALENDAR_ID (primary or a specific ID)
- Models: set OPENAI_MODEL and OPENAI_TRANSCRIPTION_MODEL in .env

## Security

- No API keys or calendar IDs are hardcoded. Use .env
- .gitignore prevents committing .env, secrets/, WhatsApp sessions, logs, and temp media
- If you accidentally committed secrets:
  1) Revoke the exposed keys
  2) Rewrite history with BFG or git filter-repo

## Commands

```bash
# Run
node app.js

# (optional) Lint / Test if you add them
npm run lint
npm test
```

## License

MIT (see LICENSE)
