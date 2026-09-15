
const http = require("http");
const { InferenceClient } = require("@huggingface/inference");

const PORT = process.env.PORT || 3000;

const hf = new InferenceClient(process.env.HF_TOKEN);

const server = http.createServer(async (req, res) => {
  // Home / health check
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      success: true,
      message: "KahaniReel API is working!"
    }));
  }

  // Video generation
  if (req.method === "POST" && req.url === "/generate") {
    try {
      let body = "";

      req.on("data", chunk => {
        body += chunk;
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body);

          if (!data.prompt) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({
              success: false,
              error: "prompt is required"
            }));
          }

          console.log("Generating video...");

          const video = await hf.textToVideo({
            provider: "fal-ai",
            model: "tencent/HunyuanVideo-1.5",
            inputs: data.prompt
          });

          const buffer = Buffer.from(await video.arrayBuffer());

          res.writeHead(200, {
            "Content-Type": "video/mp4",
            "Content-Length": buffer.length
          });

          res.end(buffer);

        } catch (error) {
          console.error(error);

          res.writeHead(500, {
            "Content-Type": "application/json"
          });

          res.end(JSON.stringify({
            success: false,
            error: error.message || "Video generation failed"
          }));
        }
      });

      return;
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    success: false,
    error: "Route not found"
  }));
});

server.listen(PORT, () => {
  console.log(`KahaniReel API running on port ${PORT}`);
});
