import { db } from "./client.js"

export const saveOrUpdateIssues = async(issues: any[]) => {
    if(issues.length == 0) return;

    const values: any[] = [];
    const placeholders = issues.map((issues, index) => {
        const offset = index * 9;
        values.push(
            issues.id,
            issues.repoId,
            issues.number,
            issues.title,
            issues.body,
            issues.state,
            JSON.stringify(issues.lables || []),
            issues.createdAt,
            issues.updatedAt,
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, 
                $${offset + 4}, $${offset + 5}, $${offset + 6}, 
                $${offset + 7}, $${offset + 8}, $${offset + 9})`
    }).join(",");

    const query = `
    INSERT INTO issues
    (id, repo_id, number, title, body, state, lables, created_at, updated_at)
    VALUES ${placeholders}
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        state = EXCLUDED.state,
        lables = EXCLUDED.lables,
        updated_at = EXCLUDED.updated_at`

    await db.query(query, values)
};