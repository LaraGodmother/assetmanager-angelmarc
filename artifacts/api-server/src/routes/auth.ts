import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/auth";

const router = Router();
const SALT_ROUNDS = 12;

async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$2b$") || stored.startsWith("$2a$")) {
    return bcrypt.compare(plain, stored);
  }
  const { createHash } = await import("crypto");
  const sha = createHash("sha256").update(plain).digest("hex");
  return sha === stored;
}

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email e password são obrigatórios." });
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db
      .insert(usersTable)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "client",
        phone: phone ?? null,
      })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        phone: usersTable.phone,
        createdAt: usersTable.createdAt,
      });

    const token = generateToken({ userId: user.id, role: user.role });
    return res.status(201).json({ user, token });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email e password são obrigatórios." });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    if (!user.passwordHash.startsWith("$2b$") && !user.passwordHash.startsWith("$2a$")) {
      const upgraded = await bcrypt.hash(password, SALT_ROUNDS);
      await db
        .update(usersTable)
        .set({ passwordHash: upgraded })
        .where(eq(usersTable.id, user.id));
    }

    const { passwordHash: _h, ...safeUser } = user;
    const token = generateToken({ userId: user.id, role: user.role });
    return res.json({ user: safeUser, token });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/auth/change-password", async (req, res) => {
  try {
    const userId = req.jwtUser?.userId;
    if (!userId) return res.status(401).json({ error: "Não autorizado." });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Senha atual incorreta." });

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, userId));

    return res.json({ success: true, message: "Senha alterada com sucesso." });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
