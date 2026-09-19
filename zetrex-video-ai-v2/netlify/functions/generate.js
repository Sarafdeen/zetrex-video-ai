exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const prompt = String(body.prompt || "").trim();
    const ratio = ["16:9", "9:16", "1:1"].includes(body.ratio) ? body.ratio : "16:9";
    const duration = Math.min(12, Math.max(4, Number(body.duration) || 5));

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "Prompt is required" }) };
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return {
        statusCode: 503,
        body: JSON.stringify({ error: "REPLICATE_API_TOKEN is missing in Netlify environment variables." })
      };
    }

    const response = await fetch("https://api.replicate.com/v1/models/bytedance/seedance-1-lite/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        "Cancel-After": "10m"
      },
      body: JSON.stringify({
        input: {
          prompt,
          duration,
          resolution: "720p",
          aspect_ratio: ratio,
          fps: 24,
          camera_fixed: false
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.detail || data.error || "Replicate request failed." })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        predictionId: data.id,
        status: data.status,
        message: "Video generation started."
      })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message || "Server error" }) };
  }
};
