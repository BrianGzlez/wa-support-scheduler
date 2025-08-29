const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");
const { text2iso } = require("../scripts/utils");
const { isDateAvailable, getClosestAvailableSlot } = require("../scripts/calendar");
const { chat } = require("../scripts/chatgpt");
const { formFlow } = require("./form.flow");

// ===== Locale/Timezone helpers (no hardcoded brand/region) =====
const LOCALE = process.env.LANG || "en-US";
const TIMEZONE = process.env.TZ || "America/Santo_Domingo";

function formatLocalizedDate(date, locale = LOCALE, timeZone = TIMEZONE) {
  return new Date(date).toLocaleString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone,
  });
}

// ===== System prompt (brand-neutral) =====
const promptBase = `
You are a virtual assistant that helps users schedule appointments through conversation.
Your only goal is to help the user choose a date and time.
You can understand both exact dates ("Thursday May 30 2024 at 10:00am") and relative dates ("tomorrow at 3 pm", "next Monday at 11 am", "in two weeks").
If the user provides a relative date, convert it to an exact date before checking availability.
I will give you the requested date and whether it is available.
If availability is true, answer clearly that the requested date is available and restate it in natural language.
If availability is false, recommend the closest available slot in natural language.
Keep responses concise and friendly.
`;

// ===== Confirmation flow =====
const confirmationFlow = addKeyword(EVENTS.ACTION).addAnswer(
  "✅ *Confirmation required*\n\nPlease choose an option:\n\n1️⃣ *Yes*\n2️⃣ *No*\n\nType the number or the word.",
  { capture: true },
  async (ctx, ctxFn) => {
    const userResponse = (ctx.body || "").trim().toLowerCase();
    console.log("📥 User response:", ctx.body, "→ parsed:", userResponse);

    const YES = ["1", "yes", "y", "ok", "okay", "confirm", "sí", "si"];
    const NO = ["2", "no", "n", "cancel", "cancelar"];

    if (YES.includes(userResponse)) {
      if (!formFlow) {
        console.error("❌ formFlow is not defined.");
        return ctxFn.flowDynamic(
          "⚠️ *Error*: The form is not available right now. Please try again later."
        );
      }
      await ctxFn.flowDynamic("📋 *Taking you to the form...*");
      return ctxFn.gotoFlow(formFlow);
    }

    if (NO.includes(userResponse)) {
      await ctxFn.endFlow(
        "❌ *Booking cancelled.* You can start again anytime. 🚀"
      );
      return;
    }

    return ctxFn.flowDynamic(
      "⚠️ *Invalid option.* Please choose *1* for *Yes* or *2* for *No*."
    );
  }
);

// ===== Date handling flow =====
const dateFlow = addKeyword(EVENTS.ACTION)
  .addAnswer(
    "📅 *Great!* What day and time would you like?\n\nFor example: *Thursday at 3 pm*.",
    { capture: true }
  )
  .addAnswer(
    "🔍 *Checking availability...* This may take a few seconds…",
    null,
    async (ctx, ctxFn) => {
      try {
        const raw = (ctx.body || "").trim();
        console.log("📥 Raw date text:", raw);

        const iso = await text2iso(raw);
        console.log("📅 Parsed ISO:", iso);

        if (!iso || typeof iso !== "string" || iso.toLowerCase() === "false") {
          return ctxFn.endFlow(
            "⚠️ *I couldn't understand that date.* Please try again with a clearer format (e.g., *Thursday May 30 at 10:00 am*)."
          );
        }

        const startDate = new Date(iso);
        if (Number.isNaN(startDate.getTime())) {
          return ctxFn.endFlow(
            "⚠️ *That doesn't look like a valid date.* Please try again."
          );
        }

        const now = new Date();
        if (startDate.getTime() < now.getTime() - 2 * 60 * 1000) {
          return ctxFn.flowDynamic(
            "⚠️ *That time is in the past.* Please choose a future date. 📆"
          );
        }

        let available = await isDateAvailable(startDate);
        console.log("📊 Availability:", available);

        async function replyWithLLM(prompt, msgs) {
          try {
            return await chat(prompt, msgs);
          } catch (e) {
            console.warn("LLM error, falling back:", e?.message || e);
            return "Here’s what I found.";
          }
        }

        const messages = [{ role: "user", content: raw }];

        if (!available) {

          const next = await getClosestAvailableSlot(startDate);
          const nextDate =
            next && next.start instanceof Date
              ? next.start
              : next && !(next instanceof Date)
                ? new Date(next.start || next)
                : next;

          if (!nextDate || Number.isNaN(new Date(nextDate).getTime())) {
            return ctxFn.endFlow(
              "⚠️ There are no available dates right now. Please try again later. 🕒"
            );
          }

          const nextText = formatLocalizedDate(nextDate);
          console.log("📅 Closest available:", nextText);

          const llmText = await replyWithLLM(
            `${promptBase}
Current time: ${now.toISOString()}
Requested date: ${startDate.toISOString()}
Availability: false. Closest available: ${nextText}.`,
            messages
          );

          await ctxFn.flowDynamic(llmText);
          await ctxFn.state.update({ date: nextDate });
          return ctxFn.gotoFlow(confirmationFlow);
        }

        // Available
        const dateText = formatLocalizedDate(startDate);
        console.log("✅ Available at:", dateText);

        const llmText = await replyWithLLM(
          `${promptBase}
Current time: ${now.toISOString()}
Requested date: ${startDate.toISOString()}
Availability: true.`,
          messages
        );

        await ctxFn.flowDynamic(llmText);
        await ctxFn.state.update({ date: startDate });
        return ctxFn.gotoFlow(confirmationFlow);
      } catch (err) {
        console.error("❌ Error in date flow:", err);
        await ctxFn.endFlow(
          "⚠️ *Unexpected error.* Please try again in a moment. 🙏"
        );
      }
    }
  );

module.exports = { dateFlow, confirmationFlow };
