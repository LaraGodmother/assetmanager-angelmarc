import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET ?? "servcontrol_fallback_secret";

const PUBLIC_PATHS = [
  { method: "POST", path: "/auth/login" },
  { method: "POST", path: "/auth/register" },
  { method: "GET",  path: "/health" },
];

const PUBLIC_PREFIXES = ["/orcamentos/"];

export interface JwtPayload {
  userId: number;
  role: "admin" | "client";
}

declare global {
  namespace Express {
    interface Request {
      jwtUser?: JwtPayload;
    }
  }
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const isPublic = PUBLIC_PATHS.some(
    (p) => p.method === req.method && p.path === req.path
  );
  const isPdfRoute = PUBLIC_PREFIXES.some((prefix) =>
    req.path.startsWith(prefix)
  );

  if (isPublic || isPdfRoute) return next();

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autorizado. Token ausente." });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.jwtUser = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
