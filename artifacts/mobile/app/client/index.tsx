import React from "react";
import {
  Image,
  Platform,
  RefreshControl,
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
import { useData } from "@/context/DataContext";
import { Card } from "@/components/ui/Card";
import { ServiceCard } from "@/components/ServiceCard";
import { AppointmentCard } from "@/components/AppointmentCard";
import { BRAND } from "@/constants/theme";

const logo = BRAND.logo;

const QUICK_ACTIONS = [
  {
    icon: "file-text" as const,
    label: "Solicitar\nOrçamento",
    route: "/auth/request-budget",
    color: BRAND.colors.accent,
  },
  {
    icon: "plus-circle" as const,
    label: "Novo\nServiço",
    route: "/client/new-service",
    color: BRAND.colors.primary,
  },
  {
    icon: "list" as const,
    label: "Meus\nServiços",
    route: "/client/services",
    color: "#6A1B9A",
  },
  {
    icon: "calendar" as const,
    label: "Agendamentos",
    route: "/client/appointments",
    color: "#2E7D32",
  },
];

export default function ClientDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { getClientOrders, getClientBudgets, getClientAppointments, refreshData, isLoading } =
    useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const orders = getClientOrders(user?.id ?? "");
  const budgets = getClientBudgets(user?.id ?? "");
  const appointments = getClientAppointments(user?.id ?? "");

  const pendingOrders = orders.filter((o) => o.status === "pendente").length;
  const pendingBudgets = budgets.filter((b) => b.status === "aguardando").length;
  const upcomingAppointments = appointments.filter(
    (a) => a.status === "agendado" || a.status === "confirmado"
  );

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* White logo bar */}
      <View
        style={{
          backgroundColor: "#ffffff",
          paddingTop: topInset + 12,
          paddingBottom: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image source={logo} style={{ width: 50, height: 50 }} resizeMode="contain" />
          <View>
            <Text style={{ fontSize: 12, color: "#64748b", fontFamily: "Inter_400Regular" }}>
              Olá, {user?.name?.split(" ")[0] ?? "Cliente"}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", color: BRAND.colors.primary }}>
              {BRAND.company.shortName}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={async () => { await logout(); router.replace("/auth/login"); }} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={BRAND.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Blue stats bar */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{orders.length}</Text>
            <Text style={styles.headerStatLabel}>Serviços</Text>
          </View>
          <View style={[styles.headerStatDivider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{budgets.length}</Text>
            <Text style={styles.headerStatLabel}>Orçamentos</Text>
          </View>
          <View style={[styles.headerStatDivider, { backgroundColor: "rgba(255,255,255,0.3)" }]} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{appointments.length}</Text>
            <Text style={styles.headerStatLabel}>Agendamentos</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor={colors.primary} />
        }
      >
        {/* Alerts */}
        {(pendingOrders > 0 || pendingBudgets > 0) && (
          <View
            style={{
              backgroundColor: "#FFF3E0",
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderLeftWidth: 4,
              borderLeftColor: colors.orange,
            }}
          >
            <Feather name="bell" size={18} color={colors.orange} />
            <Text
              style={{
                fontSize: 13,
                color: "#E65100",
                fontFamily: "Inter_500Medium",
                flex: 1,
              }}
            >
              {pendingOrders > 0
                ? `${pendingOrders} serviço(s) pendente(s) de aprovação`
                : `${pendingBudgets} orçamento(s) aguardando resposta`}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Ações rápidas
          </Text>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[
                  styles.quickAction,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: `${action.color}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Feather name={action.icon} size={22} color={action.color} />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.foreground,
                    fontFamily: "Inter_500Medium",
                    textAlign: "center",
                    lineHeight: 15,
                  }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming appointments */}
        {upcomingAppointments.length > 0 ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Próximos agendamentos
              </Text>
              <TouchableOpacity onPress={() => router.push("/client/appointments")}>
                <Text style={{ color: colors.orange, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                  Ver todos
                </Text>
              </TouchableOpacity>
            </View>
            {upcomingAppointments.slice(0, 2).map((appt) => (
              <AppointmentCard key={appt.id} appointment={appt} />
            ))}
          </View>
        ) : null}

        {/* Recent orders */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Serviços recentes
            </Text>
            <TouchableOpacity onPress={() => router.push("/client/services")}>
              <Text style={{ color: colors.orange, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <Card>
              <View style={{ alignItems: "center", padding: 20, gap: 10 }}>
                <Feather name="inbox" size={32} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    fontFamily: "Inter_400Regular",
                    textAlign: "center",
                  }}
                >
                  Nenhum serviço solicitado ainda.
                </Text>
                <TouchableOpacity onPress={() => router.push("/client/new-service")}>
                  <Text
                    style={{ color: colors.orange, fontSize: 14, fontFamily: "Inter_600SemiBold" }}
                  >
                    Solicitar agora
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            recentOrders.map((order) => <ServiceCard key={order.id} order={order} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  brandServ: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  brandControl: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFB74D",
  },
  headerGreeting: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 14,
    justifyContent: "space-around",
  },
  headerStat: {
    alignItems: "center",
    flex: 1,
  },
  headerStatValue: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  headerStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    height: "100%",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  quickAction: {
    width: "22%",
    minWidth: 75,
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
