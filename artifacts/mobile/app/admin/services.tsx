import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useData, type Service } from "@/context/DataContext";
import { Card } from "@/components/ui/Card";

// ─── ÍCONES POR NOME DE SERVIÇO ───────────────────────────────────────────────
function getServiceIcon(name: string): {
  icon: keyof typeof Feather.glyphMap;
  color: string;
} {
  const n = name.toLowerCase();
  if (n.includes("elétr") || n.includes("eletr")) return { icon: "zap", color: "#f59e0b" };
  if (n.includes("cftv") || n.includes("câmera") || n.includes("camera") || n.includes("segurança"))
    return { icon: "video", color: "#3b82f6" };
  if (n.includes("refrig") || n.includes("ar cond") || n.includes("clima"))
    return { icon: "wind", color: "#06b6d4" };
  if (n.includes("autom") || n.includes("smart") || n.includes("sensor"))
    return { icon: "cpu", color: "#8b5cf6" };
  if (n.includes("manut") || n.includes("reparo") || n.includes("geral"))
    return { icon: "tool", color: "#22c55e" };
  if (n.includes("hidrá") || n.includes("hidra") || n.includes("encanamento"))
    return { icon: "droplet", color: "#0ea5e9" };
  if (n.includes("pintura") || n.includes("paint"))
    return { icon: "edit-2", color: "#f97316" };
  if (n.includes("rede") || n.includes("internet") || n.includes("wifi"))
    return { icon: "wifi", color: "#6366f1" };
  return { icon: "settings", color: "#64748b" };
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── FORMULÁRIO ───────────────────────────────────────────────────────────────
interface ServiceForm {
  name: string;
  description: string;
  basePrice: string;
  profitMargin: string;
  rules: string;
  active: boolean;
}

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  basePrice: "",
  profitMargin: "",
  rules: "",
  active: true,
};

function serviceToForm(s: Service): ServiceForm {
  return {
    name: s.name,
    description: s.description,
    basePrice: s.basePrice > 0 ? String(s.basePrice) : "",
    profitMargin: s.profitMargin > 0 ? String(s.profitMargin) : "",
    rules: s.rules ?? "",
    active: s.active,
  };
}

function calcProfit(basePriceStr: string, marginStr: string) {
  const base = parseFloat(basePriceStr.replace(",", "."));
  const margin = parseFloat(marginStr.replace(",", "."));
  if (isNaN(base) || isNaN(margin) || base <= 0 || margin <= 0) return null;
  const profit = base * (margin / 100);
  const salePrice = base + profit;
  return { profit, salePrice, margin };
}

// ─── MODAL DE SERVIÇO ─────────────────────────────────────────────────────────
interface ServiceModalProps {
  visible: boolean;
  editing: Service | null;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    basePrice: number;
    profitMargin?: number;
    rules?: string;
    active: boolean;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      basePrice: number;
      profitMargin: number;
      rules: string;
      active: boolean;
    }>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  colors: any;
}

function ServiceModal({
  visible,
  editing,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  colors,
}: ServiceModalProps) {
  const [form, setForm] = useState<ServiceForm>(
    editing ? serviceToForm(editing) : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setForm(editing ? serviceToForm(editing) : EMPTY_FORM);
  }, [editing, visible]);

  const set = (field: keyof ServiceForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert("Campo obrigatório", "Informe o nome do serviço.");
      return;
    }
    if (!form.description.trim()) {
      Alert.alert("Campo obrigatório", "Informe a descrição do serviço.");
      return;
    }
    const basePrice = parseFloat(form.basePrice.replace(",", "."));
    if (isNaN(basePrice) || basePrice < 0) {
      Alert.alert("Valor inválido", "Informe um valor base válido (ex: 150,00).");
      return;
    }
    const profitMarginNum =
      form.profitMargin.trim()
        ? parseFloat(form.profitMargin.replace(",", "."))
        : 0;
    if (isNaN(profitMarginNum) || profitMarginNum < 0 || profitMarginNum > 999) {
      Alert.alert("Margem inválida", "Informe uma margem de lucro válida (ex: 30).");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          basePrice,
          profitMargin: profitMarginNum,
          rules: form.rules.trim() || undefined,
          active: form.active,
        } as any);
      } else {
        await onCreate({
          name: form.name.trim(),
          description: form.description.trim(),
          basePrice,
          profitMargin: profitMarginNum,
          rules: form.rules.trim() || undefined,
          active: form.active,
        });
      }
      onClose();
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!editing) return;
    Alert.alert(
      "Excluir serviço",
      `Tem certeza que deseja excluir "${editing.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await onDelete(editing.id);
              onClose();
            } catch (e: any) {
              Alert.alert("Erro", e.message ?? "Não foi possível excluir.");
            }
          },
        },
      ]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Feather name="x" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editing ? "Editar Serviço" : "Novo Serviço"}
              </Text>
              {editing ? (
                <TouchableOpacity onPress={handleDelete} style={styles.modalClose}>
                  <Feather name="trash-2" size={18} color="#ef4444" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 36 }} />
              )}
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 20, gap: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Nome */}
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Nome do serviço <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="Ex: Instalação Elétrica"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.name}
                  onChangeText={(v) => set("name", v)}
                  maxLength={80}
                />
              </View>

              {/* Descrição */}
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Descrição <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textarea,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="Descreva o serviço oferecido..."
                  placeholderTextColor={colors.mutedForeground}
                  value={form.description}
                  onChangeText={(v) => set("description", v)}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>

              {/* Preço base */}
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Valor base (R$) <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="Ex: 150,00"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.basePrice}
                  onChangeText={(v) => set("basePrice", v)}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Margem de Lucro */}
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Margem de lucro (%){" "}
                  <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>
                    (opcional)
                  </Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="Ex: 30"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.profitMargin}
                  onChangeText={(v) => set("profitMargin", v)}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Calculadora de lucro */}
              {(() => {
                const result = calcProfit(form.basePrice, form.profitMargin);
                if (!result) return null;
                return (
                  <View
                    style={{
                      borderRadius: 12,
                      backgroundColor: "#f0fdf4",
                      borderWidth: 1,
                      borderColor: "#bbf7d0",
                      padding: 14,
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Feather name="trending-up" size={14} color="#16a34a" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          fontFamily: "Inter_700Bold",
                          color: "#16a34a",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Cálculo de rentabilidade
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 8, padding: 10, alignItems: "center" }}>
                        <Text style={{ fontSize: 11, color: "#64748b", fontFamily: "Inter_400Regular", marginBottom: 2 }}>
                          Valor do serviço
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#1e293b" }}>
                          {fmt(parseFloat(form.basePrice.replace(",", ".")) || 0)}
                        </Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 8, padding: 10, alignItems: "center" }}>
                        <Text style={{ fontSize: 11, color: "#64748b", fontFamily: "Inter_400Regular", marginBottom: 2 }}>
                          Você ganha
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#16a34a" }}>
                          {fmt(result.profit)}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor: "#1565C0",
                        borderRadius: 8,
                        padding: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontSize: 12, color: "#fff", fontFamily: "Inter_400Regular", opacity: 0.85 }}>
                        Preço de venda sugerido
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#fff" }}>
                        {fmt(result.salePrice)}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Regras / Observações */}
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  Regras / Observações{" "}
                  <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>
                    (opcional)
                  </Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textarea,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="Condições especiais, materiais inclusos, etc..."
                  placeholderTextColor={colors.mutedForeground}
                  value={form.rules}
                  onChangeText={(v) => set("rules", v)}
                  multiline
                  numberOfLines={2}
                  maxLength={300}
                  textAlignVertical="top"
                />
              </View>

              {/* Ativo */}
              <View
                style={[
                  styles.switchRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.switchLabel, { color: colors.foreground }]}>
                    Serviço ativo
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}
                  >
                    Visível para clientes solicitarem
                  </Text>
                </View>
                <Switch
                  value={form.active}
                  onValueChange={(v) => set("active", v)}
                  trackColor={{ false: "#e2e8f0", true: "#1565C0" }}
                  thumbColor="#fff"
                />
              </View>

              {/* Botão Salvar */}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: saving ? colors.mutedForeground : "#1565C0" },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                <Feather
                  name={saving ? "loader" : "check"}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.saveBtnText}>
                  {saving
                    ? "Salvando..."
                    : editing
                    ? "Salvar alterações"
                    : "Cadastrar serviço"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── CARD DE SERVIÇO ──────────────────────────────────────────────────────────
function ServiceCatalogCard({
  service,
  onPress,
  colors,
}: {
  service: Service;
  onPress: () => void;
  colors: any;
}) {
  const { icon, color } = getServiceIcon(service.name);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {/* Ícone */}
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              backgroundColor: `${color}18`,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Feather name={icon} size={24} color={color} />
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  fontFamily: "Inter_700Bold",
                  color: colors.foreground,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {service.name}
              </Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                  backgroundColor: service.active ? "#dcfce7" : "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    fontFamily: "Inter_600SemiBold",
                    color: service.active ? "#166534" : "#64748b",
                  }}
                >
                  {service.active ? "Ativo" : "Inativo"}
                </Text>
              </View>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                lineHeight: 16,
                marginBottom: 6,
              }}
              numberOfLines={2}
            >
              {service.description}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <Feather name="dollar-sign" size={12} color={color} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  fontFamily: "Inter_700Bold",
                  color: color,
                }}
              >
                {fmt(service.basePrice)}
              </Text>
              {service.profitMargin > 0 && (
                <>
                  <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.border, marginHorizontal: 2 }} />
                  <Feather name="trending-up" size={11} color="#16a34a" />
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#16a34a",
                      fontFamily: "Inter_600SemiBold",
                      fontWeight: "600",
                    }}
                  >
                    {service.profitMargin}% lucro · {fmt(service.basePrice * (service.profitMargin / 100))}
                  </Text>
                </>
              )}
              {service.rules ? (
                <>
                  <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.border, marginHorizontal: 2 }} />
                  <Feather name="info" size={11} color={colors.mutedForeground} />
                </>
              ) : null}
            </View>
          </View>

          {/* Editar */}
          <Feather name="edit-3" size={16} color={colors.mutedForeground} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function AdminServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { services = [], serviceOrders = [], createService, updateService, deleteService, isLoading, refreshData } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  function openCreate() {
    setEditing(null);
    setModalVisible(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditing(null);
  }

  const activeServices = services.filter((s) => s.active);
  const inactiveServices = services.filter((s) => !s.active);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Catálogo de Serviços
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
            {services.length} serviço{services.length !== 1 ? "s" : ""} cadastrado{services.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={openCreate}
          style={[styles.addBtn, { backgroundColor: "#1565C0" }]}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total", value: services.length, color: colors.primary, icon: "layers" as const },
            { label: "Ativos", value: activeServices.length, color: "#22c55e", icon: "check-circle" as const },
            { label: "Inativos", value: inactiveServices.length, color: "#94a3b8", icon: "pause-circle" as const },
          ].map((item) => (
            <Card key={item.label} style={{ flex: 1 }} padding={12}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Feather name={item.icon} size={14} color={item.color} />
              </View>
              <Text
                style={{
                  fontSize: 22,
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

        {/* Empty state */}
        {services.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Feather name="package" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhum serviço cadastrado
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Toque em "+" para adicionar o primeiro serviço ao catálogo.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: "#1565C0" }]}
              onPress={openCreate}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Cadastrar serviço</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Serviços ativos */}
        {activeServices.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Serviços ativos
            </Text>
            {activeServices.map((s) => (
              <ServiceCatalogCard
                key={s.id}
                service={s}
                onPress={() => openEdit(s)}
                colors={colors}
              />
            ))}
          </View>
        )}

        {/* Serviços inativos */}
        {inactiveServices.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              Serviços inativos
            </Text>
            {inactiveServices.map((s) => (
              <ServiceCatalogCard
                key={s.id}
                service={s}
                onPress={() => openEdit(s)}
                colors={colors}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: "#1565C0" }]}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <ServiceModal
        visible={modalVisible}
        editing={editing}
        onClose={closeModal}
        onCreate={createService}
        onUpdate={updateService}
        onDelete={deleteService}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalClose: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    minHeight: 80,
    paddingTop: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
