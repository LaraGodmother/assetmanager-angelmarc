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

const TIME_OPTIONS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

export default function NewServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createServiceOrder, services } = useData();

  const activeServices = services.filter((s) => s.active);
  const serviceNames = activeServices.map((s) => s.name);

  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  function validate() {
    const errs: Record<string, string> = {};
    if (!serviceName) errs.serviceName = "Selecione o tipo de serviço.";
    if (!description.trim()) errs.description = "Descreva o serviço desejado.";
    if (!preferredDate.trim()) errs.preferredDate = "Informe a data preferida.";
    if (!preferredTime) errs.preferredTime = "Selecione o horário preferido.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !user) return;
    const service = activeServices.find((s) => s.name === serviceName);
    if (!service) return;
    setLoading(true);
    try {
      await createServiceOrder({
        clientId: String(user.id),
        serviceId: service.id,
        description: description.trim(),
        preferredDate,
        preferredTime,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch (err: any) {
      setErrors({ general: err?.message ?? "Erro ao solicitar serviço." });
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
          Serviço solicitado!
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
          Sua solicitação foi enviada. Nossa equipe entrará em contato para confirmar o agendamento.
        </Text>
        <Button
          title="Voltar ao painel"
          onPress={() => router.replace("/client")}
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
          }}
        >
          Novo Serviço
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            lineHeight: 20,
            marginBottom: 20,
          }}
        >
          Preencha os detalhes do serviço que você precisa e nossa equipe entrará em contato
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

        <Select
          label="Tipo de serviço"
          options={serviceNames.length > 0 ? serviceNames : ["Carregando..."]}
          value={serviceName}
          onChange={setServiceName}
          placeholder="Selecione o serviço"
          error={errors.serviceName}
        />

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
            }}
          >
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva detalhadamente o que precisa ser feito..."
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: "top", paddingVertical: 12, paddingHorizontal: 0 }}
            />
          </View>
          {errors.description ? (
            <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 4, fontFamily: "Inter_400Regular" }}>
              {errors.description}
            </Text>
          ) : null}
        </View>

        <Input
          label="Data preferida"
          value={preferredDate}
          onChangeText={setPreferredDate}
          placeholder="DD/MM/AAAA"
          keyboardType="numeric"
          error={errors.preferredDate}
          leftIcon={<Feather name="calendar" size={18} color={colors.mutedForeground} />}
        />

        <Select
          label="Horário preferido"
          options={TIME_OPTIONS}
          value={preferredTime}
          onChange={setPreferredTime}
          placeholder="Selecione o horário"
          error={errors.preferredTime}
        />

        <View
          style={{
            marginTop: 8,
            padding: 14,
            backgroundColor: colors.accent,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
            <Feather name="info" size={15} color={colors.primary} style={{ marginTop: 1 }} />
            <Text
              style={{
                fontSize: 12,
                color: colors.accentForeground,
                fontFamily: "Inter_400Regular",
                flex: 1,
                lineHeight: 18,
              }}
            >
              O upload de fotos estará disponível em breve. Você pode descrever o problema com detalhes no campo acima.
            </Text>
          </View>
        </View>

        <Button title="Solicitar serviço" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
