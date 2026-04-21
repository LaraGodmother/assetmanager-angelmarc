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
import { BudgetCard } from "@/components/BudgetCard";
import { BRAND } from "@/constants/theme";

const logo = BRAND.logo;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ADMIN_MENU = [
  { icon: "users" as const, label: "Clientes", route: "/admin/clients", color: "#1565C0" },
  { icon: "tool" as const, label: "Serviços", route: "/admin/services", color: "#F57C00" },
  { icon: "file-text" as const, label: "Orçamentos", route: "/admin/budgets", color: "#6A1B9A" },
  { icon: "clipboard" as const, label: "Ordens", route: "/admin/orders", color: "#2E7D32" },
  { icon: "calendar" as const, label: "Calendário", route: "/admin/calendar", color: "#C62828" },
  { icon: "dollar-sign" as const, label: "Financeiro", route: "/admin/financeiro", color: "#00796B" },
  { icon: "settings" as const, label: "Configurações", route: "/admin/perfil", color: "#455A64" },
];

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { serviceOrders = [], budgets = [], appointments = [], refreshData, isLoading } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const pendingOrders = serviceOrders.filter((o) => o.status === "pendente").length;
  const inProgressOrders = serviceOrders.filter((o) => o.status === "em_andamento").length;
  const pendingBudgets = budgets.filter((b) => b.status === "aguardando").length;
  const upcomingAppts = appointments.filter(
    (a) => a.status === "agendado" || a.status === "confirmado"
  ).length;

  const completedOrders = serviceOrders.filter((o) => o.status === "concluido");
  const approvedBudgets = budgets.filter((b) => b.status === "aprovado" && b.value);
  const totalRevenue = approvedBudgets.reduce((sum, b) => sum + (b.value ?? 0), 0);

  const recentOrders = [...serviceOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentBudgets = [...budgets]
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
            <Text style={{ fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold", color: BRAND.colors.primary }}>
              {BRAND.company.shortName}
            </Text>
            <Text style={{ fontSize: 11, color: "#64748b", fontFamily: "Inter_400Regular" }}>
              Painel Admin
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <TouchableOpacity onPress={() => router.push("/admin/perfil")} style={styles.logoutBtn}>
            <Feather name="user" size={20} color={BRAND.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => { await logout(); router.replace("/auth/login"); }} style={styles.logoutBtn}>
            <Feather name="log-out" size={20} color={BRAND.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Blue stats bar */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        {/* Revenue card */}
        <View style={styles.revenueCard}>
          <View>
            <Text style={styles.revenueLabel}>Faturamento aprovado</Text>
            <Text style={styles.revenueValue}>{formatCurrency(totalRevenue)}</Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: "rgba(255,255,255,0.3)",
              height: "100%",
              marginHorizontal: 16,
            }}
          />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.revenueLabel}>Concluídos</Text>
            <Text style={styles.revenueValue}>{completedOrders.length}</Text>
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
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Pendentes", value: pendingOrders, color: "#F57C00", icon: "clock" as const },
            { label: "Em andamento", value: inProgressOrders, color: "#1565C0", icon: "activity" as const },
            { label: "Orçamentos", value: pendingBudgets, color: "#6A1B9A", icon: "file-text" as const },
            { label: "Agendamentos", value: upcomingAppts, color: "#2E7D32", icon: "calendar" as const },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name={stat.icon} size={18} color={stat.color} />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  fontFamily: "Inter_700Bold",
                  color: colors.foreground,
                  marginTop: 4,
                }}
              >
                {stat.value}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                  textAlign: "center",
                  marginTop: 2,
                }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Admin Menu */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Gerenciamento
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 8 }}
          >
            {ADMIN_MENU.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: `${item.color}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Feather name={item.icon} size={24} color={item.color} />
                </View>
                <Text
                  style={{ fontSize: 12, color: colors.foreground, fontFamily: "Inter_600SemiBold" }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent orders */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Pedidos recentes
            </Text>
            <TouchableOpacity onPress={() => router.push("/admin/orders")}>
              <Text style={{ color: colors.orange, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>
          {recentOrders.map((order) => (
            <ServiceCard key={order.id} order={order} />
          ))}
        </View>

        {/* Recent budgets */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Orçamentos recentes
            </Text>
            <TouchableOpacity onPress={() => router.push("/admin/budgets")}>
              <Text style={{ color: colors.orange, fontSize: 13, fontFamily: "Inter_500Medium" }}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>
          {recentBudgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  headerRole: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
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
  menuItem: {
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 90,
  },
});
