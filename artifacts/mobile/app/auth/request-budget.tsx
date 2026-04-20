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
import { useData } from "@/context/DataContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export default function RequestBudgetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const { createBudgetRequest, services } = useData();

  const activeServices = services.filter((s) => s.active);
  const serviceNames = activeServices.map((s) => s.name);

  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState((user?.phone as string) ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  function validate() {
    const errs: Record<string, string> = {};
    if (!serviceName) errs.serviceName = "Selecione o tipo de serviço.";
    if (!description.trim()) errs.description = "Descreva o serviço.";
    if (!isAuthenticated) {
      if (!name.trim()) errs.name = "Informe seu nome.";
      if (!email.trim()) errs.email = "Informe seu e-mail.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    if (!isAuthenticated || !user) {
      setErrors({ general: "Faça login para solicitar um orçamento." });
      return;
    }

    const service = activeServices.find((s) => s.name === serviceName);
    if (!service) {
      setErrors({ general: "Serviço inválido." });
      return;
    }

    setLoading(true);
    try {
      await createBudgetRequest({
        clientId: String(user.id),
        serviceId: service.id,
        baseValue: service.basePrice,
        observations: description.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch (err: any) {
      setErrors({ general: err?.message ?? "Erro ao solicitar orçamento." });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#dcfce7",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Feather name="check" size={40} color="#16a34a" />
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            fontFamily: "Inter_700Bold",
            color: colors.foreground,
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Orçamento solicitado!
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            textAlign: "center",
            lineHeight: 20,
            marginBottom: 32,
          }}
        >
          Recebemos sua solicitação. Entraremos em contato em breve com o orçamento.
        </Text>
        <Button
          title="Voltar ao início"
          onPress={() => router.replace("/")}
          fullWidth={false}
          style={{ paddingHorizontal: 40 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
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
          <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "Inter_500Medium" }}>
            Voltar
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            fontFamily: "Inter_700Bold",
            color: colors.foreground,
            marginBottom: 6,
          }}
        >
          Solicitar Orçamento
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Preencha o formulário e entraremos em contato em breve
        </Text>

        {errors.general ? (
          <View
            style={{
              backgroundColor: "#FEF2F2",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.destructive, fontSize: 13, fontFamily: "Inter_400Regular" }}>
              {errors.general}
            </Text>
          </View>
        ) : null}

        {!isAuthenticated ? (
          <>
            <View
              style={{
                backgroundColor: "#FFF3E0",
                padding: 12,
                borderRadius: 10,
                marginBottom: 16,
                flexDirection: "row",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <Feather name="info" size={15} color={colors.orange} style={{ marginTop: 1 }} />
              <Text
                style={{
                  fontSize: 12,
                  color: "#E65100",
                  fontFamily: "Inter_400Regular",
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                Para solicitar um orçamento é necessário ter uma conta.{" "}
                <Text
                  style={{ fontFamily: "Inter_600SemiBold", color: colors.primary }}
                  onPress={() => router.push("/auth/login")}
                >
                  Fazer login
                </Text>
              </Text>
            </View>
            <Input
              label="Nome completo"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              error={errors.name}
              leftIcon={<Feather name="user" size={18} color={colors.mutedForeground} />}
            />
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Feather name="mail" size={18} color={colors.mutedForeground} />}
            />
            <Input
              label="Telefone"
              value={phone}
              onChangeText={setPhone}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              leftIcon={<Feather name="phone" size={18} color={colors.mutedForeground} />}
            />
          </>
        ) : null}

        <Select
          label="Tipo de serviço"
          options={serviceNames.length > 0 ? serviceNames : ["Carregando..."]}
          value={serviceName}
          onChange={setServiceName}
          placeholder="Selecione o serviço"
          error={errors.serviceName}
        />

        {serviceName && activeServices.find((s) => s.name === serviceName) ? (
          <View
            style={{
              backgroundColor: "#E3F2FD",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Feather name="tag" size={14} color={colors.primary} />
            <Text style={{ fontSize: 13, color: colors.primary, fontFamily: "Inter_500Medium" }}>
              Valor base:{" "}
              <Text style={{ fontFamily: "Inter_700Bold" }}>
                {Number(
                  activeServices.find((s) => s.name === serviceName)?.basePrice
                ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </Text>
            </Text>
          </View>
        ) : null}

        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              fontFamily: "Inter_500Medium",
              color: colors.mutedForeground,
              marginBottom: 6,
            }}
          >
            Descrição do serviço
          </Text>
          <View
            style={{
              borderWidth: 1.5,
              borderColor: errors.description ? colors.destructive : colors.border,
              borderRadius: colors.radius,
              backgroundColor: colors.card,
              padding: 12,
            }}
          >
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva detalhadamente o serviço que você precisa..."
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: "top", paddingHorizontal: 0 }}
            />
          </View>
          {errors.description ? (
            <Text
              style={{ color: colors.destructive, fontSize: 12, marginTop: 4, fontFamily: "Inter_400Regular" }}
            >
              {errors.description}
            </Text>
          ) : null}
        </View>

        <View style={{ marginTop: 12 }}>
          <Button title="Enviar solicitação" onPress={handleSubmit} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
