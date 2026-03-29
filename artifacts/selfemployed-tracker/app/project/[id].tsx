import { AddProjectSheet } from "@/components/AddProjectSheet";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const sourceLabels: Record<string, string> = {
  project: "Проект",
  subscription: "Подписка",
  "one-time": "Разовая работа",
  other: "Другое",
};

const sourceIcons: Record<string, string> = {
  project: "briefcase",
  subscription: "repeat",
  "one-time": "zap",
  other: "more-horizontal",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  USDT: "₮",
};

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, updateProject, deleteProject, addProject } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const project = projects.find((p) => p.id === id);

  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(project?.description ?? "");
  const [showEdit, setShowEdit] = useState(false);

  if (!project) {
    return (
      <View style={[styles.container, { paddingTop: topPad + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={48} color={Colors.border} />
          <Text style={styles.notFoundText}>Запись не найдена</Text>
        </View>
      </View>
    );
  }

  const date = new Date(project.date);
  const fullDate = date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const tax = Math.round(project.amount * 0.04);
  const net = project.amount - tax;

  const hasForeignCurrency = project.currency && project.currency !== "RUB";
  const currSymbol = hasForeignCurrency ? (CURRENCY_SYMBOLS[project.currency!] ?? project.currency) : "₽";

  const handleTogglePaid = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateProject(project.id, { isPaid: !project.isPaid });
  };

  const handleToggleReceipt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProject(project.id, { receiptSent: !project.receiptSent });
  };

  const handleDelete = () => {
    Alert.alert("Удалить доход", `Удалить «${project.name}»?`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteProject(project.id);
          router.back();
        },
      },
    ]);
  };

  const handleRepeatThisMonth = () => {
    const now = new Date();
    const currentPeriod = `${now.getMonth() + 1}.${now.getFullYear()}`;
    const alreadyThisMonth = projects.some(
      (p) => p.name === project.name && p.clientName === project.clientName &&
        new Date(p.date).getMonth() === now.getMonth() &&
        new Date(p.date).getFullYear() === now.getFullYear() &&
        p.id !== project.id
    );
    if (alreadyThisMonth) {
      Alert.alert("Уже добавлено", "Похожий доход за этот месяц уже есть.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addProject({
      name: project.name,
      clientName: project.clientName,
      source: project.source,
      amount: project.amount,
      date: new Date().toISOString(),
      isPaid: false,
      description: project.description,
      currency: project.currency,
      currencyAmount: project.currencyAmount,
      currencyRate: project.currencyRate,
      isRecurring: project.isRecurring,
    });
    Alert.alert("Добавлено", "Доход скопирован на текущий месяц.");
  };

  const handleSaveNote = () => {
    updateProject(project.id, { description: noteText });
    setEditingNote(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Детали</Text>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={() => setShowEdit(true)} style={styles.editNavBtn} activeOpacity={0.7}>
            <Feather name="edit-2" size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.7}>
            <Feather name="trash-2" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 + 20 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.sourceChip}>
              <Feather
                name={(sourceIcons[project.source] ?? "more-horizontal") as any}
                size={13}
                color={Colors.primary}
              />
              <Text style={styles.sourceLabel}>{sourceLabels[project.source] ?? "Другое"}</Text>
            </View>
            <View style={styles.badgeRow}>
              {project.isRecurring && (
                <View style={styles.recurringBadge}>
                  <Feather name="repeat" size={11} color={Colors.primary} />
                  <Text style={styles.recurringBadgeText}>Повтор</Text>
                </View>
              )}
              <View style={[styles.statusBadge, project.isPaid ? styles.statusPaid : styles.statusPending]}>
                <View style={[styles.statusDot, { backgroundColor: project.isPaid ? Colors.primaryLight : Colors.accent }]} />
                <Text style={[styles.statusText, { color: project.isPaid ? Colors.primaryLight : Colors.accent }]}>
                  {project.isPaid ? "Получено" : "Ожидается"}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.clientName}>{project.clientName}</Text>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Сумма</Text>
            <View style={styles.amountRight}>
              {hasForeignCurrency && (
                <Text style={styles.amountForeign}>
                  {currSymbol}{project.currencyAmount?.toLocaleString("ru-RU")}
                  {project.currencyRate ? ` × ${project.currencyRate}` : ""}
                </Text>
              )}
              <Text style={styles.amountValue}>{project.amount.toLocaleString("ru-RU")} ₽</Text>
            </View>
          </View>

          <Text style={styles.dateText}>{fullDate}</Text>
        </View>

        <View style={styles.calcCard}>
          <Text style={styles.cardTitle}>Налоговый расчёт</Text>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Начислено</Text>
            <Text style={styles.calcValue}>{project.amount.toLocaleString("ru-RU")} ₽</Text>
          </View>
          <View style={styles.calcDivider} />
          <View style={styles.calcRow}>
            <View style={styles.calcLabelRow}>
              <Text style={styles.calcLabel}>Налог НПД</Text>
              <View style={styles.rateTag}><Text style={styles.rateText}>4%</Text></View>
            </View>
            <Text style={[styles.calcValue, { color: Colors.danger }]}>−{tax.toLocaleString("ru-RU")} ₽</Text>
          </View>
          <View style={styles.calcDivider} />
          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, styles.calcLabelBold]}>Чистыми</Text>
            <Text style={[styles.calcValue, styles.calcValueBold, { color: Colors.primaryLight }]}>
              {net.toLocaleString("ru-RU")} ₽
            </Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Действия</Text>

          <TouchableOpacity
            style={[styles.actionRow, { borderColor: project.receiptSent ? Colors.primaryLight + "44" : Colors.border }]}
            onPress={handleToggleReceipt}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: project.receiptSent ? "#E8F5E9" : Colors.surfaceAlt }]}>
              <Feather name="file-text" size={16} color={project.receiptSent ? Colors.primaryLight : Colors.textMuted} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Чек в ФНС «Мой налог»</Text>
              <Text style={[styles.actionSub, { color: project.receiptSent ? Colors.primaryLight : Colors.textMuted }]}>
                {project.receiptSent ? "Чек выдан клиенту" : "Не забудьте выдать чек"}
              </Text>
            </View>
            <View style={[styles.checkbox, project.receiptSent && styles.checkboxChecked]}>
              {project.receiptSent && <Feather name="check" size={13} color="#fff" />}
            </View>
          </TouchableOpacity>

          {project.isRecurring && (
            <TouchableOpacity
              style={[styles.actionRow, { marginTop: 8 }]}
              onPress={handleRepeatThisMonth}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary + "15" }]}>
                <Feather name="copy" size={16} color={Colors.primary} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Повторить за этот месяц</Text>
                <Text style={styles.actionSub}>Создать копию для текущего месяца</Text>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Text style={styles.cardTitle}>Комментарий</Text>
            <TouchableOpacity
              onPress={() => (editingNote ? handleSaveNote() : setEditingNote(true))}
              style={styles.editBtn}
              activeOpacity={0.7}
            >
              <Feather name={editingNote ? "check" : "edit-2"} size={15} color={Colors.primary} />
              <Text style={styles.editBtnText}>{editingNote ? "Сохранить" : "Изменить"}</Text>
            </TouchableOpacity>
          </View>
          {editingNote ? (
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              placeholder="Добавьте заметку..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
          ) : (
            <Text style={[styles.noteText, !noteText && styles.noteEmpty]}>
              {noteText || "Нет комментария. Нажмите «Изменить» чтобы добавить."}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, project.isPaid ? styles.toggleBtnUnpaid : styles.toggleBtnPaid]}
          onPress={handleTogglePaid}
          activeOpacity={0.85}
        >
          <Feather
            name={project.isPaid ? "clock" : "check-circle"}
            size={18}
            color="#fff"
          />
          <Text style={styles.toggleBtnText}>
            {project.isPaid ? "Отметить как неоплаченное" : "Отметить как полученное"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AddProjectSheet
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        projectToEdit={project}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  navActions: {
    flexDirection: "row",
    gap: 8,
  },
  editNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primary,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  recurringBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  recurringBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.primary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPaid: { backgroundColor: "#E8F5E9" },
  statusPending: { backgroundColor: "#FFF8E1" },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  projectName: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  clientName: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  amountLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountRight: {
    alignItems: "flex-end",
  },
  amountForeign: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  amountValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.textPrimary,
  },
  dateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },
  calcCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  actionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  actionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  calcLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calcLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  calcLabelBold: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  calcValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  calcValueBold: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  calcDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  rateTag: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rateText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  editBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.primary,
  },
  noteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  noteEmpty: {
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  noteInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 21,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: Colors.surfaceAlt,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  toggleBtnPaid: {
    backgroundColor: Colors.primary,
  },
  toggleBtnUnpaid: {
    backgroundColor: Colors.accent,
  },
  toggleBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
