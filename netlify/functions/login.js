exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Method Not Allowed"
      })
    };
  }

  let data;

  try {
    data = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Invalid JSON"
      })
    };
  }

  const { username, password } = data;

  const correctUsername = process.env.LOGIN_USERNAME;
  const correctPassword = process.env.LOGIN_PASSWORD;

  if (
    username === correctUsername &&
    password === correctPassword
  ) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        result: "success"
      })
    };
  }

  return {
    statusCode: 401,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      result: "failure"
    })
  };
};
