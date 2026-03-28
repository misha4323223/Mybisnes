import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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

export default function AnalyticsScreen() {
  const { projects, paidIncome, unpaidIncome, estimatedTax, taxRate } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const sourceMap: Record<string, number> = {};
  for (const p of projects) {
    sourceMap[p.source] = (sourceMap[p.source] || 0) + p.amount;
  }
  const total = Object.values(sourceMap).reduce((a, b) => a + b, 0) || 1;
  const sourceEntries = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);

  const now = new Date();
  const months: Record<string, number> = {};
  for (const p of projects) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = (months[key] || 0) + p.amount;
  }
  const sortedMonths = Object.entries(months)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);
  const maxMonth = Math.max(...sortedMonths.map(([, v]) => v), 1);

  const monthNames = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
  ];

  const paidCount = projects.filter((p) => p.isPaid).length;
  const unpaidCount = projects.filter((p) => !p.isPaid).length;

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
            onPress={() => router.push("/(tabs)/")}
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Итоги месяца</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {(paidIncome + unpaidIncome).toLocaleString("ru-RU")} ₽
            </Text>
            <Text style={styles.summaryLabel}>Всего начислено</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryMiddle]}>
            <Text style={[styles.summaryValue, { color: Colors.primaryLight }]}>
              {paidIncome.toLocaleString("ru-RU")} ₽
            </Text>
            <Text style={styles.summaryLabel}>Получено</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.danger }]}>
              {estimatedTax.toLocaleString("ru-RU")} ₽
            </Text>
            <Text style={styles.summaryLabel}>Налог</Text>
          </View>
        </View>
      </View>

      {sortedMonths.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Доход по месяцам</Text>
          <View style={styles.chartArea}>
            {sortedMonths.map(([key, val]) => {
              const [yr, mn] = key.split("-");
              const mIdx = parseInt(mn, 10) - 1;
              const h = Math.round((val / maxMonth) * 100);
              return (
                <View key={key} style={styles.barCol}>
                  <Text style={styles.barVal}>
                    {val >= 1000 ? `${Math.round(val / 1000)}к` : val}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${h}%`, backgroundColor: Colors.primary },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{monthNames[mIdx]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {sourceEntries.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>По источникам</Text>
          {sourceEntries.map(([key, val], i) => (
            <View key={key} style={styles.sourceRow}>
              <View style={[styles.sourceDot, { backgroundColor: COLORS[i % COLORS.length] }]} />
              <Text style={styles.sourceLabel}>{sourceLabels[key] ?? key}</Text>
              <Bar ratio={val / total} color={COLORS[i % COLORS.length]} />
              <Text style={styles.sourceVal}>{val.toLocaleString("ru-RU")} ₽</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Статус оплаты</Text>
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
            <Text style={styles.statusCount}>{projects.length}</Text>
            <Text style={styles.statusLabel}>Всего</Text>
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
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    fontSize: 18,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 120,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barVal: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  barTrack: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: Colors.surfaceAlt,
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
  },
  barLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 6,
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
