import { useSyncExternalStore } from "react";

import { normalizeRange } from "./eventUtils";
import { CalendarEvent } from "./types";

const STORAGE_KEY = "agenda.events.v1";

type EventsState = {
  events: CalendarEvent[];
  selectedId: string | null;
  hasLoaded: boolean;
};

type EventInput = Omit<CalendarEvent, "id"> & { id?: string };

type EventsActions = {
  load: () => void;
  add: (input: EventInput) => CalendarEvent;
  update: (event: CalendarEvent) => void;
  remove: (id: string) => void;
  select: (id: string | null) => void;
  clearAll: () => void;
};

type EventsStore = EventsState & EventsActions;

const listeners = new Set<() => void>();

const state: EventsState = {
  events: [],
  selectedId: null,
  hasLoaded: false,
};

const actions: EventsActions = {
  load() {
    if (state.hasLoaded || typeof window === "undefined") {
      state.hasLoaded = true;
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      state.hasLoaded = true;
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Array<Omit<CalendarEvent, "start" | "end"> & { start: string; end: string }>;
      state.events = parsed.map((item) => ({
        ...item,
        start: new Date(item.start),
        end: new Date(item.end),
      }));
    } catch (error) {
      console.warn("Kon events niet laden uit localStorage", error);
      state.events = [];
    }

    state.hasLoaded = true;
    emit();
  },
  add(input) {
    const event = buildEvent(input);
    state.events = [...state.events, event];
    persist();
    emit();
    return event;
  },
  update(event) {
    const { start, end } = normalizeRange(event.start, event.end);
    state.events = state.events.map((item) => (item.id === event.id ? { ...event, start, end } : item));
    persist();
    emit();
  },
  remove(id) {
    state.events = state.events.filter((event) => event.id !== id);
    if (state.selectedId === id) {
      state.selectedId = null;
    }
    persist();
    emit();
  },
  select(id) {
    state.selectedId = id;
    emit();
  },
  clearAll() {
    state.events = [];
    state.selectedId = null;
    persist();
    emit();
  },
};

function buildEvent(input: EventInput): CalendarEvent {
  const id = input.id ?? generateId();
  const { start, end } = normalizeRange(input.start, input.end);

  return {
    ...input,
    id,
    start,
    end,
  };
}

function persist() {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(
    state.events.map((event) => ({
      ...event,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    }))
  );

  window.localStorage.setItem(STORAGE_KEY, serialized);
}

function emit() {
  listeners.forEach((listener) => listener());
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `event-${Math.random().toString(36).slice(2, 10)}`;
}

function getStore(): EventsStore {
  return {
    ...state,
    ...actions,
  };
}

export function useEventsStore<T>(selector: (store: EventsStore) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getStore()), () => selector(getStore()));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
