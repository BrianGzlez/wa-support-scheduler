const { addKeyword, EVENTS } = require('@bot-whatsapp/bot');

const createWelcomeFlow = (menuFlow) => {
  const welcomeFlow = addKeyword(EVENTS.WELCOME).addAnswer(
    '👋 ¡Hola! Soy *Victor* 🤖, tu asistente personal en PedidosYa 🚴‍♂️. Estoy aquí para ayudarte en todo lo que necesites y asegurarme de que tu experiencia como Rider sea la mejor. 🚀\n\n' +
    'Conmigo puedes:\n\n' +
    '📅 *Agendar citas* para soporte.\n' +
    '❓ *Obtener respuestas* a tus preguntas frecuentes.\n' +
    '📝 *Guiarte* en el proceso para unirte a nuestra plataforma.\n\n' +
    '✨ Estoy aquí para acompañarte en cada paso del camino. 😊\n\n' +
    '¿Te gustaría ver la lista de opciones disponibles?\n\n' +
    '1️⃣ *Sí, quiero ver las opciones.*\n' +
    '2️⃣ *No, gracias.*',
    { capture: true },
    async (ctx, ctxFn) => {
      const userInput = ctx.body.trim();

      if (userInput === '1') {
        console.log("Usuario seleccionó '1', redirigiendo al menú...");
        return ctxFn.gotoFlow(menuFlow); // Redirige al menú principal
      } else if (userInput === '2') {
        console.log("Usuario seleccionó '2', despidiendo...");
        await ctxFn.flowDynamic(
          "😊 ¡Gracias por contactarnos! Si necesitas algo más, no dudes en escribirme. Siempre estaré aquí para ayudarte. ¡Que tengas un excelente día! 🌟"
        );
      } else {
        console.log("Respuesta no válida:", userInput);
        await ctxFn.flowDynamic(
          "⚠️ *Opción no válida.* Por favor selecciona una opción válida: \n1️⃣ *Sí* \n2️⃣ *No*"
        );
        return ctxFn.gotoFlow(welcomeFlow); // Vuelve a preguntar en caso de respuesta incorrecta
      }
    }
  );

  return welcomeFlow;
};

module.exports = createWelcomeFlow;
