import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ANNUAL_LIMIT = 2_400_000;

export function LimitCard() {
  const { yearlyIncome } = useApp();

  const percent = Math.min(100, (yearlyIncome / ANNUAL_LIMIT) * 100);
  const remaining = Math.max(0, ANNUAL_LIMIT - yearlyIncome);
  const isWarning = percent >= 75;
  const isDanger = percent >= 90;

  const barColor = isDanger
    ? Colors.danger
    : isWarning
    ? Colors.accent
    : Colors.primary;

  const year = new Date().getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Feather name="trending-up" size={18} color={barColor} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Лимит дохода {year}</Text>
          <Text style={styles.sub}>Максимум для самозанятого: 2 400 000 ₽</Text>
        </View>
        <Text style={[styles.percent, { color: barColor }]}>
          {percent.toFixed(1)}%
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${percent}%` as any, backgroundColor: barColor },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.earned}>
          Заработано: {yearlyIncome.toLocaleString("ru-RU")} ₽
        </Text>
        <Text style={[styles.left, { color: barColor }]}>
          Осталось: {remaining.toLocaleString("ru-RU")} ₽
        </Text>
      </View>

      {isDanger && (
        <View style={styles.alert}>
          <Feather name="alert-triangle" size={13} color={Colors.danger} />
          <Text style={styles.alertText}>
            Осталось мало! При превышении лимита вы потеряете статус самозанятого.
          </Text>
        </View>
      )}
      {isWarning && !isDanger && (
        <View style={[styles.alert, styles.alertWarn]}>
          <Feather name="alert-circle" size={13} color={Colors.accent} />
          <Text style={[styles.alertText, { color: Colors.accent }]}>
            Использовано более 75% лимита — следите за доходом.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  percent: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  track: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  earned: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  left: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  alert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    padding: 10,
  },
  alertWarn: {
    backgroundColor: "#FFF8E1",
  },
  alertText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.danger,
    lineHeight: 17,
  },
});
