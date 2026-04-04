import Colors from "@/constants/colors";
import { TaxPayment, useApp } from "@/context/AppContext";
import { SwipeableTaxItem } from "@/components/SwipeableTaxItem";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
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

const { height: SCREEN_H } = Dimensions.get("window");

const MONTH_NAMES_SHORT = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function formatPeriod(period: string): string {
  const [month, year] = period.split(".");
  const mIdx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[mIdx] ?? month} ${year}`;
}

function daysUntil25(): number {
  const now = new Date();
  const deadline = new Date(now.getFullYear(), now.getMonth(), 25, 23, 59, 59);
  if (now > deadline) {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 25, 23, 59, 59);
    return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getMonth() + 1}.${now.getFullYear()}`;
}

interface MonthInfo {
  monthIdx: number;
  year: number;
  income: number;
  taxEntry?: TaxPayment;
  estimatedTax: number;
}

export default function TaxScreen() {
  const {
    taxPayments, projects, markTaxPaid, markTaxUnpaid, deleteTaxPayment,
    updateTaxPayment, estimatedTax, taxRate, addTaxPayment,
  } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const now = new Date();
  const currentYear = now.getFullYear();
  const days = daysUntil25();
  const isUrgent = days <= 3;
  const isMedium = days <= 7;
  const deadlineColor = isUrgent ? Colors.danger : isMedium ? Colors.accent : Colors.primary;

  const currentPeriod = getCurrentPeriod();
  const currentMonthTax = taxPayments.find(t => t.period === currentPeriod);

  const totalPaidThisYear = taxPayments
    .filter(t => t.isPaid && t.period.endsWith(`.${currentYear}`))
    .reduce((s, t) => s + t.amount, 0);

  const pendingTaxes = taxPayments.filter(t => !t.isPaid);
  const totalPending = pendingTaxes.reduce((s, t) => s + t.amount, 0);

  const monthlyIncomeMap = useMemo(() => {
    const map: Record<string, number> = {};
    projects
      .filter(p => new Date(p.date).getFullYear() === currentYear)
      .forEach(p => {
        const d = new Date(p.date);
        const key = `${d.getMonth() + 1}.${currentYear}`;
        map[key] = (map[key] ?? 0) + p.amount;
      });
    return map;
  }, [projects, currentYear]);

  const [selectedMonth, setSelectedMonth] = useState<MonthInfo | null>(null);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [editItem, setEditItem] = useState<TaxPayment | null>(null);

  const [addMonth, setAddMonth] = useState(now.getMonth());
  const [addYear] = useState(currentYear);
  const [addAmount, setAddAmount] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const monthSlideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const editSlideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  const openSheet = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };
  const closeSheet = (anim: Animated.Value, cb: () => void) => {
    Animated.timing(anim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }).start(cb);
  };

  const handleCalendarTap = (monthIdx: number) => {
    const period = `${monthIdx + 1}.${currentYear}`;
    const income = monthlyIncomeMap[period] ?? 0;
    const taxEntry = taxPayments.find(t => t.period === period);
    const estimated = Math.round(income * taxRate);
    setSelectedMonth({ monthIdx, year: currentYear, income, taxEntry, estimatedTax: estimated });
    openSheet(monthSlideAnim);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeMonthSheet = () => {
    closeSheet(monthSlideAnim, () => setSelectedMonth(null));
  };

  const handleOpenAddSheet = () => {
    setAddMonth(now.getMonth());
    setAddAmount(String(estimatedTax > 0 ? estimatedTax : ""));
    setAddSheetVisible(true);
    openSheet(slideAnim);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const closeAddSheet = () => {
    closeSheet(slideAnim, () => {
      setAddSheetVisible(false);
      setAddAmount("");
    });
  };

  const handleAddTax = () => {
    const amt = parseInt(addAmount.replace(/\D/g, ""), 10);
    if (!amt || amt <= 0) {
      Alert.alert("Ошибка", "Введите корректную сумму");
      return;
    }
    const period = `${addMonth + 1}.${addYear}`;
    const alreadyExists = taxPayments.find(t => t.period === period);
    if (alreadyExists) {
      Alert.alert("Уже существует", `Запись за ${MONTH_NAMES[addMonth]} ${addYear} уже есть.`);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTaxPayment({ amount: amt, date: new Date().toISOString(), period, isPaid: false });
    closeAddSheet();
  };

  const handleOpenEdit = (item: TaxPayment) => {
    setEditItem(item);
    setEditAmount(String(item.amount));
    openSheet(editSlideAnim);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const closeEditSheet = () => {
    closeSheet(editSlideAnim, () => {
      setEditItem(null);
      setEditAmount("");
    });
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    const amt = parseInt(editAmount.replace(/\D/g, ""), 10);
    if (!amt || amt <= 0) {
      Alert.alert("Ошибка", "Введите корректную сумму");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateTaxPayment(editItem.id, { amount: amt });
    closeEditSheet();
  };

  const handleAddFromMonthSheet = () => {
    if (!selectedMonth) return;
    const period = `${selectedMonth.monthIdx + 1}.${selectedMonth.year}`;
    if (selectedMonth.taxEntry) {
      Alert.alert("Уже существует", `Запись за этот месяц уже добавлена.`);
      return;
    }
    addTaxPayment({
      amount: selectedMonth.estimatedTax,
      date: new Date().toISOString(),
      period,
      isPaid: false,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeMonthSheet();
  };

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: Colors.background }}
        data={taxPayments}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: topPad + 16 }]}>
            <Text style={styles.pageTitle}>Налоги</Text>

            <View style={[styles.deadlineCard, { borderColor: deadlineColor + "40", backgroundColor: deadlineColor + "0D" }]}>
              <View style={styles.deadlineLeft}>
                <Text style={[styles.deadlineDays, { color: deadlineColor }]}>{days}</Text>
                <Text style={[styles.deadlineDaysLabel, { color: deadlineColor }]}>
                  {days === 1 ? "день" : days <= 4 ? "дня" : "дней"}
                </Text>
              </View>
              <View style={styles.deadlineDivider} />
              <View style={styles.deadlineRight}>
                <Text style={styles.deadlineTitle}>До дедлайна оплаты</Text>
                <Text style={styles.deadlineSub}>Срок — 25-е число каждого месяца</Text>
                <View style={styles.deadlineAmtRow}>
                  <Text style={styles.deadlineAmtLabel}>Налог за месяц:</Text>
                  <Text style={[styles.deadlineAmt, { color: deadlineColor }]}>
                    {estimatedTax.toLocaleString("ru-RU")} ₽
                  </Text>
                </View>
              </View>
            </View>

            {totalPending > 0 && (
              <View style={styles.debtCard}>
                <View style={styles.debtLeft}>
                  <Feather name="alert-circle" size={20} color={Colors.danger} />
                  <View>
                    <Text style={styles.debtLabel}>Итого не оплачено</Text>
                    <Text style={styles.debtSub}>
                      За {pendingTaxes.length} {pendingTaxes.length === 1 ? "месяц" : pendingTaxes.length <= 4 ? "месяца" : "месяцев"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.debtAmount}>{totalPending.toLocaleString("ru-RU")} ₽</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalPaidThisYear.toLocaleString("ru-RU")} ₽</Text>
                <Text style={styles.statLabel}>Оплачено в {currentYear}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: Colors.primary }]}>
                  {Math.round(
                    projects.filter(p => p.isPaid).reduce((s, p) => s + p.amount, 0) * taxRate
                  ).toLocaleString("ru-RU")} ₽
                </Text>
                <Text style={styles.statLabel}>Расчёт за весь период</Text>
              </View>
            </View>

            <YearCalendar
              currentYear={currentYear}
              taxPayments={taxPayments}
              monthlyIncomeMap={monthlyIncomeMap}
              onMonthTap={handleCalendarTap}
            />

            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleOpenAddSheet}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Добавить запись за любой месяц</Text>
            </TouchableOpacity>

            <View style={styles.hintCard}>
              <Feather name="info" size={14} color={Colors.primary} />
              <Text style={styles.hintText}>
                Оплачивайте НПД через приложение ФНС «Мой налог». Свайпните запись влево чтобы изменить сумму или удалить.
              </Text>
            </View>

            {taxPayments.length > 0 && (
              <Text style={styles.sectionTitle}>История</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="file-text" size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Нет записей</Text>
            <Text style={styles.emptyText}>
              Нажмите «Добавить запись» выше — выберите месяц и укажите сумму налога. Также можно нажать на любой месяц в календаре.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableTaxItem
            item={item}
            onMarkPaid={markTaxPaid}
            onMarkUnpaid={markTaxUnpaid}
            onEdit={handleOpenEdit}
            onDelete={deleteTaxPayment}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 34 + 84 : 110 },
        ]}
      />

      {/* Month detail sheet */}
      {selectedMonth !== null && (
        <Modal visible transparent animationType="fade" onRequestClose={closeMonthSheet} statusBarTranslucent>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeMonthSheet} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: monthSlideAnim }] }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {MONTH_NAMES[selectedMonth.monthIdx]} {selectedMonth.year}
              </Text>
              <TouchableOpacity onPress={closeMonthSheet} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthInfoGrid}>
              <View style={styles.monthInfoCell}>
                <Text style={styles.monthInfoLabel}>Доход за месяц</Text>
                <Text style={styles.monthInfoValue}>
                  {selectedMonth.income > 0
                    ? selectedMonth.income.toLocaleString("ru-RU") + " ₽"
                    : "—"}
                </Text>
              </View>
              <View style={styles.monthInfoDivider} />
              <View style={styles.monthInfoCell}>
                <Text style={styles.monthInfoLabel}>Расчёт налога</Text>
                <Text style={[styles.monthInfoValue, { color: Colors.primary }]}>
                  {selectedMonth.estimatedTax > 0
                    ? selectedMonth.estimatedTax.toLocaleString("ru-RU") + " ₽"
                    : "—"}
                </Text>
              </View>
            </View>

            {selectedMonth.taxEntry ? (
              <View style={styles.monthTaxStatus}>
                <View style={[
                  styles.monthStatusBadge,
                  { backgroundColor: selectedMonth.taxEntry.isPaid ? Colors.primaryLight + "22" : Colors.accent + "22" }
                ]}>
                  <Feather
                    name={selectedMonth.taxEntry.isPaid ? "check-circle" : "clock"}
                    size={16}
                    color={selectedMonth.taxEntry.isPaid ? Colors.primaryLight : Colors.accent}
                  />
                  <Text style={[
                    styles.monthStatusText,
                    { color: selectedMonth.taxEntry.isPaid ? Colors.primaryLight : Colors.accent }
                  ]}>
                    {selectedMonth.taxEntry.isPaid ? "Налог оплачен" : "Ожидает оплаты"}
                  </Text>
                </View>
                <Text style={styles.monthTaxAmt}>
                  {selectedMonth.taxEntry.amount.toLocaleString("ru-RU")} ₽
                </Text>
              </View>
            ) : (
              <View style={styles.monthNoTax}>
                <Text style={styles.monthNoTaxText}>Запись о налоге за этот месяц не добавлена</Text>
                {selectedMonth.income > 0 && (
                  <TouchableOpacity
                    style={styles.monthAddBtn}
                    onPress={handleAddFromMonthSheet}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={15} color="#fff" />
                    <Text style={styles.monthAddBtnText}>
                      Добавить {selectedMonth.estimatedTax > 0 ? `${selectedMonth.estimatedTax.toLocaleString("ru-RU")} ₽` : "запись"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
        </Modal>
      )}

      {/* Add tax for any month sheet */}
      {addSheetVisible && (
        <Modal visible transparent animationType="fade" onRequestClose={closeAddSheet} statusBarTranslucent>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeAddSheet} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kavWrapper}>
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Добавить запись о налоге</Text>
                <TouchableOpacity onPress={closeAddSheet} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Месяц</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthPicker}>
                  {MONTH_NAMES.map((name, idx) => {
                    const period = `${idx + 1}.${addYear}`;
                    const exists = !!taxPayments.find(t => t.period === period);
                    const isFuture = idx > now.getMonth() && addYear >= currentYear;
                    const isSelected = idx === addMonth;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.monthChip,
                          isSelected && styles.monthChipSelected,
                          (exists || isFuture) && styles.monthChipDisabled,
                        ]}
                        onPress={() => {
                          if (exists || isFuture) return;
                          setAddMonth(idx);
                          const period = `${idx + 1}.${addYear}`;
                          const income = monthlyIncomeMap[period] ?? 0;
                          const est = Math.round(income * taxRate);
                          if (est > 0) setAddAmount(String(est));
                          Haptics.selectionAsync();
                        }}
                        activeOpacity={exists || isFuture ? 1 : 0.7}
                      >
                        <Text style={[
                          styles.monthChipText,
                          isSelected && styles.monthChipTextSelected,
                          (exists || isFuture) && styles.monthChipTextDisabled,
                        ]}>
                          {name}
                        </Text>
                        {exists && <Text style={styles.monthChipMeta}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.fieldLabel}>Сумма налога (₽)</Text>
                <View style={styles.amountInputRow}>
                  <TextInput
                    style={styles.amountInput}
                    value={addAmount}
                    onChangeText={setAddAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    returnKeyType="done"
                  />
                  <Text style={styles.amountInputSuffix}>₽</Text>
                </View>

                {(() => {
                  const period = `${addMonth + 1}.${addYear}`;
                  const income = monthlyIncomeMap[period] ?? 0;
                  if (income > 0) {
                    return (
                      <Text style={styles.incomeHint}>
                        Доход за {MONTH_NAMES[addMonth]}: {income.toLocaleString("ru-RU")} ₽ → расчёт: {Math.round(income * taxRate).toLocaleString("ru-RU")} ₽
                      </Text>
                    );
                  }
                  return null;
                })()}

                <TouchableOpacity style={styles.submitBtn} onPress={handleAddTax} activeOpacity={0.8}>
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Добавить</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Edit amount sheet */}
      {editItem !== null && (
        <Modal visible transparent animationType="fade" onRequestClose={closeEditSheet} statusBarTranslucent>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeEditSheet} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kavWrapper}>
            <Animated.View style={[styles.sheet, { transform: [{ translateY: editSlideAnim }] }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Изменить сумму</Text>
                <TouchableOpacity onPress={closeEditSheet} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.sheetBody}>
                <Text style={styles.editPeriodLabel}>{formatPeriod(editItem.period)}</Text>
                <Text style={styles.fieldLabel}>Сумма налога (₽)</Text>
                <View style={styles.amountInputRow}>
                  <TextInput
                    style={styles.amountInput}
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveEdit}
                  />
                  <Text style={styles.amountInputSuffix}>₽</Text>
                </View>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit} activeOpacity={0.8}>
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </>
  );
}

function YearCalendar({
  currentYear,
  taxPayments,
  monthlyIncomeMap,
  onMonthTap,
}: {
  currentYear: number;
  taxPayments: TaxPayment[];
  monthlyIncomeMap: Record<string, number>;
  onMonthTap: (monthIdx: number) => void;
}) {
  const now = new Date();
  const currentMonth = now.getMonth();

  return (
    <View style={styles.calCard}>
      <Text style={styles.calTitle}>{currentYear} — нажмите на месяц для деталей</Text>
      <View style={styles.calGrid}>
        {MONTH_NAMES_SHORT.map((name, idx) => {
          const period = `${idx + 1}.${currentYear}`;
          const hasIncome = (monthlyIncomeMap[period] ?? 0) > 0;
          const taxEntry = taxPayments.find(t => t.period === period);
          const isFuture = idx > currentMonth;
          const isCurrent = idx === currentMonth;

          let bg = Colors.border;
          let textColor = Colors.textMuted;
          let label = "";

          if (isFuture) {
            bg = Colors.surfaceAlt;
            textColor = Colors.textMuted;
          } else if (!hasIncome && !taxEntry) {
            bg = Colors.surfaceAlt;
            textColor = Colors.textMuted;
            label = "—";
          } else if (taxEntry?.isPaid) {
            bg = Colors.primaryLight + "22";
            textColor = Colors.primaryLight;
            label = "✓";
          } else if (taxEntry && !taxEntry.isPaid) {
            bg = Colors.accent + "22";
            textColor = Colors.accent;
            label = "!";
          } else if (hasIncome) {
            bg = Colors.primary + "15";
            textColor = Colors.primary;
            label = "₽";
          }

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.calCell,
                { backgroundColor: bg },
                isCurrent && styles.calCellCurrent,
              ]}
              onPress={() => onMonthTap(idx)}
              activeOpacity={0.7}
            >
              <Text style={[styles.calMonth, { color: textColor }]}>{name}</Text>
              {label ? (
                <Text style={[styles.calLabel, { color: textColor }]}>{label}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.calLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primaryLight }]} />
          <Text style={styles.legendText}>Оплачено</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.legendText}>Ожидает</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Есть доход</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  deadlineCard: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    alignItems: "center",
  },
  deadlineLeft: {
    alignItems: "center",
    paddingRight: 16,
    minWidth: 64,
  },
  deadlineDays: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    lineHeight: 40,
  },
  deadlineDaysLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  deadlineDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.border,
    marginRight: 16,
  },
  deadlineRight: {
    flex: 1,
  },
  deadlineTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  deadlineSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  deadlineAmtRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deadlineAmtLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  deadlineAmt: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  debtCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.danger + "12",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.danger + "30",
  },
  debtLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  debtLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.danger,
  },
  debtSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.danger,
    opacity: 0.7,
    marginTop: 1,
  },
  debtAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.danger,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  statBox: {
    flex: 1,
    padding: 14,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
  },
  calCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  calTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  calCell: {
    width: "14%",
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    minWidth: 44,
  },
  calCellCurrent: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calMonth: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },
  calLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    marginTop: 1,
  },
  calLegend: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  addBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  hintCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  hintText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
  },
  empty: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  kavWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.85,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
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
  sheetBody: {
    padding: 20,
    gap: 8,
  },
  monthInfoGrid: {
    flexDirection: "row",
    margin: 20,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  monthInfoCell: {
    flex: 1,
    padding: 14,
    alignItems: "center",
  },
  monthInfoDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  monthInfoLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
    textAlign: "center",
  },
  monthInfoValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  monthTaxStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  monthStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthStatusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  monthTaxAmt: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  monthNoTax: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
    alignItems: "center",
  },
  monthNoTaxText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },
  monthAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  monthAddBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  monthPicker: {
    marginBottom: 8,
  },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    marginRight: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  monthChipDisabled: {
    opacity: 0.4,
  },
  monthChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  monthChipTextSelected: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  monthChipTextDisabled: {
    color: Colors.textMuted,
  },
  monthChipMeta: {
    fontSize: 9,
    color: Colors.primaryLight,
    marginTop: 1,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  amountInputSuffix: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  incomeHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
  },
  submitBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  editPeriodLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
});
