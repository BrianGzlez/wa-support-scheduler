const { chat } = require('./chatgpt'); // Importar tu función de ChatGPT
const { DateTime } = require('luxon');

/** 
 * @param {string} iso - Fecha en formato ISO 
 * @returns {string} - Fecha en formato legible
 **/
function iso2text(iso) {
    try {
        const dateTime = DateTime.fromISO(iso, { zone: 'utc' }).setZone('America/El_Salvador');

        const formattedDate = dateTime.toLocaleString({
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZoneName: 'short'
        });

        return formattedDate;
    } catch (error) {
        console.error('Error al convertir la fecha: ' + error);
        return 'Formato de fecha no válido';
    }
}

/** 
 * @param {string} text - Texto con fecha en lenguaje natural
 * @returns {Promise<string>} - Fecha en formato ISO o 'false' si no es válida
 **/
async function text2iso(text) {
    const currentDate = new Date();
   
    const prompt = `La fecha actual es: ${currentDate.toISOString()}. Te daré un texto que contiene una fecha o un tiempo. 

Texto: "${text}"

Necesito que extraigas la fecha y la hora de este texto y que respondas exclusivamente con esa fecha y hora en formato ISO. Considera que "este jueves" se refiere al próximo jueves en la semana actual. Si no se puede extraer una fecha válida, responde 'false'.

Ejemplos:
- "El viernes 20 de octubre a las 9 am" debe ser 2024-10-20T09:00:00.000.
- "Este viernes a las 9 am" debe ser 2024-10-20T09:00:00.000, considerando que hoy es ${currentDate.toLocaleDateString()}.
- "Mañana a las 10 am" debe ser 2024-10-16T10:00:00.000.
- "El lunes" debe ser 2024-10-16T10:00:00.000.
- "Jueves a las 9 de la mañana" debe ser 2024-10-19T09:00:00.000, considerando que hoy es ${currentDate.toLocaleDateString()}.
`;

    const messages = [{ role: "user", content: prompt }];
    
    console.log('Texto proporcionado:', text);

    const response = await chat(prompt, messages);
    
    console.log('Respuesta completa de ChatGPT:', response);
    const trimmedResponse = response.trim();
    console.log('Respuesta de ChatGPT:', trimmedResponse);

    if (trimmedResponse === 'false') {
        console.error('Error: No se pudo extraer una fecha válida del texto.');
        return 'false';
    }

    const date = new Date(trimmedResponse);
    if (isNaN(date.getTime())) {
        console.error('Error: La fecha generada no es válida.');
        return 'false';
    }

    return trimmedResponse;
}

module.exports = { text2iso, iso2text };
