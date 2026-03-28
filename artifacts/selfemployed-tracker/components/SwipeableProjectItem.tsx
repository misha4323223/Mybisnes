import Colors from "@/constants/colors";
import { Project } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = -70;

interface Props {
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

export function SwipeableProjectItem({ project, onTogglePaid, onDelete }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const date = new Date(project.date);
  const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  const isSwiping = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dy) < 20,
      onPanResponderGrant: () => {
        isSwiping.current = false;
      },
      onPanResponderMove: (_e, gs) => {
        if (gs.dx < -8) isSwiping.current = true;
        if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, -90));
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDelete(project.id));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.deleteBackground}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Feather name="trash-2" size={20} color="#fff" />
          <Text style={styles.deleteText}>Удалить</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
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

        <TouchableOpacity
          style={styles.infoTouchable}
          activeOpacity={0.7}
          onPress={() => {
            if (!isSwiping.current) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/project/${project.id}`);
            }
          }}
        >
          <Text style={styles.name} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={styles.client} numberOfLines={1}>
            {project.clientName} · {sourceLabels[project.source] ?? "Другое"}
          </Text>
        </TouchableOpacity>

        <View style={styles.right}>
          <Text
            style={[styles.amount, !project.isPaid && styles.amountPending]}
          >
            {project.amount.toLocaleString("ru-RU")} ₽
          </Text>
          <Text style={styles.date}>{dateStr}</Text>
          <Feather name="chevron-right" size={12} color={Colors.textMuted} style={{ marginTop: 3 }} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    borderRadius: 14,
    overflow: "hidden",
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Colors.danger,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    flex: 1,
    paddingHorizontal: 12,
  },
  deleteText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#fff",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
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
  info: { flex: 1 },
  infoTouchable: { flex: 1 },
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
  right: { alignItems: "flex-end" },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.primaryLight,
  },
  amountPending: { color: Colors.accent },
  date: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
