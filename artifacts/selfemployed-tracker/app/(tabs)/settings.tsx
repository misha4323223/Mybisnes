import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export default function SettingsScreen() {
  const { projects, taxPayments, paidIncome, unpaidIncome, estimatedTax, taxRate, setTaxRate, exportData, importData } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [name, setName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [notifOn, setNotifOn] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  React.useEffect(() => {
    AsyncStorage.getItem("@user_name").then((v) => {
      if (v) setName(v);
      setNameLoaded(true);
    });
    AsyncStorage.getItem("@notif_on").then((v) => {
      setNotifOn(v === "1");
    });
  }, []);

  const saveName = async () => {
    await AsyncStorage.setItem("@user_name", name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Сохранено");
  };

  const toggleNotif = () => {
    const next = !notifOn;
    setNotifOn(next);
    AsyncStorage.setItem("@notif_on", next ? "1" : "0");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const csvEscape = (v: any): string => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const buildCsv = (rows: any[][]): string =>
    rows.map((r) => r.map(csvEscape).join(",")).join("\n");

  const handleExport = async () => {
    Alert.alert(
      "Экспорт в Excel",
      "Будет создан CSV-файл, который открывается в Excel, Google Таблицах и Numbers.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Создать",
          onPress: async () => {
            try {
              const now = new Date();
              const month = MONTHS[now.getMonth()];
              const year = now.getFullYear();
              const totalAll = paidIncome + unpaidIncome;

              const rows: any[][] = [
                ["Мой Доход — Отчёт"],
                ["Период", `${month} ${year}`],
                [],
                ["Показатель", "Сумма (руб.)"],
                ["Всего доходов", totalAll],
                ["Получено", paidIncome],
                ["Ожидается", unpaidIncome],
                [`Налог НПД ${(taxRate * 100).toFixed(0)}%`, estimatedTax],
                [],
                ["Лимит самозанятого (год)", 2400000],
                ["Использовано", Math.round(totalAll)],
                ["Остаток", Math.max(0, 2400000 - totalAll)],
                [],
                ["--- ДОХОДЫ ---"],
                ["№", "Дата", "Клиент", "Описание", "Сумма (руб.)", "Валюта", "Сумма в валюте", "Курс", "Статус", "Чек ФНС", "Повтор"],
                ...projects.map((p, i) => [
                  i + 1,
                  new Date(p.date).toLocaleDateString("ru-RU"),
                  p.clientName,
                  p.name,
                  p.amount,
                  p.currency && p.currency !== "RUB" ? p.currency : "RUB",
                  p.currencyAmount ?? p.amount,
                  p.currencyRate ?? 1,
                  p.isPaid ? "Оплачен" : "Ожидается",
                  p.receiptSent ? "Да" : "Нет",
                  p.isRecurring ? "Да" : "Нет",
                ]),
                [],
                ["--- НАЛОГИ ---"],
                ["Период", "Дата", "Сумма (руб.)", "Статус"],
                ...taxPayments.map((t) => [
                  t.period,
                  new Date(t.date).toLocaleDateString("ru-RU"),
                  t.amount,
                  t.isPaid ? "Оплачен" : "Ожидает оплаты",
                ]),
              ];

              const csv = "\uFEFF" + buildCsv(rows); // BOM для Excel
              const fileName = `moy-dohod-${month.toLowerCase()}-${year}.csv`;

              if (Platform.OS === "web") {
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else {
                const path = (FileSystem.cacheDirectory ?? "") + fileName;
                await FileSystem.writeAsStringAsync(path, csv, {
                  encoding: FileSystem.EncodingType.UTF8,
                });
                const canShare = await Sharing.isAvailableAsync();
                if (!canShare) {
                  Alert.alert("Файл сохранён", `Файл: ${path}`);
                  return;
                }
                await Sharing.shareAsync(path, {
                  mimeType: "text/csv",
                  dialogTitle: "Экспорт отчёта",
                  UTI: "public.comma-separated-values-text",
                });
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e: any) {
              Alert.alert("Ошибка", String(e?.message ?? e) || "Не удалось создать файл.");
            }
          },
        },
      ]
    );
  };

  const handleBackup = async () => {
    Alert.alert(
      "Резервная копия",
      "Все данные будут сохранены в файл. Его можно отправить на почту, в Telegram или сохранить в облако.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Сохранить",
          onPress: async () => {
            try {
              const json = await exportData();
              const date = new Date().toISOString().slice(0, 10);
              const fileName = `moy-dohod-backup-${date}.json`;

              if (Platform.OS === "web") {
                const blob = new Blob([json], { type: "application/json;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else {
                const path = (FileSystem.cacheDirectory ?? "") + fileName;
                await FileSystem.writeAsStringAsync(path, json, {
                  encoding: FileSystem.EncodingType.UTF8,
                });
                const canShare = await Sharing.isAvailableAsync();
                if (!canShare) {
                  Alert.alert("Файл сохранён", `Файл сохранён: ${path}`);
                  return;
                }
                await Sharing.shareAsync(path, {
                  mimeType: "application/json",
                  dialogTitle: "Резервная копия Мой Доход",
                  UTI: "public.json",
                });
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e: any) {
              Alert.alert("Ошибка", String(e?.message ?? e) || "Не удалось создать резервную копию.");
            }
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      Alert.alert("Вставьте JSON", "Вставьте содержимое резервной копии в поле выше.");
      return;
    }
    try {
      await importData(importText.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowImport(false);
      setImportText("");
      Alert.alert("Готово", "Данные успешно восстановлены из резервной копии.");
    } catch (e: any) {
      Alert.alert("Ошибка", e.message ?? "Неверный формат данных.");
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Удалить все данные",
      "Это удалит все записи о доходах и налогах. Действие необратимо.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              "@selfemployed_projects",
              "@selfemployed_tax",
            ]);
            Alert.alert("Готово", "Все данные удалены. Перезапустите приложение.");
          },
        },
      ]
    );
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Настройки</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Профиль</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Ваше имя</Text>
            <View style={styles.nameRow}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Иван Иванов"
                placeholderTextColor={Colors.textMuted}
                editable={nameLoaded}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveName} activeOpacity={0.8}>
                <Feather name="check" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Налоговая ставка</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Ставка НПД</Text>
            <View style={styles.rateRow}>
              <TouchableOpacity
                style={[styles.rateBtn, taxRate === 0.04 && styles.rateBtnActive]}
                onPress={async () => {
                  await setTaxRate(0.04);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.rateBtnPct, taxRate === 0.04 && styles.rateBtnPctActive]}>4%</Text>
                <Text style={[styles.rateBtnLabel, taxRate === 0.04 && styles.rateBtnLabelActive]}>Физ. лица</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rateBtn, taxRate === 0.06 && styles.rateBtnActive]}
                onPress={async () => {
                  await setTaxRate(0.06);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.rateBtnPct, taxRate === 0.06 && styles.rateBtnPctActive]}>6%</Text>
                <Text style={[styles.rateBtnLabel, taxRate === 0.06 && styles.rateBtnLabelActive]}>Юр. лица / ИП</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.rateHint}>
              <Feather name="info" size={12} color={Colors.textMuted} />
              <Text style={styles.rateHintText}>
                {taxRate === 0.04
                  ? "4% — если работаете с физическими лицами"
                  : "6% — если клиент — компания или ИП"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Уведомления</Text>
          <View style={styles.card}>
            <View style={styles.notifRow}>
              <View style={[styles.notifIcon, { backgroundColor: notifOn ? "#EEF2FF" : Colors.surfaceAlt }]}>
                <Feather name="bell" size={18} color={notifOn ? Colors.primary : Colors.textMuted} />
              </View>
              <View style={styles.notifInfo}>
                <Text style={styles.notifTitle}>Напоминание о налоге</Text>
                <Text style={[styles.notifSub, { color: notifOn ? Colors.primary : Colors.textMuted }]}>
                  {notifOn ? "Включено" : "Выключено"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleNotif}
                activeOpacity={0.85}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              >
                <View style={[styles.toggle, notifOn && styles.toggleOn]}>
                  <View style={[styles.toggleThumb, notifOn && styles.toggleThumbOn]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Отчётность</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleExport} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="file-text" size={18} color={Colors.primaryLight} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Экспорт в Excel</Text>
              <Text style={styles.menuSub}>Сводка, доходы и налоги в .xlsx</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Резервная копия</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleBackup} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: "#E3F2FD" }]}>
              <Feather name="download" size={18} color={Colors.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Создать резервную копию</Text>
              <Text style={styles.menuSub}>Сохранить данные в файл для переноса</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { marginTop: 6 }]} onPress={() => setShowImport(true)} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: "#FFF3E0" }]}>
              <Feather name="upload" size={18} color={Colors.accent} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Восстановить из копии</Text>
              <Text style={styles.menuSub}>Вставить JSON резервной копии</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Информация</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Feather name="info" size={15} color={Colors.primary} />
              <Text style={styles.infoText}>
                Самозанятые платят налог на профессиональный доход (НПД).
                Ставка 4% с доходов от физлиц, 6% от организаций.
                Лимит дохода: 2 400 000 ₽ в год.
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Feather name="smartphone" size={15} color={Colors.primary} />
              <Text style={styles.infoText}>
                Оплата налога — в официальном приложении ФНС «Мой налог».
                Наше приложение только ведёт учёт.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Опасная зона</Text>
          <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={handleClearAll} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: "#FFEBEE" }]}>
              <Feather name="trash-2" size={18} color={Colors.danger} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: Colors.danger }]}>Удалить все данные</Text>
              <Text style={styles.menuSub}>Необратимое действие</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Мой Доход v1.1 · Для самозанятых РФ</Text>
      </ScrollView>

      <Modal
        visible={showImport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowImport(false)}
      >
        <View style={styles.importModal}>
          <View style={styles.importHandle} />
          <View style={styles.importHeader}>
            <Text style={styles.importTitle}>Восстановить из копии</Text>
            <TouchableOpacity onPress={() => { setShowImport(false); setImportText(""); }} style={styles.importClose}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.importDesc}>
            Вставьте содержимое JSON-файла резервной копии в поле ниже. Все текущие данные будут заменены.
          </Text>
          <TextInput
            style={styles.importInput}
            value={importText}
            onChangeText={setImportText}
            multiline
            placeholder={'{"version":1,"projects":[...],...}'}
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.importBtns}>
            <TouchableOpacity style={styles.importCancel} onPress={() => { setShowImport(false); setImportText(""); }} activeOpacity={0.8}>
              <Text style={styles.importCancelText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.importConfirm} onPress={handleImport} activeOpacity={0.8}>
              <Feather name="upload" size={16} color="#fff" />
              <Text style={styles.importConfirmText}>Восстановить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, gap: 6 },
  pageTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nameInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notifInfo: { flex: 1 },
  notifTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  notifSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rateRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  rateBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  rateBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "12",
  },
  rateBtnPct: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.textSecondary,
  },
  rateBtnPctActive: {
    color: Colors.primary,
  },
  rateBtnLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  rateBtnLabelActive: {
    color: Colors.primary,
  },
  rateHint: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  rateHintText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: "center",
    paddingHorizontal: 3,
    flexShrink: 0,
  },
  toggleOn: {
    backgroundColor: Colors.primaryLight,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: "flex-start",
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  dangerItem: {
    borderColor: "#FFCDD2",
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  menuInfo: { flex: 1 },
  menuTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  menuSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  version: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  importModal: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  importHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  importHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  importTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  importClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  importDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
  },
  importInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  importBtns: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 24,
  },
  importCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
  },
  importCancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textSecondary,
  },
  importConfirm: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  importConfirmText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
