## 0️⃣ User Authentication Flow (ENTRY GATE)
<pre><code>
[ Browser ]
|
|  GET /login
v

<p class="has-line-data" data-line-start="5" data-line-end="21">[ Redirect to GitHub OAuth ]<br>
|<br>
v<br>
[ GitHub ]<br>
|<br>
|  callback ?code=<br>
v<br>
[ Backend: /auth/github/callback ]<br>
|<br>
|-- exchange code → access_token<br>
|-- fetch GitHub user<br>
|-- upsert user in DB<br>
|-- create session<br>
|-- issue short-lived JWT<br>
v<br>
[ Browser authenticated ]</p>
✅ From now on, every API assumes authenticated user
❌ No GitHub API calls from frontend — EVER
</code></pre>

## 1️⃣ Repo Search Flow
<pre><code>
[ Browser ]
|
|  GET /repos/search?q=react
v

<p class="has-line-data" data-line-start="31" data-line-end="41">[ API ]<br>
|<br>
|-- check Redis cache<br>
|     |<br>
|     |-- HIT → return results<br>
|     |<br>
|     |-- MISS →<br>
|            |<br>
|            |-- enqueue repo_search job<br>
|            |-- return cached/stale/empty response</p>
Rules
    • Search is fast
    • Freshness is async
    • UI never blocks
</code></pre>	

## 2️⃣ Repo Open Flow (VERY IMPORTANT)
<pre><code>
[ Browser ]
|
|  GET /repos/:owner/:name
v

<p class="has-line-data" data-line-start="53" data-line-end="65">[ API ]<br>
|<br>
|-- check DB (repo exists?)<br>
|     |<br>
|     |-- NO →<br>
|           |<br>
|           |-- enqueue repo_ingest job<br>
|           |-- return { status: “processing” }<br>
|<br>
|     |-- YES →<br>
|           |<br>
|           |-- return repo metadata</p>
Background: repo_ingest job

[ Worker ]
|
|-- fetch repo metadata (GitHub API)
|-- snapshot repo structure
|-- analyze folder + file layout
|-- store in DB
👉 Repo page loads even if analysis is running
</code></pre>
	
## 3️⃣ Issues List Flow
<pre><code>
[ Browser ]
|
|  GET /repos/:id/issues
v

<p class="has-line-data" data-line-start="82" data-line-end="92">[ API ]<br>
|<br>
|-- check Redis cache<br>
|     |<br>
|     |-- HIT → return issues<br>
|     |<br>
|     |-- MISS →<br>
|            |<br>
|            |-- enqueue issue_ingest job<br>
|            |-- return cached / empty list</p>
Background: issue_ingest job

[ Worker ]
|
|-- fetch issues from GitHub
|-- normalize + store
|-- mark stale/fresh
</code></pre>

## 4️⃣ Issue Analysis Flow (CORE VALUE)
<pre><code>
[ Browser ]
|
|  GET /issues/:issue_id/analysis
v

<p class="has-line-data" data-line-start="107" data-line-end="119">[ API ]<br>
|<br>
|-- check DB (analysis exists?)<br>
|     |<br>
|     |-- YES →<br>
|           |<br>
|           |-- return analysis<br>
|<br>
|     |-- NO →<br>
|           |<br>
|           |-- enqueue issue_analysis job<br>
|           |-- return { status: “pending” }</p>
Background: issue_analysis job

[ Worker ]
|
|-- load repo structure
|-- extract issue keywords
|-- compute path relevance
|-- compute difficulty score
|-- generate explanation (templated)
|-- store result
Frontend polls or revalidates → analysis appears.
</code></pre>

## 5️⃣ Cache + Rate-Limit Flow (ALWAYS ACTIVE)
<pre><code>
[ Any GitHub API Call ]
|
|-- check rate limit state
|     |
|     |-- SAFE → proceed
|     |
|     |-- LOW → delay job
|     |
|     |-- ZERO → pause all GitHub jobs

GitHub is never hit directly by UI.
</code></pre>

## 6️⃣ Error Handling Flow
<pre><code>
[ API / Worker ]
|
|-- failure?
      |
      |-- retry (with backoff)
      |
      |-- log error
      |
      |-- mark data as degraded
User sees:

&quot;Analysis unavailable (retrying)&quot;
NOT crashes. NOT silence.
</code></pre>

## 7️⃣ Data Authority Model (IMPORTANT)
<pre><code>
GitHub → Cached copy → DB → API → UI

• GitHub = source of truth
• DB = processed truth
• Redis = speed
• UI = read-only consumer
</code></pre>

## 8️⃣ API DESIGN PRINCIPLES (LOCK THESE)
<pre><code>
Every API answers:
    • Is data ready or processing?
    • Where did data come from? (cache/db)
    • What background job was triggered?
Example response:

<p class="has-line-data" data-line-start="178" data-line-end="182">{<br>
“data”: {…},<br>
“status”: “processing”,<br>
“source”: “cache”</p>
</code></pre>
