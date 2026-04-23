const { addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const { createEvent } = require('../scripts/calendar');

const formFlow = addKeyword(EVENTS.ACTION)
  .addAnswer(
    "🎉 *Great!* Let's schedule your appointment. 😊\n\n" +
    "📝 *First*, what's your full name?",
    { capture: true },
    async (ctx, ctxFn) => {
      await ctxFn.state.update({ tempName: (ctx.body || '').trim() });
      console.log("📥 Name captured.");
    }
  )
  .addAnswer(
    "🔢 *Thanks.* Now, what's your *reference ID*?\n\n" +
    "_(Type *skip* if you don't have one.)_",
    { capture: true },
    async (ctx, ctxFn) => {
      const state = await ctxFn.state.getMyState();
      const fullName = state.tempName;
      const refId = (ctx.body || '').trim().toLowerCase();

      // Combine name and reference ID (skip if not provided)
      const displayName = refId === 'skip' || refId === ''
        ? fullName
        : `${fullName} - ${refId}`;

      await ctxFn.state.update({ name: displayName });
      console.log("📥 Name and reference ID stored.");
    }
  )
  .addAnswer(
    "💼 *Perfect.* Lastly, what's the *reason* for your appointment? 📝\n\n" +
    "Please describe your reason. If you have a support ticket, include it at the end. 🔍\n\n" +
    "*Example:*\n" +
    "👉 I need help updating my documents. Ticket: #123456",
    { capture: true },
    async (ctx, ctxFn) => {
      await ctxFn.state.update({ reason: (ctx.body || '').trim() });
      console.log("📥 Reason stored.");
    }
  )
  .addAnswer(
    "⏳ *Creating your appointment...* Please wait a moment.",
    null,
    async (ctx, ctxFn) => {
      try {
        const { name, reason, date } = await ctxFn.state.getMyState();

        if (!name || !date) {
          console.error("❌ Missing required fields:", { name, date });
          await ctxFn.flowDynamic(
            "⚠️ *Something went wrong.* We couldn't find your booking details. Please start over."
          );
          return;
        }

        console.log("📋 Creating calendar event...");
        await createEvent(name, reason || 'No reason provided', date);
        console.log("✅ Event created.");

        await ctxFn.state.clear();
        await ctxFn.flowDynamic(
          "🚀 *Appointment confirmed!* We'll see you on the agreed date. 🗓️\n\n" +
          "💬 If you need anything else, type *menu* to open the menu. We're here for you! 🤗"
        );
      } catch (error) {
        console.error("❌ Error creating the event:", error?.message || error);
        await ctxFn.flowDynamic(
          "⚠️ *There was a problem creating your appointment.* Please try again later. 😥"
        );
      }
    }
  );

module.exports = { formFlow };
