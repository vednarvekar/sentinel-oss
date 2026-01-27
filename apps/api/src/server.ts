import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";

export const server = Fastify({ logger: true });

server.decorateRequest("user", null);

server.register(cookie, {
  secret: process.env.COOKIE_SECRET || "dev-secret",
  parseOptions: {},
});

server.register(cors, {
  origin: "http://localhost:5555",
  credentials: true,
});
