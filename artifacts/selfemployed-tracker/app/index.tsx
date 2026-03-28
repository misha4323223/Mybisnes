import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Colors from "@/constants/colors";

const ONBOARDING_KEY = "@onboarding_done";

export default function InitialRoute() {
  const [target, setTarget] = useState<"onboarding" | "tabs" | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setTarget(val === "true" ? "tabs" : "onboarding");
    });
  }, []);

  if (!target) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  if (target === "onboarding") {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
