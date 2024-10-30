const { addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const { createEvent } = require("../scripts/calendar");

const formFlow = addKeyword(EVENTS.ACTION)
  .addAnswer(
    "🎉 *¡Excelente!* Vamos a agendar tu cita. 😊\n\n" +
    "📝 *Primero*, ¿cuál es tu nombre completo?",
    { capture: true },
    async (ctx, ctxFn) => {
      await ctxFn.state.update({ tempName: ctx.body.trim() }); // Guardamos temporalmente el nombre
      console.log(`📥 Nombre capturado: ${ctx.body}`);
    }
  )
  .addAnswer(
    "🔢 *Gracias.* Ahora, ¿cuál es tu *Rider ID*?",
    { capture: true },
    async (ctx, ctxFn) => {
      const state = await ctxFn.state.getMyState();
      const fullName = state.tempName; // Recuperamos el nombre

      // Guardamos el nombre junto con el Rider ID en el campo `name`
      const riderId = ctx.body.trim();
      const completeName = `${fullName} - ${riderId}`;
      await ctxFn.state.update({ name: completeName });

      console.log(`📥 Nombre y Rider ID almacenados: ${completeName}`);
    }
  )
  .addAnswer(
    "💼 *Perfecto.* Por último, ¿cuál es el *motivo* de tu turno? 📝\n\n" +
    "Por favor, escribe la razón por la cual deseas agendar tu turno. Si tienes algún ticket creado, inclúyelo al final del texto para agilizar el proceso. 🔍\n\n" +
    "*Ejemplo de descripción:*\n" +
    "👉 *Motivo:* Solicito asistencia para actualizar mis documentos en la plataforma.\n" +
    "👉 *Ticket:* #123456\n\n" +
    "Este formato nos ayudará a brindarte un servicio más rápido y eficiente. 🚀",
    { capture: true },
    async (ctx, ctxFn) => {
      await ctxFn.state.update({ motive: ctx.body.trim() });
      console.log(`📥 Motivo almacenado: ${ctx.body}`);
    }
  )
  
  .addAnswer(
    "🚀 *¡Cita creada exitosamente!* Te esperamos el día acordado. 🗓️\n\n" +
    "💬 Si necesitas más ayuda, no dudes en contactarnos. ¡Estamos aquí para ti! 🤗",
    null,
    async (ctx, ctxFn) => {
      try {
        const userInfo = await ctxFn.state.getMyState();
        const { name, motive, date } = userInfo;

        console.log(`📋 Creando evento para: ${name}, Motivo: ${motive}, Fecha: ${date}`);

        // Crear el evento en el calendario
        const eventId = await createEvent(name, motive, date);

        console.log(`✅ Evento creado con ID: ${eventId}`);

        // Limpiar estado del usuario
        await ctxFn.state.clear();
      } catch (error) {
        console.error("❌ Error al crear el evento:", error);
        await ctxFn.flowDynamic(
          "⚠️ *Hubo un problema creando tu cita.* Por favor, intenta nuevamente más tarde. 😥"
        );
      }
    }
  );

module.exports = { formFlow };
