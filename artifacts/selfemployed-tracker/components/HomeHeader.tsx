import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HomeHeaderProps {
  onAddPress: () => void;
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

  return (
    <View style={[styles.container, { paddingTop: topPad + 12 }]}>
      <View>
        <Text style={styles.label}>Мой доход</Text>
        <Text style={styles.month}>{monthLabel}</Text>
      </View>
      <TouchableOpacity onPress={onAddPress} style={styles.btn} activeOpacity={0.7}>
        <Feather name="plus" size={22} color="#fff" />
      </TouchableOpacity>
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
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
