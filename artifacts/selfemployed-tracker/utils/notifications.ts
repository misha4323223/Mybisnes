import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const NOTIF_KEY = "@notifications_enabled";

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

export function setupNotificationHandler() {
  if (Platform.OS === "web") return;
  if (isExpoGo()) return;
  try {
    const Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn("[Notif] handler setup failed:", e);
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

export type NotifResult = "granted" | "denied" | "unavailable" | "saved";

export async function enableNotifications(): Promise<NotifResult> {
  if (Platform.OS === "web" || isExpoGo()) {
    await AsyncStorage.setItem(NOTIF_KEY, "true");
    return "granted";
  }

  try {
    const Notifications = require("expo-notifications");

    // Check/request permission
    let status: string;
    try {
      const existing = await Notifications.getPermissionsAsync();
      status = existing.status;
      if (status !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
    } catch (e) {
      console.warn("[Notif] permissions error:", e);
      // Permission API unavailable, save preference anyway
      await AsyncStorage.setItem(NOTIF_KEY, "true");
      return "saved";
    }

    if (status !== "granted") {
      return "denied";
    }

    // Create Android channel
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("tax-reminders", {
          name: "Напоминания о налоге",
          importance: 6,
        });
      } catch (e) {
        console.warn("[Notif] channel error:", e);
      }
    }

    // Schedule notifications
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      let count = 0;

      for (let i = 0; i < 12; i++) {
        const totalMonth = currentMonth + i;
        const month = totalMonth % 12;
        const year = currentYear + Math.floor(totalMonth / 12);

        const date23 = new Date(year, month, 23, 10, 0, 0);
        const date24 = new Date(year, month, 24, 18, 0, 0);

        if (date23.getTime() > now.getTime()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Не забудьте оплатить налог",
              body: "Завтра 25-е — последний день! Откройте Мой налог ФНС.",
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: date23,
            },
          });
          count++;
        }

        if (date24.getTime() > now.getTime()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Сегодня последний день!",
              body: "Оплатите НПД до конца дня через «Мой налог» ФНС.",
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: date24,
            },
          });
          count++;
        }
      }
      console.log("[Notif] scheduled", count, "notifications");
    } catch (e) {
      console.warn("[Notif] scheduling error:", e);
    }

    await AsyncStorage.setItem(NOTIF_KEY, "true");
    return "granted";
  } catch (err) {
    console.error("[Notif] unexpected error:", err);
    // Save preference even if scheduling fails
    await AsyncStorage.setItem(NOTIF_KEY, "true");
    return "saved";
  }
}

export async function disableNotifications(): Promise<void> {
  try {
    if (Platform.OS !== "web" && !isExpoGo()) {
      const Notifications = require("expo-notifications");
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  } catch (e) {
    console.warn("[Notif] cancel error:", e);
  }
  try {
    await AsyncStorage.setItem(NOTIF_KEY, "false");
  } catch {}
}
