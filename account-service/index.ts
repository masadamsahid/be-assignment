import fastify from 'fastify';
import authRoutes from './routes/auth.routes';

const server = fastify();

server.register(authRoutes, { prefix: "/auth" });

server.get('/ping', async (request, reply) => {
  return 'pong\n pung \n  pang\n   peng';
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});