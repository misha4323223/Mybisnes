import Colors from "@/constants/colors";
import { IncomeSource, Project, useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  projectToEdit?: Project;
}

const SOURCES: { key: IncomeSource; label: string }[] = [
  { key: "project", label: "Проект" },
  { key: "subscription", label: "Подписка" },
  { key: "one-time", label: "Разовая работа" },
  { key: "other", label: "Другое" },
];

export function AddProjectSheet({ visible, onClose, projectToEdit }: Props) {
  const { addProject, updateProject } = useApp();
  const insets = useSafeAreaInsets();

  const isEdit = !!projectToEdit;

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<IncomeSource>("project");
  const [isPaid, setIsPaid] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (visible) {
      if (projectToEdit) {
        setName(projectToEdit.name);
        setClientName(projectToEdit.clientName === "Без клиента" ? "" : projectToEdit.clientName);
        setAmount(projectToEdit.amount.toString());
        setSource(projectToEdit.source);
        setIsPaid(projectToEdit.isPaid);
        setDescription(projectToEdit.description ?? "");
      } else {
        setName("");
        setClientName("");
        setAmount("");
        setSource("project");
        setIsPaid(false);
        setDescription("");
      }
    }
  }, [visible, projectToEdit]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Укажите название");
      return;
    }
    const amt = parseFloat(amount.replace(",", "."));
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert("Укажите корректную сумму");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEdit && projectToEdit) {
      updateProject(projectToEdit.id, {
        name: name.trim(),
        clientName: clientName.trim() || "Без клиента",
        amount: amt,
        source,
        isPaid,
        description: description.trim(),
      });
    } else {
      addProject({
        name: name.trim(),
        clientName: clientName.trim() || "Без клиента",
        amount: amt,
        source,
        date: new Date().toISOString(),
        isPaid,
        description: description.trim(),
      });
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? "Редактировать" : "Новый доход"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>Название</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: разработка сайта"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>Клиент</Text>
            <TextInput
              style={styles.input}
              placeholder="Имя или компания"
              placeholderTextColor={Colors.textMuted}
              value={clientName}
              onChangeText={setClientName}
            />

            <Text style={styles.fieldLabel}>Сумма (₽)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Тип дохода</Text>
            <View style={styles.sourceRow}>
              {SOURCES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.sourceChip,
                    source === s.key && styles.sourceChipActive,
                  ]}
                  onPress={() => setSource(s.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sourceLabel,
                      source === s.key && styles.sourceLabelActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Статус оплаты</Text>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsPaid((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleInfo}>
                <Feather
                  name={isPaid ? "check-circle" : "clock"}
                  size={18}
                  color={isPaid ? Colors.primaryLight : Colors.accent}
                />
                <Text style={styles.toggleText}>
                  {isPaid ? "Деньги получены" : "Ожидает оплаты"}
                </Text>
              </View>
              <View style={[styles.toggle, isPaid && styles.toggleActive]}>
                <View style={[styles.toggleThumb, isPaid && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Комментарий (необязательно)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Детали проекта..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>{isEdit ? "Сохранить изменения" : "Добавить доход"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    padding: 20,
    paddingBottom: 8,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  sourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sourceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sourceChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sourceLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sourceLabelActive: {
    color: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.primaryLight,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
