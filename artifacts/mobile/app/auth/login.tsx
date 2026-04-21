import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
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
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/constants/theme";

const logo = BRAND.logo;

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { refreshData } = useData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleLogin() {
    if (!email || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        refreshData().catch(() => {});
        router.replace(result.role === "admin" ? "/admin" : "/client");
      } else {
        setError(result.error ?? "Erro ao entrar.");
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
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 32,
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

        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <Image
            source={logo}
            style={{
              width: 90,
              height: 90,
              marginBottom: 16,
            }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              fontFamily: "Inter_700Bold",
              color: BRAND.colors.primary,
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            {BRAND.company.name}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
            }}
          >
            Entre com sua conta para continuar
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 4 }}>
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={
              <Feather name="mail" size={18} color={colors.mutedForeground} />
            }
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            isPassword
            leftIcon={
              <Feather name="lock" size={18} color={colors.mutedForeground} />
            }
          />

          {error ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#fee2e2",
                padding: 12,
                borderRadius: 10,
                marginBottom: 4,
              }}
            >
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text
                style={{
                  color: colors.destructive,
                  fontSize: 13,
                  fontFamily: "Inter_400Regular",
                  flex: 1,
                }}
              >
                {error}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => router.push("/auth/forgot-password")}
            style={{ alignSelf: "flex-end", marginBottom: 20 }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 13,
                fontFamily: "Inter_500Medium",
              }}
            >
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

          <Button title="Entrar" onPress={handleLogin} loading={loading} />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 24,
              gap: 12,
            }}
          >
            <View
              style={{ flex: 1, height: 1, backgroundColor: colors.border }}
            />
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
                fontFamily: "Inter_400Regular",
              }}
            >
              ou
            </Text>
            <View
              style={{ flex: 1, height: 1, backgroundColor: colors.border }}
            />
          </View>

          <Button
            title="Criar conta de cliente"
            onPress={() => router.push("/auth/register")}
            variant="outline"
          />
        </View>

        {/* Demo hint */}
        <View
          style={{
            marginTop: 32,
            padding: 14,
            backgroundColor: colors.accent,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: colors.accentForeground,
              fontFamily: "Inter_500Medium",
              textAlign: "center",
            }}
          >
            Acesso admin: admin@angelmarc.com
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
