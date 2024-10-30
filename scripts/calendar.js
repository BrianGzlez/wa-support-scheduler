const { google } = require('googleapis');

// Autenticación
const auth = new google.auth.GoogleAuth({
    keyFile: './google.json',
    scopes: ['https://www.googleapis.com/auth/calendar']
});

const calendar = google.calendar({ version: "v3" });

const calendarID = "f8229778a9508795c02b466dac87cf9873fb47d8c7693ee0337434467af17a27@group.calendar.google.com";
const timeZone = 'America/Santo_Domingo'; // Zona horaria de Santo Domingo

const rangeLimit = {
    days: [1, 2, 3, 4, 5], // Lunes a Viernes
    startHour: 9,           // 9 AM
    endHour: 17             // 5 PM (para que el último bloque sea 4:45 - 5:00)
};

const standardDurationMinutes = 15; // Bloques de 15 minutos
const dateLimit = 30; // Límite de búsqueda de fechas (30 días)

// Función para crear un evento en Google Calendar
async function createEvent(eventName, description, date) {
    try {
        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        const startDateTime = new Date(date);
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(startDateTime.getMinutes() + standardDurationMinutes);

        // Verificar si el evento está dentro del rango permitido
        if (!isTimeWithinRange(startDateTime)) {
            throw new Error("❌ La hora seleccionada está fuera del horario permitido (9 AM - 5 PM).");
        }

        const event = {
            summary: eventName,
            description: description,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: timeZone,
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: timeZone,
            },
        };

        const response = await calendar.events.insert({
            calendarId: calendarID,
            resource: event,
        });

        console.log("✅ Evento creado con éxito:", response.data);
        return response.data.id;
    } catch (err) {
        console.error("❌ Error al crear el evento:", err);
        throw err;
    }
}

// Función para verificar si la hora está dentro del rango permitido
function isTimeWithinRange(date) {
    const hour = date.getHours();
    return hour >= rangeLimit.startHour && hour < rangeLimit.endHour;
}

// Función para listar los slots disponibles
async function listAvailableSlots(startDate = new Date(), endDate) {
    try {
        const authClient = await auth.getClient();
        google.options({ auth: authClient });

        if (!endDate) {
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + dateLimit);
        }

        const response = await calendar.events.list({
            calendarId: calendarID,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            timeZone: timeZone,
            singleEvents: true,
            orderBy: 'startTime'
        });

        console.log("📅 Eventos obtenidos:", response.data.items);

        const events = response.data.items;
        const slots = [];
        let currentDate = new Date(startDate);

        // Generar bloques de 15 minutos por cada hora dentro del rango permitido
        while (currentDate < endDate) {
            const dayOfWeek = currentDate.getDay();
            if (rangeLimit.days.includes(dayOfWeek)) {
                for (let hour = rangeLimit.startHour; hour < rangeLimit.endHour; hour++) {
                    for (let minute = 0; minute < 60; minute += standardDurationMinutes) {
                        const slotStart = new Date(currentDate);
                        slotStart.setHours(hour, minute, 0, 0);

                        const slotEnd = new Date(slotStart);
                        slotEnd.setMinutes(slotStart.getMinutes() + standardDurationMinutes);

                        const overlappingEvents = events.filter(event => {
                            const eventStart = new Date(event.start.dateTime || event.start.date);
                            const eventEnd = new Date(event.end.dateTime || event.end.date);
                            return (slotStart < eventEnd && slotEnd > eventStart);
                        });

                        // Permitir hasta 1 evento por bloque de 15 minutos (4 bloques por hora)
                        if (overlappingEvents.length === 0) {
                            slots.push({ start: slotStart, end: slotEnd });
                        }
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log("✅ Slots disponibles:", slots);
        return slots;
    } catch (err) {
        console.error("❌ Error al listar slots disponibles:", err);
        throw err;
    }
}

// Función para obtener el slot más cercano en la misma fecha
// Función para obtener el slot más cercano en la misma fecha
async function getClosestAvailableSlot(preferredDate) {
    try {
        if (typeof preferredDate === 'string') {
            preferredDate = new Date(preferredDate);
        }

        if (isNaN(preferredDate)) {
            throw new Error('La fecha proporcionada no es válida.');
        }

        const availableSlots = await listAvailableSlots(preferredDate);
        const currentDateTime = new Date(); // Hora y fecha actual

        // Filtrar solo slots futuros o en la misma fecha con hora futura
        const sameDayFutureSlots = availableSlots.filter(slot =>
            (slot.start > currentDateTime) &&
            (slot.start.toDateString() === preferredDate.toDateString())
        );

        if (sameDayFutureSlots.length === 0) {
            console.log("❌ No hay slots futuros disponibles en la fecha preferida.");
            return null; // Retorna null si no hay slots futuros en la misma fecha
        }

        // Ordenar los slots por proximidad a la hora seleccionada
        const closestSlot = sameDayFutureSlots.reduce((closest, current) => {
            const diffCurrent = Math.abs(current.start - preferredDate);
            const diffClosest = Math.abs(closest.start - preferredDate);
            return diffCurrent < diffClosest ? current : closest;
        }, sameDayFutureSlots[0]);

        console.log("🔍 Slot más cercano encontrado:", closestSlot);
        return closestSlot;
    } catch (err) {
        console.error("❌ Error al obtener el slot más cercano:", err);
        throw err;
    }
}


// Función para obtener todos los slots disponibles en un día específico
async function getAvailableSlotsForDate(preferredDate) {
    try {
        if (typeof preferredDate === 'string') {
            preferredDate = new Date(preferredDate);
        }

        if (isNaN(preferredDate)) {
            throw new Error('La fecha proporcionada no es válida.');
        }

        const availableSlots = await listAvailableSlots(preferredDate);

        // Filtrar los slots que coincidan con la fecha seleccionada
        const sameDaySlots = availableSlots.filter(
            slot => slot.start.toDateString() === preferredDate.toDateString()
        );

        if (sameDaySlots.length === 0) {
            console.log("❌ No hay slots disponibles en la fecha seleccionada.");
            return [];
        }

        console.log("📅 Slots disponibles para la fecha:", sameDaySlots);
        return sameDaySlots;
    } catch (err) {
        console.error("❌ Error al obtener los slots disponibles para la fecha:", err);
        throw err;
    }
}

// Modificación de isDateAvailable para sugerir todos los turnos disponibles en caso de que no se especifique hora
async function isDateAvailable(date) {
    try {
        const currentDate = new Date();
        const maxDate = new Date();
        maxDate.setDate(currentDate.getDate() + dateLimit);

        if (date < currentDate || date > maxDate) {
            console.log("❌ Fecha fuera del rango permitido.");
            return false;
        }

        const dayOfWeek = date.getDay();
        if (!rangeLimit.days.includes(dayOfWeek)) {
            console.log("❌ Día no laboral.");
            return false;
        }

        if (!isTimeWithinRange(date)) {
            console.log("❌ Hora fuera del rango permitido.");
            return false;
        }

        const availableSlots = await getAvailableSlotsForDate(date);

        if (availableSlots.length > 0) {
            console.log("✅ Turnos disponibles para la fecha seleccionada:");
            availableSlots.forEach(slot =>
                console.log(`- De ${slot.start.toLocaleTimeString()} a ${slot.end.toLocaleTimeString()}`)
            );
            return true;
        } else {
            console.log("❌ No hay slots disponibles en la fecha seleccionada.");
            return false;
        }
    } catch (err) {
        console.error("❌ Error al verificar la disponibilidad de la fecha:", err);
        throw err;
    }
}


module.exports = { createEvent, isDateAvailable, getClosestAvailableSlot, getAvailableSlotsForDate};
