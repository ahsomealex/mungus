exports.handler = async (event) => {

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // Handle browser preflight request
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: ""
        };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers,
            body: "POST only"
        };
    }

    try {

        const { filename, base64 } = JSON.parse(event.body);

        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const token = process.env.GITHUB_TOKEN;

        const path = `uploads/${filename}`;

        let sha;

        const existing = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github+json"
                }
            }
        );

        if (existing.ok) {
            const json = await existing.json();
            sha = json.sha;
        }

        const upload = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github+json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `Upload ${filename}`,
                    content: base64,
                    sha
                })
            }
        );

        if (!upload.ok) {
            return {
                statusCode: 500,
                headers,
                body: await upload.text()
            };
        }

        return {
            statusCode: 200,
            headers,
            body: "Success"
        };

    } catch (error) {

        return {
            statusCode: 500,
            headers,
            body: error.toString()
        };

    }
};
