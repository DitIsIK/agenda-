"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { useMemo } from "react";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";

import type { CalendarEvent } from "@/lib/calendar";
import { useEvents } from "./EventProvider";

const locales = { nl };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1, locale: nl }),
  getDay,
  locales,
});

const DragAndDropCalendar = withDragAndDrop(Calendar);

const colorClasses: Record<string, string> = {
  lesson: "bg-lesson",
  study: "bg-study",
  exam: "bg-exam",
  task: "bg-task",
};

export default function WeekView() {
  const { events, conflicts, updateEventTime } = useEvents();

  const conflictEventIds = useMemo(() => new Set(conflicts.flatMap((conflict) => [conflict.eventId, conflict.conflictingWithId])), [
    conflicts,
  ]);

  return (
    <div className="rounded-2xl bg-card p-2 shadow-soft">
      <DragAndDropCalendar
        culture="nl"
        localizer={localizer}
        events={events}
        views={[Views.WEEK, Views.DAY, Views.MONTH]}
        defaultView={Views.WEEK}
        style={{ height: 700 }}
        eventPropGetter={(event) => {
          const calendarEvent = event as CalendarEvent;
          const baseColor = colorClasses[calendarEvent.type] ?? "bg-task";
          const lockedClass = calendarEvent.locked ? "opacity-90" : "opacity-100";
          const conflictClass = conflictEventIds.has(calendarEvent.id) ? "ring-2 ring-destructive ring-offset-2" : "";

          return {
            className: `${baseColor} ${lockedClass} ${conflictClass} !border-none !text-white`,
          };
        }}
        components={{
          event: ({ event }) => {
            const calendarEvent = event as CalendarEvent;
            return (
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center justify-between gap-2 text-xs font-medium">
                <span>{calendarEvent.title}</span>
                {calendarEvent.locked ? <span className="text-[10px] uppercase tracking-wide">Locked</span> : null}
              </div>
              {calendarEvent.location ? (
                <span className="text-[10px] opacity-80">{calendarEvent.location}</span>
              ) : null}
            </div>
            );
          },
        }}
        resizable
        draggableAccessor={(event) => {
          const calendarEvent = event as CalendarEvent;
          return !calendarEvent.locked;
        }}
        onEventDrop={({ event, start, end }) => {
          const calendarEvent = event as CalendarEvent;
          if (calendarEvent.locked) return;
          updateEventTime(calendarEvent.id, new Date(start as Date), new Date(end as Date));
        }}
        onEventResize={({ event, start, end }) => {
          const calendarEvent = event as CalendarEvent;
          if (calendarEvent.locked) return;
          updateEventTime(calendarEvent.id, new Date(start as Date), new Date(end as Date));
        }}
      />
    </div>
  );
}
