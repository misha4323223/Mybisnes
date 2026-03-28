import { AddProjectSheet } from "@/components/AddProjectSheet";
import { HomeHeader } from "@/components/HomeHeader";
import { LimitCard } from "@/components/LimitCard";
import { StatsCard } from "@/components/StatsCard";
import { SwipeableProjectItem } from "@/components/SwipeableProjectItem";
import { TaxCard } from "@/components/TaxCard";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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
    loading,
  } = useApp();

  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [periodKey, setPeriodKey] = useState<string>("all");

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
