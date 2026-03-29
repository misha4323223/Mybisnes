import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRESETS = [5000, 10000, 25000, 50000, 100000];

export default function CalculatorScreen() {
  const { taxRate } = useApp();
  const [input, setInput] = useState("");
  const [isLegal, setIsLegal] = useState(false);
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const rate = isLegal ? 0.06 : taxRate;
  const amount = parseFloat(input.replace(",", ".")) || 0;
  const tax = Math.round(amount * rate);
  const net = amount - tax;

  const handlePreset = (val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput(String(val));
  };

  const formatNum = (n: number) =>
    n > 0 ? n.toLocaleString("ru-RU") + " ₽" : "—";

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
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Калькулятор</Text>
      <Text style={styles.subtitle}>Рассчитайте налог с любой суммы</Text>

      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, !isLegal && styles.typeBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsLegal(false);
          }}
          activeOpacity={0.75}
        >
          <Text style={[styles.typeLabel, !isLegal && styles.typeLabelActive]}>
            Физ. лицо · {(taxRate * 100).toFixed(0)}%
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, isLegal && styles.typeBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsLegal(true);
          }}
          activeOpacity={0.75}
        >
          <Text style={[styles.typeLabel, isLegal && styles.typeLabelActive]}>
            Юр. лицо · 6%
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Сумма дохода</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.bigInput}
            value={input}
            onChangeText={setInput}
            placeholder="0"
            placeholderTextColor={Colors.border}
            keyboardType="numeric"
            returnKeyType="done"
          />
          <Text style={styles.currency}>₽</Text>
          {input.length > 0 && (
            <TouchableOpacity
              onPress={() => setInput("")}
              style={styles.clearBtn}
            >
              <Feather name="x-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.presetRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p}
              style={styles.preset}
              onPress={() => handlePreset(p)}
              activeOpacity={0.7}
            >
              <Text style={styles.presetText}>
                {p >= 1000 ? `${p / 1000}к` : p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.resultsCard}>
        <View style={styles.resultRow}>
          <View style={styles.resultIcon}>
            <Feather name="percent" size={16} color={Colors.danger} />
          </View>
          <Text style={styles.resultLabel}>
            Налог НПД ({(rate * 100).toFixed(0)}%)
          </Text>
          <Text style={[styles.resultValue, { color: Colors.danger }]}>
            {formatNum(tax)}
          </Text>
        </View>

        <View style={styles.resultDivider} />

        <View style={styles.resultRow}>
          <View style={styles.resultIcon}>
            <Feather name="check-circle" size={16} color={Colors.primaryLight} />
          </View>
          <Text style={styles.resultLabel}>Чистыми на руки</Text>
          <Text style={[styles.resultValue, { color: Colors.primaryLight }]}>
            {formatNum(net)}
          </Text>
        </View>

        <View style={styles.resultDivider} />

        <View style={styles.resultRow}>
          <View style={styles.resultIcon}>
            <Feather name="dollar-sign" size={16} color={Colors.textSecondary} />
          </View>
          <Text style={styles.resultLabel}>Полная сумма</Text>
          <Text style={styles.resultValue}>{formatNum(amount)}</Text>
        </View>
      </View>

      {amount > 0 && (
        <View style={styles.hintCard}>
          <Feather name="calendar" size={14} color={Colors.primary} />
          <Text style={styles.hintText}>
            Налог {tax.toLocaleString("ru-RU")} ₽ нужно оплатить до 25-го числа
            следующего месяца через приложение «Мой налог» ФНС России.
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Ставки налога НПД</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>4%</Text> — с доходов от физических лиц
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoDot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>6%</Text> — с доходов от юридических лиц и ИП
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoDot, { backgroundColor: Colors.textMuted }]} />
          <Text style={styles.infoText}>
            Лимит дохода самозанятого — <Text style={styles.infoBold}>2.4 млн ₽/год</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, gap: 14 },
  pageTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -6,
  },
  typeRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  typeBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textMuted,
  },
  typeLabelActive: {
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  bigInput: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: Colors.textPrimary,
    padding: 0,
  },
  currency: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textMuted,
  },
  clearBtn: { padding: 4 },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  resultsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  resultLabel: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resultValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  resultDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  hintCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EBF5EE",
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#C3E0CC",
  },
  hintText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 19,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 5,
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  infoBold: {
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
});
