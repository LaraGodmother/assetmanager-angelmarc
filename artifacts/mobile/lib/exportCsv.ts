import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Platform, Share } from "react-native";

function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

function downloadWeb(filename: string, csv: string): void {
  try {
    const dataUri =
      "data:text/csv;charset=utf-8," + encodeURIComponent("\uFEFF" + csv);
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write("<pre>" + csv.replace(/</g, "&lt;") + "</pre>");
      win.document.title = filename;
    }
  }
}

export async function exportAndShare(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): Promise<void> {
  try {
    const csv = buildCsv(headers, rows);

    // ── WEB ────────────────────────────────────────────────────────────────
    if (Platform.OS === "web") {
      downloadWeb(filename, csv);
      return;
    }

    // ── NATIVE (iOS / Android) ──────────────────────────────────────────────
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      // Fallback: share as plain text
      await Share.share({ message: csv, title: filename });
      return;
    }

    const fileUri = cacheDir + filename;

    // Write the CSV file
    await FileSystem.writeAsStringAsync(fileUri, "\uFEFF" + csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Try expo-sharing (preferred — opens native share sheet with file)
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Compartilhar planilha",
        UTI: "public.comma-separated-values-text",
      });
      return;
    }

    // Fallback 1: React Native Share with URL (iOS)
    if (Platform.OS === "ios") {
      await Share.share({ url: fileUri, title: filename });
      return;
    }

    // Fallback 2: Share CSV text content (Android Expo Go)
    await Share.share({
      message: csv,
      title: filename,
    });
  } catch (e: any) {
    // If expo-sharing threw, try text fallback before showing error
    if (e?.code !== "ERR_SHARING_MUI" && e?.message?.includes("sharing")) {
      try {
        const csv = buildCsv(headers, rows);
        await Share.share({ message: csv, title: filename });
        return;
      } catch {
        // fall through to error alert
      }
    }
    console.error("[exportCsv] erro:", e);
    Alert.alert(
      "Erro ao exportar",
      e?.message ?? "Não foi possível exportar a planilha.",
      [{ text: "OK" }]
    );
  }
}

export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return String(dateStr);
  }
}

export function fmtBrl(value: number | null | undefined): string {
  if (value == null) return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
