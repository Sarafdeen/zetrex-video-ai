exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const id = event.queryStringParameters?.id;
    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: "Prediction id is required." }) };
    }

    const secretName = ["REPLICATE", "API", "TOKEN"].join("_");
    const token = process.env[secretName];

    if (!token) {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: "Video API token is missing in Netlify environment variables." })
      };
    }

    const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(id)}`, {
      headers: { Authorization: ["Bearer", token].join(" ") }
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.detail || data.error || "Could not read prediction." })
      };
    }

    const output = Array.isArray(data.output) ? data.output[0] : data.output;

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: data.id,
        status: data.status,
        videoUrl: data.status === "succeeded" ? output : null,
        error: data.error || null
      })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message || "Server error" }) };
  }
};
