import { db } from "@workspace/db";
import { servicesTable, usersTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import crypto from "crypto";

function hash(p: string) {
  return crypto.createHash("sha256").update(p).digest("hex");
}

export async function seedDatabase() {
  try {
    const existingServices = await db
      .select({ count: sql<number>`count(*)` })
      .from(servicesTable);

    if (Number(existingServices[0].count) === 0) {
      await db.insert(servicesTable).values([
        {
          name: "Elétrica",
          description: "Instalações, reparos e manutenção elétrica residencial e comercial",
          basePrice: "150.00",
          rules: "Orçamento in-loco obrigatório para serviços acima de R$500",
          active: true,
        },
        {
          name: "CFTV / Câmeras",
          description: "Instalação e monitoramento de sistemas de segurança com câmeras",
          basePrice: "280.00",
          rules: "Instalação mínima de 2 câmeras por atendimento",
          active: true,
        },
        {
          name: "Refrigeração",
          description: "Instalação e manutenção de ar-condicionado e sistemas de refrigeração",
          basePrice: "200.00",
          rules: "Limpeza e higienização inclusos na manutenção preventiva",
          active: true,
        },
        {
          name: "Automação",
          description: "Automação residencial e comercial com tecnologia de ponta",
          basePrice: "500.00",
          rules: "Projeto técnico necessário antes do início do serviço",
          active: true,
        },
        {
          name: "Manutenção Geral",
          description: "Serviços gerais de manutenção predial e reparos diversos",
          basePrice: "120.00",
          rules: "Hora técnica cobrada após 2h de serviço",
          active: true,
        },
      ]);
      console.log("✅ Serviços inseridos com seed.");
    }

    const existingAdmin = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable);

    if (Number(existingAdmin[0].count) === 0) {
      await db.insert(usersTable).values({
        name: "Administrador",
        email: "admin@servcontrol.com",
        passwordHash: hash("admin123"),
        role: "admin",
        phone: "(11) 99999-9999",
      });
      console.log("✅ Admin inserido com seed.");
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
}
