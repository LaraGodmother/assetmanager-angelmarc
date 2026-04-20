import React from "react";
import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
}

export function StatCard({ title, value, icon, color }: StatCardProps) {
  const colors = useColors();
  const iconColor = color ?? colors.primary;
  const iconBg = color ? `${color}20` : colors.accent;

  return (
    <Card style={{ flex: 1, marginHorizontal: 4 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          fontFamily: "Inter_700Bold",
          color: colors.foreground,
          marginBottom: 2,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: colors.mutedForeground,
          fontFamily: "Inter_400Regular",
        }}
      >
        {title}
      </Text>
    </Card>
  );
}
