import { AddProjectSheet } from "@/components/AddProjectSheet";
import { HomeHeader } from "@/components/HomeHeader";
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type FilterType = "all" | "paid" | "unpaid";

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

  const filtered = useMemo(() => {
    let list = projects;
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
  }, [projects, filter, search]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "paid", label: "Получено" },
    { key: "unpaid", label: "Ожидают" },
  ];

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

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
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
      </View>
    </>
  );

  const EmptyState = (
    <View style={styles.empty}>
      <Feather
        name={search || filter !== "all" ? "search" : "briefcase"}
        size={48}
        color={Colors.border}
      />
      <Text style={styles.emptyTitle}>
        {search || filter !== "all" ? "Ничего не найдено" : "Нет записей"}
      </Text>
      <Text style={styles.emptyText}>
        {search || filter !== "all"
          ? "Попробуйте изменить поиск или фильтр"
          : "Нажмите + чтобы добавить\nпервый доход"}
      </Text>
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
