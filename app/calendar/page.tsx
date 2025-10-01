import WeekView from "@/components/calendar/WeekView";

export default function CalendarPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Agenda</h1>
      <WeekView />
    </main>
  );
}
