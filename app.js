const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const { dateFlow } = require('./flows/date.flow');
const { confirmationFlow } = require('./flows/date.flow');
const { formFlow } = require('./flows/form.flow');
const createWelcomeFlow = require('./flows/welcome.flow'); // Importar como función

// Flujo para el menú principal
const menuFlow = addKeyword('Lista', 'menu', 'opciones')
  .addAnswer(
    `📋 *Menú Principal* 📋\n\nSelecciona una opción de la lista para continuar:\n\n` +
    `1️⃣ *Agendar cita en el Hub* 🗓️\n` +
    `2️⃣ *Preguntas Frecuentes* ❓\n` +
    `3️⃣ *Quiero ser parte de PeYa* 🚴‍♂️\n` +
    `0️⃣ *Salir* 👋\n\n` +
    `Por favor, escribe el número de la opción que deseas elegir.`,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
      switch (ctx.body.trim()) {
        case '1':
          console.log("Usuario seleccionó '1': Agendar cita");
          return gotoFlow(dateFlow); // Redirige al flujo de citas
        case '2':
          console.log("Usuario seleccionó '2': Preguntas frecuentes");
          return gotoFlow(flowPreguntasFrecuentes); // Redirige al flujo de preguntas frecuentes
        case '3':
          console.log("Usuario seleccionó '3': Quiero ser parte de PeYa");
          return gotoFlow(flowQuieroSerParte); // Redirige al flujo de "Quiero ser parte"
        case '0':
          console.log("Usuario seleccionó '0': Salir");
          await flowDynamic(
            "👋 *Saliendo...* Si necesitas algo más, puedes volver a escribir *Lista* para acceder nuevamente al menú. ¡Hasta luego!"
          );
          break;
        default:
          console.log("Opción no válida:", ctx.body);
          return fallBack(
            "⚠️ *Opción no válida.* Por favor selecciona una opción válida de la lista usando los números correspondientes."
          );
      }
    }
  );

  const flowPreguntasFrecuentes = addKeyword(EVENTS.ACTION)
  .addAnswer(
    `🙋‍♂️ *Preguntas Frecuentes* 🙋‍♀️\n\n¡Hola! Estas son algunas de las preguntas más comunes en nuestro centro de servicio. Por favor, selecciona el número de la opción que deseas conocer. 🤔\n\nSi tu pregunta no aparece aquí, no te preocupes, elige la opción *15️⃣ Otra consulta* y con gusto te ayudaremos. 💬\n\n
1️⃣ *¿Cómo puedo recibir únicamente pedidos en efectivo?*\n
2️⃣ *¿Por qué me descontaron dinero de mi cuenta?*\n
3️⃣ *¿Cuándo recibiré el pago semanal en mi cuenta bancaria?*\n
4️⃣ *¿Por qué no he recibido el pago por las fotos del menú?*\n
5️⃣ *¿Cómo puedo congelar mi grupo?*\n
6️⃣ *¿Qué significan los montos negativos en mi billetera?*\n
7️⃣ *¿Por qué no he recibido las ganancias por referir a un amigo?*\n
8️⃣ *¿Cómo realizo un pago a través de PagaTodo?*\n
9️⃣ *¿Cómo registro mi cuenta bancaria en la aplicación?*\n
🔟 *¿Cuál es el costo de los equipos para trabajar en PeYa?*\n
1️⃣1️⃣ *¿Cómo puedo solicitar una carta de trabajo?*\n
1️⃣2️⃣ *¿Cómo se realiza el pago semanal?*\n
1️⃣3️⃣ *¿Por qué no estoy recibiendo pedidos en efectivo?*\n
1️⃣4️⃣ *¿Puedo solicitar un acuerdo de pago?*\n
1️⃣5️⃣ *Otra consulta* 🗣️`,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
      switch (ctx.body.trim()) {
        case "1":
          await flowDynamic(
            "💸 *Pedidos en efectivo*: El sistema distribuye los pedidos de forma automática y equitativa entre los repartidores según su zona. De esta manera, garantizamos la eficiencia y la equidad en las entregas. 🚀"
          );
          break;
        case "2":
          await flowDynamic(
            "📉 *Deducciones*: Cada miércoles se realizan deducciones en tu billetera, relacionadas con el seguro, uso de la app e impuestos. Estos montos pueden variar según tus ganancias de la semana. Si tienes dudas, estamos aquí para ayudarte. 🤝"
          );
          break;
        case "3":
          await flowDynamic(
            "🏦 *Pago semanal*: El pago se refleja en tu cuenta bancaria el jueves por la tarde o el viernes, dependiendo del banco. ¡No olvides revisar tu cuenta y cualquier actualización! 🔔"
          );
          break;
        case "4":
          await flowDynamic(
            "📸 *Pago por fotos del menú*: Las fotos son verificadas en orden de llegada, y los pagos se ajustan cada dos viernes. Si aún no ves el pago, tu solicitud está en revisión. Gracias por tu paciencia. 🕵️‍♂️"
          );
          break;
        case "5":
          await flowDynamic(
            "🧊 *Congelar grupo*: Ve al menú lateral en la pestaña *Rendimiento*, selecciona *Historial* y elige *Congelar grupo* en la parte superior. Si tienes dudas, no dudes en consultarnos. ❄️"
          );
          break;
        case "6":
          await flowDynamic(
            "📉 *Montos negativos en tu billetera*: Los ajustes negativos corresponden a avances de efectivo diarios. Cada miércoles se realiza un corte y tu saldo disponible se deposita si supera los RD$ 2,000. ¡Estamos aquí para cualquier duda! 💵"
          );
          break;
        case "7":
          await flowDynamic(
            "🎁 *Bono por referidos*: Para obtener el bono, la persona referida debe completar una cantidad mínima de pedidos durante sus primeros 7 días. ¡Invita a tus amigos y aprovecha los beneficios! 🕒"
          );
          break;
        case "8":
          await flowDynamic(
            "💳 *Pago con PagaTodo*: Realiza tu depósito aquí: [https://peya.inswhub.com/pago](https://peya.inswhub.com/pago). Ingresa tu *Rider ID*, correo y monto. Luego, usa el código generado en cualquier punto PagaTodo. 🏪"
          );
          break;
        case "9":
          await flowDynamic(
            "🏦 *Registro bancario*:\n1️⃣ Accede a tu perfil en el menú lateral.\n2️⃣ Selecciona *Perfil* y luego *Información Bancaria*.\n3️⃣ Carga un documento con tu nombre y número de cuenta.\n4️⃣ Ingresa tu número de cuenta y guarda los cambios. ¡Listo! ✅"
          );
          break;
        case "10":
          await flowDynamic(
            "🛍️ *Equipos y precios*:\n- Mochila: RD$ 3,000\n- T-shirt manga corta: RD$ 450\n- T-shirt manga larga: RD$ 480\n- Jacket: RD$ 1,100\n- Rainset: RD$ 1,570\n\n📍 *Depósito*: BHD 27475900019\nRecoge en el HUB (Calle F. Thomen) de lunes a jueves, 9am-3pm. 🕘"
          );
          break;
        case "11":
          await flowDynamic(
            "📄 *Carta de trabajo*: Como prestadores de servicio, no emitimos cartas laborales. Sin embargo, puedes usar el desglose de pago que enviamos cada miércoles para tus gestiones. 📧"
          );
          break;
        case "12":
          await flowDynamic(
            "🗓️ *Métodos de pago semanal*:\n- *Adelanto diario*: Aparece en tu billetera según tus pedidos en efectivo.\n- *Depósito semanal*: Si tienes más de RD$ -2,000 el miércoles, depositamos el monto en tu cuenta el jueves. 💰"
          );
          break;
        case "13":
          await flowDynamic(
            "⚠️ *Pedidos en efectivo*: Los grupos 5 y 6 ya no reciben pedidos en efectivo. Sin embargo, los grupos 1, 2, 3 y 4 siguen aceptándolos. ¡Gracias por tu comprensión! 🙏"
          );
          break;
        case "14":
          await flowDynamic(
            "❌ *Acuerdos de pago*: No es posible realizar acuerdos de pago. Te sugerimos mantener tu billetera con al menos RD$ 900 para continuar ofreciendo tus servicios. 🚀"
          );
          break;
        case "15":
          return gotoFlow(flowConsultaOtra); // Redirige a otro flujo para consultas adicionales
        default:
          return fallBack(
            "⚠️ *Opción no válida.* Por favor, selecciona una opción del menú usando el número correspondiente. 😊"
          );
      }
      return gotoFlow(flowFin); // Redirige al flujo final o siguiente
    }
  );




  const flowConsultaOtra = addKeyword(EVENTS.ACTION).addAnswer(
    "🗣️ *Consulta adicional* 🗣️\n\nPor favor, describe tu consulta para que podamos ayudarte mejor. 📝",
    { capture: true },
    async (ctx, ctxFn) => {
      const consulta = ctx.body.trim();
      await ctxFn.flowDynamic(
        `📌 *Tu consulta*: "${consulta}"\n\n🔍 *Sugerencia*: Te recomiendo acercarte a tu *fleet designado* para recibir asistencia personalizada.`
      );
      await ctxFn.flowDynamic(
        "🚀 *Si necesitas más ayuda*, vuelve a escribir *Lista* para acceder a las opciones disponibles. ¡Estamos aquí para apoyarte! 💪"
      );
    }
  );
  

  const flowFin = addKeyword(EVENTS.ACTION).addAnswer(
    "🔄 *¿Qué deseas hacer ahora?*\n\n" +
      "1️⃣ *Volver a la lista de opciones* 📋\n" +
      "2️⃣ *Volver a las preguntas frecuentes* 📌\n" +
      "0️⃣ *Salir* 👋\n\n" +
      "Por favor, escribe el número de la opción que prefieras.",
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
      const userInput = ctx.body.trim(); // Corrección del nombre userInput
      
      if (userInput === "1") {
        console.log("Usuario seleccionó '1': Volver a la lista.");
        return gotoFlow(menuFlow); // Regresa al flujo del menú principal
      } else if (userInput === "0") {
        console.log("Usuario seleccionó '0': Salir.");
        await flowDynamic(
          "👋 *Saliendo...* ¡Hasta pronto! Si necesitas algo más, no dudes en escribirnos. 😊"
        );
      } else if (userInput === "2") {
        console.log("Usuario seleccionó '2': Preguntas frecuentes.");
        return gotoFlow(flowPreguntasFrecuentes); // Flujo de preguntas frecuentes
      } else {
        console.log("Opción no válida:", userInput);
        return fallBack(
          "⚠️ *Opción no válida.* Por favor selecciona una opción válida: \n" +
            "1️⃣ *Volver a la lista* o 0️⃣ *Salir*."
        );
      }
    }
  );
  

// Flujo de "Quiero ser parte"
const flowQuieroSerParte = addKeyword(EVENTS.ACTION)
  .addAnswer(
    "🎉 *¡Genial! Nos encantaría tenerte como parte de PedidosYa Rider.* 🚴‍♂️\n\n" +
    "Para comenzar el proceso de inscripción, visita el siguiente enlace: 👇\n\n" +
    "🔗 [Regístrate aquí](https://www.repartosya.com.do/)\n\n" +
    "📋 *Requisitos para ser Rider:*\n" +
    "✔️ Tener al menos 18 años.\n" +
    "✔️ Contar con una cédula de identidad o pasaporte vigente.\n" +
    "✔️ Poseer moto propia (con seguro y carta de ruta al día). 🛵\n" +
    "✔️ Tener un teléfono *iPhone 6s o superior* o *Android 9 o superior*, con internet y cámara frontal para estar siempre conectado. 📱\n\n" +
    "💼 *¿Por qué unirte a PedidosYa Rider?*\n" +
    "✨ Organiza tu semana a tu medida y elige tus horarios.\n" +
    "🏙️ Reparte en la ciudad y zona que te convenga.\n" +
    "💰 Genera ganancias semanales de forma rápida y fácil.\n\n" +
    "🚀 *¡No pierdas esta oportunidad! Te estamos esperando.*"
  )
  .addAnswer(
    "🔄 *¿Qué deseas hacer ahora?*\n\n" +
    "1️⃣ *Volver a la lista de opciones* 📋\n" +
    "0️⃣ *Salir* 👋\n\n" +
    "Por favor, escribe el número de la opción que prefieras.",
    { capture: true },
    async (ctx, { gotoFlow, flowDynamic, fallBack }) => {
      const userInput = ctx.body.trim();

      if (userInput === "1") {
        console.log("Usuario seleccionó '1': Volver a la lista.");
        return gotoFlow(menuFlow); 
      } else if (userInput === "0") {
        console.log("Usuario seleccionó '0': Salir.");
        await flowDynamic(
          "👋 ¡Hasta pronto! Si necesitas algo más, no dudes en escribirnos. 😊"
        );
        return;
      } else {
        console.log("Opción no válida:", userInput);
        return fallBack(
          "⚠️ *Opción no válida.* Por favor selecciona una opción válida: \n" +
          "1️⃣ *Volver a la lista* o 0️⃣ *Salir*."
        );
      }
    }
  );

module.exports = { flowQuieroSerParte };

// Crear el flujo de bienvenida pasando menuFlow
const welcomeFlow = createWelcomeFlow(menuFlow);

// Flujo principal, que redirige según la intención del usuario
const flowPrincipal = addKeyword(EVENTS.WELCOME)
  .addAction(async (ctx, ctxFn) => {
    const bodyText = ctx.body.toLowerCase().trim(); // Elimina espacios adicionales y estandariza el texto
    
    // Palabras clave para detección de citas
    const keywordDate = ['agendar', 'cita', 'reunion', 'turno'];
    const containsKeywordDate = keywordDate.some(keyword => bodyText.includes(keyword));
    
    if (containsKeywordDate) {
      console.log("📅 Palabra clave de cita detectada, redirigiendo al flujo de fecha...");
      return ctxFn.gotoFlow(dateFlow); // Redirige al flujo de citas
    }

    // Redirige al flujo de bienvenida si no se detecta ninguna palabra clave de cita
    console.log("👋 Redirigiendo al flujo de bienvenida por defecto...");
    return await ctxFn.gotoFlow(welcomeFlow); // Redirige al flujo de bienvenida
  });



// Inicialización del bot
const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowPrincipal, dateFlow, formFlow, welcomeFlow, menuFlow, flowFin, flowPreguntasFrecuentes, flowConsultaOtra, confirmationFlow, flowQuieroSerParte]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();
};

main();
