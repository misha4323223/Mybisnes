import Colors from "@/constants/colors";
import { Project } from "@/context/AppContext";
import { generateAndShareInvoicePdf } from "@/utils/generateInvoicePdf";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_H } = Dimensions.get("window");

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900) + 100;
  return `СЧ-${y}${m}${d}-${rand}`;
}

function fmt(n: number): string {
  return n.toLocaleString("ru-RU") + " ₽";
}

interface InvoiceSheetProps {
  visible: boolean;
  onClose: () => void;
  project: Project;
}

export function InvoiceSheet({ visible, onClose, project }: InvoiceSheetProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [userName, setUserName] = useState("");
  const [userInn, setUserInn] = useState("");
  const [userSbp, setUserSbp] = useState("");
  const [invoiceNumber] = useState(generateInvoiceNumber);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("@user_name"),
      AsyncStorage.getItem("@user_inn"),
      AsyncStorage.getItem("@user_sbp"),
    ]).then(([name, inn, sbp]) => {
      if (name) setUserName(name);
      if (inn) setUserInn(inn);
      if (sbp) setUserSbp(sbp);
    });
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const invoiceDate = new Date(project.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const buildInvoiceText = (): string => {
    const lines: string[] = [];
    lines.push("════════════════════════════");
    lines.push(`           СЧЁТ НА ОПЛАТУ`);
    lines.push("════════════════════════════");
    lines.push(`№ ${invoiceNumber}`);
    lines.push(`Дата: ${invoiceDate}`);
    lines.push("");
    lines.push("ИСПОЛНИТЕЛЬ:");
    lines.push(userName || "Не указано");
    if (userInn) lines.push(`ИНН: ${userInn}`);
    lines.push("Статус: Самозанятый (НПД)");
    lines.push("");
    lines.push("ЗАКАЗЧИК:");
    lines.push(project.clientName);
    if (project.clientEmail) lines.push(`Email: ${project.clientEmail}`);
    if (project.clientPhone) lines.push(`Тел: ${project.clientPhone}`);
    lines.push("");
    lines.push("────────────────────────────");
    lines.push("УСЛУГА:");
    lines.push(project.name);
    if (project.description) lines.push(`Описание: ${project.description}`);
    lines.push("────────────────────────────");
    lines.push(`ИТОГО: ${fmt(project.amount)}`);
    lines.push("────────────────────────────");
    if (userSbp) {
      lines.push("");
      lines.push("РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ:");
      lines.push(`СБП: ${userSbp}`);
    }
    lines.push("");
    lines.push("Чек будет выдан через приложение");
    lines.push("«Мой налог» после получения оплаты.");
    lines.push("════════════════════════════");
    return lines.join("\n");
  };

  const handleSendPdf = async () => {
    if (pdfLoading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPdfLoading(true);
      await generateAndShareInvoicePdf({
        invoiceNumber,
        invoiceDate,
        userName,
        userInn,
        userSbp,
        clientName: project.clientName,
        clientEmail: project.clientEmail,
        clientPhone: project.clientPhone,
        projectName: project.name,
        projectDescription: project.description,
        amount: project.amount,
      });
    } catch (e: any) {
      if (String(e).includes("dismissed") || String(e).includes("cancel")) return;
      Alert.alert("Ошибка", String(e?.message ?? e));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCopy = async () => {
    const text = buildInvoiceText();
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather name="file-text" size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Счёт на оплату</Text>
              <Text style={styles.headerSub}>{invoiceNumber}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Feather name="x" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceTopRow}>
              <Text style={styles.invoiceLabel}>СЧЁТ НА ОПЛАТУ</Text>
              <Text style={styles.invoiceNum}>{invoiceNumber}</Text>
            </View>
            <Text style={styles.invoiceDate}>{invoiceDate}</Text>

            <View style={styles.divider} />

            <View style={styles.partyRow}>
              <View style={styles.party}>
                <Text style={styles.partyLabel}>ИСПОЛНИТЕЛЬ</Text>
                <Text style={styles.partyName}>{userName || "—"}</Text>
                {userInn ? (
                  <Text style={styles.partySub}>ИНН: {userInn}</Text>
                ) : null}
                <Text style={styles.partySub}>Самозанятый (НПД)</Text>
              </View>
              <View style={styles.partySep} />
              <View style={styles.party}>
                <Text style={styles.partyLabel}>ЗАКАЗЧИК</Text>
                <Text style={styles.partyName}>{project.clientName}</Text>
                {project.clientEmail ? (
                  <Text style={styles.partySub}>{project.clientEmail}</Text>
                ) : null}
                {project.clientPhone ? (
                  <Text style={styles.partySub}>{project.clientPhone}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.serviceRow}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{project.name}</Text>
                {project.description ? (
                  <Text style={styles.serviceDesc}>{project.description}</Text>
                ) : null}
              </View>
              <Text style={styles.serviceAmount}>{fmt(project.amount)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ИТОГО К ОПЛАТЕ</Text>
              <Text style={styles.totalAmount}>{fmt(project.amount)}</Text>
            </View>

            {userSbp ? (
              <>
                <View style={styles.divider} />
                <View style={styles.sbpRow}>
                  <View style={styles.sbpIcon}>
                    <Feather name="smartphone" size={14} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.sbpLabel}>СБП — оплата по номеру</Text>
                    <Text style={styles.sbpPhone}>{userSbp}</Text>
                  </View>
                </View>
              </>
            ) : null}

            <View style={styles.divider} />
            <Text style={styles.footnote}>
              Чек будет выдан через «Мой налог» после получения оплаты
            </Text>
          </View>

          {(!userName || !userInn) && (
            <View style={styles.hintCard}>
              <Feather name="info" size={14} color={Colors.accent} />
              <Text style={styles.hintText}>
                Добавьте ИНН и реквизиты СБП в Настройках → Профиль — они будут в счёте
              </Text>
            </View>
          )}

          <View style={styles.pdfHintCard}>
            <Feather name="file-text" size={14} color="#4F46E5" />
            <Text style={styles.pdfHintText}>
              Кнопка «Отправить PDF» создаст красивый счёт-документ, который можно отправить через Telegram, WhatsApp, Email и любые другие приложения
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={handleCopy}
            activeOpacity={0.8}
            disabled={pdfLoading}
          >
            <Feather name={copied ? "check" : "copy"} size={16} color={Colors.primary} />
            <Text style={styles.copyBtnText}>{copied ? "Скопировано" : "Копировать"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, pdfLoading && styles.shareBtnLoading]}
            onPress={handleSendPdf}
            activeOpacity={0.8}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.shareBtnText}>Создаю PDF...</Text>
              </>
            ) : (
              <>
                <Feather name="send" size={16} color="#fff" />
                <Text style={styles.shareBtnText}>Отправить PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.88,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  invoiceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  invoiceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  invoiceNum: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  invoiceDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  partyRow: {
    flexDirection: "row",
    gap: 12,
  },
  party: {
    flex: 1,
    gap: 3,
  },
  partySep: {
    width: 1,
    backgroundColor: Colors.border,
  },
  partyLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  partySub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  serviceDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  serviceAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: Colors.primary + "18",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primary,
  },
  sbpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sbpIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  sbpLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  sbpPhone: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 1,
  },
  footnote: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.accent + "15",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accent + "35",
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: Colors.accent,
    lineHeight: 18,
  },
  pdfHintCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.primary + "15",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "35",
  },
  pdfHintText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary + "18",
    borderRadius: 14,
    paddingVertical: 14,
  },
  copyBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  },
  shareBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareBtnLoading: {
    opacity: 0.8,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
