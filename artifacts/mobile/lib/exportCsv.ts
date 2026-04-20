import { Alert, Platform } from "react-native";

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

async function shareNative(filename: string, csv: string): Promise<void> {
  // Lazy-import to avoid issues on web bundle
  const FileSystem = await import("expo-file-system");
  const Sharing = await import("expo-sharing");

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error("Sistema de arquivos não disponível.");
  }

  const fileUri = cacheDir + filename;

  // Use string "utf8" literal instead of FileSystem.EncodingType.UTF8
  // for maximum compatibility across expo-file-system versions
  await FileSystem.writeAsStringAsync(fileUri, "\uFEFF" + csv, {
    encoding: "utf8" as any,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: "Compartilhar planilha",
      UTI: "public.comma-separated-values-text",
    });
  } else {
    Alert.alert(
      "Arquivo salvo",
      `Planilha salva em:\n${fileUri}`,
      [{ text: "OK" }]
    );
  }
}

function downloadWeb(filename: string, csv: string): void {
  try {
    // Use data URI — more compatible inside iframes than blob URLs
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
    // Fallback: open in new tab as plain text
    const win = window.open();
    if (win) {
      win.document.write("<pre>" + csv.replace(/</g, "&lt;") + "</pre>");
      win.document.title = filename;
    } else {
      Alert.alert(
        "Exportação",
        "Não foi possível baixar automaticamente. Copie os dados exibidos no console."
      );
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

    await shareNative(filename, csv);
  } catch (e: any) {
    console.error("[exportCsv] erro:", e);
    Alert.alert(
      "Erro ao exportar",
      e?.message ?? "Não foi possível exportar a planilha. Tente novamente.",
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
