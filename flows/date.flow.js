const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");
const { text2iso, iso2text } = require('../scripts/utils');
const { isDateAvailable, getClosestAvailableSlot } = require("../scripts/calendar");
const { chat } = require("../scripts/chatgpt");
const { formFlow } = require("./form.flow");

// Función para formatear fechas en español
function formatSpanishDate(date) {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'America/Santo_Domingo'
  });
}

const currentDate = new Date();
console.log("Fecha actual:", currentDate);

const promptBase = `
Sos un asistente virtual diseñado para ayudar a los usuarios a agendar citas mediante una conversación.
Tu objetivo es únicamente ayudar al usuario a elegir un horario y una fecha para sacar turno.
Puedes entender tanto fechas exactas (como "Jueves 30 de mayo 2024 a las 10:00hs") como fechas relativas (como "mañana a las 3 pm", "el próximo lunes a las 11 am", "en dos semanas"). 
Si el usuario da una fecha relativa, conviértela a una fecha exacta antes de verificar la disponibilidad.
Te voy a dar la fecha solicitada por el usuario y la disponibilidad de la misma. Esta fecha la tiene que confirmar el usuario.
Si la disponibilidad es true, entonces responde algo como: La fecha solicitada está disponible. El turno sería el Jueves 30 de mayo 2024 a las 10:00hs.
Si la disponibilidad es false, entonces recomienda la siguiente fecha disponible.
`;


// **Flujo de confirmación con estilo y logs adicionales**
const confirmationFlow = addKeyword(EVENTS.ACTION)
  .addAnswer(
    "✅ *Confirmación requerida* ✅\n\n" +
    "Por favor, elige una opción para continuar:\n\n" +
    "1️⃣ *Sí*\n" +
    "2️⃣ *No*\n\n" +
    "Escribe el número o la palabra correspondiente. 😊",
    { capture: true },
    async (ctx, ctxFn) => {
      const userResponse = ctx.body.trim().toLowerCase();
      console.log("📥 Respuesta del usuario recibida:", ctx.body);
      console.log("📥 Respuesta procesada:", userResponse);

      if (["1", "si", "sí"].includes(userResponse)) {
        console.log("✅ Confirmación detectada. Redirigiendo al formulario...");

        if (!formFlow) {
          console.error("❌ Error: El flujo 'formFlow' no está definido.");
          return ctxFn.flowDynamic(
            "⚠️ *Error*: No se puede acceder al formulario en este momento. Por favor, inténtalo más tarde."
          );
        }

        console.log("🔄 Intentando redirigir al formFlow...");
        await ctxFn.flowDynamic("📋 *Redirigiendo al formulario...*");
        return ctxFn.gotoFlow(formFlow);
      } else if (["2", "no"].includes(userResponse)) {
        console.log("🚫 Cancelación detectada.");
        await ctxFn.endFlow(
          "❌ *Reserva cancelada.* Si cambias de opinión, ¡puedes volver a intentarlo en cualquier momento! 🚀"
        );
      } else {
        console.log("⚠️ Respuesta no válida. Pidiendo nuevamente al usuario.");
        return ctxFn.flowDynamic(
          "⚠️ *Opción no válida.* Por favor, elige '1' para *Sí* o '2' para *No*. 😊"
        );
      }
    }
  );

// **Flujo para gestionar la fecha solicitada**
const dateFlow = addKeyword(EVENTS.ACTION)
  .addAnswer(
    "📅 *¡Perfecto!* ¿En qué día y a qué hora te gustaría agendar la cita? 😊\n\n" +
    "Por ejemplo: *Jueves a las 3 pm*.",
    { capture: true }
  )

  .addAnswer(
    "🔍 *Revisando disponibilidad...* Esto puede tardar unos segundos...",
    null,
    async (ctx, ctxFn) => {
      try {
        console.log("📥 Fecha recibida:", ctx.body);

        const solicitedDate = await text2iso(ctx.body);
        console.log("📅 Fecha solicitada convertida:", solicitedDate);

        if (solicitedDate.includes("false")) {
          console.log("❌ No se pudo deducir la fecha.");
          return ctxFn.endFlow(
            "⚠️ *Error*: No se pudo entender la fecha proporcionada. Por favor, intenta nuevamente con el formato correcto. 📆"
          );
        }

        const startDate = new Date(solicitedDate);

        // Validación: Evitar fechas pasadas
        if (startDate < new Date()) {
          console.log("❌ La fecha proporcionada ya pasó.");
          return ctxFn.flowDynamic(
            "⚠️ *Error*: La fecha proporcionada ya ha pasado. Por favor, elige una fecha futura. 📅"
          );
        }

        let dateAvailable = await isDateAvailable(startDate);
        console.log("📅 Disponibilidad de la fecha:", dateAvailable);

        let dateText;

        if (!dateAvailable) {
          const nextDateAvailable = await getClosestAvailableSlot(startDate);
          if (!nextDateAvailable || !nextDateAvailable.start) {
            console.log("❌ No se encontró un próximo espacio disponible.");
            return ctxFn.endFlow(
              "⚠️ No hay fechas disponibles en este momento. Vuelve a intentarlo más tarde. 🕒"
            );
          }

          dateText = formatSpanishDate(nextDateAvailable.start);
          console.log("📅 Próxima fecha disponible:", dateText);

          const messages = [{ role: "user", content: `${ctx.body}` }];
          const responseGPT = await chat(
            `${promptBase}\nHoy es: ${currentDate}\nFecha solicitada: ${solicitedDate}\nDisponibilidad: false. Próxima fecha disponible: ${dateText}.`,
            messages
          );

          console.log("💬 Respuesta de ChatGPT:", responseGPT);

          await ctxFn.flowDynamic(responseGPT);
          await ctxFn.state.update({ date: nextDateAvailable.start });

          console.log("🔄 Redirigiendo al flujo de confirmación...");
          return ctxFn.gotoFlow(confirmationFlow);
        } else {
          dateText = formatSpanishDate(startDate);
          console.log("✅ Fecha disponible:", dateText);

          const messages = [{ role: "user", content: `${ctx.body}` }];
          const responseGPT = await chat(
            `${promptBase}\nHoy es: ${currentDate}\nFecha solicitada: ${solicitedDate}\nDisponibilidad: true.`,
            messages
          );

          console.log("💬 Respuesta de ChatGPT:", responseGPT);

          await ctxFn.flowDynamic(responseGPT);
          await ctxFn.state.update({ date: startDate });

          console.log("🔄 Redirigiendo al flujo de confirmación...");
          return ctxFn.gotoFlow(confirmationFlow);
        }
      } catch (error) {
        console.error("❌ Error en el flujo de fechas:", error);
        await ctxFn.endFlow(
          "⚠️ *Error*: Ocurrió un problema procesando tu solicitud. Por favor, intenta nuevamente. 🙏"
        );
      }
    }
  );

module.exports = { dateFlow, confirmationFlow };
