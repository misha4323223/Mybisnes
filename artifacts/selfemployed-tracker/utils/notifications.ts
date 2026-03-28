import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIF_KEY = "@notifications_enabled";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(NOTIF_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function enableNotifications(): Promise<"granted" | "denied" | "unavailable"> {
  if (Platform.OS === "web") return "unavailable";
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return "denied";

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("tax-reminders", {
        name: "Напоминания о налоге",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    await scheduleMonthlyReminders();
    await AsyncStorage.setItem(NOTIF_KEY, "true");
    return "granted";
  } catch (e) {
    return "unavailable";
  }
}

export async function disableNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(NOTIF_KEY, "false");
  } catch {}
}

async function scheduleMonthlyReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let i = 0; i < 12; i++) {
    const month = (currentMonth + i) % 12;
    const year = currentYear + Math.floor((currentMonth + i) / 12);

    const date23 = new Date(year, month, 23, 10, 0, 0);
    const date24 = new Date(year, month, 24, 18, 0, 0);

    if (date23 > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Не забудьте оплатить налог",
          body: "Завтра 25-е — последний день! Оплатите НПД в приложении «Мой налог» ФНС.",
          ...(Platform.OS === "android" && { channelId: "tax-reminders" }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: date23,
        },
      });
    }

    if (date24 > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Сегодня последний день!",
          body: "Оплатите налог НПД до конца дня через «Мой налог» ФНС.",
          ...(Platform.OS === "android" && { channelId: "tax-reminders" }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: date24,
        },
      });
    }
  }
}
