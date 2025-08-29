const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const { dateFlow } = require('./flows/date.flow');
const { confirmationFlow } = require('./flows/date.flow');
const { formFlow } = require('./flows/form.flow');
const createWelcomeFlow = require('./flows/welcome.flow'); // imported as factory

// Main menu flow
const menuFlow = addKeyword('Lista', 'menu', 'opciones')
  .addAnswer(
    `📋 *Main Menu* 📋\n\nChoose an option to continue:\n\n` +
    `1️⃣ *Schedule an appointment* 🗓️\n` +
    `2️⃣ *Frequently Asked Questions* ❓\n` +
    `3️⃣ *I want to join as a courier* 🚴‍♂️\n` +
    `0️⃣ *Exit* 👋\n\n` +
    `Please type the number of the option you want.`,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
      switch ((ctx.body || '').trim()) {
        case '1':
          console.log("User chose: schedule appointment");
          return gotoFlow(dateFlow);
        case '2':
          console.log("User chose: FAQs");
          return gotoFlow(flowPreguntasFrecuentes);
        case '3':
          console.log("User chose: join courier program");
          return gotoFlow(flowQuieroSerParte);
        case '0':
          console.log("User chose: exit");
          await flowDynamic(
            "👋 *Exiting...* If you need anything else, type *Lista* to open the menu again. See you soon!"
          );
          break;
        default:
          console.log("Invalid menu option selected.");
          return fallBack(
            "⚠️ *Invalid option.* Please choose a valid item from the list using the corresponding number."
          );
      }
    }
  );

const flowPreguntasFrecuentes = addKeyword(EVENTS.ACTION)
  .addAnswer(
    `🙋‍♂️ *Frequently Asked Questions* 🙋‍♀️\n\nHi! These are some common questions. Please type the number of the topic you want to see. 🤔\n\n` +
`1️⃣ *How can I receive cash-only orders?*\n` +
`2️⃣ *Why was money deducted from my account?*\n` +
`3️⃣ *When will I receive my weekly payout?*\n` +
`4️⃣ *Why haven’t I received payment for media submissions?*\n` +
`5️⃣ *How can I pause my availability or group?*\n` +
`6️⃣ *What do negative amounts in my wallet mean?*\n` +
`7️⃣ *Why didn’t I get the referral bonus yet?*\n` +
`8️⃣ *How do I make a payment via a local partner?*\n` +
`9️⃣ *How do I register my bank account in the app?*\n` +
`🔟 *What are typical equipment costs?*\n` +
`1️⃣1️⃣ *How can I request a work/engagement letter?*\n` +
`1️⃣2️⃣ *How is the weekly payout processed?*\n` +
`1️⃣3️⃣ *Why am I not getting cash orders?*\n` +
`1️⃣4️⃣ *Can I request a payment arrangement?*\n` +
`1️⃣5️⃣ *Other inquiry* 🗣️`,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
      switch ((ctx.body || '').trim()) {
        case "1":
          await flowDynamic(
            "💸 *Cash-only orders*: Order distribution is automated and may depend on region, compliance, and current policies. Cash availability can vary."
          );
          break;
        case "2":
          await flowDynamic(
            "📉 *Deductions*: Payout statements can include fees, advances, adjustments, or taxes. Review your weekly statement for details."
          );
          break;
        case "3":
          await flowDynamic(
            "🏦 *Weekly payout*: Transfers are generally processed late Thursday or Friday depending on your bank. Check your payout status in-app."
          );
          break;
        case "4":
          await flowDynamic(
            "📸 *Media submissions*: Reviews are handled in order of submission and payouts follow the platform’s schedule. If it’s pending, it’s still under review."
          );
          break;
        case "5":
          await flowDynamic(
            "🧊 *Pause availability/group*: Use your app’s *Availability/Status* controls to pause or adjust your working group if supported in your region."
          );
          break;
        case "6":
          await flowDynamic(
            "📉 *Negative wallet amounts*: These may reflect advances or adjustments. Settlements usually occur weekly; review your statement for specifics."
          );
          break;
        case "7":
          await flowDynamic(
            "🎁 *Referral bonus*: Eligibility typically requires the referred person to complete a minimum number of tasks within a set time window."
          );
          break;
        case "8":
          await flowDynamic(
            "💳 *Local partner payments*: Use your assigned reference code in the official portal/app and complete payment at an authorized location."
          );
          break;
        case "9":
          await flowDynamic(
            "🏦 *Bank account registration*:\n1) Open your profile in the app.\n2) Go to *Bank Information*.\n3) Provide required documents (matching name/account).\n4) Enter your account details and save."
          );
          break;
        case "10":
          await flowDynamic(
            "🛍️ *Equipment costs*: Pricing varies by region and supplier. Please check the official store or support channel for up-to-date information."
          );
          break;
        case "11":
          await flowDynamic(
            "📄 *Work/engagement letter*: If you’re an independent contractor, a formal employment letter may not apply. Use your payout statements as supporting documentation."
          );
          break;
        case "12":
          await flowDynamic(
            "🗓️ *Weekly payout methods*: Advances may reflect in your wallet; weekly deposits are made if you meet the minimum balance and regional rules."
          );
          break;
        case "13":
          await flowDynamic(
            "⚠️ *Cash orders*: Availability depends on region, risk controls, and policy. Not all groups or areas receive cash orders."
          );
          break;
        case "14":
          await flowDynamic(
            "❌ *Payment arrangements*: Arrangements may not be available. Keep the recommended minimum wallet balance to avoid interruptions."
          );
          break;
        case "15":
          return gotoFlow(flowConsultaOtra);
        default:
          return fallBack(
            "⚠️ *Invalid option.* Please select a menu item using the corresponding number. 😊"
          );
      }
      return gotoFlow(flowFin);
    }
  );

const flowConsultaOtra = addKeyword(EVENTS.ACTION).addAnswer(
  "🗣️ *Additional inquiry* 🗣️\n\nPlease describe your question so we can assist you better. 📝",
  { capture: true },
  async (ctx, ctxFn) => {
    const consulta = (ctx.body || '').trim();
    await ctxFn.flowDynamic(
      `📌 *Your inquiry*: "${consulta}"\n\n🔍 *Tip*: If your account has an assigned support/fleet contact, reach out to them for personalized help.`
    );
    await ctxFn.flowDynamic(
      "🚀 If you need more help, type *Lista* to open the menu again. We’re here to support you! 💪"
    );
  }
);

const flowFin = addKeyword(EVENTS.ACTION).addAnswer(
  "🔄 *What would you like to do next?*\n\n" +
    "1️⃣ *Back to the options list* 📋\n" +
    "2️⃣ *Back to FAQs* 📌\n" +
    "0️⃣ *Exit* 👋\n\n" +
    "Please type the number of your choice.",
  { capture: true },
  async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
    const userInput = (ctx.body || '').trim();
    if (userInput === "1") {
      console.log("User chose: back to list.");
      return gotoFlow(menuFlow);
    } else if (userInput === "0") {
      console.log("User chose: exit.");
      await flowDynamic(
        "👋 *Exiting...* See you soon! If you need anything else, just write to us. 😊"
      );
    } else if (userInput === "2") {
      console.log("User chose: FAQs.");
      return gotoFlow(flowPreguntasFrecuentes);
    } else {
      console.log("Invalid option on finish screen.");
      return fallBack(
        "⚠️ *Invalid option.* Please choose a valid one:\n1️⃣ *Back to list* or 0️⃣ *Exit*."
      );
    }
  }
);

// “I want to join” flow (brand-neutral)
const flowQuieroSerParte = addKeyword(EVENTS.ACTION)
  .addAnswer(
    "🎉 *Great! We’d love to have you join as a courier.* 🚴‍♂️\n\n" +
    "To start the onboarding process, please visit the official signup page of your region or contact support for the correct link. 👇\n\n" +
    "🔗 *Signup page:* https://example.com/signup (replace with your official link)\n\n" +
    "📋 *Typical requirements may include:*\n" +
    "✔️ Being at least 18 years old.\n" +
    "✔️ Valid ID or passport.\n" +
    "✔️ A suitable vehicle if required (with documents up to date).\n" +
    "✔️ A compatible smartphone with internet and front camera. 📱\n\n" +
    "💼 *Why join?*\n" +
    "✨ Flexible scheduling.\n" +
    "🏙️ Choose the areas where you want to operate (as available).\n" +
    "💰 Weekly earnings depending on your activity and region.\n\n" +
    "🚀 *We’re excited to hear from you!*"
  )
  .addAnswer(
    "🔄 *What would you like to do next?*\n\n" +
    "1️⃣ *Back to the options list* 📋\n" +
    "0️⃣ *Exit* 👋\n\n" +
    "Please type the number of your choice.",
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
      const userInput = (ctx.body || '').trim();
      if (userInput === "1") {
        console.log("User chose: back to list.");
        return gotoFlow(menuFlow);
      } else if (userInput === "0") {
        console.log("User chose: exit.");
        await flowDynamic(
          "👋 See you soon! If you need anything else, just write to us. 😊"
        );
        return;
      } else {
        console.log("Invalid option in join flow.");
        return fallBack(
          "⚠️ *Invalid option.* Please choose:\n1️⃣ *Back to list* or 0️⃣ *Exit*."
        );
      }
    }
  );

module.exports = { flowQuieroSerParte };

// Create welcome flow passing menuFlow
const welcomeFlow = createWelcomeFlow(menuFlow);

// Main flow: route based on user intent
const flowPrincipal = addKeyword(EVENTS.WELCOME)
  .addAction(async (ctx, ctxFn) => {
    const bodyText = (ctx.body || '').toLowerCase().trim();

    // Spanish keywords preserved to avoid logic changes
    const keywordDate = ['agendar', 'cita', 'reunion', 'turno'];
    const containsKeywordDate = keywordDate.some(keyword => bodyText.includes(keyword));

    if (containsKeywordDate) {
      console.log("📅 Appointment keyword detected → redirecting to date flow...");
      return ctxFn.gotoFlow(dateFlow);
    }

    console.log("👋 Redirecting to default welcome flow...");
    return await ctxFn.gotoFlow(welcomeFlow);
  });

// Bot initialization
const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([
    flowPrincipal,
    dateFlow,
    formFlow,
    welcomeFlow,
    menuFlow,
    flowFin,
    flowPreguntasFrecuentes,
    flowConsultaOtra,
    confirmationFlow,
    flowQuieroSerParte
  ]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();
