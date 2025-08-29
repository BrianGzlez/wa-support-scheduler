// scripts/calendar.js
const { google } = require('googleapis');

// ===== Auth (no secrets in code) =====
// Set GOOGLE_APPLICATION_CREDENTIALS in your environment to point to your JSON key file.
// Example: GOOGLE_APPLICATION_CREDENTIALS=./secrets/google.json
const auth = new google.auth.GoogleAuth({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './secrets/google.json',
  scopes: ['https://www.googleapis.com/auth/calendar'],
});


const calendar = google.calendar({ version: 'v3' });

// Set GOOGLE_CALENDAR_ID=primary (or your calendar ID) in .env
const calendarID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const timeZone = process.env.TZ || 'America/Santo_Domingo';

// Work window: Monday–Friday, 9:00–17:00 local time
const rangeLimit = {
  days: [1, 2, 3, 4, 5], // Mon–Fri (0=Sun)
  startHour: 9,          // 9 AM
  endHour: 17,           // 5 PM (last 15-min block ends at 17:00)
};

const standardDurationMinutes = 15; // 15-minute blocks
const dateLimit = 30;               // search horizon in days

// Create an event on Google Calendar
async function createEvent(eventName, description, date) {
  try {
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const startDateTime = new Date(date);
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(startDateTime.getMinutes() + standardDurationMinutes);

    // Validate time window
    if (!isTimeWithinRange(startDateTime)) {
      throw new Error('Selected time is outside the allowed window (9 AM – 5 PM).');
    }

    const event = {
      summary: eventName,
      description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone,
      },
    };

    const response = await calendar.events.insert({
      calendarId: calendarID,
      resource: event,
    });

    console.log('✅ Event created successfully (id only logged).');
    return response.data.id;
  } catch (err) {
    console.error('❌ Error creating event:', err.message || err);
    throw err;
  }
}

// Check if a time is within the allowed work window
function isTimeWithinRange(date) {
  const hour = date.getHours();
  return hour >= rangeLimit.startHour && hour < rangeLimit.endHour;
}

// List available 15-min slots within the search window
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
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`📅 Retrieved ${events.length} events in range.`);

    const slots = [];
    let currentDate = new Date(startDate);

    // Generate 15-min blocks for each allowed day/hour
    while (currentDate < endDate) {
      const dayOfWeek = currentDate.getDay();
      if (rangeLimit.days.includes(dayOfWeek)) {
        for (let hour = rangeLimit.startHour; hour < rangeLimit.endHour; hour++) {
          for (let minute = 0; minute < 60; minute += standardDurationMinutes) {
            const slotStart = new Date(currentDate);
            slotStart.setHours(hour, minute, 0, 0);

            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotStart.getMinutes() + standardDurationMinutes);

            const overlappingEvents = events.filter((event) => {
              const eventStart = new Date(event.start.dateTime || event.start.date);
              const eventEnd = new Date(event.end.dateTime || event.end.date);
              return slotStart < eventEnd && slotEnd > eventStart;
            });

            // Allow at most 1 event per 15-min block
            if (overlappingEvents.length === 0) {
              slots.push({ start: slotStart, end: slotEnd });
            }
          }
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`✅ Computed ${slots.length} available slots.`);
    return slots;
  } catch (err) {
    console.error('❌ Error listing available slots:', err.message || err);
    throw err;
  }
}

// Get the closest available slot on the same day
async function getClosestAvailableSlot(preferredDate) {
  try {
    if (typeof preferredDate === 'string') {
      preferredDate = new Date(preferredDate);
    }
    if (!(preferredDate instanceof Date) || Number.isNaN(preferredDate.getTime())) {
      throw new Error('The provided date is not valid.');
    }

    const availableSlots = await listAvailableSlots(preferredDate);
    const now = new Date();

    // Same-day future slots only
    const sameDayFutureSlots = availableSlots.filter(
      (slot) => slot.start > now && slot.start.toDateString() === preferredDate.toDateString()
    );

    if (sameDayFutureSlots.length === 0) {
      console.log('❌ No future slots available on the preferred date.');
      return null;
    }

    // Closest to the preferred time
    const closestSlot = sameDayFutureSlots.reduce((closest, current) => {
      const diffCurrent = Math.abs(current.start - preferredDate);
      const diffClosest = Math.abs(closest.start - preferredDate);
      return diffCurrent < diffClosest ? current : closest;
    }, sameDayFutureSlots[0]);

    console.log('🔍 Closest same-day slot found.');
    return closestSlot;
  } catch (err) {
    console.error('❌ Error getting closest available slot:', err.message || err);
    throw err;
  }
}

// Get all available slots for a specific day
async function getAvailableSlotsForDate(preferredDate) {
  try {
    if (typeof preferredDate === 'string') {
      preferredDate = new Date(preferredDate);
    }
    if (!(preferredDate instanceof Date) || Number.isNaN(preferredDate.getTime())) {
      throw new Error('The provided date is not valid.');
    }

    const availableSlots = await listAvailableSlots(preferredDate);

    const sameDaySlots = availableSlots.filter(
      (slot) => slot.start.toDateString() === preferredDate.toDateString()
    );

    if (sameDaySlots.length === 0) {
      console.log('❌ No slots available on the selected date.');
      return [];
    }

    console.log(`📅 Found ${sameDaySlots.length} slots for the selected date.`);
    return sameDaySlots;
  } catch (err) {
    console.error('❌ Error getting slots for date:', err.message || err);
    throw err;
  }
}

// Check availability for a specific datetime (and print all options if missing time)
async function isDateAvailable(date) {
  try {
    const currentDate = new Date();
    const maxDate = new Date();
    maxDate.setDate(currentDate.getDate() + dateLimit);

    if (date < currentDate || date > maxDate) {
      console.log('❌ Date is outside the allowed search range.');
      return false;
    }

    const dayOfWeek = date.getDay();
    if (!rangeLimit.days.includes(dayOfWeek)) {
      console.log('❌ Non-working day.');
      return false;
    }

    if (!isTimeWithinRange(date)) {
      console.log('❌ Time is outside the allowed window.');
      return false;
    }

    const availableSlots = await getAvailableSlotsForDate(date);

    if (availableSlots.length > 0) {
      console.log('✅ There are available slots on the selected date.');
      // Avoid printing specific times to logs to reduce exposure
      return true;
    } else {
      console.log('❌ No slots available on the selected date.');
      return false;
    }
  } catch (err) {
    console.error('❌ Error checking date availability:', err.message || err);
    throw err;
  }
}

module.exports = { createEvent, isDateAvailable, getClosestAvailableSlot, getAvailableSlotsForDate };
