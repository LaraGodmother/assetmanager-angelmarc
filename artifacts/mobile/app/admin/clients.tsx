import React, { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import type { User } from "@/context/AuthContext";

const USERS_KEY = "@servicospro_users";

const SEED_CLIENTS = [
  { id: "client-seed-1", name: "Carlos Mendes", email: "carlos@email.com", phone: "(11) 98765-4321", role: "client", createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "client-seed-2", name: "Ana Rodrigues", email: "ana@email.com", phone: "(11) 91234-5678", role: "client", createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "client-seed-3", name: "Pedro Silva", email: "pedro@email.com", phone: "(11) 95555-9999", role: "client", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "client-seed-4", name: "Lucia Ferreira", email: "lucia@email.com", phone: "(11) 97777-3333", role: "client", createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "client-seed-5", name: "Roberto Alves", email: "roberto@email.com", phone: "(11) 96666-2222", role: "client", createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
];

export default function AdminClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [clients, setClients] = useState<User[]>([]);

  useEffect(() => {
    async function load() {
      const raw = await AsyncStorage.getItem(USERS_KEY);
      const registered: User[] = raw ? JSON.parse(raw) : [];
      const merged = [
        ...SEED_CLIENTS,
        ...registered.filter(
          (r) => !SEED_CLIENTS.find((s) => s.id === r.id)
        ),
      ] as User[];
      setClients(merged);
    }
    load();
  }, []);

  function getInitials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  }

  const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444"];

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
          Clientes
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
          }}
        >
          {clients.length} clientes
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {clients.map((client, idx) => (
          <Card key={client.id} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: COLORS[idx % COLORS.length] + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    fontFamily: "Inter_700Bold",
                    color: COLORS[idx % COLORS.length],
                  }}
                >
                  {getInitials(client.name)}
                </Text>
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
                  {client.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    fontFamily: "Inter_400Regular",
                    marginBottom: 2,
                  }}
                >
                  {client.email}
                </Text>
                {client.phone ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {client.phone}
                  </Text>
                ) : null}
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.mutedForeground,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  Desde
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.foreground,
                    fontFamily: "Inter_500Medium",
                  }}
                >
                  {formatDate(client.createdAt)}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
