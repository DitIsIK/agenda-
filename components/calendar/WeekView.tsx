"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";

const locales = { nl };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1, locale: nl }),
  getDay,
  locales,
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  type: "lesson" | "study" | "exam" | "task" | string;
}

export default function WeekView() {
  const events: CalendarEvent[] = [
    {
      title: "Communicatie 101 (les)",
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000),
      type: "lesson",
    },
    {
      title: "Studieblok Marketing",
      start: new Date(Date.now() + 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 25 * 60 * 60 * 1000),
      type: "study",
    },
  ];

  const eventPropGetter = (event: CalendarEvent) => {
    const colorClasses: Record<string, string> = {
      lesson: "bg-lesson",
      study: "bg-study",
      exam: "bg-exam",
      task: "bg-task",
    };

    return {
      className: `${colorClasses[event.type] ?? "bg-task"} !text-white !border-none`,
    };
  };

  return (
    <div className="rounded-2xl shadow-soft p-2 bg-card">
      <Calendar
        culture="nl"
        localizer={localizer}
        events={events}
        views={[Views.WEEK, Views.DAY, Views.MONTH]}
        defaultView={Views.WEEK}
        style={{ height: 650 }}
        eventPropGetter={eventPropGetter}
      />
    </div>
  );
}
