import Colors from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INFO_SLIDES = [
  {
    id: "1",
    icon: "briefcase" as const,
    iconBg: Colors.primary + "18",
    iconColor: Colors.primary,
    title: "Учёт доходов\nв одном месте",
    text: "Добавляйте доходы от разных клиентов, помечайте оплаченные и ожидаемые — всё под рукой.",
  },
  {
    id: "2",
    icon: "percent" as const,
    iconBg: Colors.primary + "15",
    iconColor: Colors.primaryLight,
    title: "Налог считается\nавтоматически",
    text: "4% с физических лиц, 6% с юридических. Приложение само посчитает сколько нужно заплатить.",
  },
  {
    id: "3",
    icon: "trending-up" as const,
    iconBg: Colors.accent + "18",
    iconColor: Colors.accent,
    title: "Следите за лимитом\n2 400 000 ₽",
    text: "Самозанятые не могут зарабатывать больше 2,4 млн в год. Приложение покажет сколько осталось.",
  },
  {
    id: "4",
    icon: "bar-chart-2" as const,
    iconBg: Colors.accent + "15",
    iconColor: Colors.accent,
    title: "Аналитика и\nотчёты",
    text: "Смотрите доходы по месяцам и источникам. Экспортируйте отчёт одной кнопкой.",
  },
];

const ONBOARDING_KEY = "@onboarding_done";
const TAX_RATE_KEYS = [
  { label: "4% — физ. лица", value: 0.04, desc: "Доходы от граждан" },
  { label: "6% — юр. лица", value: 0.06, desc: "Доходы от организаций и ИП" },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [userName, setUserName] = useState("");
  const [selectedRate, setSelectedRate] = useState(0.04);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isSetupSlide = activeIndex === INFO_SLIDES.length;
  const isLast = isSetupSlide;
  const slide = INFO_SLIDES[activeIndex];

  const animateTransition = (cb: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    cb();
  };

  const finish = async () => {
    if (userName.trim()) {
      await AsyncStorage.setItem("@user_name", userName.trim());
    }
    await AsyncStorage.setItem("@selfemployed_tax_rate", String(selectedRate));
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  };

  const goNext = () => {
    if (!isSetupSlide) {
      animateTransition(() => setActiveIndex(activeIndex + 1));
    } else {
      finish();
    }
  };

  const totalSlides = INFO_SLIDES.length + 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.root,
          {
            paddingTop: Platform.OS === "web" ? 24 : insets.top,
            paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 16,
          },
        ]}
      >
        {!isSetupSlide && (
          <TouchableOpacity style={styles.skip} onPress={finish}>
            <Text style={styles.skipText}>Пропустить</Text>
          </TouchableOpacity>
        )}

        {!isSetupSlide ? (
          <Animated.View style={[styles.slide, { opacity: fadeAnim }]}>
            <View style={[styles.iconCircle, { backgroundColor: slide!.iconBg }]}>
              <Feather name={slide!.icon} size={56} color={slide!.iconColor} />
            </View>
            <Text style={styles.title}>{slide!.title}</Text>
            <Text style={styles.text}>{slide!.text}</Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.setupSlide, { opacity: fadeAnim }]}>
            <View style={styles.setupIconCircle}>
              <Feather name="user-check" size={44} color={Colors.primary} />
            </View>
            <Text style={styles.setupTitle}>Немного о вас</Text>
            <Text style={styles.setupSub}>Это поможет персонализировать приложение</Text>

            <View style={styles.setupCard}>
              <Text style={styles.setupLabel}>Ваше имя (необязательно)</Text>
              <TextInput
                style={styles.setupInput}
                placeholder="Например: Алексей"
                placeholderTextColor={Colors.textMuted}
                value={userName}
                onChangeText={setUserName}
                returnKeyType="done"
                autoFocus={false}
              />
            </View>

            <View style={styles.setupCard}>
              <Text style={styles.setupLabel}>Ваша основная ставка налога</Text>
              <Text style={styles.setupHint}>Можно изменить позже в настройках</Text>
              <View style={styles.rateRow}>
                {TAX_RATE_KEYS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.rateBtn, selectedRate === r.value && styles.rateBtnActive]}
                    onPress={() => setSelectedRate(r.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.rateBtnLabel, selectedRate === r.value && styles.rateBtnLabelActive]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.rateBtnDesc, selectedRate === r.value && styles.rateBtnDescActive]}>
                      {r.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.btn}
            onPress={goNext}
            activeOpacity={0.85}
          >
            {isLast ? (
              <Text style={styles.btnText}>Начать работу</Text>
            ) : (
              <>
                <Text style={styles.btnText}>Далее</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skip: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textMuted,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 28,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 36,
  },
  text: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  setupSlide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 16,
  },
  setupIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
  },
  setupTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  setupSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: -8,
    marginBottom: 4,
  },
  setupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  setupLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  setupHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -4,
  },
  setupInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  rateRow: {
    flexDirection: "row",
    gap: 10,
  },
  rateBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 3,
  },
  rateBtnActive: {
    backgroundColor: Colors.primary + "12",
    borderColor: Colors.primary,
  },
  rateBtnLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rateBtnLabelActive: {
    color: Colors.primary,
  },
  rateBtnDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  rateBtnDescActive: {
    color: Colors.primary + "BB",
  },
  bottom: {
    paddingHorizontal: 24,
    gap: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#fff",
  },
});
