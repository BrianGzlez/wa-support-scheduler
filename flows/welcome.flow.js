const { addKeyword, EVENTS } = require('@bot-whatsapp/bot');

// Timestamp when the bot started — used to ignore stale messages
const BOT_START_TIME = Date.now();
const STALE_MESSAGE_THRESHOLD_MS = 15_000; // ignore messages older than 15 seconds

const createWelcomeFlow = (menuFlow) => {
  const welcomeFlow = addKeyword(EVENTS.ACTION).addAnswer(
    "👋 Hello! I'm your *virtual assistant* 🤖. I'm here to help you with anything you need.\n\n" +
    "With me you can:\n\n" +
    "📅 *Schedule* appointments\n" +
    "❓ *Get answers* to frequently asked questions\n" +
    "📝 *Get guidance* through onboarding steps\n\n" +
    "Would you like to see the available options?\n\n" +
    "1️⃣ *Yes, show me the options*\n" +
    "2️⃣ *No, thanks*",
    { capture: true },
    async (ctx, ctxFn) => {
      // Ignore stale messages delivered on reconnect
      const messageTime = ctx.timestamp ? ctx.timestamp * 1000 : Date.now();
      if (messageTime < BOT_START_TIME - STALE_MESSAGE_THRESHOLD_MS) {
        console.log("⏭️ Ignoring stale message from before bot start.");
        return;
      }

      const userInput = (ctx.body || '').trim();

      if (userInput === '1') {
        console.log("User selected '1' → redirecting to menu.");
        return ctxFn.gotoFlow(menuFlow);
      }

      if (userInput === '2') {
        console.log("User selected '2' → farewell.");
        return ctxFn.flowDynamic(
          "😊 Thanks for reaching out! If you need anything else, just message me. Have a great day! 🌟"
        );
      }

      // Invalid input — use fallBack instead of gotoFlow to avoid circular reference
      return ctxFn.fallBack(
        "⚠️ *Invalid option.* Please reply *1* to see the options or *2* to exit."
      );
    }
  );

  return welcomeFlow;
};

module.exports = createWelcomeFlow;
