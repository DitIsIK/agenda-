"use client";

import { useMemo } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type Event,
  type EventPropGetter,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import nl from "date-fns/locale/nl";

import "react-big-calendar/lib/css/react-big-calendar.css";

type AgendaEventType = "lesson" | "study" | "exam";

interface AgendaEvent extends Event {
  type: AgendaEventType;
}

const locales = {
  nl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const eventColors: Record<AgendaEventType, string> = {
  lesson: "#2563EB",
  study: "#16A34A",
  exam: "#DC2626",
};

const messages = {
  week: "Week",
  work_week: "Werkweek",
  day: "Dag",
  month: "Maand",
  previous: "Vorige",
  next: "Volgende",
  today: "Vandaag",
  agenda: "Agenda",
  date: "Datum",
  time: "Tijd",
  event: "Event",
  noEventsInRange: "Geen events in deze periode.",
};

export function WeekView() {
  const demoEvents = useMemo<AgendaEvent[]>(() => {
    const base = new Date();
    const lessonStart = new Date(base);
    lessonStart.setHours(9, 0, 0, 0);
    const lessonEnd = new Date(lessonStart);
    lessonEnd.setHours(10, 30, 0, 0);

    const studyStart = new Date(base);
    studyStart.setDate(studyStart.getDate() + 1);
    studyStart.setHours(14, 0, 0, 0);
    const studyEnd = new Date(studyStart);
    studyEnd.setHours(15, 0, 0, 0);

    const examStart = new Date(base);
    examStart.setDate(examStart.getDate() + 3);
    examStart.setHours(11, 0, 0, 0);
    const examEnd = new Date(examStart);
    examEnd.setHours(12, 30, 0, 0);

    return [
      {
        title: "Communicatie 101",
        start: lessonStart,
        end: lessonEnd,
        type: "lesson",
      },
      {
        title: "Marketingstudieblok",
        start: studyStart,
        end: studyEnd,
        type: "study",
      },
      {
        title: "Marketingtoets",
        start: examStart,
        end: examEnd,
        type: "exam",
      },
    ];
  }, []);

  const eventPropGetter: EventPropGetter<AgendaEvent> = (event) => ({
    style: {
      backgroundColor: eventColors[event.type],
      border: "none",
      borderRadius: "0.75rem",
      color: "#ffffff",
      display: "block",
      boxShadow: "0 4px 10px -4px rgba(37, 99, 235, 0.3)",
    },
  });

  return (
    <div className="h-[720px] w-full rounded-2xl border border-border bg-card p-4 shadow-soft">
      <Calendar<AgendaEvent>
        culture="nl"
        localizer={localizer}
        defaultView="week"
        views={{ week: true, day: true, agenda: true }}
        events={demoEvents}
        messages={messages}
        eventPropGetter={eventPropGetter}
        startAccessor="start"
        endAccessor="end"
        step={30}
        timeslots={2}
        toolbar
      />
    </div>
  );
}

export default WeekView;
