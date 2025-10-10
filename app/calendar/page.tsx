"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { useEffect, useMemo, useState } from "react";
import { Calendar, SlotInfo, Views, dateFnsLocalizer } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";

import { FabAdd } from "./components/FabAdd";
import { EventForm, EventDraft } from "./components/EventForm";
import { RightDock } from "./components/RightDock";
import { useEventsStore } from "@/lib/useEventsStore";
import { CalendarEvent } from "@/lib/types";

const locales = {
  nl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type FormState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit";
      event?: CalendarEvent;
      slotSuggestion?: Pick<CalendarEvent, "start" | "end">;
    };

export default function CalendarPage() {
  const events = useEventsStore((store) => store.events);
  const load = useEventsStore((store) => store.load);
  const add = useEventsStore((store) => store.add);
  const update = useEventsStore((store) => store.update);
  const remove = useEventsStore((store) => store.remove);
  const select = useEventsStore((store) => store.select);

  const [formState, setFormState] = useState<FormState>({ open: false });

  useEffect(() => {
    load();
  }, [load]);

  const calendarEvents = useMemo(() => events.map((event) => ({ ...event })), [events]);

  const eventPropGetter = (event: CalendarEvent) => {
    const backgroundMap: Record<string, string> = {
      lesson: "bg-lesson",
      study: "bg-study",
      task: "bg-task",
      exam: "bg-exam",
    };

    const backgroundClass = backgroundMap[event.type] ?? "bg-slate-500";

    return {
      className: `${backgroundClass} !border-none !text-white rounded-md`,
    };
  };

  const openCreateForm = (suggestion?: { start: Date; end: Date }) => {
    select(null);
    setFormState({ open: true, mode: "create", slotSuggestion: suggestion });
  };

  const openEditForm = (event: CalendarEvent) => {
    select(event.id);
    setFormState({ open: true, mode: "edit", event });
  };

  const handleFormClose = () => {
    setFormState({ open: false });
    select(null);
  };

  const handleFormSubmit = (draft: EventDraft) => {
    if (formState.open && formState.mode === "edit" && formState.event) {
      update({ ...formState.event, ...draft });
    } else {
      add({
        title: draft.title,
        type: draft.type,
        start: draft.start,
        end: draft.end,
        location: draft.location,
        locked: draft.locked,
        notes: draft.notes,
      });
    }

    handleFormClose();
  };

  const handleDelete = (id: string) => {
    remove(id);
    handleFormClose();
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (slotInfo.action === "doubleClick") {
      openCreateForm({ start: slotInfo.start, end: slotInfo.end });
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    openEditForm(event);
  };

  const handleAddClick = () => {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    openCreateForm({ start, end });
  };

  const defaultDate = useMemo(() => (events.length ? events[0].start : new Date()), [events]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm">
          <Calendar
            culture="nl"
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            views={[Views.WEEK, Views.DAY, Views.MONTH]}
            defaultView={Views.WEEK}
            defaultDate={defaultDate}
            style={{ height: 640 }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(event) => handleSelectEvent(event as CalendarEvent)}
            eventPropGetter={(event) => eventPropGetter(event as CalendarEvent)}
            onDoubleClickEvent={(event) => handleSelectEvent(event as CalendarEvent)}
            popup
          />
        </div>

        <div className="w-full shrink-0 lg:w-80">
          <RightDock />
        </div>
      </div>

      <EventForm
        open={formState.open}
        mode={formState.open ? formState.mode : "create"}
        initialEvent={formState.open ? formState.event ?? formState.slotSuggestion : undefined}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        onDelete={formState.open && formState.event ? handleDelete : undefined}
      />

      <FabAdd onClick={handleAddClick} />
    </div>
  );
}
