const { addKeyword, EVENTS } = require('@bot-whatsapp/bot');

const createWelcomeFlow = (menuFlow) => {
  const welcomeFlow = addKeyword(EVENTS.WELCOME).addAnswer(
    "👋 Hello! I'm your *virtual assistant* 🤖. I'm here to help you with anything you need and make your experience smoother. 🚀\n\n" +
    "With me you can:\n\n" +
    "📅 *Schedule* support appointments.\n" +
    "❓ *Get answers* to frequently asked questions.\n" +
    "📝 *Get guidance* through onboarding steps.\n\n" +
    "✨ I’m here to support you every step of the way. 😊\n\n" +
    "Would you like to see the available options?\n\n" +
    "1️⃣ *Yes, show me the options.*\n" +
    "2️⃣ *No, thanks.*",
    { capture: true },
    async (ctx, ctxFn) => {
      const userInput = (ctx.body || '').trim();

      if (userInput === '1') {
        console.log("User selected '1' → redirecting to menu.");
        return ctxFn.gotoFlow(menuFlow); // Go to main menu
      } else if (userInput === '2') {
        console.log("User selected '2' → sending farewell.");
        await ctxFn.flowDynamic(
          "😊 Thanks for reaching out! If you need anything else, just message me. Have a great day! 🌟"
        );
      } else {
        console.log("Invalid option received.");
        await ctxFn.flowDynamic(
          "⚠️ *Invalid option.* Please select a valid choice:\n1️⃣ *Yes* \n2️⃣ *No*"
        );
        return ctxFn.gotoFlow(welcomeFlow); // Ask again on invalid input
      }
    }
  );

  return welcomeFlow;
};

module.exports = createWelcomeFlow;
