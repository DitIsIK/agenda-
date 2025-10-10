export type EventType = "lesson" | "study" | "task" | "exam";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: EventType;
  location?: string;
  locked?: boolean;
  notes?: string;
}
