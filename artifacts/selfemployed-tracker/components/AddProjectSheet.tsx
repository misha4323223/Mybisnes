import Colors from "@/constants/colors";
import { Currency, IncomeSource, Project, useApp } from "@/context/AppContext";
import DateTimePicker from "@react-native-community/datetimepicker";
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

const CURRENCIES: { key: Currency; symbol: string; label: string }[] = [
  { key: "RUB", symbol: "₽", label: "Рубли" },
  { key: "USD", symbol: "$", label: "Доллары" },
  { key: "EUR", symbol: "€", label: "Евро" },
  { key: "USDT", symbol: "₮", label: "USDT" },
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
  const [currency, setCurrency] = useState<Currency>("RUB");
  const [currencyRate, setCurrencyRate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateStr, setWebDateStr] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (visible) {
      if (projectToEdit) {
        setName(projectToEdit.name);
        setClientName(projectToEdit.clientName === "Без клиента" ? "" : projectToEdit.clientName);
        setAmount(projectToEdit.currency && projectToEdit.currency !== "RUB"
          ? (projectToEdit.currencyAmount ?? projectToEdit.amount).toString()
          : projectToEdit.amount.toString());
        setSource(projectToEdit.source);
        setIsPaid(projectToEdit.isPaid);
        setDescription(projectToEdit.description ?? "");
        setCurrency(projectToEdit.currency ?? "RUB");
        setCurrencyRate(projectToEdit.currencyRate?.toString() ?? "");
        setIsRecurring(projectToEdit.isRecurring ?? false);
        setReceiptSent(projectToEdit.receiptSent ?? false);
        setClientPhone(projectToEdit.clientPhone ?? "");
        setClientEmail(projectToEdit.clientEmail ?? "");
        const d = new Date(projectToEdit.date);
        setDate(d);
        setWebDateStr(d.toISOString().slice(0, 10));
      } else {
        setName("");
        setClientName("");
        setAmount("");
        setSource("project");
        setIsPaid(false);
        setDescription("");
        setCurrency("RUB");
        setCurrencyRate("");
        setIsRecurring(false);
        setReceiptSent(false);
        setClientPhone("");
        setClientEmail("");
        const today = new Date();
        setDate(today);
        setWebDateStr(today.toISOString().slice(0, 10));
      }
    }
  }, [visible, projectToEdit]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Укажите название");
      return;
    }
    const rawAmt = parseFloat(amount.replace(",", "."));
    if (!amount || isNaN(rawAmt) || rawAmt <= 0) {
      Alert.alert("Укажите корректную сумму");
      return;
    }

    let finalAmount = rawAmt;
    let currencyAmount: number | undefined;
    let rate: number | undefined;

    if (currency !== "RUB") {
      const r = parseFloat(currencyRate.replace(",", "."));
      if (!currencyRate || isNaN(r) || r <= 0) {
        Alert.alert("Укажите курс обмена к рублю");
        return;
      }
      currencyAmount = rawAmt;
      rate = r;
      finalAmount = Math.round(rawAmt * r);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const finalDate = Platform.OS === "web"
      ? (webDateStr ? new Date(webDateStr + "T12:00:00") : new Date())
      : date;

    const payload = {
      name: name.trim(),
      clientName: clientName.trim() || "Без клиента",
      clientPhone: clientPhone.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      amount: finalAmount,
      source,
      isPaid,
      description: description.trim(),
      currency: currency !== "RUB" ? currency : undefined,
      currencyAmount,
      currencyRate: rate,
      isRecurring,
      receiptSent,
      date: finalDate.toISOString(),
    };

    if (isEdit && projectToEdit) {
      updateProject(projectToEdit.id, payload);
    } else {
      addProject(payload);
    }
    onClose();
  };

  const isForeign = currency !== "RUB";
  const currSymbol = CURRENCIES.find(c => c.key === currency)?.symbol ?? "₽";

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

            <Text style={styles.fieldLabel}>Телефон клиента (необязательно)</Text>
            <TextInput
              style={styles.input}
              placeholder="+7 900 000-00-00"
              placeholderTextColor={Colors.textMuted}
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            <Text style={styles.fieldLabel}>Email клиента (необязательно)</Text>
            <TextInput
              style={styles.input}
              placeholder="client@example.com"
              placeholderTextColor={Colors.textMuted}
              value={clientEmail}
              onChangeText={setClientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={styles.fieldLabel}>Дата получения</Text>
            {Platform.OS === "web" ? (
              <TextInput
                style={styles.input}
                value={webDateStr}
                onChangeText={(v) => {
                  setWebDateStr(v);
                  const d = new Date(v + "T12:00:00");
                  if (!isNaN(d.getTime())) setDate(d);
                }}
                placeholder="ГГГГ-ММ-ДД"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            ) : (
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Feather name="calendar" size={16} color={Colors.primary} />
                <Text style={styles.dateBtnText}>
                  {date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                </Text>
                <Feather name="chevron-down" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
            {showDatePicker && Platform.OS !== "web" && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (selectedDate) setDate(selectedDate);
                }}
                locale="ru-RU"
              />
            )}

            <Text style={styles.fieldLabel}>Валюта</Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.currencyChip, currency === c.key && styles.currencyChipActive]}
                  onPress={() => setCurrency(c.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.currencySymbol, currency === c.key && styles.currencySymbolActive]}>
                    {c.symbol}
                  </Text>
                  <Text style={[styles.currencyLabel, currency === c.key && styles.currencyLabelActive]}>
                    {c.key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Сумма ({currSymbol})</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            {isForeign && (
              <>
                <Text style={styles.fieldLabel}>Курс к рублю (1 {currency} = ? ₽)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Например: 91.5"
                  placeholderTextColor={Colors.textMuted}
                  value={currencyRate}
                  onChangeText={setCurrencyRate}
                  keyboardType="numeric"
                />
                {amount && currencyRate && !isNaN(parseFloat(amount)) && !isNaN(parseFloat(currencyRate)) && (
                  <View style={styles.convertHint}>
                    <Feather name="refresh-cw" size={12} color={Colors.primary} />
                    <Text style={styles.convertHintText}>
                      = {Math.round(parseFloat(amount) * parseFloat(currencyRate)).toLocaleString("ru-RU")} ₽ (для налога)
                    </Text>
                  </View>
                )}
              </>
            )}

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

            <Text style={styles.fieldLabel}>Повторяющийся доход</Text>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsRecurring((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleInfo}>
                <Feather
                  name="repeat"
                  size={18}
                  color={isRecurring ? Colors.primary : Colors.textMuted}
                />
                <View>
                  <Text style={styles.toggleText}>
                    {isRecurring ? "Повторяется ежемесячно" : "Разовый доход"}
                  </Text>
                  {isRecurring && (
                    <Text style={styles.toggleSub}>Напомним добавить в следующем месяце</Text>
                  )}
                </View>
              </View>
              <View style={[styles.toggle, isRecurring && styles.toggleActive]}>
                <View style={[styles.toggleThumb, isRecurring && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Чек ФНС «Мой налог»</Text>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setReceiptSent((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleInfo}>
                <Feather
                  name="file-text"
                  size={18}
                  color={receiptSent ? Colors.primaryLight : Colors.textMuted}
                />
                <View>
                  <Text style={styles.toggleText}>
                    {receiptSent ? "Чек выдан клиенту" : "Чек не выдан"}
                  </Text>
                  <Text style={styles.toggleSub}>Самозанятый обязан выдать чек</Text>
                </View>
              </View>
              <View style={[styles.toggle, receiptSent && styles.toggleActive]}>
                <View style={[styles.toggleThumb, receiptSent && styles.toggleThumbActive]} />
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
  currencyRow: {
    flexDirection: "row",
    gap: 8,
  },
  currencyChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 2,
  },
  currencyChipActive: {
    backgroundColor: Colors.primary + "12",
    borderColor: Colors.primary,
  },
  currencySymbol: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textMuted,
  },
  currencySymbolActive: {
    color: Colors.primary,
  },
  currencyLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
  },
  currencyLabelActive: {
    color: Colors.primary,
  },
  convertHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    backgroundColor: Colors.primary + "10",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  convertHintText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.primary,
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
    flex: 1,
  },
  toggleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  toggleSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
    flexShrink: 0,
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
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + "55",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateBtnText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
