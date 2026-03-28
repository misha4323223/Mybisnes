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
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return "denied";
    await scheduleMonthlyReminders();
    await AsyncStorage.setItem(NOTIF_KEY, "true");
    return "granted";
  } catch {
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

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Не забудьте оплатить налог",
      body: "Завтра 25-е — последний день! Оплатите НПД через «Мой налог» ФНС.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day: 23,
      hour: 10,
      minute: 0,
      repeats: true,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Сегодня последний день!",
      body: "Оплатите налог НПД до конца дня через приложение «Мой налог» ФНС.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day: 24,
      hour: 18,
      minute: 0,
      repeats: true,
    },
  });
}
