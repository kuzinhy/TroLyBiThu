import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// GitHub API endpoint to save knowledge
app.post("/api/github/save", async (req, res) => {
  const { content } = req.body;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || "nguyenhuythudaumot-create";
  const GITHUB_REPO = process.env.GITHUB_REPO || "ai-bi-thu-assistant";
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
  const GITHUB_FILE_PATH = "brain/knowledge.json";

  console.log(`Attempting to save knowledge to ${GITHUB_OWNER}/${GITHUB_REPO}`);

  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN is missing in environment variables");
    return res.status(500).json({ error: "Chưa cấu hình GITHUB_TOKEN trong biến môi trường." });
  }

  try {
    // 1. Get current file content and sha
    const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`;
    let sha: string | undefined;
    let currentData = { knowledge: [] as string[] };

    try {
      const getRes = await axios.get(getUrl, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      sha = getRes.data.sha;
      const base64Content = getRes.data.content;
      currentData = JSON.parse(Buffer.from(base64Content, "base64").toString("utf-8"));
    } catch (error: any) {
      if (error.response?.status !== 404) {
        throw error;
      }
      // File doesn't exist, we'll create it
    }
    
    // 2. Add new content to knowledge array
    if (!currentData.knowledge) currentData.knowledge = [];
    currentData.knowledge.push(content);

    // 3. Update/Create file on GitHub
    const putUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    await axios.put(putUrl, {
      message: `Update knowledge: ${content.substring(0, 50)}...`,
      content: Buffer.from(JSON.stringify(currentData, null, 2)).toString("base64"),
      sha, // If undefined, GitHub creates the file
      branch: GITHUB_BRANCH,
    }, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    res.json({ success: true, message: "Đã lưu vào bộ nhớ GitHub" });
  } catch (error: any) {
    console.error("GitHub API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Lỗi khi lưu vào GitHub", details: error.response?.data || error.message });
  }
});

// GitHub API endpoint to delete knowledge
app.delete("/api/github/delete", async (req, res) => {
  const { index } = req.body;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || "nguyenhuythudaumot-create";
  const GITHUB_REPO = process.env.GITHUB_REPO || "ai-bi-thu-assistant";
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
  const GITHUB_FILE_PATH = "brain/knowledge.json";

  console.log(`Attempting to delete knowledge at index ${index} from ${GITHUB_OWNER}/${GITHUB_REPO}`);

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "Chưa cấu hình GITHUB_TOKEN trong biến môi trường." });
  }

  try {
    const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`;
    const getRes = await axios.get(getUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const { sha, content: base64Content } = getRes.data;
    const currentData = JSON.parse(Buffer.from(base64Content, "base64").toString("utf-8"));
    
    if (currentData.knowledge && currentData.knowledge[index] !== undefined) {
      currentData.knowledge.splice(index, 1);
    } else {
      return res.status(400).json({ error: "Index not found" });
    }

    const putUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    await axios.put(putUrl, {
      message: `Delete knowledge at index ${index}`,
      content: Buffer.from(JSON.stringify(currentData, null, 2)).toString("base64"),
      sha,
      branch: GITHUB_BRANCH,
    }, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    res.json({ success: true, message: "Đã xóa khỏi bộ nhớ GitHub" });
  } catch (error: any) {
    console.error("GitHub API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Lỗi khi xóa khỏi GitHub", details: error.response?.data || error.message });
  }
});

// GitHub API endpoint to get knowledge
app.get("/api/github/knowledge", async (req, res) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || "nguyenhuythudaumot-create";
  const GITHUB_REPO = process.env.GITHUB_REPO || "ai-bi-thu-assistant";
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
  const GITHUB_FILE_PATH = "brain/knowledge.json";

  try {
    const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`;
    const headers: any = {
      Accept: "application/vnd.github.v3+json",
    };
    if (GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }

    const getRes = await axios.get(getUrl, { headers });
    const { content: base64Content } = getRes.data;
    const data = JSON.parse(Buffer.from(base64Content, "base64").toString("utf-8"));
    res.json(data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return res.json({ knowledge: [] });
    }
    console.error("GitHub API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Lỗi khi tải kiến thức từ GitHub", details: error.response?.data || error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Google Sheets Data Proxy
app.get("/api/external/orders", async (req, res) => {
  try {
    const response = await axios.get("https://script.google.com/macros/s/AKfycbwPcCkjNETO_qzS5pYdZfTWE1c_nkLOsnbXxZlHBe6r81r5on2t47qKG_kUUDakb9Bk/exec");
    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching Google Sheets data:", error.message);
    res.status(500).json({ error: "Failed to fetch external order data" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
