import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function TaxCard() {
  const { estimatedTax, paidIncome, taxRate, addTaxPayment, taxPayments, deleteTaxPayment } = useApp();
  const [added, setAdded] = useState(false);

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

  const period = `${now.getMonth() + 1}.${now.getFullYear()}`;
  const existingPayment = taxPayments.find((t) => t.period === period);
  const alreadyExists = !!existingPayment;

  const handleRemind = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!alreadyExists) {
      addTaxPayment({
        amount: estimatedTax,
        date: new Date().toISOString(),
        period,
        isPaid: false,
      });
    }
    setAdded(true);
    setTimeout(() => {
      router.navigate("/(tabs)/tax");
    }, 600);
  };

  const handleRemove = () => {
    if (existingPayment) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      deleteTaxPayment(existingPayment.id);
      setAdded(false);
    }
  };

  const urgentColor =
    daysLeft <= 5
      ? Colors.danger
      : daysLeft <= 10
      ? Colors.accent
      : Colors.primaryLight;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Feather name="file-text" size={20} color={Colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Налог за {monthStr}</Text>
          <Text style={styles.sub}>
            Ставка {(taxRate * 100).toFixed(0)}% · Физ. лица
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.taxAmt}>
            {estimatedTax.toLocaleString("ru-RU")} ₽
          </Text>
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
              width: daysLeft > 0 ? `${Math.round(((30 - daysLeft) / 30) * 100)}%` : "100%",
              backgroundColor: urgentColor,
            },
          ]}
        />
      </View>

      {alreadyExists ? (
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.btnAdded}
            onPress={() => router.navigate("/(tabs)/tax")}
            activeOpacity={0.8}
          >
            <Feather name="check" size={14} color={Colors.primaryLight} />
            <Text style={styles.btnTextDone}>Напоминание добавлено</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnRemove}
            onPress={handleRemove}
            activeOpacity={0.8}
          >
            <Feather name="x" size={15} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.btn, added && styles.btnDone]}
          onPress={handleRemind}
          activeOpacity={0.8}
          disabled={added}
        >
          <Feather
            name={added ? "check" : "bell"}
            size={14}
            color={added ? Colors.primaryLight : Colors.primary}
          />
          <Text style={[styles.btnText, added && styles.btnTextDone]}>
            {added ? "Добавлено — открываю вкладку" : "Добавить напоминание"}
          </Text>
        </TouchableOpacity>
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
  info: { flex: 1 },
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
  right: { alignItems: "flex-end" },
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
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  btnAdded: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
  },
  btnRemove: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
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
  btnDone: {
    backgroundColor: "#E8F5E9",
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  btnTextDone: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primaryLight,
  },
});
