import React, { useState } from "react";
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
import { useData } from "@/context/DataContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function AdminCalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { appointments, serviceOrders } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

  function getDaysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
  }

  function getFirstDayOfMonth(y: number, m: number) {
    return new Date(y, m, 1).getDay();
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function getDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function hasAppointment(day: number) {
    const dateStr = getDateStr(day);
    return appointments.some((a) => a.date === dateStr);
  }

  function hasOrder(day: number) {
    const dateStr = getDateStr(day);
    return serviceOrders.some((o) => o.preferredDate === dateStr);
  }

  const selectedDateStr = selectedDay ? getDateStr(selectedDay) : null;
  const dayAppointments = selectedDateStr
    ? appointments.filter((a) => a.date === selectedDateStr)
    : [];
  const dayOrders = selectedDateStr
    ? serviceOrders.filter((o) => o.preferredDate === selectedDateStr)
    : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

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
          Calendário
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month navigation */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
            <Feather name="chevron-left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              fontFamily: "Inter_700Bold",
              color: colors.foreground,
            }}
          >
            {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
            <Feather name="chevron-right" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Days of week header */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: colors.muted,
          }}
        >
          {DAYS.map((d) => (
            <Text
              key={d}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 12,
                fontFamily: "Inter_600SemiBold",
                color: colors.mutedForeground,
              }}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={{ paddingHorizontal: 8 }}>
          {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: "row" }}>
              {cells.slice(rowIdx * 7, (rowIdx + 1) * 7).map((day, colIdx) => {
                const isSelected = day !== null && day === selectedDay;
                const hasAppt = day !== null && hasAppointment(day);
                const hasOrd = day !== null && hasOrder(day);
                const today = day !== null && isToday(day);

                return (
                  <TouchableOpacity
                    key={colIdx}
                    onPress={() => day && setSelectedDay(day)}
                    disabled={!day}
                    style={{
                      flex: 1,
                      height: 48,
                      alignItems: "center",
                      justifyContent: "center",
                      margin: 2,
                      borderRadius: 10,
                      backgroundColor: isSelected
                        ? colors.primary
                        : today
                        ? colors.accent
                        : "transparent",
                    }}
                  >
                    {day ? (
                      <>
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily:
                              today || isSelected
                                ? "Inter_700Bold"
                                : "Inter_400Regular",
                            color: isSelected
                              ? "#ffffff"
                              : today
                              ? colors.primary
                              : colors.foreground,
                          }}
                        >
                          {day}
                        </Text>
                        {(hasAppt || hasOrd) && !isSelected ? (
                          <View
                            style={{ flexDirection: "row", gap: 3, marginTop: 2 }}
                          >
                            {hasAppt ? (
                              <View
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: 3,
                                  backgroundColor: "#22c55e",
                                }}
                              />
                            ) : null}
                            {hasOrd ? (
                              <View
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: 3,
                                  backgroundColor: "#f59e0b",
                                }}
                              />
                            ) : null}
                          </View>
                        ) : null}
                      </>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            marginTop: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" }} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              Agendamento
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#f59e0b" }} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              Serviço
            </Text>
          </View>
        </View>

        {/* Selected day details */}
        {selectedDay ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                fontFamily: "Inter_700Bold",
                color: colors.foreground,
                marginBottom: 12,
              }}
            >
              {selectedDay} de {MONTHS[month]}
            </Text>

            {dayAppointments.length === 0 && dayOrders.length === 0 ? (
              <Card style={{ alignItems: "center", padding: 20 }}>
                <Feather name="calendar" size={28} color={colors.mutedForeground} />
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    fontFamily: "Inter_400Regular",
                    marginTop: 8,
                  }}
                >
                  Nenhum evento neste dia
                </Text>
              </Card>
            ) : (
              <>
                {dayAppointments.map((appt) => (
                  <Card key={appt.id} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Feather name="user" size={16} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
                          {appt.clientName} — {appt.serviceType}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                          {appt.time}
                        </Text>
                      </View>
                      <StatusBadge status={appt.status} />
                    </View>
                  </Card>
                ))}
                {dayOrders.map((order) => (
                  <Card key={order.id} style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#f59e0b" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Feather name="tool" size={16} color="#f59e0b" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
                          {order.clientName} — {order.serviceType}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                          {order.preferredTime}
                        </Text>
                      </View>
                      <StatusBadge status={order.status} />
                    </View>
                  </Card>
                ))}
              </>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
