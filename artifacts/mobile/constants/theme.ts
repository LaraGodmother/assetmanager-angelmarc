// =============================================================
//  CONFIGURAÇÃO DE MARCA — Grupo Angelmarc Service
//  Ao fazer fork para um novo cliente, edite apenas este arquivo
//  e o arquivo equivalente em artifacts/api-server/src/config/company.ts
// =============================================================

export const BRAND = {
  company: {
    name: "Grupo Angelmarc Service & System",
    shortName: "Angelmarc",
    tagline: "Tecnologia e Serviços Residenciais e Comerciais",
    cnpj: "65.591.897/0001-10",
    phone: "(11) 98520-6774",
    whatsapp: "5511985206774",
    email: "grupoangelmarc@outlook.com.br",
    address: "",
  },

  // Cores extraídas do logo (azul marinho + vermelho)
  colors: {
    primary: "#1B2D6B",       // Azul marinho (texto ANGELMARC)
    primaryDark: "#0F1E4A",   // Azul marinho escuro (hover, pressed)
    primaryLight: "#E8EAF6",  // Azul lavanda suave (fundos, chips)

    accent: "#CC2020",        // Vermelho (arco do globo)
    accentLight: "#FFEBEE",   // Vermelho suave (fundos)
    accentDark: "#B71C1C",    // Vermelho escuro (textos sobre fundo claro)
  },

  // Logo — arquivo em assets/images/logo.png
  logo: require("../assets/images/logo.png") as number,
};
