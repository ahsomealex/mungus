exports.handler = async (event) => {

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "POST only"
        };
    }

    const { filename, base64 } = JSON.parse(event.body);

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const path = `uploads/${filename}`;

    // Does file already exist?

    let sha = undefined;

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
            body: await upload.text()
        };

    }

    return {
        statusCode: 200,
        body: "Success"
    };

};