// Minimal RFC 5545 calendar builder — just enough to export deadlines as
// all-day events with a reminder, importable into Google/Apple/Outlook calendars.

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function foldLine(line: string) {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

function formatIcsDate(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function formatIcsDateTime(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export type IcsEvent = {
  uid: string;
  title: string;
  date: Date;
  description?: string;
  /** Days before the event to fire a reminder alarm. */
  alarmDaysBefore?: number;
};

export function buildIcs(calendarName: string, events: IcsEvent[]) {
  const dtstamp = formatIcsDateTime(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Scadenze in Regola//IT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  for (const ev of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}@scadenzeinregola.it`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${formatIcsDate(ev.date)}`,
      `SUMMARY:${escapeIcsText(ev.title)}`
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    if (ev.alarmDaysBefore) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeIcsText(ev.title)}`,
        `TRIGGER:-P${ev.alarmDaysBefore}D`,
        "END:VALARM"
      );
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
