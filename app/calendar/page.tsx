import { CalendarDashboard } from "@/components/calendar/CalendarDashboard";
import { EventProvider } from "@/components/calendar/EventProvider";

export default function CalendarPage() {
  return (
    <EventProvider>
      <CalendarDashboard />
    </EventProvider>
  );
}
