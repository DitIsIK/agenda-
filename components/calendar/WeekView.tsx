"use client";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { nl },
});

export default function WeekView() {
  const events = [
    { title: "Communicatie 101 (les)", start: new Date(), end: new Date(Date.now() + 60 * 60 * 1000), type: "lesson" },
    {
      title: "Studieblok Marketing",
      start: new Date(Date.now() + 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 25 * 60 * 60 * 1000),
      type: "study",
    },
  ];
  const eventPropGetter = (e: any) => {
    const map: Record<string, string> = { lesson: "bg-lesson", study: "bg-study", exam: "bg-exam", task: "bg-task" };
    return { className: `${map[e.type] ?? "bg-task"} !text-white !border-none` };
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
