import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function TaxCard() {
  const { estimatedTax, paidIncome, taxRate, addTaxPayment, taxPayments } = useApp();

  const now = new Date();
  const nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + 1, 25);
  const daysLeft = Math.ceil(
    (nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const months = [
    "Январе", "Феврале", "Марте", "Апреле", "Мае", "Июне",
    "Июле", "Августе", "Сентябре", "Октябре", "Ноябре", "Декабре",
  ];
  const monthStr = months[now.getMonth()];

  const handleRemind = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const period = `${now.getMonth() + 1}.${now.getFullYear()}`;
    const alreadyExists = taxPayments.some((t) => t.period === period);
    if (alreadyExists) {
      Alert.alert("Уже добавлено", "Запись о налоге за этот период уже существует.");
      return;
    }
    addTaxPayment({
      amount: estimatedTax,
      date: new Date().toISOString(),
      period,
      isPaid: false,
    });
    Alert.alert("Готово", `Налог ${estimatedTax.toLocaleString("ru-RU")} ₽ добавлен в напоминания.`);
  };

  const urgentColor = daysLeft <= 5 ? Colors.danger : daysLeft <= 10 ? Colors.accent : Colors.primaryLight;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Feather name="file-text" size={20} color={Colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Налог за {monthStr}</Text>
          <Text style={styles.sub}>Ставка {(taxRate * 100).toFixed(0)}% · Физ. лица</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.taxAmt}>{estimatedTax.toLocaleString("ru-RU")} ₽</Text>
          <Text style={[styles.days, { color: urgentColor }]}>
            {daysLeft > 0 ? `через ${daysLeft} дн.` : "сегодня!"}
          </Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, (paidIncome / Math.max(1, paidIncome)) * 100)}%`,
              backgroundColor: Colors.primaryLight,
            },
          ]}
        />
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleRemind} activeOpacity={0.8}>
        <Feather name="bell" size={14} color={Colors.primary} />
        <Text style={styles.btnText}>Добавить напоминание</Text>
      </TouchableOpacity>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  taxAmt: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  days: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 14,
    marginBottom: 14,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
});
