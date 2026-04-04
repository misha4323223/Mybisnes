import Colors from "@/constants/colors";
import { TaxPayment } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = -70;
const SWIPE_OPEN = -160;

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function formatPeriod(period: string): string {
  const parts = period.split(".");
  if (parts.length === 2) {
    const mIdx = parseInt(parts[0], 10) - 1;
    return `${MONTH_NAMES[mIdx] ?? parts[0]} ${parts[1]}`;
  }
  return period;
}

interface Props {
  item: TaxPayment;
  onMarkPaid: (id: string) => void;
  onMarkUnpaid: (id: string) => void;
  onEdit: (item: TaxPayment) => void;
  onDelete: (id: string) => void;
}

export function SwipeableTaxItem({ item, onMarkPaid, onMarkUnpaid, onEdit, onDelete }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dy) < 20,
      onPanResponderMove: (_e, gs) => {
        if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, -170));
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: SWIPE_OPEN,
            useNativeDriver: true,
          }).start();
        } else {
          closeSwipe();
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
    }).start(() => onDelete(item.id));
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeSwipe();
    setTimeout(() => onEdit(item), 200);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.actionsBackground}>
        <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
          <Feather name="edit-2" size={18} color="#fff" />
          <Text style={styles.actionText}>Изменить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Feather name="trash-2" size={18} color="#fff" />
          <Text style={styles.actionText}>Удалить</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.statusBadge, item.isPaid ? styles.badgePaid : styles.badgePending]}>
          <Feather
            name={item.isPaid ? "check" : "clock"}
            size={13}
            color={item.isPaid ? Colors.primaryLight : Colors.accent}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.period}>{formatPeriod(item.period)}</Text>
          <Text style={styles.date}>
            {item.isPaid ? "Оплачено " : "Добавлено "}
            {new Date(item.date).toLocaleDateString("ru-RU")}
          </Text>
          <Text style={styles.swipeHint}>← свайп для действий</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.amount}>{item.amount.toLocaleString("ru-RU")} ₽</Text>
          {!item.isPaid ? (
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onMarkPaid(item.id);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.payBtnText}>Оплатил</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.paidTag}
              onPress={() => onMarkUnpaid(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
            >
              <Feather name="check" size={13} color={Colors.primaryLight} />
            </TouchableOpacity>
          )}
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
  actionsBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 160,
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
  },
  editBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  actionText: {
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
  info: {
    flex: 1,
  },
  period: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  date: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  swipeHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    opacity: 0.5,
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  payBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
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
});
