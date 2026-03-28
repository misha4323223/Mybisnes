import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
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
  const { projects, paidIncome, unpaidIncome, estimatedTax } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [name, setName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem("@user_name").then((v) => {
      if (v) setName(v);
      setNameLoaded(true);
    });
  }, []);

  const saveName = async () => {
    await AsyncStorage.setItem("@user_name", name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Сохранено");
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
