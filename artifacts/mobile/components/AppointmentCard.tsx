import React from "react";
import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import { StatusBadge } from "./ui/StatusBadge";
import { useColors } from "@/hooks/useColors";
import type { Appointment } from "@/context/DataContext";

interface AppointmentCardProps {
  appointment: Appointment;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  } catch {
    return dateStr;
  }
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const colors = useColors();

  return (
    <Card style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="calendar" size={22} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              fontFamily: "Inter_600SemiBold",
              color: colors.foreground,
              marginBottom: 2,
            }}
          >
            {appointment.serviceType}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              marginBottom: 4,
              textTransform: "capitalize",
            }}
          >
            {formatDate(appointment.date)} • {appointment.time}
          </Text>
          <StatusBadge status={appointment.status} />
        </View>
      </View>

      {appointment.notes ? (
        <Text
          style={{
            fontSize: 13,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {appointment.notes}
        </Text>
      ) : null}
    </Card>
  );
}
