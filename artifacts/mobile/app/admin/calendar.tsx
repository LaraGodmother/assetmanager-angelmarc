import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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
  const { appointments, serviceOrders, calendarNotes, saveCalendarNote, deleteCalendarNote } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  function getDaysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
  }

  function getFirstDayOfMonth(y: number, m: number) {
    return new Date(y, m, 1).getDay();
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function getDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function hasAppointment(day: number) {
    return appointments.some((a) => a.date === getDateStr(day));
  }

  function hasOrder(day: number) {
    return serviceOrders.some((o) => o.preferredDate === getDateStr(day));
  }

  function hasNote(day: number) {
    return !!calendarNotes[getDateStr(day)];
  }

  const selectedDateStr = selectedDay ? getDateStr(selectedDay) : null;
  const dayAppointments = selectedDateStr ? appointments.filter((a) => a.date === selectedDateStr) : [];
  const dayOrders = selectedDateStr ? serviceOrders.filter((o) => o.preferredDate === selectedDateStr) : [];
  const dayNote = selectedDateStr ? calendarNotes[selectedDateStr] : undefined;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  function openNoteModal() {
    setNoteInput(dayNote ?? "");
    setShowNoteModal(true);
  }

  async function handleSaveNote() {
    if (!selectedDateStr || !noteInput.trim()) return;
    setSavingNote(true);
    try {
      await saveCalendarNote(selectedDateStr, noteInput.trim());
      setShowNoteModal(false);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a nota.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote() {
    if (!selectedDateStr) return;
    Alert.alert(
      "Excluir nota",
      "Deseja excluir a anotação deste dia?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCalendarNote(selectedDateStr);
            } catch {
              Alert.alert("Erro", "Não foi possível excluir a nota.");
            }
          },
        },
      ]
    );
  }

  function formatDayLabel(day: number) {
    const weekDay = new Date(year, month, day).getDay();
    return `${DAYS[weekDay]}, ${day} de ${MONTHS[month]}`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
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
        <Text style={{ fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground, flex: 1 }}>
          Calendário
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* ── MONTH NAVIGATION ─────────────────────────────────────────────── */}
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
          <Text style={{ fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground }}>
            {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
            <Feather name="chevron-right" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── DAY NAMES ROW ─────────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.muted }}>
          {DAYS.map((d) => (
            <Text key={d} style={{ flex: 1, textAlign: "center", fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground }}>
              {d}
            </Text>
          ))}
        </View>

        {/* ── CALENDAR GRID ─────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 8 }}>
          {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: "row" }}>
              {cells.slice(rowIdx * 7, (rowIdx + 1) * 7).map((day, colIdx) => {
                const isSelected = day !== null && day === selectedDay;
                const hasAppt = day !== null && hasAppointment(day);
                const hasOrd = day !== null && hasOrder(day);
                const hasNoteOnDay = day !== null && hasNote(day);
                const today = day !== null && isToday(day);

                return (
                  <TouchableOpacity
                    key={colIdx}
                    onPress={() => day && setSelectedDay(day)}
                    disabled={!day}
                    style={{
                      flex: 1,
                      height: 52,
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
                            fontFamily: today || isSelected ? "Inter_700Bold" : "Inter_400Regular",
                            color: isSelected ? "#ffffff" : today ? colors.primary : colors.foreground,
                          }}
                        >
                          {day}
                        </Text>
                        {(hasAppt || hasOrd || hasNoteOnDay) && !isSelected ? (
                          <View style={{ flexDirection: "row", gap: 3, marginTop: 2 }}>
                            {hasAppt && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#22c55e" }} />}
                            {hasOrd && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#f59e0b" }} />}
                            {hasNoteOnDay && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#8b5cf6" }} />}
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

        {/* ── LEGEND ────────────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            gap: 14,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            marginTop: 4,
            flexWrap: "wrap",
          }}
        >
          {[
            { color: "#22c55e", label: "Agendamento" },
            { color: "#f59e0b", label: "Serviço" },
            { color: "#8b5cf6", label: "Nota" },
          ].map(({ color, label }) => (
            <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── SELECTED DAY DETAILS ──────────────────────────────────────────── */}
        {selectedDay ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
            {/* Day header with "Add note" button */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground, flex: 1 }}>
                {formatDayLabel(selectedDay)}
              </Text>
              <TouchableOpacity
                onPress={openNoteModal}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: dayNote ? "#EDE9FE" : "#F3F4F6",
                  borderWidth: 1.5,
                  borderColor: dayNote ? "#C4B5FD" : colors.border,
                }}
              >
                <Feather name={dayNote ? "edit-2" : "plus"} size={14} color={dayNote ? "#7C3AED" : colors.mutedForeground} />
                <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: dayNote ? "#7C3AED" : colors.mutedForeground }}>
                  {dayNote ? "Editar nota" : "Adicionar nota"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Note card if exists */}
            {dayNote ? (
              <View
                style={{
                  backgroundColor: "#F5F3FF",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: "#8b5cf6",
                  borderWidth: 1,
                  borderColor: "#DDD6FE",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <Feather name="edit-3" size={15} color="#8b5cf6" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#8b5cf6", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Anotação
                    </Text>
                    <Text style={{ fontSize: 14, color: "#4C1D95", fontFamily: "Inter_400Regular", lineHeight: 20 }}>
                      {dayNote}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleDeleteNote} style={{ padding: 4 }}>
                    <Feather name="trash-2" size={15} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Appointments and orders */}
            {dayAppointments.length === 0 && dayOrders.length === 0 && !dayNote ? (
              <Card style={{ alignItems: "center", padding: 20 }}>
                <Feather name="calendar" size={28} color={colors.mutedForeground} />
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8 }}>
                  Nenhum evento neste dia
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 4 }}>
                  Toque em "Adicionar nota" para anotar um compromisso
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

      {/* ── NOTE MODAL ────────────────────────────────────────────────────────── */}
      <Modal visible={showNoteModal} transparent animationType="slide" onRequestClose={() => setShowNoteModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowNoteModal(false)}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: 40,
                }}
              >
                {/* Modal header */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: "#EDE9FE",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Feather name="edit-3" size={18} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground }}>
                      Anotação do dia
                    </Text>
                    {selectedDay ? (
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                        {formatDayLabel(selectedDay)}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                    <Feather name="x" size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

                <TextInput
                  value={noteInput}
                  onChangeText={setNoteInput}
                  placeholder="Escreva aqui o compromisso, lembrete ou observação para este dia..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={6}
                  autoFocus
                  style={{
                    borderWidth: 1.5,
                    borderColor: noteInput ? "#8b5cf6" : colors.border,
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: colors.foreground,
                    backgroundColor: colors.muted,
                    minHeight: 130,
                    textAlignVertical: "top",
                    marginBottom: 16,
                  }}
                />

                <TouchableOpacity
                  onPress={handleSaveNote}
                  disabled={savingNote || !noteInput.trim()}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 15,
                    borderRadius: 12,
                    backgroundColor: noteInput.trim() ? "#7C3AED" : colors.muted,
                  }}
                >
                  {savingNote ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Feather name="check" size={18} color={noteInput.trim() ? "#fff" : colors.mutedForeground} />
                  )}
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: "Inter_600SemiBold",
                      color: noteInput.trim() ? "#fff" : colors.mutedForeground,
                    }}
                  >
                    {savingNote ? "Salvando..." : "Salvar anotação"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
