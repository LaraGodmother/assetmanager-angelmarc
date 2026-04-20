import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevation?: boolean;
}

export function Card({
  children,
  style,
  padding = 16,
  elevation = true,
}: CardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          padding,
          borderWidth: 1,
          borderColor: colors.border,
          ...(elevation
            ? {
                boxShadow: "0px 2px 6px rgba(0,0,0,0.06)",
                elevation: 2,
              }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
