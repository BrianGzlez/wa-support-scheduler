const { chat } = require('./chatgpt'); // Import your ChatGPT function
const { DateTime } = require('luxon');

/**
 * Formats an ISO datetime into a readable string using TZ/LANG.
 * @param {string} iso - ISO string
 * @returns {string} - Human-readable date string
 */
function iso2text(iso) {
  try {
    const TIMEZONE = process.env.TZ || 'America/Santo_Domingo';
    const LOCALE = process.env.LANG || 'en-US';

    const dateTime = DateTime.fromISO(iso, { zone: 'utc' })
      .setZone(TIMEZONE)
      .setLocale(LOCALE);

    const formattedDate = dateTime.toLocaleString({
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });

    return formattedDate;
  } catch (error) {
    console.error('Error converting date:', error?.message || error);
    return 'Invalid date format';
  }
}

/**
 * Extracts a datetime from natural language using the LLM, returning ISO or 'false'.
 * @param {string} text - Natural language text containing a date/time
 * @returns {Promise<string>} - ISO string or 'false' if invalid
 */
async function text2iso(text) {
  const currentDate = new Date();
  const TIMEZONE = process.env.TZ || 'America/Santo_Domingo';
  const LOCALE = process.env.LANG || 'en-US';

  const prompt = `Current datetime (ISO): ${currentDate.toISOString()}
Timezone: ${TIMEZONE}
Locale: ${LOCALE}

You will receive a text that contains a date and/or time expressed in natural language.

Text: "${text}"

Your task:
1) Extract the intended exact datetime.
2) Reply **only** with that datetime in ISO 8601 (e.g., 2025-08-28T15:00:00.000Z). No extra words, no code fences, no quotes.
3) Treat relative phrases accordingly (e.g., "tomorrow", "this Thursday", "next Monday"). "This Thursday" refers to the next occurrence of Thursday relative to the *current* date above.
4) If you cannot determine a valid datetime, reply exactly: false

Examples (illustrative; use the current datetime at the top for resolution):
- "Friday at 9 am" → 2025-10-17T09:00:00.000-04:00 (example; include offset or Z as appropriate)
- "Tomorrow 10 am" → 2025-10-16T10:00:00.000-04:00
- "Thursday 9 in the morning" → 2025-10-19T09:00:00.000-04:00
`;

  console.log('Natural-language date received.');

  const messages = [{ role: 'user', content: prompt }];
  const response = await chat(prompt, messages);


  console.log('LLM response received.');

  const trimmedResponse = String(response || '').trim();

  if (trimmedResponse === 'false') {
    console.error('No valid date could be extracted from the text.');
    return 'false';
  }

  const parsed = new Date(trimmedResponse);
  if (Number.isNaN(parsed.getTime())) {
    console.error('Generated datetime is invalid.');
    return 'false';
  }

  return trimmedResponse;
}

module.exports = { text2iso, iso2text };
