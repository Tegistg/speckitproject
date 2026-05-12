import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'development' ? true : process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB max

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    app.log.error(error);
    return reply.status(statusCode).send({
      error: error.message ?? 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const { authRoutes } = await import('./routes/auth');
  const { listingRoutes } = await import('./routes/listings');
  const { orderRoutes } = await import('./routes/orders');
  const { userRoutes } = await import('./routes/users');
  const { ratingRoutes } = await import('./routes/ratings');
  const { webhookRoutes } = await import('./routes/webhooks');

  await app.register(authRoutes);
  await app.register(listingRoutes);
  await app.register(orderRoutes);
  await app.register(userRoutes);
  await app.register(ratingRoutes);
  await app.register(webhookRoutes);

  return app;
}
