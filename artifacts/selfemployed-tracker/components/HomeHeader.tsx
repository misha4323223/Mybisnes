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
  const topPad = Platform.OS === "web" ? 52 : insets.top;

  const now = new Date();
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];
  const monthLabel = `${months[now.getMonth()]} ${now.getFullYear()}`;
  const days = daysUntil25();
  const isUrgent = days <= 3;
  const daysColor = isUrgent ? Colors.danger : Colors.primary;

  return (
    <View style={[styles.container, { paddingTop: topPad + 6 }]}>
      <View style={styles.left}>
        <Text style={styles.label}>Мой доход</Text>
        <Text style={styles.month}>{monthLabel}</Text>
      </View>

      <View style={styles.right}>
        <View style={[styles.taxBlock, { borderColor: daysColor + "30", backgroundColor: daysColor + "12" }]}>
          <View style={styles.taxRow}>
            <Text style={[styles.daysNum, { color: daysColor }]}>{days}</Text>
            <Text style={[styles.daysSuffix, { color: daysColor }]}>дн.</Text>
          </View>
          <Text style={styles.taxLabel}>до налога</Text>
        </View>

        <TouchableOpacity onPress={onAddPress} style={styles.btn} activeOpacity={0.7}>
          <Feather name="plus" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    gap: 2,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  month: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  taxBlock: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  taxRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  daysNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    lineHeight: 22,
  },
  daysSuffix: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 18,
  },
  taxLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
});
