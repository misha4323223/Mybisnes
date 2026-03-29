import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HomeHeaderProps {
  onAddPress: () => void;
}

function daysUntil25(): number {
  const now = new Date();
  const deadline = new Date(now.getFullYear(), now.getMonth(), 25, 23, 59, 59);
  if (now > deadline) {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 25, 23, 59, 59);
    return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function HomeHeader({ onAddPress }: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const now = new Date();
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];
  const monthLabel = `${months[now.getMonth()]} ${now.getFullYear()}`;
  const days = daysUntil25();
  const isUrgent = days <= 3;
  const pillColor = isUrgent ? "#FF6B35" : "rgba(255,255,255,0.22)";

  return (
    <View style={[styles.container, { paddingTop: topPad + 12 }]}>
      <View>
        <Text style={styles.label}>Мой доход</Text>
        <Text style={styles.month}>{monthLabel}</Text>
      </View>
      <View style={styles.right}>
        <View style={[styles.deadlinePill, { backgroundColor: pillColor }]}>
          <Feather name="clock" size={12} color="#fff" />
          <Text style={styles.deadlinePillText}>{days}д до 25-го</Text>
        </View>
        <TouchableOpacity onPress={onAddPress} style={styles.btn} activeOpacity={0.7}>
          <Feather name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: "#fff",
  },
  month: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deadlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  deadlinePillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
