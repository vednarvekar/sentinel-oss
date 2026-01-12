import { ACCESS_TOKEN_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, USER_API_URL } from "../config/github.js"


export const githubServices = {
    async getAccessToken(code: string) {
        const response = await fetch(ACCESS_TOKEN_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code,
            })
        })
        const data = await response.json();
        return data.access_token as string || undefined;
    },

    async getUserProfile(accessToken: string) {
        const response = await fetch(USER_API_URL, {
            headers: {
                Authorization: `Berear ${accessToken}`
            }
        })
        return response.json();
    }
}