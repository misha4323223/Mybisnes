import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONTH_NAMES_SHORT = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function formatPeriod(period: string): string {
  const [month, year] = period.split(".");
  const mIdx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[mIdx] ?? month} ${year}`;
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

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getMonth() + 1}.${now.getFullYear()}`;
}

export default function TaxScreen() {
  const { taxPayments, projects, markTaxPaid, deleteTaxPayment, estimatedTax, paidIncome, taxRate, addTaxPayment } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const now = new Date();
  const currentYear = now.getFullYear();
  const days = daysUntil25();
  const isUrgent = days <= 3;
  const isMedium = days <= 7;

  const deadlineColor = isUrgent ? Colors.danger : isMedium ? Colors.accent : Colors.primary;

  const currentPeriod = getCurrentPeriod();
  const currentMonthTax = taxPayments.find(t => t.period === currentPeriod);

  const totalPaidThisYear = taxPayments
    .filter(t => t.isPaid && t.period.endsWith(`.${currentYear}`))
    .reduce((s, t) => s + t.amount, 0);

  const pendingTaxes = taxPayments.filter(t => !t.isPaid);
  const totalPending = pendingTaxes.reduce((s, t) => s + t.amount, 0);

  const monthlyIncomeMap = useMemo(() => {
    const map: Record<string, number> = {};
    projects
      .filter(p => new Date(p.date).getFullYear() === currentYear)
      .forEach(p => {
        const d = new Date(p.date);
        const key = `${d.getMonth() + 1}.${currentYear}`;
        map[key] = (map[key] ?? 0) + p.amount;
      });
    return map;
  }, [projects, currentYear]);

  const handlePay = (id: string, amount: number) => {
    Alert.alert(
      "Подтверждение оплаты",
      `Отметить налог ${amount.toLocaleString("ru-RU")} ₽ как оплаченный?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Оплачено",
          style: "default",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markTaxPaid(id);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Удалить запись",
      "Удалить эту запись о налоге?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteTaxPayment(id);
          },
        },
      ]
    );
  };

  const handleAddReminder = () => {
    const period = getCurrentPeriod();
    const alreadyExists = taxPayments.find(t => t.period === period);
    if (alreadyExists) {
      Alert.alert("Уже добавлено", "Запись о налоге за текущий месяц уже есть.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTaxPayment({
      amount: estimatedTax,
      date: new Date().toISOString(),
      period,
      isPaid: false,
    });
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: Colors.background }}
      data={taxPayments}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={styles.pageTitle}>Налоги</Text>

          <View style={[styles.deadlineCard, { borderColor: deadlineColor + "40", backgroundColor: deadlineColor + "0D" }]}>
            <View style={styles.deadlineLeft}>
              <Text style={[styles.deadlineDays, { color: deadlineColor }]}>{days}</Text>
              <Text style={[styles.deadlineDaysLabel, { color: deadlineColor }]}>
                {days === 1 ? "день" : days <= 4 ? "дня" : "дней"}
              </Text>
            </View>
            <View style={styles.deadlineDivider} />
            <View style={styles.deadlineRight}>
              <Text style={styles.deadlineTitle}>До дедлайна оплаты</Text>
              <Text style={styles.deadlineSub}>Срок — 25-е число каждого месяца</Text>
              <View style={styles.deadlineAmtRow}>
                <Text style={styles.deadlineAmtLabel}>Налог за месяц:</Text>
                <Text style={[styles.deadlineAmt, { color: deadlineColor }]}>
                  {estimatedTax.toLocaleString("ru-RU")} ₽
                </Text>
              </View>
            </View>
          </View>

          {pendingTaxes.length > 0 && (
            <View style={styles.alertRow}>
              <Feather name="alert-circle" size={14} color={Colors.accent} />
              <Text style={styles.alertText}>
                Не оплачено за {pendingTaxes.length} {pendingTaxes.length === 1 ? "месяц" : "месяца"}: {totalPending.toLocaleString("ru-RU")} ₽
              </Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalPaidThisYear.toLocaleString("ru-RU")} ₽</Text>
              <Text style={styles.statLabel}>Оплачено в {currentYear}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                {Math.round(paidIncome * taxRate).toLocaleString("ru-RU")} ₽
              </Text>
              <Text style={styles.statLabel}>Расчёт за весь период</Text>
            </View>
          </View>

          <YearCalendar
            currentYear={currentYear}
            taxPayments={taxPayments}
            monthlyIncomeMap={monthlyIncomeMap}
          />

          {!currentMonthTax && estimatedTax > 0 && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddReminder}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Добавить запись за текущий месяц</Text>
            </TouchableOpacity>
          )}

          <View style={styles.hintCard}>
            <Feather name="info" size={14} color={Colors.primary} />
            <Text style={styles.hintText}>
              Оплачивайте НПД через приложение ФНС «Мой налог». Этот раздел помогает следить за налоговыми обязательствами.
            </Text>
          </View>

          {taxPayments.length > 0 && (
            <Text style={styles.sectionTitle}>История</Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="file-text" size={32} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Нет записей</Text>
          <Text style={styles.emptyText}>
            Добавьте запись о налоге за этот месяц через кнопку выше, или перейдите на главную и нажмите «Добавить напоминание о налоге».
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.taxItem}>
          <View style={[styles.statusBadge, item.isPaid ? styles.badgePaid : styles.badgePending]}>
            <Feather
              name={item.isPaid ? "check" : "clock"}
              size={13}
              color={item.isPaid ? Colors.primaryLight : Colors.accent}
            />
          </View>
          <View style={styles.taxInfo}>
            <Text style={styles.taxPeriod}>{formatPeriod(item.period)}</Text>
            <Text style={styles.taxDate}>
              {item.isPaid ? "Оплачено " : "Добавлено "}{new Date(item.date).toLocaleDateString("ru-RU")}
            </Text>
          </View>
          <Text style={styles.taxAmt}>{item.amount.toLocaleString("ru-RU")} ₽</Text>
          {!item.isPaid ? (
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => handlePay(item.id, item.amount)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.payBtnText}>Оплатил</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.paidRow}>
              <View style={styles.paidTag}>
                <Feather name="check" size={13} color={Colors.primaryLight} />
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.deleteBtn}
              >
                <Feather name="trash-2" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      contentContainerStyle={[
        styles.list,
        { paddingBottom: Platform.OS === "web" ? 34 + 84 : 110 },
      ]}
    />
  );
}

function YearCalendar({
  currentYear,
  taxPayments,
  monthlyIncomeMap,
}: {
  currentYear: number;
  taxPayments: ReturnType<typeof useApp>["taxPayments"];
  monthlyIncomeMap: Record<string, number>;
}) {
  const now = new Date();
  const currentMonth = now.getMonth();

  return (
    <View style={styles.calCard}>
      <Text style={styles.calTitle}>{currentYear} — статус по месяцам</Text>
      <View style={styles.calGrid}>
        {MONTH_NAMES_SHORT.map((name, idx) => {
          const period = `${idx + 1}.${currentYear}`;
          const hasIncome = (monthlyIncomeMap[period] ?? 0) > 0;
          const taxEntry = taxPayments.find(t => t.period === period);
          const isFuture = idx > currentMonth;
          const isCurrent = idx === currentMonth;

          let bg = Colors.border;
          let textColor = Colors.textMuted;
          let dotColor: string | null = null;
          let label = "";

          if (isFuture) {
            bg = Colors.surfaceAlt;
            textColor = Colors.textMuted;
          } else if (!hasIncome && !taxEntry) {
            bg = Colors.surfaceAlt;
            textColor = Colors.textMuted;
            label = "—";
          } else if (taxEntry?.isPaid) {
            bg = Colors.primaryLight + "22";
            textColor = Colors.primaryLight;
            dotColor = Colors.primaryLight;
            label = "✓";
          } else if (taxEntry && !taxEntry.isPaid) {
            bg = Colors.accent + "22";
            textColor = Colors.accent;
            dotColor = Colors.accent;
            label = "!";
          } else if (hasIncome) {
            bg = Colors.primary + "15";
            textColor = Colors.primary;
            label = "₽";
          }

          return (
            <View
              key={idx}
              style={[
                styles.calCell,
                { backgroundColor: bg },
                isCurrent && styles.calCellCurrent,
              ]}
            >
              <Text style={[styles.calMonth, { color: textColor }]}>{name}</Text>
              {label ? (
                <Text style={[styles.calLabel, { color: textColor }]}>{label}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.calLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primaryLight }]} />
          <Text style={styles.legendText}>Оплачено</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.legendText}>Ожидает</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Есть доход</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  deadlineCard: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    alignItems: "center",
    gap: 0,
  },
  deadlineLeft: {
    alignItems: "center",
    paddingRight: 16,
    minWidth: 64,
  },
  deadlineDays: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    lineHeight: 40,
  },
  deadlineDaysLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  deadlineDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.border,
    marginRight: 16,
  },
  deadlineRight: {
    flex: 1,
  },
  deadlineTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  deadlineSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  deadlineAmtRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deadlineAmtLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deadlineAmt: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.accent + "15",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  alertText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.accent,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  statBox: {
    flex: 1,
    padding: 14,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
  },
  calCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  calTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  calCell: {
    width: "14%",
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    minWidth: 44,
  },
  calCellCurrent: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calMonth: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },
  calLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    marginTop: 1,
  },
  calLegend: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  addBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  hintCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
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
    fontSize: 13,
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
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgePaid: {
    backgroundColor: Colors.primaryLight + "22",
  },
  badgePending: {
    backgroundColor: Colors.accent + "22",
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
  paidTag: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  paidTagText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.primaryLight,
  },
  empty: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
