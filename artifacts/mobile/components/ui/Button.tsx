import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
}: ButtonProps) {
  const colors = useColors();

  const getContainerStyle = () => {
    const base: ViewStyle = {
      borderRadius: colors.radius,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    };

    const sizes = {
      sm: { paddingVertical: 8, paddingHorizontal: 16 },
      md: { paddingVertical: 14, paddingHorizontal: 20 },
      lg: { paddingVertical: 18, paddingHorizontal: 24 },
    };

    const variants = {
      primary: {
        backgroundColor: disabled
          ? colors.mutedForeground
          : colors.primary,
      },
      secondary: {
        backgroundColor: colors.secondary,
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: colors.primary,
      },
      ghost: {
        backgroundColor: "transparent",
      },
      danger: {
        backgroundColor: colors.destructive,
      },
    };

    return {
      ...base,
      ...sizes[size],
      ...variants[variant],
      ...(fullWidth ? { width: "100%" as const } : {}),
    };
  };

  const getTextColor = () => {
    if (variant === "outline" || variant === "ghost") return colors.primary;
    if (variant === "secondary") return colors.secondaryForeground;
    return "#ffffff";
  };

  const getFontSize = () => {
    if (size === "sm") return 13;
    if (size === "lg") return 17;
    return 15;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        getContainerStyle(),
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? colors.primary : "#ffffff"}
          size="small"
        />
      ) : null}
      <Text
        style={{
          color: disabled ? "#aaaaaa" : getTextColor(),
          fontSize: getFontSize(),
          fontWeight: "600",
          fontFamily: "Inter_600SemiBold",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
