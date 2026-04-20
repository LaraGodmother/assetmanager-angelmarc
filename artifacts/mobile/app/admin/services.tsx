import React from "react";
import {
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
import { useData } from "@/context/DataContext";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

const SERVICE_ICONS: Record<string, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  Elétrica: { icon: "zap", color: "#f59e0b" },
  "CFTV / Câmeras": { icon: "video", color: "#3b82f6" },
  Refrigeração: { icon: "wind", color: "#06b6d4" },
  Automação: { icon: "cpu", color: "#8b5cf6" },
  "Manutenção Geral": { icon: "tool", color: "#22c55e" },
};

export default function AdminServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { serviceOrders } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const byType: Record<string, { count: number; pending: number; done: number }> = {};
  serviceOrders.forEach((o) => {
    if (!byType[o.serviceType]) {
      byType[o.serviceType] = { count: 0, pending: 0, done: 0 };
    }
    byType[o.serviceType].count++;
    if (o.status === "pendente" || o.status === "em_andamento") {
      byType[o.serviceType].pending++;
    }
    if (o.status === "concluido") {
      byType[o.serviceType].done++;
    }
  });

  const entries = Object.entries(byType).sort((a, b) => b[1].count - a[1].count);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: topInset + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            fontFamily: "Inter_700Bold",
            color: colors.foreground,
            flex: 1,
          }}
        >
          Gestão de Serviços
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Total", value: serviceOrders.length, color: colors.primary },
            {
              label: "Em aberto",
              value: serviceOrders.filter((o) => o.status !== "concluido" && o.status !== "cancelado").length,
              color: "#f59e0b",
            },
            {
              label: "Concluídos",
              value: serviceOrders.filter((o) => o.status === "concluido").length,
              color: "#22c55e",
            },
          ].map((item) => (
            <Card key={item.label} style={{ flex: 1 }} padding={12}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  fontFamily: "Inter_700Bold",
                  color: item.color,
                  marginBottom: 2,
                }}
              >
                {item.value}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {item.label}
              </Text>
            </Card>
          ))}
        </View>

        {/* By service type */}
        <View>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              fontFamily: "Inter_700Bold",
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Por tipo de serviço
          </Text>

          {entries.length === 0 ? (
            <Card style={{ alignItems: "center", padding: 24 }}>
              <Feather name="tool" size={32} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  marginTop: 10,
                  fontFamily: "Inter_400Regular",
                }}
              >
                Nenhum serviço registrado
              </Text>
            </Card>
          ) : (
            entries.map(([type, stats]) => {
              const info = SERVICE_ICONS[type] ?? { icon: "tool" as const, color: colors.primary };
              return (
                <Card key={type} style={{ marginBottom: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        backgroundColor: `${info.color}15`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather name={info.icon} size={22} color={info.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          fontFamily: "Inter_600SemiBold",
                          color: colors.foreground,
                          marginBottom: 2,
                        }}
                      >
                        {type}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.mutedForeground,
                          fontFamily: "Inter_400Regular",
                        }}
                      >
                        {stats.count} pedido{stats.count !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      paddingTop: 10,
                    }}
                  >
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          fontFamily: "Inter_700Bold",
                          color: "#f59e0b",
                        }}
                      >
                        {stats.pending}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.mutedForeground,
                          fontFamily: "Inter_400Regular",
                        }}
                      >
                        Em aberto
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 1,
                        backgroundColor: colors.border,
                        height: "100%",
                      }}
                    />
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          fontFamily: "Inter_700Bold",
                          color: "#22c55e",
                        }}
                      >
                        {stats.done}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.mutedForeground,
                          fontFamily: "Inter_400Regular",
                        }}
                      >
                        Concluídos
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
