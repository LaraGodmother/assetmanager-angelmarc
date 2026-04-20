import React, { useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  style,
  ...props
}: InputProps) {
  const colors = useColors();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            fontFamily: "Inter_500Medium",
            color: colors.mutedForeground,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.container,
          {
            borderColor: error
              ? colors.destructive
              : isFocused
              ? colors.primary
              : colors.border,
            backgroundColor: colors.card,
            borderRadius: colors.radius,
          },
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}

        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          style={[
            styles.input,
            {
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
              fontSize: 15,
            },
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.icon}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.icon}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text
          style={{
            color: colors.destructive,
            fontSize: 12,
            marginTop: 4,
            fontFamily: "Inter_400Regular",
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    height: 52,
  },
  icon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
  },
});
