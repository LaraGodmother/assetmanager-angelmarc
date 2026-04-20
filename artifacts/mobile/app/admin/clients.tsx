import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";

type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
};

export default function ClientesScreen() {
  const colors = useColors();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  function adicionarCliente() {
    if (!nome) return;

    const novo: Cliente = {
      id: String(Date.now()),
      nome,
      email,
      telefone,
    };

    setClientes((prev) => [novo, ...prev]);
    setNome("");
    setEmail("");
    setTelefone("");
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>
          👤 Clientes (CRM)
        </Text>

        {/* FORM */}
        <Card style={{ padding: 12, marginTop: 16 }}>
          <TextInput
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
            style={{ marginBottom: 8, color: colors.foreground }}
          />

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={{ marginBottom: 8, color: colors.foreground }}
          />

          <TextInput
            placeholder="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            style={{ marginBottom: 8, color: colors.foreground }}
          />

          <TouchableOpacity
            onPress={adicionarCliente}
            style={{
              backgroundColor: colors.primary,
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              + Adicionar Cliente
            </Text>
          </TouchableOpacity>
        </Card>

        {/* LISTA */}
        <View style={{ marginTop: 20 }}>
          {clientes.map((c) => (
            <Card key={c.id} style={{ padding: 12, marginBottom: 10 }}>
              <Text style={{ fontWeight: "700" }}>{c.nome}</Text>
              <Text>{c.email}</Text>
              <Text>{c.telefone}</Text>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}