import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIF_KEY = "@notifications_enabled";

export function setupNotificationHandler() {
  if (Platform.OS === "web") return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn("[Notifications] setNotificationHandler error:", e);
  }
}

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(NOTIF_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function enableNotifications(): Promise<
  "granted" | "denied" | "unavailable"
> {
  if (Platform.OS === "web") return "unavailable";

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return "denied";

    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("tax-reminders", {
          name: "Напоминания о налоге",
          importance: Notifications.AndroidImportance.HIGH,
        });
      } catch {}
    }

    await scheduleMonthlyReminders();
    await AsyncStorage.setItem(NOTIF_KEY, "true");
    return "granted";
  } catch (err) {
    console.warn("[Notifications] enableNotifications error:", err);
    await AsyncStorage.setItem(NOTIF_KEY, "false");
    return "unavailable";
  }
}

export async function disableNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
  try {
    await AsyncStorage.setItem(NOTIF_KEY, "false");
  } catch {}
}

async function scheduleMonthlyReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let i = 0; i < 12; i++) {
    const totalMonth = currentMonth + i;
    const month = totalMonth % 12;
    const year = currentYear + Math.floor(totalMonth / 12);

    const date23 = new Date(year, month, 23, 10, 0, 0);
    const date24 = new Date(year, month, 24, 18, 0, 0);

    if (date23.getTime() > now.getTime()) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Не забудьте оплатить налог",
            body: "Завтра 25-е — последний день! Оплатите НПД через «Мой налог» ФНС.",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: date23,
          },
        });
      } catch (e) {
        console.warn("[Notifications] schedule 23rd error:", e);
      }
    }

    if (date24.getTime() > now.getTime()) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Сегодня последний день!",
            body: "Оплатите налог НПД до конца дня через «Мой налог» ФНС.",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: date24,
          },
        });
      } catch (e) {
        console.warn("[Notifications] schedule 24th error:", e);
      }
    }
  }
}
