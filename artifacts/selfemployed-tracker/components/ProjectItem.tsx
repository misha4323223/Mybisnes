import Colors from "@/constants/colors";
import { Project } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProjectItemProps {
  project: Project;
  onTogglePaid: (id: string) => void;
  onDelete: (id: string) => void;
}

const sourceLabels: Record<string, string> = {
  project: "Проект",
  subscription: "Подписка",
  "one-time": "Разовая работа",
  other: "Другое",
};

export function ProjectItem({ project, onTogglePaid, onDelete }: ProjectItemProps) {
  const date = new Date(project.date);
  const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.checkBtn, project.isPaid && styles.checkBtnActive]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTogglePaid(project.id);
        }}
        activeOpacity={0.7}
      >
        {project.isPaid && <Feather name="check" size={14} color="#fff" />}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{project.name}</Text>
        <Text style={styles.client} numberOfLines={1}>
          {project.clientName} · {sourceLabels[project.source] ?? "Другое"}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, !project.isPaid && styles.amountPending]}>
          {project.amount.toLocaleString("ru-RU")} ₽
        </Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete(project.id);
        }}
        activeOpacity={0.6}
      >
        <Feather name="trash-2" size={15} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  client: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.primaryLight,
  },
  amountPending: {
    color: Colors.accent,
  },
  date: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
});
