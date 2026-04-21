import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { openExportUrl } from "@/lib/exportCsv";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useData, BudgetStatus, Budget } from "@/context/DataContext";
import { BudgetCard } from "@/components/BudgetCard";
import { Card } from "@/components/ui/Card";

const FILTER_OPTIONS = ["Todos", "aguardando", "aprovado", "recusado"];
const FILTER_LABELS: Record<string, string> = {
  Todos: "Todos",
  aguardando: "Aguardando",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export default function AdminBudgetsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { budgets, updateBudgetStatus } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState("Todos");
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [valueInput, setValueInput] = useState("");
  const [notes, setNotes] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await openExportUrl("/export/orcamentos.csv");
    } finally {
      setExporting(false);
    }
  }

  const filtered = budgets
    .filter((b) => filter === "Todos" || b.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function openBudget(budget: Budget) {
    setSelectedBudget(budget);
    setValueInput(budget.value ? String(budget.value) : "");
    setNotes(budget.notes ?? "");
    setShowModal(true);
  }

  async function updateStatus(status: BudgetStatus) {
    if (!selectedBudget) return;
    const value = valueInput ? parseFloat(valueInput.replace(",", ".")) : undefined;
    await updateBudgetStatus(selectedBudget.id, status, value, notes || undefined);
    setShowModal(false);
    setSelectedBudget(null);
  }

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
          Orçamentos
        </Text>
        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting || budgets.length === 0}
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setFilter(opt)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor: filter === opt ? colors.primary : colors.muted,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                color: filter === opt ? "#ffffff" : colors.mutedForeground,
              }}
            >
              {FILTER_LABELS[opt]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <Card style={{ marginTop: 32, alignItems: "center", padding: 32 }}>
            <Feather name="file-text" size={36} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                marginTop: 12,
                textAlign: "center",
              }}
            >
              Nenhum orçamento encontrado
            </Text>
          </Card>
        ) : (
          filtered.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} onPress={() => openBudget(budget)} />
          ))
        )}
      </ScrollView>

      {/* Budget Detail Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
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
                marginBottom: 4,
              }}
            >
              {selectedBudget?.serviceType}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                marginBottom: 4,
              }}
            >
              Cliente: {selectedBudget?.clientName}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
                lineHeight: 18,
                marginBottom: 16,
              }}
            >
              {selectedBudget?.description}
            </Text>

            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                fontFamily: "Inter_500Medium",
                color: colors.mutedForeground,
                marginBottom: 6,
              }}
            >
              Valor (R$)
            </Text>
            <TextInput
              value={valueInput}
              onChangeText={setValueInput}
              placeholder="Ex: 1500.00"
              keyboardType="numeric"
              style={{
                height: 48,
                borderWidth: 1.5,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                marginBottom: 12,
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
                fontSize: 15,
                backgroundColor: colors.muted,
              }}
              placeholderTextColor={colors.mutedForeground}
            />

            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                fontFamily: "Inter_500Medium",
                color: colors.mutedForeground,
                marginBottom: 6,
              }}
            >
              Observações
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Detalhes do orçamento..."
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1.5,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                color: colors.foreground,
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                backgroundColor: colors.muted,
                height: 80,
                textAlignVertical: "top",
              }}
              placeholderTextColor={colors.mutedForeground}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => updateStatus("recusado")}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: "#fee2e2",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#991b1b",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  Recusar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateStatus("aprovado")}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: "#dcfce7",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#166534",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                  }}
                >
                  Aprovar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
