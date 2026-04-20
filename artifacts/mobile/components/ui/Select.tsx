import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function Select({
  label,
  placeholder = "Selecione...",
  options,
  value,
  onChange,
  error,
}: SelectProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: 12 }}>
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

      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1.5,
          borderColor: error ? colors.destructive : colors.border,
          borderRadius: colors.radius,
          height: 52,
          paddingHorizontal: 14,
          backgroundColor: colors.card,
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: value ? colors.foreground : colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            fontSize: 15,
          }}
        >
          {value ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

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

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={styles.overlay}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              styles.modal,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                fontFamily: "Inter_600SemiBold",
                color: colors.foreground,
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              {label ?? "Selecionar"}
            </Text>
            <ScrollView>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  style={[
                    styles.option,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor:
                        value === opt ? colors.accent : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily:
                        value === opt
                          ? "Inter_600SemiBold"
                          : "Inter_400Regular",
                      color:
                        value === opt
                          ? colors.accentForeground
                          : colors.foreground,
                      fontSize: 15,
                    }}
                  >
                    {opt}
                  </Text>
                  {value === opt ? (
                    <Feather
                      name="check"
                      size={16}
                      color={colors.accentForeground}
                    />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
});
