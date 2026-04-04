import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const sourceLabels: Record<string, string> = {
  project: "Проекты",
  subscription: "Подписки",
  "one-time": "Разовые",
  other: "Другое",
};

function Bar({ ratio, color }: { ratio: number; color: string }) {
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});

const COLORS = [Colors.primary, Colors.primaryLight, Colors.accent, Colors.textMuted];

const MONTH_NAMES_FULL = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const MONTH_NAMES_SHORT = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

function formatBarVal(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}М`;
  if (val >= 1_000) return `${Math.round(val / 1_000)}к`;
  return String(val);
}

export default function AnalyticsScreen() {
  const { projects, taxRate } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const now = new Date();
  const currentYear = now.getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const p of projects) {
      years.add(new Date(p.date).getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [projects]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const yearProjects = useMemo(
    () => projects.filter((p) => new Date(p.date).getFullYear() === selectedYear),
    [projects, selectedYear]
  );

  const currentMonthName = MONTH_NAMES_FULL[now.getMonth()];

  const currentMonthProjects = useMemo(
    () => projects.filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === currentYear && d.getMonth() === now.getMonth();
    }),
    [projects]
  );
  const currentMonthIncome = currentMonthProjects.reduce((s, p) => s + p.amount, 0);
  const currentMonthPaidIncome = currentMonthProjects.filter((p) => p.isPaid).reduce((s, p) => s + p.amount, 0);
  const estimatedTax = Math.round(currentMonthPaidIncome * taxRate);

  const yearPaidIncome = yearProjects.filter((p) => p.isPaid).reduce((s, p) => s + p.amount, 0);
  const yearUnpaidIncome = yearProjects.filter((p) => !p.isPaid).reduce((s, p) => s + p.amount, 0);
  const yearTax = Math.round(yearPaidIncome * taxRate);

  const sourceMap: Record<string, number> = {};
  for (const p of yearProjects) {
    sourceMap[p.source] = (sourceMap[p.source] || 0) + p.amount;
  }
  const sourceTotal = Object.values(sourceMap).reduce((a, b) => a + b, 0) || 1;
  const sourceEntries = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);

  const months: Record<string, number> = {};
  for (const p of yearProjects) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = (months[key] || 0) + p.amount;
  }
  const sortedMonths = Object.entries(months)
    .sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonth = Math.max(...sortedMonths.map(([, v]) => v), 1);

  const paidCount = yearProjects.filter((p) => p.isPaid).length;
  const unpaidCount = yearProjects.filter((p) => !p.isPaid).length;

  const clientMap: Record<string, { total: number; count: number; unpaid: number; lastDate: string }> = {};
  for (const p of yearProjects) {
    const nm = p.clientName || "Без клиента";
    if (!clientMap[nm]) clientMap[nm] = { total: 0, count: 0, unpaid: 0, lastDate: p.date };
    clientMap[nm].total += p.amount;
    clientMap[nm].count += 1;
    if (!p.isPaid) clientMap[nm].unpaid += p.amount;
    if (p.date > clientMap[nm].lastDate) clientMap[nm].lastDate = p.date;
  }
  const topClients = Object.entries(clientMap).sort((a, b) => b[1].total - a[1].total);
  const maxClient = topClients[0]?.[1].total || 1;

  const receiptPending = projects.filter((p) => p.isPaid && !p.receiptSent).length;
  const recurringCount = projects.filter((p) => p.isRecurring).length;

  if (projects.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.pageTitle, { paddingHorizontal: 16 }]}>Аналитика</Text>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Feather name="bar-chart-2" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Нет данных для анализа</Text>
          <Text style={styles.emptyText}>
            Добавьте доходы на главном экране,{"\n"}чтобы увидеть статистику
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push("/")}
            activeOpacity={0.85}
          >
            <Feather name="arrow-left" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>На главную</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Аналитика</Text>

      {selectedYear === currentYear && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{currentMonthName} — текущий месяц</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {currentMonthIncome.toLocaleString("ru-RU")} ₽
              </Text>
              <Text style={styles.summaryLabel}>Начислено</Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryMiddle]}>
              <Text style={[styles.summaryValue, { color: Colors.primaryLight }]}>
                {currentMonthPaidIncome.toLocaleString("ru-RU")} ₽
              </Text>
              <Text style={styles.summaryLabel}>Получено</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                {estimatedTax.toLocaleString("ru-RU")} ₽
              </Text>
              <Text style={styles.summaryLabel}>Налог {(taxRate * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>
      )}

      {availableYears.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearRow}
          style={styles.yearScroll}
        >
          {availableYears.map((yr) => (
            <TouchableOpacity
              key={yr}
              style={[styles.yearChip, selectedYear === yr && styles.yearChipActive]}
              onPress={() => setSelectedYear(yr)}
              activeOpacity={0.75}
            >
              <Text style={[styles.yearLabel, selectedYear === yr && styles.yearLabelActive]}>
                {yr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Итого за {selectedYear} год</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {(yearPaidIncome + yearUnpaidIncome).toLocaleString("ru-RU")} ₽
            </Text>
            <Text style={styles.summaryLabel}>Всего</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryMiddle]}>
            <Text style={[styles.summaryValue, { color: Colors.primaryLight }]}>
              {yearPaidIncome.toLocaleString("ru-RU")} ₽
            </Text>
            <Text style={styles.summaryLabel}>Получено</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.danger }]}>
              {yearTax.toLocaleString("ru-RU")} ₽
            </Text>
            <Text style={styles.summaryLabel}>Налог за год</Text>
          </View>
        </View>
        {yearUnpaidIncome > 0 && (
          <View style={styles.yearUnpaidBadge}>
            <Feather name="clock" size={13} color={Colors.accent} />
            <Text style={styles.yearUnpaidText}>
              Ожидает оплаты: {yearUnpaidIncome.toLocaleString("ru-RU")} ₽
            </Text>
          </View>
        )}
      </View>

      {sortedMonths.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Доход по месяцам · {selectedYear}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.chartArea,
              { minWidth: sortedMonths.length * 52 },
            ]}
          >
            {sortedMonths.map(([key, val]) => {
              const [, mn] = key.split("-");
              const mIdx = parseInt(mn, 10) - 1;
              const ratio = val / maxMonth;
              const isCurrentMonth =
                selectedYear === currentYear && mIdx === now.getMonth();
              return (
                <View key={key} style={styles.barCol}>
                  <Text style={styles.barVal}>{formatBarVal(val)}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(Math.round(ratio * 100), 4)}%`,
                          backgroundColor: isCurrentMonth ? Colors.primaryLight : Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isCurrentMonth && styles.barLabelActive]}>
                    {MONTH_NAMES_SHORT[mIdx]}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
          <Text style={styles.chartNote}>
            Максимум: {maxMonth.toLocaleString("ru-RU")} ₽
          </Text>
        </View>
      )}

      {sourceEntries.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>По источникам · {selectedYear}</Text>
          {sourceEntries.map(([key, val], i) => (
            <View key={key} style={styles.sourceRow}>
              <View style={[styles.sourceDot, { backgroundColor: COLORS[i % COLORS.length] }]} />
              <Text style={styles.sourceLabel}>{sourceLabels[key] ?? key}</Text>
              <Bar ratio={val / sourceTotal} color={COLORS[i % COLORS.length]} />
              <Text style={styles.sourceVal}>{val.toLocaleString("ru-RU")} ₽</Text>
            </View>
          ))}
        </View>
      )}

      {topClients.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>История по клиентам · {selectedYear}</Text>
          {topClients.map(([nm, data], i) => (
            <View key={nm} style={[styles.clientCard, i < topClients.length - 1 && styles.clientCardBorder]}>
              <View style={styles.clientHeader}>
                <View style={[styles.clientAvatar, { backgroundColor: COLORS[i % COLORS.length] + "22" }]}>
                  <Text style={[styles.clientAvatarText, { color: COLORS[i % COLORS.length] }]}>
                    {nm.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName} numberOfLines={1}>{nm}</Text>
                  <Text style={styles.clientMeta}>
                    {data.count} {data.count === 1 ? "проект" : data.count <= 4 ? "проекта" : "проектов"} · последний {new Date(data.lastDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  </Text>
                </View>
                <Text style={[styles.clientTotal, { color: COLORS[i % COLORS.length] }]}>
                  {data.total >= 1000 ? `${Math.round(data.total / 1000)}к` : data.total} ₽
                </Text>
              </View>
              <View style={styles.clientBarWrap}>
                <View style={[styles.clientBarFill, { width: `${Math.round((data.total / maxClient) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }]} />
              </View>
              {data.unpaid > 0 && (
                <Text style={styles.clientUnpaid}>Ожидает оплаты: {data.unpaid.toLocaleString("ru-RU")} ₽</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {(receiptPending > 0 || recurringCount > 0) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Напоминания</Text>
          {receiptPending > 0 && (
            <View style={styles.reminderRow}>
              <View style={[styles.reminderIcon, { backgroundColor: Colors.accent + "18" }]}>
                <Feather name="file-text" size={16} color={Colors.accent} />
              </View>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderTitle}>Чеки ФНС не выданы</Text>
                <Text style={styles.reminderSub}>{receiptPending} {receiptPending === 1 ? "доход" : "дохода"} без чека — откройте запись и отметьте</Text>
              </View>
            </View>
          )}
          {recurringCount > 0 && (
            <View style={[styles.reminderRow, receiptPending > 0 && { marginTop: 10 }]}>
              <View style={[styles.reminderIcon, { backgroundColor: Colors.primary + "15" }]}>
                <Feather name="repeat" size={16} color={Colors.primary} />
              </View>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderTitle}>Повторяющиеся доходы</Text>
                <Text style={styles.reminderSub}>{recurringCount} {recurringCount === 1 ? "источник" : "источника"} — можно повторить за текущий месяц</Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Статус оплаты · {selectedYear}</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Feather name="check-circle" size={20} color={Colors.primaryLight} />
            <Text style={styles.statusCount}>{paidCount}</Text>
            <Text style={styles.statusLabel}>Оплачено</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Feather name="clock" size={20} color={Colors.accent} />
            <Text style={styles.statusCount}>{unpaidCount}</Text>
            <Text style={styles.statusLabel}>Ожидает</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Feather name="briefcase" size={20} color={Colors.textSecondary} />
            <Text style={styles.statusCount}>{yearProjects.length}</Text>
            <Text style={styles.statusLabel}>Записей</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Налоговая информация</Text>
        <View style={styles.taxInfoRow}>
          <Feather name="info" size={16} color={Colors.primary} />
          <Text style={styles.taxInfoText}>
            Самозанятые платят {(taxRate * 100).toFixed(0)}% с доходов от физических лиц и 6% от юридических. Оплата до 25 числа следующего месяца через приложение «Мой налог» ФНС.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pageTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  yearScroll: {
    marginBottom: 0,
  },
  yearRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 4,
  },
  yearChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  yearChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  yearLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  yearLabelActive: {
    color: "#fff",
  },
  summaryRow: {
    flexDirection: "row",
  },
  summaryItem: {
    flex: 1,
  },
  summaryMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginHorizontal: 8,
  },
  summaryValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  yearUnpaidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: Colors.accent + "15",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  yearUnpaidText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.accent,
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 160,
    paddingBottom: 2,
  },
  barCol: {
    width: 44,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barVal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 5,
    textAlign: "center",
  },
  barTrack: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: Colors.surfaceAlt,
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
  },
  barLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 7,
  },
  barLabelActive: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primaryLight,
  },
  chartNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 10,
    textAlign: "right",
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  sourceLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textPrimary,
    width: 80,
    flexShrink: 0,
  },
  sourceVal: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
    flexShrink: 0,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statusDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.border,
  },
  statusCount: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.textPrimary,
  },
  statusLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  taxInfoRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  taxInfoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  clientCard: {
    paddingVertical: 12,
  },
  clientCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  clientAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  clientMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  clientTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    flexShrink: 0,
  },
  clientBarWrap: {
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  clientBarFill: {
    height: 5,
    borderRadius: 3,
  },
  clientUnpaid: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.accent,
    marginTop: 2,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reminderIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  reminderSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
