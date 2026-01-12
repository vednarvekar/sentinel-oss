import {server} from "../server.js"
import { AUTHORIZE_URL } from "../config/github.js"
import { FastifyRequest, FastifyReply } from "fastify";
import "dotenv/config";
import crypto from "node:crypto"

export async function authRoutes() {
    server.get("/auth/github", async(request: FastifyRequest, reply: FastifyReply) => {
        const state = crypto.randomBytes(16).toString("hex");

        reply.setCookie("oauth_state", state, {
            path: "/",
            httpOnly: true,
            maxAge: 600,
        })

        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID || "",
            scope: "read:user",
        })
        return reply.redirect(`${AUTHORIZE_URL}?${params.toString()}`)
    })

    server.get("/auth/github/callback", async(request: FastifyRequest, reply: FastifyReply) => {})
}