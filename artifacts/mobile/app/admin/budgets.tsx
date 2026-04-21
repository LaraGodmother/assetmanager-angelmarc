import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Linking,
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
import { BRAND } from "@/constants/theme";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useData, BudgetStatus, Budget } from "@/context/DataContext";
import { BudgetCard } from "@/components/BudgetCard";
import { Card } from "@/components/ui/Card";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? window.location.origin + "/api"
    : "https://0c4f309c-6b3c-4e2f-96e4-8aadfecef50e-00-3gjzlqu4remhq.picard.replit.dev/api");

function buildPdfUrl(budgetId: string) {
  return API_BASE.replace(/\/api$/, "") + "/api/orcamentos/" + budgetId + "/pdf";
}

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
  const { budgets, updateBudgetStatus, saveBudgetEdits } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState("Todos");
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [valueInput, setValueInput] = useState("");
  const [notes, setNotes] = useState("");
  const [exporting, setExporting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  async function handleExport() {
    setExporting(true);
    try {
      await openExportUrl("/export/orcamentos.csv");
    } finally {
      setExporting(false);
    }
  }

  async function handleGeneratePdf(budget: Budget) {
    setGeneratingPdf(true);
    try {
      const url = buildPdfUrl(budget.id);
      await Linking.openURL(url);
    } finally {
      setGeneratingPdf(false);
    }
  }

  async function handleShareWhatsApp(budget: Budget) {
    const pdfUrl = buildPdfUrl(budget.id);
    const msg = encodeURIComponent(
      `Olá ${budget.clientName}! Segue o orçamento Nº ${budget.id.padStart(4, "0")} da ${BRAND.company.name}.\n\nAcesse para visualizar:\n${pdfUrl}`
    );
    const phone = budget.clientPhone?.replace(/\D/g, "");
    const waUrl = phone
      ? `https://wa.me/55${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    await Linking.openURL(waUrl);
  }

  const filtered = budgets
    .filter((b) => filter === "Todos" || b.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function openBudget(budget: Budget) {
    setSelectedBudget(budget);
    setValueInput(budget.value ? String(budget.value) : "");
    setNotes(budget.observations ?? "");
    setSelectedPayments(
      budget.paymentConditions ? budget.paymentConditions.split(",").filter(Boolean) : []
    );
    setShowModal(true);
  }

  function parsedValue() {
    return valueInput ? parseFloat(valueInput.replace(",", ".")) : undefined;
  }

  async function handleSave() {
    if (!selectedBudget) return;
    setSaving(true);
    try {
      await saveBudgetEdits(
        selectedBudget.id,
        parsedValue(),
        notes || undefined,
        selectedPayments.length > 0 ? selectedPayments.join(",") : ""
      );
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: BudgetStatus) {
    if (!selectedBudget) return;
    setSaving(true);
    try {
      await updateBudgetStatus(selectedBudget.id, status, parsedValue(), notes || undefined);
      setShowModal(false);
      setSelectedBudget(null);
    } finally {
      setSaving(false);
    }
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
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Backdrop — only closes on direct tap of the dark area */}
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
            onPress={() => { Keyboard.dismiss(); setShowModal(false); }}
          />

          {/* Modal content — stops touches from reaching the backdrop */}
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            >
              {/* Header row with close button */}
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      fontFamily: "Inter_700Bold",
                      color: colors.foreground,
                      marginBottom: 3,
                    }}
                  >
                    {selectedBudget?.serviceType}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    Cliente: {selectedBudget?.clientName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => { Keyboard.dismiss(); setShowModal(false); }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.muted,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 8,
                  }}
                >
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {/* Status badge */}
              {selectedBudget && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginRight: 8 }}>
                    Status atual:
                  </Text>
                  <View style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor:
                      selectedBudget.status === "aprovado" ? "#dcfce7" :
                      selectedBudget.status === "recusado" ? "#fee2e2" : "#FFF3E0",
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: "Inter_600SemiBold",
                      color:
                        selectedBudget.status === "aprovado" ? "#166534" :
                        selectedBudget.status === "recusado" ? "#991b1b" : "#B45309",
                    }}>
                      {selectedBudget.status === "aprovado" ? "Aprovado" :
                       selectedBudget.status === "recusado" ? "Recusado" : "Aguardando"}
                    </Text>
                  </View>
                </View>
              )}

              <Text
                style={{
                  fontSize: 13,
                  color: colors.foreground,
                  fontFamily: "Inter_400Regular",
                  lineHeight: 18,
                  marginBottom: 14,
                }}
              >
                {selectedBudget?.description}
              </Text>

              {/* PDF + WhatsApp row */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
                <TouchableOpacity
                  onPress={() => selectedBudget && handleGeneratePdf(selectedBudget)}
                  disabled={generatingPdf}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: "#EFF6FF",
                    borderWidth: 1.5,
                    borderColor: "#BFDBFE",
                  }}
                >
                  {generatingPdf ? (
                    <ActivityIndicator size="small" color="#1565C0" />
                  ) : (
                    <Feather name="file-text" size={16} color="#1565C0" />
                  )}
                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1565C0" }}>
                    Gerar PDF
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => selectedBudget && handleShareWhatsApp(selectedBudget)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: "#F0FDF4",
                    borderWidth: 1.5,
                    borderColor: "#BBF7D0",
                  }}
                >
                  <Feather name="message-circle" size={16} color="#16A34A" />
                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#16A34A" }}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Valor */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: "500",
                    fontFamily: "Inter_500Medium",
                    color: colors.mutedForeground,
                  }}
                >
                  Valor (R$)
                </Text>
              </View>
              <TextInput
                value={valueInput}
                onChangeText={setValueInput}
                placeholder="Ex: 1500.00"
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
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

              {/* Condições de Pagamento */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  fontFamily: "Inter_500Medium",
                  color: colors.mutedForeground,
                  marginBottom: 8,
                }}
              >
                Condições de Pagamento
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {(
                  [
                    { key: "pix", label: "PIX", icon: "zap" },
                    { key: "debit", label: "Cartão de Débito", icon: "credit-card" },
                    { key: "credit", label: "Parcel. Crédito", icon: "layers" },
                  ] as const
                ).map(({ key, label, icon }) => {
                  const active = selectedPayments.includes(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() =>
                        setSelectedPayments((prev) =>
                          active ? prev.filter((k) => k !== key) : [...prev, key]
                        )
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderRadius: 24,
                        borderWidth: 1.5,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? "#EFF6FF" : colors.muted,
                      }}
                    >
                      <Feather name={icon} size={13} color={active ? colors.primary : colors.mutedForeground} />
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
                          color: active ? colors.primary : colors.mutedForeground,
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Observações / Itens */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: "500",
                    fontFamily: "Inter_500Medium",
                    color: colors.mutedForeground,
                  }}
                >
                  Itens / Observações
                </Text>
                <TouchableOpacity
                  onPress={() => Keyboard.dismiss()}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Feather name="check" size={13} color="#ffffff" />
                  <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#ffffff" }}>
                    OK
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Format hint */}
              <View style={{
                backgroundColor: "#EFF6FF",
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 6,
              }}>
                <Feather name="info" size={13} color="#1565C0" style={{ marginTop: 1 }} />
                <Text style={{ fontSize: 11, color: "#1565C0", fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 }}>
                  {"Cada linha = 1 item no PDF.\nExemplo:\nServiço instalação R$500\n2 câmeras Intelbras R$500\nCabos e conectores R$150"}
                </Text>
              </View>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={"Serviço instalação R$500\n2 câmeras Intelbras R$500\nCabos e conectores R$150"}
                multiline
                numberOfLines={6}
                blurOnSubmit={false}
                style={{
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 20,
                  color: colors.foreground,
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  backgroundColor: colors.muted,
                  minHeight: 130,
                  textAlignVertical: "top",
                  lineHeight: 20,
                }}
                placeholderTextColor={colors.mutedForeground}
              />

              {/* Save edits button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: saveFeedback ? "#dcfce7" : colors.primary,
                  marginBottom: 12,
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : saveFeedback ? (
                  <Feather name="check-circle" size={17} color="#166534" />
                ) : (
                  <Feather name="save" size={17} color="#fff" />
                )}
                <Text style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                  color: saveFeedback ? "#166534" : "#fff",
                }}>
                  {saveFeedback ? "Salvo!" : "Salvar Alterações"}
                </Text>
              </TouchableOpacity>

              {/* Separator */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                  Alterar status
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>

              {/* Status buttons */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => updateStatus("aguardando")}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: "#FFF3E0",
                    alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: "#FED7AA",
                  }}
                >
                  <Feather name="clock" size={14} color="#B45309" style={{ marginBottom: 3 }} />
                  <Text style={{ color: "#B45309", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                    Pendente
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateStatus("aprovado")}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: "#dcfce7",
                    alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: "#BBF7D0",
                  }}
                >
                  <Feather name="check-circle" size={14} color="#166534" style={{ marginBottom: 3 }} />
                  <Text style={{ color: "#166534", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                    Aprovar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateStatus("recusado")}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: "#fee2e2",
                    alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: "#FECACA",
                  }}
                >
                  <Feather name="x-circle" size={14} color="#991b1b" style={{ marginBottom: 3 }} />
                  <Text style={{ color: "#991b1b", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                    Recusar
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
