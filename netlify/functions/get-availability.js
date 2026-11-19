// Netlify Function: citeste calendarele iCal (Booking + Airbnb) din variabile
// de mediu si returneaza zilele ocupate. URL-urile iCal se pun in Netlify:
// Site settings -> Environment variables -> ICAL_BOOKING_URL / ICAL_AIRBNB_URL
exports.handler = async function () {
  const urls = [process.env.ICAL_BOOKING_URL, process.env.ICAL_AIRBNB_URL].filter(Boolean);
  const booked = [];

  function parseICal(text) {
    const days = [];
    const events = text.split('BEGIN:VEVENT');
    for (let i = 1; i < events.length; i++) {
      const ev = events[i];
      const sMatch = ev.match(/DTSTART[^:]*:(\d{8})/);
      const eMatch = ev.match(/DTEND[^:]*:(\d{8})/);
      if (!sMatch) continue;
      const start = sMatch[1];
      const end = eMatch ? eMatch[1] : start;
      let cur = new Date(+start.slice(0, 4), +start.slice(4, 6) - 1, +start.slice(6, 8));
      const endD = new Date(+end.slice(0, 4), +end.slice(4, 6) - 1, +end.slice(6, 8));
      // ziua de checkout (DTEND) este libera in regim de cazare
      while (cur < endD) {
        days.push({ year: cur.getFullYear(), month: cur.getMonth() + 1, day: cur.getDate() });
        cur.setDate(cur.getDate() + 1);
      }
    }
    return days;
  }

  try {
    for (const url of urls) {
      const res = await fetch(url);
      const text = await res.text();
      booked.push(...parseICal(text));
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
      body: JSON.stringify({ bookedDays: booked })
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookedDays: [], error: e.message })
    };
  }
};
