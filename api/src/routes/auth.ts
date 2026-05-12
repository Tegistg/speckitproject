import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as authService from '../services/authService';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refresh_token: z.string(),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await authService.register(body.email, body.password, body.name);
    return reply.status(201).send({ message: 'Verification email sent', userId: result.userId });
  });

  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const { tokens, user } = await authService.login(body.email, body.password);
    return reply.send({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
      user,
    });
  });

  app.post('/auth/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body);
    const tokens = authService.refreshTokens(body.refresh_token);
    return reply.send({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
    });
  });

  app.post('/auth/logout', async (_request, reply) => {
    return reply.status(204).send();
  });
}
