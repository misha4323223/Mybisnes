import { AddProjectSheet } from "@/components/AddProjectSheet";
import { HomeHeader } from "@/components/HomeHeader";
import { LimitCard } from "@/components/LimitCard";
import { StatsCard } from "@/components/StatsCard";
import { SwipeableProjectItem } from "@/components/SwipeableProjectItem";
import { TaxCard } from "@/components/TaxCard";
import Colors from "@/constants/colors";
import { Project, useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type FilterType = "all" | "paid" | "unpaid";

const MONTH_NAMES_SHORT = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export default function HomeScreen() {
  const {
    projects,
    totalIncome,
    paidIncome,
    unpaidIncome,
    estimatedTax,
    taxRate,
    updateProject,
    deleteProject,
    addProject,
    loading,
  } = useApp();

  const [showAdd, setShowAdd] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [periodKey, setPeriodKey] = useState<string>("all");

  const recurringReminders = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const recurring = projects.filter((p) => p.isRecurring);
    return recurring.filter((p) => {
      const d = new Date(p.date);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) return false;
      const alreadyThisMonth = projects.some(
        (q) =>
          q.name === p.name &&
          q.clientName === p.clientName &&
          new Date(q.date).getMonth() === thisMonth &&
          new Date(q.date).getFullYear() === thisYear
      );
      return !alreadyThisMonth;
    }).filter((p, i, arr) =>
      arr.findIndex((q) => q.name === p.name && q.clientName === p.clientName) === i
    );
  }, [projects]);

  const handleRepeatAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date();
    recurringReminders.forEach((p) => {
      addProject({
        name: p.name,
        clientName: p.clientName,
        source: p.source,
        amount: p.amount,
        date: now.toISOString(),
        isPaid: false,
        description: p.description,
        currency: p.currency,
        currencyAmount: p.currencyAmount,
        currencyRate: p.currencyRate,
        isRecurring: true,
      });
    });
  };

  const availablePeriods = useMemo(() => {
    const keys = new Set<string>();
    for (const p of projects) {
      const d = new Date(p.date);
      keys.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
    return Array.from(keys)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 8);
  }, [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (periodKey !== "all") {
      const [yr, mn] = periodKey.split("-").map(Number);
      list = list.filter((p) => {
        const d = new Date(p.date);
        return d.getFullYear() === yr && d.getMonth() === mn;
      });
    }
    if (filter === "paid") list = list.filter((p) => p.isPaid);
    if (filter === "unpaid") list = list.filter((p) => !p.isPaid);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, filter, search, periodKey]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const STATUS_FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "paid", label: "Получено" },
    { key: "unpaid", label: "Ожидают" },
  ];

  const isFiltering = search || filter !== "all" || periodKey !== "all";

  const ListHeader = (
    <>
      <StatsCard
        totalIncome={totalIncome}
        paidIncome={paidIncome}
        unpaidIncome={unpaidIncome}
        estimatedTax={estimatedTax}
        taxRate={taxRate}
      />
      <TaxCard />
      <LimitCard />

      {recurringReminders.length > 0 && (
        <View style={styles.recurringBanner}>
          <View style={styles.recurringBannerLeft}>
            <View style={styles.recurringBannerIcon}>
              <Feather name="repeat" size={16} color={Colors.primary} />
            </View>
            <View style={styles.recurringBannerInfo}>
              <Text style={styles.recurringBannerTitle}>Повторяющиеся доходы</Text>
              <Text style={styles.recurringBannerSub}>
                {recurringReminders.length} {recurringReminders.length === 1 ? "источник" : recurringReminders.length <= 4 ? "источника" : "источников"} не добавлено за этот месяц
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.recurringBannerBtn}
            onPress={handleRepeatAll}
            activeOpacity={0.8}
          >
            <Text style={styles.recurringBannerBtnText}>Добавить все</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по названию или клиенту"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {availablePeriods.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
          style={styles.periodScroll}
        >
          <TouchableOpacity
            style={[styles.periodChip, periodKey === "all" && styles.periodChipActive]}
            onPress={() => setPeriodKey("all")}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodLabel, periodKey === "all" && styles.periodLabelActive]}>
              Все периоды
            </Text>
          </TouchableOpacity>
          {availablePeriods.map((key) => {
            const [yr, mn] = key.split("-").map(Number);
            const label = `${MONTH_NAMES_SHORT[mn]} ${yr}`;
            const active = periodKey === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.periodChip, active && styles.periodChipActive]}
                onPress={() => setPeriodKey(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.periodLabel, active && styles.periodLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterLabel,
                filter === f.key && styles.filterLabelActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Доходы</Text>
        <Text style={styles.sectionCount}>{filtered.length}</Text>
        {isFiltering && (
          <TouchableOpacity
            onPress={() => {
              setSearch("");
              setFilter("all");
              setPeriodKey("all");
            }}
            style={styles.clearBtn}
            activeOpacity={0.7}
          >
            <Feather name="x" size={13} color={Colors.textMuted} />
            <Text style={styles.clearBtnText}>Сбросить</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const EmptyState = (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Feather
          name={isFiltering ? "search" : "briefcase"}
          size={36}
          color={isFiltering ? Colors.textMuted : Colors.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {isFiltering ? "Ничего не найдено" : "Пока нет доходов"}
      </Text>
      <Text style={styles.emptyText}>
        {isFiltering
          ? "Попробуйте изменить поиск или фильтр"
          : "Добавьте первый доход, чтобы\nначать отслеживать финансы"}
      </Text>
      {!isFiltering && (
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => setShowAdd(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>Добавить доход</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <HomeHeader onAddPress={() => setShowAdd(true)} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableProjectItem
            project={item}
            onTogglePaid={(id) => updateProject(id, { isPaid: !item.isPaid })}
            onDelete={deleteProject}
            onEdit={(p) => setEditingProject(p)}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      <AddProjectSheet visible={showAdd} onClose={() => setShowAdd(false)} />
      <AddProjectSheet
        visible={!!editingProject}
        onClose={() => setEditingProject(undefined)}
        projectToEdit={editingProject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  list: { paddingHorizontal: 16 },
  searchContainer: {
    marginTop: 16,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  periodScroll: {
    marginBottom: 10,
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 4,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  periodChipActive: {
    backgroundColor: "#1565C0",
    borderColor: "#1565C0",
  },
  periodLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  periodLabelActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  clearBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textMuted,
  },
  recurringBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary + "12",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    padding: 12,
    marginTop: 10,
    gap: 10,
  },
  recurringBannerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recurringBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  recurringBannerInfo: {
    flex: 1,
  },
  recurringBannerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
  },
  recurringBannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.primary + "AA",
    marginTop: 1,
  },
  recurringBannerBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  recurringBannerBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  empty: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
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
