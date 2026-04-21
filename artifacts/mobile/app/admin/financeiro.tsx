import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { openExportUrl } from "@/lib/exportCsv";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useData } from "@/context/DataContext";
import { Card } from "@/components/ui/Card";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function pct(v: number) {
  return `${v.toFixed(1)}%`;
}

// ─── CONSTANTS (module-level — required for React Compiler) ───────────────────
const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  transfer: "Transferência",
  "Não informado": "Não informado",
};
const PAYMENT_COLORS = ["#1565C0", "#F57C00", "#22c55e", "#8b5cf6", "#06b6d4", "#94a3b8"];
const STATUS_COLOR: Record<string, string> = {
  concluido: "#22c55e",
  em_andamento: "#3b82f6",
  pendente: "#f59e0b",
  cancelado: "#ef4444",
};
const STATUS_LABEL: Record<string, string> = {
  concluido: "Concluído",
  em_andamento: "Em andamento",
  pendente: "Pendente",
  cancelado: "Cancelado",
};
const PERIOD_LABEL: Record<string, string> = {
  mes: "Mês Atual",
  trimestre: "Trimestre",
  ano: "Ano",
  total: "Todo o período",
};

// ─── BAR CHART SIMPLES ────────────────────────────────────────────────────────
function HorizontalBar({
  label,
  value,
  max,
  color,
  valueLabel,
  colors,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  valueLabel: string;
  colors: any;
}) {
  const pctWidth = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
        <Text style={{ fontSize: 13, color: colors.foreground, fontFamily: "Inter_400Regular" }}>
          {label}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", color }}>
          {valueLabel}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
        <View
          style={{
            height: "100%",
            width: `${pctWidth}%`,
            backgroundColor: color,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  sub?: string;
  color: string;
  colors: any;
}) {
  return (
    <Card style={{ flex: 1, minWidth: "47%" }} padding={14}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: `${color}18`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={icon} size={14} color={color} />
        </View>
        <Text
          style={{
            fontSize: 11,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 19,
          fontWeight: "700",
          fontFamily: "Inter_700Bold",
          color,
          marginBottom: 2,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {sub ? (
        <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          {sub}
        </Text>
      ) : null}
    </Card>
  );
}

// ─── FILTRO DE PERÍODO ────────────────────────────────────────────────────────
type Period = "mes" | "trimestre" | "ano" | "total";
const PERIODS: { key: Period; label: string }[] = [
  { key: "mes", label: "Mês" },
  { key: "trimestre", label: "Trim." },
  { key: "ano", label: "Ano" },
  { key: "total", label: "Total" },
];

function filterByPeriod<T extends { createdAt: string }>(items: T[], period: Period): T[] {
  if (period === "total") return items;
  const now = new Date();
  const start = new Date();
  if (period === "mes") start.setDate(1);
  else if (period === "trimestre") start.setMonth(now.getMonth() - 2, 1);
  else if (period === "ano") start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return items.filter((i) => new Date(i.createdAt) >= start);
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function FinanceiroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { serviceOrders, budgets, refreshData, isLoading } = useData();
  const [period, setPeriod] = useState<Period>("mes");
  const [exporting, setExporting] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filteredOrders = useMemo(() => filterByPeriod(serviceOrders, period), [serviceOrders, period]);
  const filteredBudgets = useMemo(() => filterByPeriod(budgets, period), [budgets, period]);

  // ── KPIs Financeiros ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const approvedBudgets = filteredBudgets.filter((b) => b.status === "aprovado");
    const faturamento = approvedBudgets.reduce((s, b) => s + b.value, 0);
    const lucro = approvedBudgets.reduce((s, b) => s + b.baseValue * (b.profitMargin / 100), 0);
    const custo = faturamento - lucro;
    const totalRecebido = filteredOrders.reduce((s, o) => s + o.amountPaid, 0);
    const totalAReceber = Math.max(0, faturamento - totalRecebido);
    const ticketMedio = approvedBudgets.length > 0 ? faturamento / approvedBudgets.length : 0;
    const margemMedia =
      approvedBudgets.length > 0
        ? approvedBudgets.reduce((s, b) => s + b.profitMargin, 0) / approvedBudgets.length
        : 0;
    const recusados = filteredBudgets.filter((b) => b.status === "recusado");
    const totalRecusado = recusados.reduce((s, b) => s + b.value, 0);
    const totalBudgets = filteredBudgets.reduce((s, b) => s + b.value, 0);
    const inadimplencia = totalBudgets > 0 ? (totalRecusado / totalBudgets) * 100 : 0;
    return { faturamento, lucro, custo, totalRecebido, totalAReceber, ticketMedio, margemMedia, inadimplencia };
  }, [filteredOrders, filteredBudgets]);

  // ── Status dos Pedidos ────────────────────────────────────────────────────
  const orderStatus = useMemo(() => {
    const total = filteredOrders.length || 1;
    const concluidos = filteredOrders.filter((o) => o.status === "concluido").length;
    const emAndamento = filteredOrders.filter((o) => o.status === "em_andamento").length;
    const pendentes = filteredOrders.filter((o) => o.status === "pendente").length;
    const cancelados = filteredOrders.filter((o) => o.status === "cancelado").length;
    return { total: filteredOrders.length, concluidos, emAndamento, pendentes, cancelados };
  }, [filteredOrders]);

  // ── Status dos Orçamentos ─────────────────────────────────────────────────
  const budgetStatus = useMemo(() => {
    const aprovados = filteredBudgets.filter((b) => b.status === "aprovado").length;
    const aguardando = filteredBudgets.filter((b) => b.status === "aguardando").length;
    const recusados = filteredBudgets.filter((b) => b.status === "recusado").length;
    return { total: filteredBudgets.length, aprovados, aguardando, recusados };
  }, [filteredBudgets]);

  // ── Receita por tipo de serviço ────────────────────────────────────────────
  const byServiceType = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBudgets
      .filter((b) => b.status === "aprovado")
      .forEach((b) => {
        map[b.serviceType] = (map[b.serviceType] ?? 0) + b.value;
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredBudgets]);

  // ── Top clientes ──────────────────────────────────────────────────────────
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    filteredBudgets
      .filter((b) => b.status === "aprovado")
      .forEach((b) => {
        if (!map[b.clientId]) {
          map[b.clientId] = { name: b.clientName, total: 0, count: 0 };
        }
        map[b.clientId].total += b.value;
        map[b.clientId].count++;
      });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredBudgets]);

  // ── Formas de pagamento ───────────────────────────────────────────────────
  const paymentMethods = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const method = o.paymentMethod ?? "Não informado";
      map[method] = (map[method] ?? 0) + 1;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([method, count]) => ({
        method: PAYMENT_LABELS[method] ?? method,
        count,
        pct: (count / total) * 100,
      }));
  }, [filteredOrders]);


  // ── Pedidos recentes ──────────────────────────────────────────────────────
  const recentOrders = useMemo(
    () =>
      [...filteredOrders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [filteredOrders]
  );

  const maxServiceRevenue = byServiceType[0]?.[1] ?? 1;
  const maxClientRevenue = topClients[0]?.total ?? 1;
  const maxStatus = Math.max(orderStatus.concluidos, orderStatus.emAndamento, orderStatus.pendentes, orderStatus.cancelados, 1);


  async function handleExport() {
    setExporting(true);
    try {
      await openExportUrl(`/export/financeiro.csv?period=${period}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 12,
            backgroundColor: "#1565C0",
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Dashboard Financeiro</Text>
            <Text style={styles.headerSub}>Relatório completo do negócio</Text>
          </View>
          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            style={{
              backgroundColor: "#ffffff20",
              borderRadius: 10,
              width: 38,
              height: 38,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="download" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Filtro de período */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodBtn,
                period === p.key && styles.periodBtnActive,
              ]}
              onPress={() => setPeriod(p.key)}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  period === p.key && styles.periodBtnTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor="#1565C0" />
        }
      >
        {/* ── 1. KPIs PRINCIPAIS ─────────────────────────────────────────────── */}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Resumo Financeiro
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <KpiCard
              icon="trending-up"
              label="Faturamento aprovado"
              value={fmt(kpis.faturamento)}
              sub={`${budgetStatus.aprovados} orçamento${budgetStatus.aprovados !== 1 ? "s" : ""} aprovado${budgetStatus.aprovados !== 1 ? "s" : ""}`}
              color="#1565C0"
              colors={colors}
            />
            <KpiCard
              icon="dollar-sign"
              label="Lucro líquido"
              value={fmt(kpis.lucro)}
              sub={`Margem: ${pct(kpis.margemMedia)}`}
              color="#22c55e"
              colors={colors}
            />
            <KpiCard
              icon="layers"
              label="Custo total"
              value={fmt(kpis.custo)}
              sub="Mão de obra e materiais"
              color="#f59e0b"
              colors={colors}
            />
            <KpiCard
              icon="clock"
              label="A receber"
              value={fmt(kpis.totalAReceber)}
              sub="Saldo pendente"
              color="#F57C00"
              colors={colors}
            />
            <KpiCard
              icon="check-circle"
              label="Total recebido"
              value={fmt(kpis.totalRecebido)}
              sub="Pagamentos confirmados"
              color="#0ea5e9"
              colors={colors}
            />
            <KpiCard
              icon="shopping-bag"
              label="Ticket médio"
              value={fmt(kpis.ticketMedio)}
              sub="Por orçamento aprovado"
              color="#8b5cf6"
              colors={colors}
            />
          </View>

          {/* Inadimplência */}
          <Card style={{ marginTop: 10 }} padding={14}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="alert-triangle" size={16} color="#ef4444" />
                <Text style={{ fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
                  Inadimplência
                </Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", color: kpis.inadimplencia > 20 ? "#ef4444" : "#22c55e" }}>
                {pct(kpis.inadimplencia)}
              </Text>
            </View>
            <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: `${Math.min(kpis.inadimplencia, 100)}%`,
                  backgroundColor: kpis.inadimplencia > 20 ? "#ef4444" : "#22c55e",
                  borderRadius: 5,
                }}
              />
            </View>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 6 }}>
              {budgetStatus.recusados} orçamento{budgetStatus.recusados !== 1 ? "s" : ""} recusado{budgetStatus.recusados !== 1 ? "s" : ""} no período
            </Text>
          </Card>
        </View>

        {/* ── 2. STATUS DOS PEDIDOS ──────────────────────────────────────────── */}
        <Card padding={16}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Feather name="clipboard" size={16} color="#1565C0" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Status dos Pedidos
            </Text>
            <View style={{ marginLeft: "auto" }}>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                {orderStatus.total} total
              </Text>
            </View>
          </View>
          <HorizontalBar label="Concluídos" value={orderStatus.concluidos} max={maxStatus} color="#22c55e" valueLabel={String(orderStatus.concluidos)} colors={colors} />
          <HorizontalBar label="Em andamento" value={orderStatus.emAndamento} max={maxStatus} color="#3b82f6" valueLabel={String(orderStatus.emAndamento)} colors={colors} />
          <HorizontalBar label="Pendentes" value={orderStatus.pendentes} max={maxStatus} color="#f59e0b" valueLabel={String(orderStatus.pendentes)} colors={colors} />
          <HorizontalBar label="Cancelados" value={orderStatus.cancelados} max={maxStatus} color="#ef4444" valueLabel={String(orderStatus.cancelados)} colors={colors} />
        </Card>

        {/* ── 3. STATUS DOS ORÇAMENTOS ───────────────────────────────────────── */}
        <Card padding={16}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Feather name="file-text" size={16} color="#F57C00" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Status dos Orçamentos
            </Text>
            <View style={{ marginLeft: "auto" }}>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                {budgetStatus.total} total
              </Text>
            </View>
          </View>
          <HorizontalBar label="Aprovados" value={budgetStatus.aprovados} max={Math.max(budgetStatus.total, 1)} color="#22c55e" valueLabel={String(budgetStatus.aprovados)} colors={colors} />
          <HorizontalBar label="Aguardando" value={budgetStatus.aguardando} max={Math.max(budgetStatus.total, 1)} color="#f59e0b" valueLabel={String(budgetStatus.aguardando)} colors={colors} />
          <HorizontalBar label="Recusados" value={budgetStatus.recusados} max={Math.max(budgetStatus.total, 1)} color="#ef4444" valueLabel={String(budgetStatus.recusados)} colors={colors} />
        </Card>

        {/* ── 4. RECEITA POR TIPO DE SERVIÇO ─────────────────────────────────── */}
        {byServiceType.length > 0 && (
          <Card padding={16}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Feather name="pie-chart" size={16} color="#8b5cf6" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Receita por Tipo de Serviço
              </Text>
            </View>
            {byServiceType.map(([type, value], i) => (
              <HorizontalBar
                key={type}
                label={type}
                value={value}
                max={maxServiceRevenue}
                color={PAYMENT_COLORS[i % PAYMENT_COLORS.length]}
                valueLabel={fmt(value)}
                colors={colors}
              />
            ))}
          </Card>
        )}

        {/* ── 5. FORMAS DE PAGAMENTO ─────────────────────────────────────────── */}
        {paymentMethods.length > 0 && (
          <Card padding={16}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Feather name="credit-card" size={16} color="#0ea5e9" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Formas de Pagamento
              </Text>
            </View>

            {/* Donut visual (segmentos coloridos) */}
            <View style={{ flexDirection: "row", height: 18, borderRadius: 9, overflow: "hidden", marginBottom: 14 }}>
              {paymentMethods.map((pm, i) => (
                <View
                  key={pm.method}
                  style={{
                    flex: pm.pct,
                    backgroundColor: PAYMENT_COLORS[i % PAYMENT_COLORS.length],
                  }}
                />
              ))}
            </View>

            {paymentMethods.map((pm, i) => (
              <View key={pm.method} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }} />
                <Text style={{ flex: 1, fontSize: 13, color: colors.foreground, fontFamily: "Inter_400Regular" }}>
                  {pm.method}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
                  {pm.count}×
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", width: 42, textAlign: "right" }}>
                  {pct(pm.pct)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* ── 6. TOP CLIENTES ────────────────────────────────────────────────── */}
        {topClients.length > 0 && (
          <Card padding={16}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Feather name="users" size={16} color="#22c55e" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Ranking de Clientes
              </Text>
            </View>
            {topClients.map((c, i) => (
              <View
                key={c.name + i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 10,
                  borderBottomWidth: i < topClients.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: i === 0 ? "#F57C00" : i === 1 ? "#64748b" : i === 2 ? "#a16207" : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#fff" }}>
                    {i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.foreground }} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    {c.count} serviço{c.count !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#1565C0" }}>
                    {fmt(c.total)}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    Ticket médio: {fmt(c.total / c.count)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* ── 7. ÚLTIMOS PEDIDOS ─────────────────────────────────────────────── */}
        <Card padding={16}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Feather name="list" size={16} color="#1565C0" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Histórico Recente
            </Text>
          </View>

          {recentOrders.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 8, fontFamily: "Inter_400Regular" }}>
                Nenhum pedido neste período
              </Text>
            </View>
          ) : (
            recentOrders.map((o, i) => (
              <View
                key={o.id}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: i < recentOrders.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: STATUS_COLOR[o.status] ?? "#94a3b8",
                    flexShrink: 0,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.foreground }} numberOfLines={1}>
                    {o.serviceType}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    {o.clientName}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View
                    style={{
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 8,
                      backgroundColor: `${STATUS_COLOR[o.status] ?? "#94a3b8"}18`,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: STATUS_COLOR[o.status] ?? "#94a3b8" }}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </Text>
                  </View>
                  {o.price > 0 && (
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                      {fmt(o.price)}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>

        {/* ── 8. ORÇAMENTOS RECENTES ─────────────────────────────────────────── */}
        <Card padding={16}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Feather name="file-text" size={16} color="#F57C00" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Orçamentos Recentes
            </Text>
          </View>

          {filteredBudgets.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 8, fontFamily: "Inter_400Regular" }}>
                Nenhum orçamento neste período
              </Text>
            </View>
          ) : (
            [...filteredBudgets]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((b, i, arr) => {
                const bColor = b.status === "aprovado" ? "#22c55e" : b.status === "recusado" ? "#ef4444" : "#f59e0b";
                const bLabel = b.status === "aprovado" ? "Aprovado" : b.status === "recusado" ? "Recusado" : "Aguardando";
                return (
                  <View
                    key={b.id}
                    style={{
                      paddingVertical: 10,
                      borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: bColor, flexShrink: 0 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.foreground }} numberOfLines={1}>
                        {b.serviceType}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                        {b.clientName}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground }}>
                        {fmt(b.value)}
                      </Text>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: `${bColor}18`, marginTop: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: bColor }}>
                          {bLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "#ffffff99",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  periodBtnActive: {
    backgroundColor: "#fff",
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.8)",
  },
  periodBtnTextActive: {
    color: "#1565C0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
