import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { assertUniversityEmail } from '../middleware/emailDomain';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TOKEN_TTL = '30d';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  avgRating: number | null;
  completedTransactionCount: number;
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<{ userId: string }> {
  assertUniversityEmail(email);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { name },
  });

  if (error) {
    const err = new Error(error.message) as Error & { statusCode: number };
    err.statusCode = error.status === 422 ? 409 : 422;
    throw err;
  }

  await prisma.user.create({
    data: { id: data.user.id, email, name },
  });

  return { userId: data.user.id };
}

export async function login(
  email: string,
  password: string,
): Promise<{ tokens: AuthTokens; user: UserSummary }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const err = new Error('Invalid credentials') as Error & { statusCode: number };
    err.statusCode = error.status === 400 ? 401 : 403;
    throw err;
  }

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: data.user.id } });

  const tokens = issueTokens(dbUser.id, dbUser.email);
  return {
    tokens,
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avgRating: dbUser.avgRating ? Number(dbUser.avgRating) : null,
      completedTransactionCount: dbUser.completedTransactionCount,
    },
  };
}

export function issueTokens(userId: string, email: string): AuthTokens {
  const accessToken = jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign({ sub: userId, email, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
  return { accessToken, refreshToken, expiresIn: 3600 };
}

export function refreshTokens(refreshToken: string): AuthTokens {
  const payload = jwt.verify(refreshToken, JWT_SECRET) as {
    sub: string;
    email: string;
    type?: string;
  };
  if (payload.type !== 'refresh') {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  }
  return issueTokens(payload.sub, payload.email);
}
