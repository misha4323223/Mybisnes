import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function formatPeriod(period: string): string {
  const [month, year] = period.split(".");
  const mIdx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[mIdx] ?? month} ${year}`;
}

export default function TaxScreen() {
  const { taxPayments, markTaxPaid, estimatedTax, paidIncome } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePay = (id: string, amount: number) => {
    Alert.alert(
      "Подтверждение оплаты",
      `Отметить налог ${amount.toLocaleString("ru-RU")} ₽ как оплаченный?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Оплачено",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markTaxPaid(id);
          },
        },
      ]
    );
  };

  const ListHeader = (
    <View style={[styles.header, { paddingTop: topPad + 16 }]}>
      <Text style={styles.pageTitle}>Налоги</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Feather name="dollar-sign" size={16} color={Colors.primary} />
          <Text style={styles.infoLabel}>Доход за текущий месяц</Text>
          <Text style={styles.infoValue}>{paidIncome.toLocaleString("ru-RU")} ₽</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Feather name="percent" size={16} color={Colors.accent} />
          <Text style={styles.infoLabel}>Налог к уплате</Text>
          <Text style={[styles.infoValue, { color: Colors.accent }]}>
            {estimatedTax.toLocaleString("ru-RU")} ₽
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Feather name="calendar" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Срок оплаты</Text>
          <Text style={styles.infoValue}>25 числа</Text>
        </View>
      </View>

      <View style={styles.hintCard}>
        <Feather name="info" size={14} color={Colors.primary} />
        <Text style={styles.hintText}>
          Оплачивайте налог в приложении ФНС «Мой налог». Здесь ведётся учёт ваших налоговых обязательств.
        </Text>
      </View>

      {taxPayments.length > 0 && (
        <Text style={styles.sectionTitle}>История платежей</Text>
      )}
    </View>
  );

  const EmptyState = (
    <View style={styles.empty}>
      <Feather name="file-text" size={48} color={Colors.border} />
      <Text style={styles.emptyTitle}>Нет записей</Text>
      <Text style={styles.emptyText}>
        Добавьте напоминание о налоге{"\n"}на главном экране
      </Text>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: Colors.background }}
      data={taxPayments}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={EmptyState}
      renderItem={({ item }) => (
        <View style={styles.taxItem}>
          <View style={[styles.statusDot, item.isPaid ? styles.dotPaid : styles.dotPending]} />
          <View style={styles.taxInfo}>
            <Text style={styles.taxPeriod}>{formatPeriod(item.period)}</Text>
            <Text style={styles.taxDate}>
              {new Date(item.date).toLocaleDateString("ru-RU")}
            </Text>
          </View>
          <Text style={styles.taxAmt}>{item.amount.toLocaleString("ru-RU")} ₽</Text>
          {!item.isPaid ? (
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => handlePay(item.id, item.amount)}
              activeOpacity={0.7}
            >
              <Text style={styles.payBtnText}>Оплатил</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.paidBadge}>
              <Feather name="check" size={12} color={Colors.primaryLight} />
              <Text style={styles.paidText}>Оплачено</Text>
            </View>
          )}
        </View>
      )}
      contentContainerStyle={[
        styles.list,
        { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 },
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  hintCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  hintText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
  },
  taxItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  dotPaid: {
    backgroundColor: Colors.primaryLight,
  },
  dotPending: {
    backgroundColor: Colors.accent,
  },
  taxInfo: {
    flex: 1,
  },
  taxPeriod: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  taxDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  taxAmt: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  payBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paidText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primaryLight,
  },
  empty: {
    alignItems: "center",
    paddingTop: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
