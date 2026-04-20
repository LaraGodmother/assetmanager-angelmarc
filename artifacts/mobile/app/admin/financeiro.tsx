import React from "react";
import {
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useData } from "@/context/DataContext";
import { Card } from "@/components/ui/Card";

const logo = require("../../assets/images/logo.png");

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface StatRowProps {
  label: string;
  value: string | number;
  valueColor?: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
}

function StatRow({ label, value, valueColor, borderColor, textColor, mutedColor }: StatRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}
    >
      <Text style={{ fontSize: 14, color: mutedColor, fontFamily: "Inter_400Regular" }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          fontFamily: "Inter_600SemiBold",
          color: valueColor ?? textColor,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function FinanceiroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { budgets = [], serviceOrders = [], refreshData, isLoading } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const approvedBudgets = budgets.filter((b) => b.status === "aprovado");
  const pendingBudgets = budgets.filter((b) => b.status === "aguardando");
  const rejectedBudgets = budgets.filter((b) => b.status === "recusado");

  const totalRevenue = approvedBudgets.reduce((acc, b) => acc + (b.value ?? 0), 0);
  const totalCost = approvedBudgets.reduce((acc, b) => acc + (b.baseValue ?? 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin =
    approvedBudgets.length > 0
      ? approvedBudgets.reduce((acc, b) => acc + (b.profitMargin ?? 0), 0) /
        approvedBudgets.length
      : 0;

  const pendingOrders = serviceOrders.filter((o) => o.status === "pendente").length;
  const inProgressOrders = serviceOrders.filter((o) => o.status === "em_andamento").length;
  const doneOrders = serviceOrders.filter((o) => o.status === "concluido").length;
  const cancelledOrders = serviceOrders.filter((o) => o.status === "cancelado").length;

  const noData = budgets.length === 0 && serviceOrders.length === 0;

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
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
        }}
      >
        <Image source={logo} style={{ width: 44, height: 44 }} resizeMode="contain" />
        <View>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.brandServ}>Serv</Text>
            <Text style={styles.brandControl}>Control</Text>
          </View>
          <Text style={{ fontSize: 11, color: "#64748b", fontFamily: "Inter_400Regular" }}>
            Financeiro
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={colors.primary}
          />
        }
      >
        {/* Revenue hero card */}
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroLabel}>Faturamento aprovado</Text>
          <Text style={styles.heroValue}>{fmt(totalRevenue)}</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroSubLabel}>Custo total</Text>
              <Text style={styles.heroSubValue}>{fmt(totalCost)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.heroSubLabel}>Lucro total</Text>
              <Text
                style={[
                  styles.heroSubValue,
                  { color: totalProfit >= 0 ? "#A5D6A7" : "#EF9A9A" },
                ]}
              >
                {fmt(totalProfit)}
              </Text>
            </View>
          </View>
        </View>

        {/* KPI mini cards */}
        <View style={styles.cardsRow}>
          <View style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="trending-up" size={20} color={colors.orange} />
            <Text style={[styles.miniValue, { color: colors.foreground }]}>
              {avgMargin.toFixed(1)}%
            </Text>
            <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>
              Margem média
            </Text>
          </View>
          <View style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={20} color="#2E7D32" />
            <Text style={[styles.miniValue, { color: colors.foreground }]}>
              {approvedBudgets.length}
            </Text>
            <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>
              Aprovados
            </Text>
          </View>
          <View style={[styles.miniCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clipboard" size={20} color={colors.primary} />
            <Text style={[styles.miniValue, { color: colors.foreground }]}>
              {doneOrders}
            </Text>
            <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>
              Concluídas
            </Text>
          </View>
        </View>

        {/* Budget breakdown */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <View style={[styles.iconBox, { backgroundColor: "#EDE7F6" }]}>
                <Feather name="file-text" size={16} color="#6A1B9A" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Orçamentos
              </Text>
            </View>
            <StatRow label="Total de orçamentos" value={budgets.length} borderColor={colors.border} textColor={colors.foreground} mutedColor={colors.mutedForeground} />
            <StatRow label="Aguardando aprovação" value={pendingBudgets.length} valueColor={colors.orange} borderColor={colors.border} textColor={colors.foreground} mutedColor={colors.mutedForeground} />
            <StatRow label="Aprovados" value={approvedBudgets.length} valueColor="#2E7D32" borderColor={colors.border} textColor={colors.foreground} mutedColor={colors.mutedForeground} />
            <StatRow label="Recusados" value={rejectedBudgets.length} valueColor={colors.destructive} borderColor={colors.border} textColor={colors.foreground} mutedColor={colors.mutedForeground} />
          </View>
        </Card>

        {/* Orders breakdown */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
                <Feather name="clipboard" size={16} color="#2E7D32" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Ordens de Serviço
              </Text>
            </View>
            <StatRow label="Total de ordens" value={serviceOrders.length} borderColor={colors.border} textColor={colors.foreground} mutedColor={colors.mutedForeground} />
            <StatRow label="Pendentes" value={pendingOrders} valueColor={colors.orange} borderColor={colors.border} textColor={colors.foreground} mutedColor={colors.mutedForeground} />
            <StatRow label="Em andamento" value={inProgressOrders} valueColor={colors.primary} borderColor={colors.border} textColor={colors.foreground} mutedColor={colors.mutedForeground} />
            <StatRow label="Concluídas" value={doneOrders} valueColor="#2E7D32" borderColor={colors.border} textColor={colors.foreground} mutedColor={colors.mutedForeground} />
            <StatRow label="Canceladas" value={cancelledOrders} valueColor={colors.destructive} borderColor={colors.border} textColor={colors.foreground} mutedColor={colors.mutedForeground} />
          </View>
        </Card>

        {/* Empty state */}
        {noData && !isLoading && (
          <View style={{ alignItems: "center", padding: 32, gap: 12 }}>
            <Feather name="bar-chart-2" size={40} color={colors.mutedForeground} />
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Nenhum dado financeiro ainda.{"\n"}
              Os dados aparecerão conforme os orçamentos e ordens forem criados.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  brandServ: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#1565C0",
  },
  brandControl: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#F57C00",
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  heroValue: {
    fontSize: 30,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroSubLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  heroSubValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  miniCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  miniValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  miniLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
