import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { api, type ApiUser } from "@/lib/api";
import { openExportUrl, fmtDate } from "@/lib/exportCsv";

// ─── UTILS ────────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── TELA ─────────────────────────────────────────────────────────────────────
export default function AdminClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [clients, setClients] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", document: "", address: "", password: "" });
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (e: any) {
      Alert.alert("Erro", "Não foi possível carregar clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search)
  );

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Alert.alert("Campos obrigatórios", "Informe nome, e-mail e senha.");
      return;
    }
    setSaving(true);
    try {
      const created = await api.register(
        form.name.trim(),
        form.email.trim().toLowerCase(),
        form.password,
        form.phone.trim() || undefined
      );
      if ((form.document.trim() || form.address.trim()) && created?.user?.id) {
        await api.updateClient(created.user.id, {
          document: form.document.trim() || undefined,
          address: form.address.trim() || undefined,
        });
      }
      setForm({ name: "", email: "", phone: "", document: "", address: "", password: "" });
      setShowModal(false);
      await loadClients();
    } catch (e: any) {
      Alert.alert("Erro ao cadastrar", e.message ?? "E-mail já em uso ou erro no servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await openExportUrl("/export/clientes.csv");
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
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Clientes (CRM)
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} cadastrado{clients.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleExport}
          style={[styles.iconBtn, { backgroundColor: "#22c55e18" }]}
          disabled={exporting || clients.length === 0}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : (
            <Feather name="download" size={18} color="#22c55e" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={[styles.iconBtn, { backgroundColor: "#1565C0" }]}
        >
          <Feather name="user-plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── BUSCA ──────────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Buscar por nome, e-mail ou telefone..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── LISTA ──────────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 40, gap: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadClients} tintColor={colors.primary} />
        }
      >
        {loading && clients.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              Carregando clientes...
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48, gap: 12 }}>
            <Feather name="users" size={48} color={colors.mutedForeground} />
            <Text style={{ fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground }}>
              {search ? "Nenhum resultado" : "Nenhum cliente cadastrado"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>
              {search
                ? "Tente buscar por outro termo"
                : "Toque em + para cadastrar o primeiro cliente"}
            </Text>
            {!search && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: "#1565C0" }]}
                onPress={() => setShowModal(true)}
              >
                <Feather name="user-plus" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Cadastrar cliente</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map((c) => (
            <Card key={c.id} style={styles.clientCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                {/* Avatar */}
                <View
                  style={[styles.avatar, { backgroundColor: "#1565C018" }]}
                >
                  <Text style={[styles.avatarText, { color: "#1565C0" }]}>
                    {initials(c.name)}
                  </Text>
                </View>
                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 2 }}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <Feather name="mail" size={11} color={colors.mutedForeground} />
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
                      {c.email}
                    </Text>
                  </View>
                  {c.phone ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Feather name="phone" size={11} color={colors.mutedForeground} />
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                        {c.phone}
                      </Text>
                    </View>
                  ) : null}
                  {c.document ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Feather name="credit-card" size={11} color={colors.mutedForeground} />
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                        {c.document}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {/* Data */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    Desde
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
                    {fmtDate(c.createdAt)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ── MODAL NOVO CLIENTE ─────────────────────────────────────────────── */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalClose}>
                  <Feather name="x" size={20} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Novo Cliente
                </Text>
                <View style={{ width: 36 }} />
              </View>

              <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
                {[
                  { field: "name" as const, label: "Nome completo *", placeholder: "Ex: João da Silva", keyboard: "default" as const },
                  { field: "email" as const, label: "E-mail *", placeholder: "joao@email.com", keyboard: "email-address" as const },
                  { field: "phone" as const, label: "Telefone / WhatsApp", placeholder: "(11) 99999-9999", keyboard: "phone-pad" as const },
                  { field: "document" as const, label: "CPF / CNPJ", placeholder: "000.000.000-00", keyboard: "default" as const },
                  { field: "address" as const, label: "Endereço", placeholder: "Rua, número, bairro, cidade", keyboard: "default" as const },
                  { field: "password" as const, label: "Senha de acesso *", placeholder: "Mínimo 6 caracteres", keyboard: "default" as const },
                ].map(({ field, label, placeholder, keyboard }) => (
                  <View key={field}>
                    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                      placeholder={placeholder}
                      placeholderTextColor={colors.mutedForeground}
                      value={form[field]}
                      onChangeText={(v) => setForm((prev) => ({ ...prev, [field]: v }))}
                      keyboardType={keyboard}
                      secureTextEntry={field === "password"}
                      autoCapitalize={field === "email" ? "none" : "words"}
                    />
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: saving ? colors.mutedForeground : "#1565C0" }]}
                  onPress={handleCreate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Feather name="user-plus" size={18} color="#fff" />
                  )}
                  <Text style={styles.saveBtnText}>
                    {saving ? "Cadastrando..." : "Cadastrar cliente"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  clientCard: { paddingVertical: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
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
  modalClose: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  fieldLabel: {
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
