import { ACCESS_TOKEN_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI, USER_API_URL } from "../config/github.js"
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

export const githubServices = {
    async getAccessToken(code: string) {
        const response = await fetch(ACCESS_TOKEN_URL, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Accept: "application/vnd.github+json",
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

        return await data.access_token as string || undefined;
    },

    async getUserProfile(accessToken: string) {
        const response = await fetch(USER_API_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": "sentinel-oss",
                Accept: "application/vnd.github+json",
            }
        })
        return await response.json();
    },

    async searchRepository(query: string, token: string){
          const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=10`;
        const reponse = await fetch(url, {
            credentials: "include",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "NodeJS-App"
            },
        })
        
        const data = await reponse.json();

        return data.items.map((repo: any) => ({
            id: repo.id,
            owner: repo.owner.login,
            name: repo.name,
            full_name: repo.full_name,
            stars: repo.stargazers_count,
            description: repo.description,
        }));
    },

    async getRepoMetaData(owner: string, name: string, token: string){
        const url = `https://api.github.com/repos/${owner}/${name}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
            }
        });

        if(!response.ok){
            throw new Error(`Repo metadata failed ${response.status}`)
        }

        return await response.json()
    },

    async getRepoTree(owner: string, name: string, branch: string, token: string){
        const url = `https://api.github.com/repos/${owner}/${name}/git/trees/${branch}?recursive=1`

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
            }
        });

        if(!response.ok){
            throw new Error(`Repo tree failed ${response.status}`)
        }

        return await response.json()
    },

    async getRepoIssues(owner: string, name: string, token: string) {
    // This query is what the GitHub search bar uses: "is:issue is:open"
        const query = encodeURIComponent(`repo:${owner}/${name} is:issue is:open`);
        const url = `https://api.github.com/search/issues?q=${query}&per_page=100&sort=created&order=desc`;
        
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "User-Agent": "Sentinel-OSS"
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // The Search API returns an object { total_count: X, items: [...] }
        // We only want the items.
        return data.items || [];
}
}