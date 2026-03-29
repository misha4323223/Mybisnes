import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const { projects, paidIncome, unpaidIncome, estimatedTax, taxRate, setTaxRate } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [name, setName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem("@user_name").then((v) => {
      if (v) setName(v);
      setNameLoaded(true);
    });
    AsyncStorage.getItem("@notif_enabled").then((v) => {
      if (v === "true") setNotifEnabled(true);
    });
  }, []);

  const saveName = async () => {
    await AsyncStorage.setItem("@user_name", name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Сохранено");
  };

  const handleToggleNotif = () => {
    const next = !notifEnabled;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS === "web") {
      Alert.alert("Уведомления", "Уведомления доступны только в мобильном приложении.");
      return;
    }

    if (next) {
      // Включаем — просим открыть системные настройки
      Alert.alert(
        "Включить напоминания?",
        "Разрешите уведомления в настройках телефона. Мы напомним об уплате налога 23-го и 24-го числа каждого месяца.",
        [
          { text: "Не сейчас", style: "cancel" },
          {
            text: "Открыть настройки",
            onPress: () => {
              setNotifEnabled(true);
              AsyncStorage.setItem("@notif_enabled", "true");
              Linking.openSettings();
            },
          },
        ]
      );
    } else {
      // Выключаем сразу
      setNotifEnabled(false);
      AsyncStorage.setItem("@notif_enabled", "false");
    }
  };

  const handleExport = async () => {
    const now = new Date();
    const months = [
      "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
    ];
    const month = months[now.getMonth()];

    const lines = [
      `Отчёт за ${month} ${now.getFullYear()}`,
      `─────────────────`,
      `Всего доходов: ${(paidIncome + unpaidIncome).toLocaleString("ru-RU")} ₽`,
      `Получено: ${paidIncome.toLocaleString("ru-RU")} ₽`,
      `Ожидается: ${unpaidIncome.toLocaleString("ru-RU")} ₽`,
      `Налог НПД (4%): ${estimatedTax.toLocaleString("ru-RU")} ₽`,
      `─────────────────`,
      ``,
      `Список доходов:`,
    ];

    projects.forEach((p, i) => {
      const date = new Date(p.date).toLocaleDateString("ru-RU");
      const status = p.isPaid ? "[✓]" : "[ожидается]";
      lines.push(
        `${i + 1}. ${status} ${p.name} — ${p.amount.toLocaleString("ru-RU")} ₽ (${date})`
      );
    });

    lines.push(``, `Создано в приложении «Мой Доход»`);
    const text = lines.join("\n");

    if (Platform.OS === "web") {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const filename = `moy-dohod-${month.toLowerCase()}-${now.getFullYear()}.txt`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      try {
        await Share.share({ message: text });
      } catch {
        Alert.alert("Ошибка", "Не удалось экспортировать отчёт.");
      }
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
          <TouchableOpacity
            style={styles.notifRow}
            onPress={handleToggleNotif}
            activeOpacity={0.7}
          >
            <View style={[styles.notifIcon, { backgroundColor: notifEnabled ? "#EEF2FF" : Colors.surfaceAlt }]}>
              <Feather name="bell" size={18} color={notifEnabled ? Colors.primary : Colors.textMuted} />
            </View>
            <View style={styles.notifInfo}>
              <Text style={styles.notifTitle}>Напоминание о налоге</Text>
              <Text style={[styles.notifSub, notifEnabled && { color: Colors.primary }]}>
                {notifEnabled ? "Включено — 23-го и 24-го числа" : "Выключено"}
              </Text>
            </View>
            {/* Визуальный тумблер */}
            <View style={[styles.toggle, notifEnabled && styles.toggleOn]}>
              <View style={[styles.toggleThumb, notifEnabled && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Отчётность</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleExport} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: "#E8F5E9" }]}>
            <Feather name="share" size={18} color={Colors.primaryLight} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Экспорт отчёта</Text>
            <Text style={styles.menuSub}>Поделиться сводкой за месяц</Text>
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

      <Text style={styles.version}>Мой Доход v1.0 · Для самозанятых РФ</Text>
    </ScrollView>
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
  notifHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 10,
  },
  notifHintText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.primaryLight,
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
});
