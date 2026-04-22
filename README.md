# Conversational AI Scheduler — WhatsApp Booking Assistant

> AI-powered conversational system for automated customer support and scheduling via WhatsApp.

---

## The Problem

Businesses lose time and customers managing appointment scheduling and support manually. Repetitive questions, missed bookings, and no 24/7 availability create friction that hurts retention.

## The Solution

A fully automated WhatsApp assistant that handles customer support and appointment booking end-to-end — no human intervention required for routine interactions.

Built with conversational flows, Google Calendar integration, OpenAI-powered responses, and voice message transcription (Whisper).

---

## Key Features

| Feature | Description |
|---|---|
| 🗓️ **Smart Scheduling** | Books appointments in 15-min slots, Mon–Fri, with real-time availability checks |
| 🧠 **AI Responses** | OpenAI-powered answers for FAQs and open-ended queries |
| 🎙️ **Voice Input** | Transcribes voice notes via OpenAI Whisper — a rare differentiator |
| 📅 **Calendar Integration** | Syncs directly with Google Calendar; creates events automatically |
| 💬 **Conversational Flows** | Natural-language date parsing ("next Monday 9am", "tomorrow 3pm") |
| ⚙️ **Configurable Logic** | Working hours, slot size, locale, and timezone via environment variables |
| 🔒 **Secure by Default** | No secrets in code — `.env`-based config, `.gitignore` pre-configured |

---

## How It Works

```
User sends WhatsApp message
        │
        ▼
  Welcome Flow → Main Menu
        │
   ┌────┴────────────────┐
   │                     │
Schedule Appointment    FAQs / Support
   │                     │
Natural-language      AI-powered or
date parsing          predefined answers
   │
Availability check (Google Calendar)
   │
Confirmation → Event created
```

1. **Welcome flow** greets the user and presents the main menu
2. **Scheduling flow** parses natural-language dates, checks real-time availability, collects user info (name, reason), and creates the calendar event
3. **FAQ flow** handles 15 common support topics with neutral, configurable answers
4. **Voice flow** (optional) downloads audio, converts OGG → MP3, and transcribes with Whisper
5. **AI fallback** handles open-ended queries via OpenAI chat completion

---

## Tech Stack

- **Runtime**: Node.js 18+
- **WhatsApp**: [@bot-whatsapp/bot](https://github.com/codigoencasa/bot-whatsapp) with Baileys provider
- **Calendar**: Google Calendar API (service account)
- **AI**: OpenAI GPT (chat) + Whisper (transcription)
- **Date parsing**: Luxon
- **Containerization**: Docker

> ⚠️ This project uses Baileys, an unofficial WhatsApp library. For production at scale, evaluate the [WhatsApp Business Platform](https://business.whatsapp.com/) and review WhatsApp's Terms of Service.

---

## Project Structure

```
.
├── app.js                  # Bot initialization and main routing
├── flows/
│   ├── welcome.flow.js     # Greeting and menu entry point
│   ├── date.flow.js        # Appointment scheduling + confirmation
│   └── form.flow.js        # User data collection (name, reason, ID)
├── scripts/
│   ├── calendar.js         # Google Calendar availability + event creation
│   ├── chatgpt.js          # OpenAI chat completion wrapper
│   ├── utils.js            # Natural-language date parser (text2iso)
│   └── voice.js            # Whisper transcription (optional)
├── Dockerfile
├── .env.example
└── .gitignore
```

---

## Quick Start

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd <your-repo>

# 2. Set up environment
cp .env.example .env
# Edit .env with your credentials

# 3. Install dependencies
npm install

# 4. Run
node app.js
# A QR portal opens — scan it with the WhatsApp account for the bot
```

---

## Environment Variables

```ini
# Google Calendar
GOOGLE_APPLICATION_CREDENTIALS=./secrets/google.json   # Service account JSON path
GOOGLE_CALENDAR_ID=primary                              # Or your specific calendar ID

# Locale / Timezone
TZ=America/Santo_Domingo
LANG=en-US

# OpenAI (optional — enables AI responses and voice transcription)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_TRANSCRIPTION_MODEL=whisper-1
```

Place your Google service account JSON at the path defined in `GOOGLE_APPLICATION_CREDENTIALS`. Never commit secrets or session files — `.gitignore` is pre-configured to prevent this.

---

## Configuration

| Setting | File | Variable |
|---|---|---|
| Working hours & slot size | `scripts/calendar.js` | `rangeLimit`, `standardDurationMinutes` |
| Working days | `scripts/calendar.js` | `rangeLimit.days` |
| Locale & timezone | `.env` | `LANG`, `TZ` |
| AI model | `.env` | `OPENAI_MODEL` |
| Transcription model | `.env` | `OPENAI_TRANSCRIPTION_MODEL` |

---

## Security

- No API keys or credentials hardcoded — all via `.env`
- `.gitignore` excludes `.env`, `secrets/`, WhatsApp session files, logs, and temp media
- If you accidentally committed secrets: revoke them immediately, then rewrite history with [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) or `git filter-repo`

---

## Docker

```bash
docker build -t conversational-ai-scheduler .
docker run --env-file .env conversational-ai-scheduler
```

---

## License

MIT
