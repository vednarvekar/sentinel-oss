import Fastify from "fastify";
import cookie from '@fastify/cookie';
import cors from "@fastify/cors";
import "dotenv/config";

export const server = Fastify({logger: true});

server.decorateRequest('user', null);

declare module 'fastify' {
  interface FastifyRequest {
    user: { 
      id: string;
      githubToken: string;
     } | null;
  }
}

server.register(cookie, {
  secret: "my-secret", // Optional: for signing cookies
  parseOptions: {}     // Optional: default cookie options
});

server.register(cors, {
  origin: "http://localhost:5555",
  credentials: true,
});