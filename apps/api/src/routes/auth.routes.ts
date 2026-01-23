import { AUTHORIZE_URL } from "../config/github.js"

import crypto from "node:crypto"

import { createUserFromGithub } from "../db/user.repo.js";
import { createSession } from "../db/sessions.repo.js";

import { FastifyRequest, FastifyReply } from "fastify";

import { githubServices } from "../service/github.service.js";
import {server} from "../server.js"
import { signToken } from "../utils/jwt.js";
import dotenv from "dotenv";
dotenv.config();

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
            redirect_uri: process.env.GITHUB_REDIRECT_URI!,
            scope: "read:user",
            state: state,
        })
        return reply.redirect(`${AUTHORIZE_URL}?${params.toString()}`)
    })



    server.get("/auth/github/callback", async(request: FastifyRequest, reply: FastifyReply) => {
        const {code, state} = request.query as {code:string, state:string};

        if (!code) {
            return reply.status(400).send({ error: "Missing OAuth code" });
        }

        const savedState = request.cookies.oauth_state;

        if(!state || state !== savedState) {
            return reply.status(401).send({ error: "State Mismatched / CSRF Detected"})
        }

        reply.clearCookie("oauth_state");
        const ghToken = await githubServices.getAccessToken(code);

        if(!ghToken) {
            return reply.status(500).send({ error: "Failed to get GitHub Access Token"})
        }

        const ghProfile = await githubServices.getUserProfile(ghToken);

        if (!ghProfile?.id || !ghProfile?.login) {
            return reply.status(500).send({ error: "Invalid GitHub profile" });
        }

        const user = await createUserFromGithub(
            ghProfile.id,
            ghProfile.login,
            ghProfile.avatar_url,
            ghToken
        )
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const session = await createSession(user.id, expiresAt);
        const jwt = signToken(user.id, session.id );

        reply.setCookie("accessToken", jwt, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 60 * 60 * 24,
        });
        return reply.redirect(`${process.env.FRONTEND_URL}/auth-success`);
    })
}