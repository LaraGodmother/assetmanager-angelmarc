import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function parseDatetime(date: string, time: string): Date | null {
  try {
    const [year, month, day] = date.split("-").map(Number);
    const cleaned = time.replace("h", ":").replace(/\s/g, "");
    const parts = cleaned.split(":");
    const hour = Number(parts[0] ?? 0);
    const minute = Number(parts[1] ?? 0);
    const d = new Date(year, month - 1, day, hour, minute, 0);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

export async function scheduleAppointmentNotification(
  apptId: string,
  clientName: string,
  serviceType: string,
  date: string,
  time: string
): Promise<void> {
  if (Platform.OS === "web") return;
  const dt = parseDatetime(date, time);
  if (!dt) return;
  const triggerDate = new Date(dt.getTime() - 30 * 60 * 1000);
  if (triggerDate <= new Date()) return;

  await Notifications.cancelScheduledNotificationAsync(`appt-${apptId}`).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: `appt-${apptId}`,
    content: {
      title: "Agendamento em 30 min",
      body: `${clientName} — ${serviceType} às ${time}`,
      data: { type: "appointment", apptId },
      sound: true,
    },
    trigger: { date: triggerDate, type: Notifications.SchedulableTriggerInputTypes.DATE },
  });
}

export async function cancelAppointmentNotification(apptId: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(`appt-${apptId}`).catch(() => {});
}

export async function scheduleCalendarNoteNotification(
  date: string,
  noteText: string
): Promise<void> {
  if (Platform.OS === "web") return;
  const [year, month, day] = date.split("-").map(Number);
  const triggerDate = new Date(year, month - 1, day, 8, 0, 0);
  if (triggerDate <= new Date()) return;

  await Notifications.cancelScheduledNotificationAsync(`note-${date}`).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: `note-${date}`,
    content: {
      title: `Lembrete do dia ${day}/${month}`,
      body: noteText.length > 80 ? noteText.slice(0, 77) + "..." : noteText,
      data: { type: "calendar_note", date },
      sound: true,
    },
    trigger: { date: triggerDate, type: Notifications.SchedulableTriggerInputTypes.DATE },
  });
}

export async function cancelCalendarNoteNotification(date: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(`note-${date}`).catch(() => {});
}

export async function rescheduleAllNotifications(
  appointments: Array<{
    id: string;
    clientName: string;
    serviceType: string;
    date: string;
    time: string;
    status: string;
  }>,
  calendarNotes: Record<string, string>
): Promise<void> {
  if (Platform.OS === "web") return;
  const now = new Date();

  for (const appt of appointments) {
    if (appt.status === "confirmado" || appt.status === "agendado") {
      const dt = parseDatetime(appt.date, appt.time);
      if (dt && dt > now) {
        await scheduleAppointmentNotification(
          appt.id,
          appt.clientName,
          appt.serviceType,
          appt.date,
          appt.time
        );
      }
    }
  }

  for (const [date, note] of Object.entries(calendarNotes)) {
    const [year, month, day] = date.split("-").map(Number);
    const triggerDate = new Date(year, month - 1, day, 8, 0, 0);
    if (triggerDate > now) {
      await scheduleCalendarNoteNotification(date, note);
    }
  }
}
