import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking, Alert, Platform, Share } from "react-native";

// ── BASE URL (same logic as api.ts) ──────────────────────────────────────────
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://0c4f309c-6b3c-4e2f-96e4-8aadfecef50e-00-3gjzlqu4remhq.picard.replit.dev/api";

// ─────────────────────────────────────────────────────────────────────────────
// openExportUrl — Opens a server-side CSV export URL in the system browser.
// This is the most reliable approach for Expo Go (no native module limitations).
// The browser will download or preview the CSV as a proper document.
// ─────────────────────────────────────────────────────────────────────────────
export async function openExportUrl(path: string): Promise<void> {
  const url = BASE_URL.replace(/\/api$/, "") + "/api" + path;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erro", "Não foi possível abrir o navegador para baixar o arquivo.");
    }
  } catch (e: any) {
    Alert.alert("Erro ao exportar", e?.message ?? "Tente novamente.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// exportAndShare — Client-side CSV generation + native share sheet.
// Used for financial dashboard where data is pre-calculated on the client.
// ─────────────────────────────────────────────────────────────────────────────
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

    if (Platform.OS === "web") {
      downloadWeb(filename, csv);
      return;
    }

    // Try writing file + expo-sharing (best: opens native share with real file)
    const cacheDir = FileSystem.cacheDirectory;
    if (cacheDir) {
      const fileUri = cacheDir + filename;
      await FileSystem.writeAsStringAsync(fileUri, "\uFEFF" + csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Compartilhar planilha",
          UTI: "public.comma-separated-values-text",
        });
        return;
      }

      // iOS fallback: share file URL via native Share
      if (Platform.OS === "ios") {
        await Share.share({ url: fileUri, title: filename });
        return;
      }
    }

    // Android / last resort: share CSV text content
    await Share.share({ message: csv, title: filename });
  } catch (e: any) {
    console.error("[exportCsv] erro:", e);
    Alert.alert(
      "Erro ao exportar",
      e?.message ?? "Não foi possível exportar. Tente novamente.",
      [{ text: "OK" }]
    );
  }
}

// ── FORMATTERS ───────────────────────────────────────────────────────────────
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
