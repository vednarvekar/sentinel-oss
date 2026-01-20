import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import { authRoutes } from "./routes/auth.routes.js";
import "dotenv/config";

export const server = Fastify({logger: true,});

// Initialize 'user' so it can be safely attached in middleware
server.decorateRequest('user', null);

// TypeScript support: Define the user object shape
declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string } | null;
  }
}

server.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET,
})
server.register(authRoutes);
