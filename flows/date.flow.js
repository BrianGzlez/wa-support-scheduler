const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");
const { text2iso } = require("../scripts/utils");
const { isDateAvailable, getClosestAvailableSlot } = require("../scripts/calendar");
const { chat } = require("../scripts/chatgpt");
const { formFlow } = require("./form.flow");

// ─── Locale / Timezone ────────────────────────────────────────────────────────
const LOCALE = process.env.LANG || "en-US";
const TIMEZONE = process.env.TZ || "America/New_York";

function formatLocalizedDate(date) {
  return new Date(date).toLocaleString(LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: TIMEZONE,
  });
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SCHEDULING_PROMPT = `
You are a friendly scheduling assistant helping users book appointments via WhatsApp.
Your only goal is to confirm or suggest appointment times.
You will receive the requested date and its availability status.
- If available: confirm the date clearly and naturally.
- If unavailable: suggest the closest available slot in a friendly tone.
Keep responses short, warm, and conversational. No bullet points or markdown.
`.trim();

// ─── LLM helper (defined once, reused across flows) ──────────────────────────
async function replyWithLLM(systemPrompt, userMessage, fallback) {
  try {
    return await chat(systemPrompt, [{ role: "user", content: userMessage }]);
  } catch (err) {
    console.warn("LLM error, using fallback:", err?.message || err);
    return fallback;
  }
}

// ─── Confirmation flow ────────────────────────────────────────────────────────
const confirmationFlow = addKeyword(EVENTS.ACTION).addAnswer(
  "✅ *Would you like to confirm this appointment?*\n\n1️⃣ *Yes, confirm*\n2️⃣ *No, cancel*",
  { capture: true },
  async (ctx, ctxFn) => {
    const userResponse = (ctx.body || "").trim().toLowerCase();

    const YES = ["1", "yes", "y", "ok", "okay", "confirm"];
    const NO  = ["2", "no", "n", "cancel"];

    if (YES.includes(userResponse)) {
      if (!formFlow) {
        console.error("❌ formFlow is not defined.");
        return ctxFn.flowDynamic(
          "⚠️ *Error*: The booking form is unavailable right now. Please try again later."
        );
      }
      await ctxFn.flowDynamic("📋 *Taking you to the booking form...*");
      return ctxFn.gotoFlow(formFlow);
    }

    if (NO.includes(userResponse)) {
      return ctxFn.endFlow(
        "❌ *Booking cancelled.* No worries — type *menu* whenever you want to try again. 🚀"
      );
    }

    return ctxFn.fallBack(
      "⚠️ *Invalid option.* Please reply *1* to confirm or *2* to cancel."
    );
  }
);

// ─── Date flow ────────────────────────────────────────────────────────────────
const dateFlow = addKeyword(EVENTS.ACTION)
  .addAnswer(
    "📅 *When would you like your appointment?*\n\nJust tell me naturally — for example:\n• *Tomorrow at 3 pm*\n• *Next Monday at 10 am*\n• *Friday May 30 at 9:00 am*",
    { capture: true }
  )
  .addAnswer(
    "🔍 *Checking availability...* One moment please.",
    null,
    async (ctx, ctxFn) => {
      try {
        const raw = (ctx.body || "").trim();
        console.log("📥 Raw date input:", raw);

        // Step 1: Parse natural language to ISO
        const iso = await text2iso(raw);
        console.log("📅 Parsed ISO:", iso);

        if (!iso || iso.toLowerCase() === "false") {
          return ctxFn.endFlow(
            "⚠️ *I couldn't understand that date.* Please try again with a clearer format, like *Thursday at 3 pm* or *May 30 at 10 am*."
          );
        }

        const startDate = new Date(iso);
        if (Number.isNaN(startDate.getTime())) {
          return ctxFn.endFlow(
            "⚠️ *That doesn't look like a valid date.* Please try again."
          );
        }

        // Step 2: Reject past dates
        const now = new Date();
        if (startDate.getTime() < now.getTime() - 2 * 60 * 1000) {
          return ctxFn.endFlow(
            "⚠️ *That time is in the past.* Please choose a future date and time. 📆"
          );
        }

        // Step 3: Check availability
        const available = await isDateAvailable(startDate);
        console.log("📊 Available:", available);

        if (!available) {
          // Try to find the closest available slot
          const nextSlot = await getClosestAvailableSlot(startDate);

          if (!nextSlot) {
            return ctxFn.endFlow(
              "😔 *No available slots found for that day.* Our schedule is fully booked. Please try a different date or contact us directly."
            );
          }

          const nextDate = nextSlot.start instanceof Date
            ? nextSlot.start
            : new Date(nextSlot.start);

          if (Number.isNaN(nextDate.getTime())) {
            return ctxFn.endFlow(
              "⚠️ *Could not find a valid alternative slot.* Please try again with a different date."
            );
          }

          const nextText = formatLocalizedDate(nextDate);
          const llmReply = await replyWithLLM(
            SCHEDULING_PROMPT,
            `The user requested: "${raw}". That slot is unavailable. The closest available slot is: ${nextText}.`,
            `That slot is taken, but I found the next available time: *${nextText}*. Would you like to book it?`
          );

          await ctxFn.flowDynamic(llmReply);
          await ctxFn.state.update({ date: nextDate });
          return ctxFn.gotoFlow(confirmationFlow);
        }

        // Slot is available
        const dateText = formatLocalizedDate(startDate);
        const llmReply = await replyWithLLM(
          SCHEDULING_PROMPT,
          `The user requested: "${raw}". That slot is available on ${dateText}.`,
          `Great news! *${dateText}* is available. Would you like to confirm?`
        );

        await ctxFn.flowDynamic(llmReply);
        await ctxFn.state.update({ date: startDate });
        return ctxFn.gotoFlow(confirmationFlow);

      } catch (err) {
        console.error("❌ Error in date flow:", err?.message || err);
        return ctxFn.endFlow(
          "⚠️ *Something went wrong.* Please try again in a moment. 🙏"
        );
      }
    }
  );

module.exports = { dateFlow, confirmationFlow };
