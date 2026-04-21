import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { openExportUrl } from "@/lib/exportCsv";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useData, ServiceStatus } from "@/context/DataContext";
import { ServiceCard } from "@/components/ServiceCard";
import { Card } from "@/components/ui/Card";
import type { ServiceOrder } from "@/context/DataContext";

const STATUS_OPTIONS: { label: string; value: ServiceStatus }[] = [
  { label: "Pendente", value: "pendente" },
  { label: "Em Andamento", value: "em_andamento" },
  { label: "Concluído", value: "concluido" },
  { label: "Cancelado", value: "cancelado" },
];

const FILTER_OPTIONS = [
  "Todos",
  "pendente",
  "em_andamento",
  "concluido",
  "cancelado",
];

const FILTER_LABELS: Record<string, string> = {
  Todos: "Todos",
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default function AdminOrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { serviceOrders, updateServiceOrderStatus } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [filter, setFilter] = useState("Todos");
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await openExportUrl("/export/ordens.csv");
    } finally {
      setExporting(false);
    }
  }

  const filtered = serviceOrders
    .filter((o) => filter === "Todos" || o.status === filter)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  function openOrder(order: ServiceOrder) {
    setSelectedOrder(order);
    setPrice(String(order.price ?? ""));
    setCost(String(order.cost ?? ""));
    setShowModal(true);
  }

  async function changeStatus(status: ServiceStatus) {
    if (!selectedOrder) return;
    await updateServiceOrderStatus(selectedOrder.id, status);
    setShowModal(false);
    setSelectedOrder(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
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
          Ordens de Serviço
        </Text>

        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting || serviceOrders.length === 0}
          style={{
            backgroundColor: "#22c55e18",
            borderRadius: 10,
            width: 38,
            height: 38,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <Feather name="download" size={18} color="#22c55e" />
          )}
        </TouchableOpacity>
      </View>

      {/* FILTER */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setFilter(opt)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor:
                filter === opt ? colors.primary : colors.muted,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                color:
                  filter === opt ? "#fff" : colors.mutedForeground,
              }}
            >
              {FILTER_LABELS[opt]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* LIST */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <Card style={{ marginTop: 32, alignItems: "center", padding: 32 }}>
            <Feather
              name="clipboard"
              size={36}
              color={colors.mutedForeground}
            />
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              Nenhuma ordem encontrada
            </Text>
          </Card>
        ) : (
          filtered.map((order) => (
            <ServiceCard
              key={order.id}
              order={order}
              onPress={() => openOrder(order)}
            />
          ))
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                fontFamily: "Inter_700Bold",
                color: colors.foreground,
                marginBottom: 6,
              }}
            >
              Serviço: {selectedOrder?.serviceType}
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                marginBottom: 20,
              }}
            >
              Cliente: {selectedOrder?.clientName}
            </Text>

            {/* FINANCEIRO */}
            <View
              style={{
                backgroundColor: colors.muted,
                padding: 12,
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: colors.foreground, marginBottom: 6 }}>
                💰 Preço
              </Text>

              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={{
                  backgroundColor: colors.card,
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 10,
                  color: colors.foreground,
                }}
              />

              <Text style={{ color: colors.foreground, marginBottom: 6 }}>
                💸 Custo
              </Text>

              <TextInput
                value={cost}
                onChangeText={setCost}
                keyboardType="numeric"
                style={{
                  backgroundColor: colors.card,
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 10,
                  color: colors.foreground,
                }}
              />

              <Text style={{ color: colors.primary }}>
                📈 Lucro: €
                {(Number(price || 0) - Number(cost || 0)).toFixed(2)}
              </Text>
            </View>

            {/* STATUS */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                fontFamily: "Inter_600SemiBold",
                color: colors.foreground,
                marginBottom: 12,
              }}
            >
              Alterar status:
            </Text>

            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => changeStatus(opt.value)}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 8,
                  backgroundColor:
                    selectedOrder?.status === opt.value
                      ? colors.accent
                      : colors.muted,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color:
                      selectedOrder?.status === opt.value
                        ? colors.accentForeground
                        : colors.foreground,
                  }}
                >
                  {opt.label}
                </Text>

                {selectedOrder?.status === opt.value && (
                  <Feather
                    name="check"
                    size={16}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}