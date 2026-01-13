import { ACCESS_TOKEN_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI, USER_API_URL } from "../config/github.js"
import { Agent } from "undici";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const agent = new Agent({
  connect: { family: 4 },
});


export const githubServices = {
    async getAccessToken(code: string) {
        const response = await fetch(ACCESS_TOKEN_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code,
                redirect_url: GITHUB_REDIRECT_URI,
            })
        })
        const data = await response.json();
        
        if (!data.access_token) {
            throw new Error("No access token from GitHub");
        }

        return data.access_token as string || undefined;
    },

    async getUserProfile(accessToken: string) {
        const response = await fetch(USER_API_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": "sentinel-oss",
                Accept: "application/vnd.github+json",
            }
        })
        return response.json();
    }
}