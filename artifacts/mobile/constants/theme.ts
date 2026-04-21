// =============================================================
//  CONFIGURAÇÃO DE MARCA — ServControl
//  Ao fazer fork para um novo cliente, edite apenas este arquivo
//  e o arquivo equivalente em artifacts/api-server/src/config/company.ts
// =============================================================

export const BRAND = {
  company: {
    name: "Grupo Angelmarc Service & System",
    shortName: "ServControl",
    tagline: "Tecnologia e Serviços Residenciais e Comerciais",
    cnpj: "65.591.897/0001-10",
    phone: "(11) 99999-9999",
    whatsapp: "5511999999999",
    email: "contato@servcontrol.com.br",
    address: "",
  },

  // Cores principais — substitua pelo hex do cliente
  colors: {
    primary: "#1565C0",       // Azul principal
    primaryDark: "#0D47A1",   // Azul escuro (hover, pressed)
    primaryLight: "#E3F2FD",  // Azul suave (fundos, chips)

    accent: "#F57C00",        // Laranja de destaque
    accentLight: "#FFF3E0",   // Laranja suave (fundos)
    accentDark: "#E65100",    // Laranja escuro (textos sobre fundo claro)
  },

  // Logo local — substitua pelo arquivo do cliente em assets/images/
  logo: require("../assets/images/logo.png") as number,
};
