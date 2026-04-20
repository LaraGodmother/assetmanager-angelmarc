import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Informe seu nome completo.";
    if (!email.trim()) errs.email = "Informe seu e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "E-mail inválido.";
    if (!password) errs.password = "Informe uma senha.";
    else if (password.length < 6)
      errs.password = "A senha deve ter pelo menos 6 caracteres.";
    if (password !== confirmPassword)
      errs.confirmPassword = "As senhas não coincidem.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register(
        name.trim(),
        email.trim().toLowerCase(),
        password,
        phone.trim() || undefined
      );
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/client");
      } else {
        setErrors({ email: result.error ?? "Erro ao criar conta." });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: topInset + 16,
          paddingBottom: bottomInset + 24,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 28,
            alignSelf: "flex-start",
          }}
        >
          <Feather name="arrow-left" size={20} color={colors.primary} />
          <Text
            style={{
              fontSize: 15,
              color: colors.primary,
              fontFamily: "Inter_500Medium",
            }}
          >
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              fontFamily: "Inter_700Bold",
              color: colors.foreground,
              marginBottom: 6,
            }}
          >
            Criar conta
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              lineHeight: 20,
            }}
          >
            Cadastre-se para acompanhar seus serviços e orçamentos
          </Text>
        </View>

        <Input
          label="Nome completo"
          value={name}
          onChangeText={setName}
          placeholder="João da Silva"
          autoCapitalize="words"
          error={errors.name}
          leftIcon={
            <Feather name="user" size={18} color={colors.mutedForeground} />
          }
        />

        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
          leftIcon={
            <Feather name="mail" size={18} color={colors.mutedForeground} />
          }
        />

        <Input
          label="Telefone (opcional)"
          value={phone}
          onChangeText={setPhone}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
          leftIcon={
            <Feather name="phone" size={18} color={colors.mutedForeground} />
          }
        />

        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          isPassword
          error={errors.password}
          leftIcon={
            <Feather name="lock" size={18} color={colors.mutedForeground} />
          }
        />

        <Input
          label="Confirmar senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repita a senha"
          isPassword
          error={errors.confirmPassword}
          leftIcon={
            <Feather name="lock" size={18} color={colors.mutedForeground} />
          }
        />

        <View style={{ marginTop: 8 }}>
          <Button title="Criar conta" onPress={handleRegister} loading={loading} />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          style={{ alignItems: "center", marginTop: 20 }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
            }}
          >
            Já tem uma conta?{" "}
            <Text
              style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}
            >
              Entrar
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
