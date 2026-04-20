import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import { StatusBadge } from "./ui/StatusBadge";
import { useColors } from "@/hooks/useColors";
import type { ServiceOrder } from "@/context/DataContext";

interface ServiceCardProps {
  order: ServiceOrder;
  onPress?: () => void;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

export function ServiceCard({ order, onPress }: ServiceCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
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
              {order.serviceType}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
              }}
            >
              {order.clientName}
            </Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        <Text
          style={{
            fontSize: 13,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            lineHeight: 18,
            marginBottom: 12,
          }}
          numberOfLines={2}
        >
          {order.description}
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="calendar" size={13} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
              }}
            >
              {formatDate(order.preferredDate)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name="clock" size={13} color={colors.mutedForeground} />
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
              }}
            >
              {order.preferredTime}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
