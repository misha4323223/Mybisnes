import Colors from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "briefcase" as const,
    iconBg: "#E8F5E9",
    iconColor: Colors.primary,
    title: "Учёт доходов\nв одном месте",
    text: "Добавляйте доходы от разных клиентов, помечайте оплаченные и ожидаемые — всё под рукой.",
    accent: Colors.primary,
  },
  {
    id: "2",
    icon: "percent" as const,
    iconBg: "#E3F2FD",
    iconColor: "#1565C0",
    title: "Налог считается\nавтоматически",
    text: "4% с физических лиц, 6% с юридических. Приложение само посчитает сколько нужно заплатить и когда.",
    accent: "#1565C0",
  },
  {
    id: "3",
    icon: "trending-up" as const,
    iconBg: "#FFF3E0",
    iconColor: Colors.accent,
    title: "Следите за лимитом\n2 400 000 ₽",
    text: "Самозанятые не могут зарабатывать больше 2,4 млн в год. Приложение покажет сколько осталось.",
    accent: Colors.accent,
  },
  {
    id: "4",
    icon: "bar-chart-2" as const,
    iconBg: "#F3E5F5",
    iconColor: "#6A1B9A",
    title: "Аналитика и\nотчёты",
    text: "Смотрите доходы по месяцам и источникам. Экспортируйте отчёт одной кнопкой.",
    accent: "#6A1B9A",
  },
];

const ONBOARDING_KEY = "@onboarding_done";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      finish();
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Platform.OS === "web" ? 24 : insets.top,
          paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 16,
        },
      ]}
    >
      <TouchableOpacity style={styles.skip} onPress={finish}>
        <Text style={styles.skipText}>Пропустить</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
              <Feather name={item.icon} size={56} color={item.iconColor} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, isLast && styles.btnLast]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          {isLast ? (
            <Text style={styles.btnText}>Начать</Text>
          ) : (
            <>
              <Text style={styles.btnText}>Далее</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  btnLast: {
    backgroundColor: Colors.primary,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#fff",
  },
});
