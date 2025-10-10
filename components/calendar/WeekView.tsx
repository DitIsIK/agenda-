// components/calendar/WeekView.tsx
"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { useMemo, useState } from "react";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { nl } from "date-fns/locale";

const locales = { nl };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type RBCEvt = {
  title: string;
  start: Date;
  end: Date;
  type?: "lesson" | "study" | "exam" | "task";
};

const DnDCalendar = withDragAndDrop<RBCEvt, object>(Calendar as any);

export default function WeekView() {
  // demo events zodat je wat ziet
  const [events, setEvents] = useState<RBCEvt[]>(
    useMemo(
      () => [
        {
          title: "Communicatie 101 (les)",
          start: new Date(Date.now() + 60 * 60 * 1000),
          end: new Date(Date.now() + 2 * 60 * 60 * 1000),
          type: "lesson",
        },
        {
          title: "Studieblok Marketing",
          start: new Date(Date.now() + 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 25 * 60 * 60 * 1000),
          type: "study",
        },
      ],
      []
    )
  );

  const eventPropGetter = (event: RBCEvt) => {
    const map: Record<string, string> = {
      lesson: "bg-lesson",
      study: "bg-study",
      exam: "bg-exam",
      task: "bg-task",
    };
    const cls = map[event.type ?? "task"] ?? "bg-task";
    return { className: `${cls} !text-white !border-none` };
  };

  // simpele drag handlers (optioneel)
  const onEventDrop = ({ event, start, end }: any) => {
    setEvents((prev) =>
      prev.map((e) => (e === event ? { ...e, start, end } : e))
    );
  };
  const onEventResize = ({ event, start, end }: any) => {
    setEvents((prev) =>
      prev.map((e) => (e === event ? { ...e, start, end } : e))
    );
  };

  return (
    <div className="rounded-2xl shadow-soft p-2 bg-card">
      <DnDCalendar
        culture="nl"
        localizer={localizer}
        events={events}
        views={[Views.WEEK, Views.DAY, Views.MONTH]}
        defaultView={Views.WEEK}
        style={{ height: 650 }}
        eventPropGetter={eventPropGetter}
        draggableAccessor={() => true}
        resizable
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
      />
    </div>
  );
}
