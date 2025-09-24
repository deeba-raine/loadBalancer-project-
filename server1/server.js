const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 8081;

// Create shared uploads folder if not exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Serve static files
app.use(express.static(uploadDir));
app.use("/", express.static(path.join(__dirname, "public")));

// ----------------------------
// ✅ Add this health check route
app.get("/health", (req, res) => {
  res.send("OK");
});
// ----------------------------

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Upload file
app.post("/upload", upload.single("myFile"), (req, res) => {
  res.sendStatus(200);
});

// List files
app.get("/files", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).send("Unable to scan files");
    res.json(files);
  });
});

// Download file
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) res.download(filePath);
  else res.status(404).send("File not found");
});

// Delete file
app.delete("/delete/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.sendStatus(200);
  } else {
    res.status(404).send("File not found");
  }
});

// Catch-all route: serve index.html for any unknown path
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
