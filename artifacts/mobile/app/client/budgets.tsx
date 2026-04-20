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
import { BudgetCard } from "@/components/BudgetCard";
import { Card } from "@/components/ui/Card";

export default function ClientBudgetsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getClientBudgets } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const budgets = getClientBudgets(String(user?.id ?? "")).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
            flex: 1,
          }}
        >
          Meus Orçamentos
        </Text>
        <TouchableOpacity onPress={() => router.push("/auth/request-budget")}>
          <Feather name="plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {budgets.length === 0 ? (
          <Card style={{ marginTop: 40, alignItems: "center", padding: 32 }}>
            <Feather name="file-text" size={40} color={colors.mutedForeground} />
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
              Nenhum orçamento ainda
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                textAlign: "center",
                marginTop: 6,
                marginBottom: 20,
              }}
            >
              Solicite um orçamento gratuito agora
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/auth/request-budget")}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 10,
                paddingHorizontal: 24,
                borderRadius: colors.radius,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 14,
                }}
              >
                Solicitar orçamento
              </Text>
            </TouchableOpacity>
          </Card>
        ) : (
          budgets.map((budget) => <BudgetCard key={budget.id} budget={budget} />)
        )}
      </ScrollView>
    </View>
  );
}
