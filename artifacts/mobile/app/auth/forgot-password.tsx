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
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { recoverPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await recoverPassword(email.trim().toLowerCase());
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? "Erro ao recuperar senha.");
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
            marginBottom: 40,
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

        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Feather name="key" size={32} color={colors.primary} />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              fontFamily: "Inter_700Bold",
              color: colors.foreground,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Recuperar senha
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Digite seu e-mail e enviaremos as instruções para redefinir sua senha
          </Text>
        </View>

        {!sent ? (
          <>
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
              leftIcon={
                <Feather name="mail" size={18} color={colors.mutedForeground} />
              }
            />

            <View style={{ marginTop: 8 }}>
              <Button
                title="Enviar instruções"
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          </>
        ) : (
          <View
            style={{
              backgroundColor: "#dcfce7",
              padding: 20,
              borderRadius: 12,
              alignItems: "center",
              gap: 12,
            }}
          >
            <Feather name="check-circle" size={40} color="#16a34a" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                fontFamily: "Inter_600SemiBold",
                color: "#166534",
                textAlign: "center",
              }}
            >
              Instruções enviadas!
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#166534",
                fontFamily: "Inter_400Regular",
                textAlign: "center",
                lineHeight: 19,
              }}
            >
              Verifique sua caixa de entrada em {email}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.replace("/auth/login")}
          style={{ alignItems: "center", marginTop: 24 }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.primary,
              fontFamily: "Inter_500Medium",
            }}
          >
            Voltar ao login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
