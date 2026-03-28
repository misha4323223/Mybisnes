import { AddProjectSheet } from "@/components/AddProjectSheet";
import { HomeHeader } from "@/components/HomeHeader";
import { ProjectItem } from "@/components/ProjectItem";
import { StatsCard } from "@/components/StatsCard";
import { TaxCard } from "@/components/TaxCard";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Доходы</Text>
        <Text style={styles.sectionCount}>{projects.length}</Text>
      </View>
    </>
  );

  const EmptyState = (
    <View style={styles.empty}>
      <Feather name="briefcase" size={48} color={Colors.border} />
      <Text style={styles.emptyTitle}>Нет записей</Text>
      <Text style={styles.emptyText}>
        Нажмите + чтобы добавить{"\n"}первый доход
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <HomeHeader onAddPress={() => setShowAdd(true)} />
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectItem
            project={item}
            onTogglePaid={(id) =>
              updateProject(id, { isPaid: !item.isPaid })
            }
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
  list: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
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
