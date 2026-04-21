import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { BRAND } from "@/constants/theme";

export default function PerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Campos obrigatórios", "Preencha todos os campos.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Senha fraca", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Senhas diferentes", "A nova senha e a confirmação não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      Alert.alert("Sucesso", "Senha alterada com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível alterar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 12, backgroundColor: "#ffffff", borderBottomColor: "#e2e8f0" },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User info card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: BRAND.colors.primaryLight }]}>
            <Feather name="user" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name ?? "Administrador"}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user?.email ?? ""}</Text>
            <View style={[styles.roleBadge, { backgroundColor: BRAND.colors.primaryLight }]}>
              <Text style={[styles.roleBadgeText, { color: colors.primary }]}>Administrador</Text>
            </View>
          </View>
        </View>

        {/* Change password */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Alterar Senha</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Current password */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Senha atual</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Digite sua senha atual"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
              <Feather name={showCurrent ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* New password */}
          <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 14 }]}>Nova senha</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
              <Feather name={showNew ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Confirm password */}
          <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 14 }]}>Confirmar nova senha</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a nova senha"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Strength hint */}
          {newPassword.length > 0 && (
            <View style={styles.strengthRow}>
              <View
                style={[
                  styles.strengthBar,
                  {
                    backgroundColor:
                      newPassword.length >= 12
                        ? "#22c55e"
                        : newPassword.length >= 8
                        ? "#f59e0b"
                        : "#ef4444",
                    flex: Math.min(newPassword.length / 12, 1),
                  },
                ]}
              />
              <Text style={[styles.strengthText, { color: colors.mutedForeground }]}>
                {newPassword.length >= 12 ? "Forte" : newPassword.length >= 8 ? "Boa" : "Fraca"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: loading ? colors.mutedForeground : colors.primary },
            ]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveBtnText}>Salvando...</Text>
            ) : (
              <>
                <Feather name="lock" size={16} color="#ffffff" />
                <Text style={styles.saveBtnText}>Alterar Senha</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: BRAND.colors.primaryLight, borderColor: colors.border }]}>
          <Feather name="info" size={15} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Use uma senha com pelo menos 8 caracteres, misturando letras, números e símbolos para maior segurança.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    flexDirection: "column",
    gap: 0,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    alignSelf: "center",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  userEmail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 3,
  },
  roleBadge: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  eyeBtn: {
    padding: 6,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    height: 6,
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
    minWidth: 20,
  },
  strengthText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    marginTop: 20,
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
