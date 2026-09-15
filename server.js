const http = require("http");
const { fal } = require("@fal-ai/client");

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    return res.end(JSON.stringify({
      success: true,
      message: "KahaniReel API is working!"
    }));
  }

  // Video generation
  if (req.method === "POST" && req.url === "/generate") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);

        if (!data.prompt) {
          res.writeHead(400, {
            "Content-Type": "application/json"
          });

          return res.end(JSON.stringify({
            success: false,
            error: "prompt is required"
          }));
        }

        console.log("Starting Fal.ai video generation...");

        const result = await fal.subscribe(
          "fal-ai/hunyuan-video-v1.5/text-to-video",
          {
            input: {
              prompt: data.prompt,
              aspect_ratio: data.aspect_ratio || "16:9",
              resolution: data.resolution || "480p",
              num_frames: data.num_frames || 121,
              enable_prompt_expansion: true
            },
            logs: true,
            onQueueUpdate: (update) => {
              console.log("Queue status:", update.status);
            }
          }
        );

        const videoUrl = result.data.video.url;

        console.log("Video generated:", videoUrl);

        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
          success: true,
          video_url: videoUrl
        }));

      } catch (error) {
        console.error("Fal.ai error:", error);

        res.writeHead(500, {
          "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
          success: false,
          error: error.message || "Video generation failed"
        }));
      }
    });

    return;
  }

  // Unknown route
  res.writeHead(404, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    success: false,
    error: "Route not found"
  }));
});

server.listen(PORT, () => {
  console.log(`KahaniReel API running on port ${PORT}`);
});
