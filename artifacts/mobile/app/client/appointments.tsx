import React from "react";
import {
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
import { useData } from "@/context/DataContext";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Card } from "@/components/ui/Card";

export default function ClientAppointmentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getClientAppointments } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const appointments = getClientAppointments(String(user?.id ?? "")).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

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
          }}
        >
          Meus Agendamentos
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {appointments.length === 0 ? (
          <Card style={{ marginTop: 40, alignItems: "center", padding: 32 }}>
            <Feather name="calendar" size={40} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                fontFamily: "Inter_600SemiBold",
                color: colors.foreground,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              Nenhum agendamento
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Seus agendamentos aparecerão aqui
            </Text>
          </Card>
        ) : (
          appointments.map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
