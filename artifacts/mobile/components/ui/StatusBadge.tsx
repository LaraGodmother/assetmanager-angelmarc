import React from "react";
import { Text, View } from "react-native";
import type { ServiceStatus, BudgetStatus, AppointmentStatus } from "@/context/DataContext";

type AnyStatus = ServiceStatus | BudgetStatus | AppointmentStatus;

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pendente: { label: "Pendente", bg: "#fef3c7", text: "#92400e" },
  em_andamento: { label: "Em Andamento", bg: "#dbeafe", text: "#1e40af" },
  concluido: { label: "Concluído", bg: "#dcfce7", text: "#166534" },
  cancelado: { label: "Cancelado", bg: "#fee2e2", text: "#991b1b" },
  aguardando: { label: "Aguardando", bg: "#fef3c7", text: "#92400e" },
  aprovado: { label: "Aprovado", bg: "#dcfce7", text: "#166534" },
  recusado: { label: "Recusado", bg: "#fee2e2", text: "#991b1b" },
  agendado: { label: "Agendado", bg: "#ede9fe", text: "#5b21b6" },
  confirmado: { label: "Confirmado", bg: "#dcfce7", text: "#166534" },
  realizado: { label: "Realizado", bg: "#e0f2fe", text: "#0369a1" },
};

interface StatusBadgeProps {
  status: AnyStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "#f1f5f9",
    text: "#64748b",
  };

  return (
    <View
      style={{
        backgroundColor: config.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: config.text,
          fontSize: 11,
          fontWeight: "600",
          fontFamily: "Inter_600SemiBold",
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
