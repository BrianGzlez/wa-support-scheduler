const { addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const { createEvent } = require("../scripts/calendar");

const formFlow = addKeyword(EVENTS.ACTION)
  .addAnswer(
    "🎉 *Great!* Let's schedule your appointment. 😊\n\n" +
    "📝 *First*, what's your full name?",
    { capture: true },
    async (ctx, ctxFn) => {
      await ctxFn.state.update({ tempName: (ctx.body || '').trim() }); // store name temporarily
      console.log("📥 Name captured.");
    }
  )
  .addAnswer(
    "🔢 *Thanks.* Now, what's your *reference ID*?",
    { capture: true },
    async (ctx, ctxFn) => {
      const state = await ctxFn.state.getMyState();
      const fullName = state.tempName; // retrieve name

      // Store the name together with the reference ID in `name`
      const refId = (ctx.body || '').trim();
      const completeName = `${fullName} - ${refId}`;
      await ctxFn.state.update({ name: completeName });

      console.log("📥 Name and reference ID stored.");
    }
  )
  .addAnswer(
    "💼 *Perfect.* Lastly, what's the *reason* for your appointment? 📝\n\n" +
    "Please write the reason for booking. If you already have a ticket, include it at the end to speed things up. 🔍\n\n" +
    "*Example:*\n" +
    "👉 *Reason:* I need assistance to update my documents on the platform.\n" +
    "👉 *Ticket:* #123456\n\n" +
    "This format helps us provide faster and more efficient service. 🚀",
    { capture: true },
    async (ctx, ctxFn) => {
      await ctxFn.state.update({ motive: (ctx.body || '').trim() });
      console.log("📥 Reason stored.");
    }
  )
  
  .addAnswer(
    "🚀 *Appointment created successfully!* We'll see you on the agreed date. 🗓️\n\n" +
    "💬 If you need more help, feel free to contact us. We're here for you! 🤗",
    null,
    async (ctx, ctxFn) => {
      try {
        const userInfo = await ctxFn.state.getMyState();
        const { name, motive, date } = userInfo;

        console.log("📋 Creating calendar event...");
        
        const eventId = await createEvent(name, motive, date);

        console.log("✅ Event created.");

        await ctxFn.state.clear();
      } catch (error) {
        console.error("❌ Error creating the event:", error);
        await ctxFn.flowDynamic(
          "⚠️ *There was a problem creating your appointment.* Please try again later. 😥"
        );
      }
    }
  );

module.exports = { formFlow };
