import Colors from "@/constants/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatsCardProps {
  totalIncome: number;
  paidIncome: number;
  unpaidIncome: number;
  estimatedTax: number;
  taxRate: number;
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("ru-RU") + " ₽";
}

export function StatsCard({
  totalIncome,
  paidIncome,
  unpaidIncome,
  estimatedTax,
  taxRate,
}: StatsCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        <View style={styles.mainBlock}>
          <Text style={styles.mainLabel}>Общий доход</Text>
          <Text style={styles.mainAmount}>{formatMoney(totalIncome)}</Text>
        </View>
        <View style={styles.taxBlock}>
          <Text style={styles.taxLabel}>Налог ({(taxRate * 100).toFixed(0)}%)</Text>
          <Text style={styles.taxAmount}>{formatMoney(estimatedTax)}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.bottomRow}>
        <View style={styles.stat}>
          <View style={[styles.dot, { backgroundColor: Colors.primaryLight }]} />
          <View>
            <Text style={styles.statLabel}>Получено</Text>
            <Text style={styles.statValue}>{formatMoney(paidIncome)}</Text>
          </View>
        </View>
        <View style={styles.stat}>
          <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
          <View>
            <Text style={styles.statLabel}>Ожидается</Text>
            <Text style={styles.statValue}>{formatMoney(unpaidIncome)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  mainBlock: {},
  mainLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
  },
  mainAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: "#fff",
    marginTop: 4,
  },
  taxBlock: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  taxLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  taxAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#fff",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 16,
  },
  bottomRow: {
    flexDirection: "row",
    gap: 24,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  statValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
    marginTop: 1,
  },
});
