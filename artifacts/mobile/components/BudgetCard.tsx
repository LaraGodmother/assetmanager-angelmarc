import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import { StatusBadge } from "./ui/StatusBadge";
import { useColors } from "@/hooks/useColors";
import type { Budget } from "@/context/DataContext";

interface BudgetCardProps {
  budget: Budget;
  onPress?: () => void;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

export function BudgetCard({ budget, onPress }: BudgetCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                fontFamily: "Inter_600SemiBold",
                color: colors.foreground,
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              {budget.serviceType}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
              }}
            >
              {budget.clientName}
            </Text>
          </View>
          <StatusBadge status={budget.status} />
        </View>

        <Text
          style={{
            fontSize: 13,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            marginBottom: 10,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {budget.description}
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 10,
          }}
        >
          {budget.value !== undefined ? (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                fontFamily: "Inter_700Bold",
                color: colors.primary,
              }}
            >
              {formatCurrency(budget.value)}
            </Text>
          ) : (
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
              }}
            >
              Valor a definir
            </Text>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="calendar" size={13} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
              }}
            >
              {formatDate(budget.createdAt)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
