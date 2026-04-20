import React, { useMemo } from "react";
import { View, Text, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";

export default function FinanceiroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { serviceOrders } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  // 💰 cálculos
  const totalFaturamento = useMemo(() => {
    return serviceOrders.reduce((acc, o) => acc + (o.price || 0), 0);
  }, [serviceOrders]);

  const totalCusto = useMemo(() => {
    return serviceOrders.reduce((acc, o) => acc + (o.cost || 0), 0);
  }, [serviceOrders]);

  const lucro = totalFaturamento - totalCusto;

  const concluidos = serviceOrders.filter(
    (o) => o.status === "concluido"
  ).length;

  const emAndamento = serviceOrders.filter(
    (o) => o.status === "em_andamento"
  ).length;

  const pendentes = serviceOrders.filter(
    (o) => o.status === "pendente"
  ).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
      <View
        style={{
          paddingTop: topInset + 10,
          padding: 20,
          backgroundColor: colors.card,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: colors.foreground,
          }}
        >
          💰 Dashboard Financeiro
        </Text>

        <Text style={{ color: colors.mutedForeground, marginTop: 5 }}>
          Resumo geral do seu negócio
        </Text>
      </View>

      {/* CARDS PRINCIPAIS */}
      <View style={{ padding: 16, gap: 12 }}>
        <Card style={{ padding: 16 }}>
          <Text>📊 Faturamento total</Text>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>
            € {totalFaturamento.toFixed(2)}
          </Text>
        </Card>

        <Card style={{ padding: 16 }}>
          <Text>💸 Custo total</Text>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>
            € {totalCusto.toFixed(2)}
          </Text>
        </Card>

        <Card style={{ padding: 16 }}>
          <Text>📈 Lucro líquido</Text>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: lucro >= 0 ? "green" : "red",
            }}
          >
            € {lucro.toFixed(2)}
          </Text>
        </Card>
      </View>

      {/* RESUMO OPERACIONAL */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 10,
            color: colors.foreground,
          }}
        >
          📋 Status dos serviços
        </Text>

        <Card style={{ padding: 12, marginBottom: 8 }}>
          <Text>✔ Concluídos: {concluidos}</Text>
        </Card>

        <Card style={{ padding: 12, marginBottom: 8 }}>
          <Text>⏳ Em andamento: {emAndamento}</Text>
        </Card>

        <Card style={{ padding: 12 }}>
          <Text>🕒 Pendentes: {pendentes}</Text>
        </Card>
      </View>

      {/* LISTA SIMPLES */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontWeight: "600", marginBottom: 10 }}>
          Últimos serviços
        </Text>

        {serviceOrders.slice(0, 5).map((item) => (
          <Card key={item.id} style={{ padding: 12, marginBottom: 8 }}>
            <Text style={{ fontWeight: "600" }}>
              {item.serviceType}
            </Text>
            <Text style={{ fontSize: 12, opacity: 0.7 }}>
              Cliente: {item.clientName}
            </Text>
            <Text>
              € {(item.price || 0) - (item.cost || 0)}
            </Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}