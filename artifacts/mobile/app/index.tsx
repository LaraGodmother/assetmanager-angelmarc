import React from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const SERVICES = [
  {
    icon: "zap" as const,
    title: "Elétrica",
    description: "Instalações, reparos e manutenção elétrica residencial e comercial",
    color: "#f59e0b",
  },
  {
    icon: "video" as const,
    title: "CFTV / Câmeras",
    description: "Instalação e monitoramento de sistemas de segurança com câmeras",
    color: "#3b82f6",
  },
  {
    icon: "wind" as const,
    title: "Refrigeração",
    description: "Instalação e manutenção de ar-condicionado e sistemas de refrigeração",
    color: "#06b6d4",
  },
  {
    icon: "cpu" as const,
    title: "Automação",
    description: "Automação residencial e comercial com tecnologia de ponta",
    color: "#8b5cf6",
  },
  {
    icon: "tool" as const,
    title: "Manutenção Geral",
    description: "Serviços gerais de manutenção predial e reparos diversos",
    color: "#22c55e",
  },
];

const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_MSG = "Olá, gostaria de solicitar um orçamento.";

function openWhatsApp() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`;
  Linking.openURL(url);
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  function handleDashboard() {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/client");
      }
    } else {
      router.push("/auth/login");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View
          style={[
            styles.hero,
            {
              paddingTop: topInset + 24,
              backgroundColor: colors.primary,
            },
          ]}
        >
          <View style={styles.heroContent}>
            <View style={styles.logoRow}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Feather name="shield" size={24} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.logoTitle}>ServiçosPRO</Text>
                <Text style={styles.logoSubtitle}>Soluções Técnicas</Text>
              </View>
            </View>

            <Text style={styles.heroTagline}>
              Serviços especializados{"\n"}para você e sua empresa
            </Text>
            <Text style={styles.heroSubtext}>
              Elétrica, CFTV, Refrigeração, Automação e Manutenção Geral
            </Text>
          </View>

          <View style={styles.heroBadges}>
            <View style={styles.badge}>
              <Feather name="check-circle" size={14} color="#ffffff" />
              <Text style={styles.badgeText}>Profissionais certificados</Text>
            </View>
            <View style={styles.badge}>
              <Feather name="clock" size={14} color="#ffffff" />
              <Text style={styles.badgeText}>Atendimento rápido</Text>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={[styles.ctaSection, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.ctaPrimary, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth/request-budget")}
            activeOpacity={0.85}
          >
            <Feather name="file-text" size={18} color="#ffffff" />
            <Text style={styles.ctaPrimaryText}>Solicitar Orçamento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ctaSecondary,
              {
                borderColor: colors.primary,
                backgroundColor: colors.background,
              },
            ]}
            onPress={handleDashboard}
            activeOpacity={0.85}
          >
            <Feather name="user" size={18} color={colors.primary} />
            <Text style={[styles.ctaSecondaryText, { color: colors.primary }]}>
              {isAuthenticated ? "Minha Área" : "Criar Conta / Entrar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Nossos Serviços
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}
          >
            Soluções completas para atender todas as suas necessidades técnicas
          </Text>

          {SERVICES.map((svc) => (
            <View
              key={svc.title}
              style={[
                styles.serviceItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.serviceIcon,
                  { backgroundColor: `${svc.color}15` },
                ]}
              >
                <Feather name={svc.icon} size={22} color={svc.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.serviceTitle, { color: colors.foreground }]}
                >
                  {svc.title}
                </Text>
                <Text
                  style={[
                    styles.serviceDescription,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {svc.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* About Section */}
        <View
          style={[
            styles.aboutSection,
            {
              backgroundColor: colors.accent,
              marginHorizontal: 20,
              borderRadius: 16,
              marginBottom: 24,
            },
          ]}
        >
          <Feather name="award" size={28} color={colors.primary} />
          <Text
            style={[
              styles.aboutTitle,
              { color: colors.foreground, marginTop: 12 },
            ]}
          >
            Por que nos escolher?
          </Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            {[
              "Mais de 10 anos de experiência no mercado",
              "Técnicos certificados e treinados",
              "Garantia em todos os serviços",
              "Atendimento em até 24 horas",
              "Orçamento gratuito e sem compromisso",
            ].map((item) => (
              <View
                key={item}
                style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
              >
                <Feather
                  name="check"
                  size={15}
                  color={colors.primary}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.foreground,
                    fontFamily: "Inter_400Regular",
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating WhatsApp Button */}
      <TouchableOpacity
        onPress={openWhatsApp}
        style={[
          styles.whatsappFab,
          { bottom: bottomInset + 16 },
        ]}
        activeOpacity={0.85}
      >
        <Feather name="message-circle" size={26} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  heroContent: {
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  logoSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  heroTagline: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    color: "#ffffff",
    fontFamily: "Inter_500Medium",
  },
  ctaSection: {
    flexDirection: "column",
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
  },
  ctaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  ctaSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  ctaSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginBottom: 20,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  serviceDescription: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  aboutSection: {
    padding: 20,
    alignItems: "flex-start",
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  whatsappFab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#25d366",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
