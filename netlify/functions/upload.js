exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json"
    };

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
            body: JSON.stringify({ error: "POST only" })
        };
    }

    try {
        const {
            username,
            password,
            files
        } = JSON.parse(event.body);

        // Authenticate
        if (
            username !== process.env.LOGIN_USERNAME ||
            password !== process.env.LOGIN_PASSWORD
        ) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: "Invalid username or password"
                })
            };
        }

        if (!Array.isArray(files)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: "files must be an array"
                })
            };
        }

        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const token = process.env.GITHUB_TOKEN;

        const results = [];

        for (const file of files) {
            const { filename, base64 } = file;

            if (!filename || !base64) {
                results.push({
                    filename,
                    success: false,
                    error: "Missing filename or base64"
                });
                continue;
            }

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

            if (upload.ok) {
                results.push({
                    filename,
                    success: true
                });
            } else {
                results.push({
                    filename,
                    success: false,
                    error: await upload.text()
                });
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                uploaded: results.filter(r => r.success).length,
                total: results.length,
                results
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: error.toString()
            })
        };
    }
};
