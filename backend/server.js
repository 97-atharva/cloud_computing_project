const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ================================
// CONFIG
// ================================
const JWT_SECRET = "supersecret_dev_key";
const MONGO_URI = "mongodb://127.0.0.1:27017/spotify_clone";

// ================================
// CONNECT MONGO
// ================================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ================================
// MODELS
// ================================
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  passwordHash: String,
});

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  fileName: String,
  tags: [String],
});

const playlistSchema = new mongoose.Schema({
  name: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
});

const User = mongoose.model("User", userSchema);
const Song = mongoose.model("Song", songSchema);
const Playlist = mongoose.model("Playlist", playlistSchema);

// ================================
// AUTH MIDDLEWARE
// ================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expired/invalid" });
  }
}

// ================================
// SIGNUP API
// ================================
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already used" });

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    passwordHash: hash,
  });

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
});

// ================================
// LOGIN API
// ================================
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
});

// ================================
// CURRENT USER
// ================================
app.get("/api/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select("username email");
  res.json(user);
});

// ================================
// SEED SONGS
// ================================
async function seedSongs() {
  const count = await Song.countDocuments();
  if (count > 0) return;

  await Song.insertMany([
    {
      title: "Kesariya",
      artist: "Arijit Singh",
      fileName: "kesariya.mp3",
      tags: ["romantic", "bollywood"],
    },
  ]);

  console.log("🎵 Demo songs seeded. Add MP3 files in backend/songs/");
}
seedSongs();

// ================================
// SONG SEARCH API
// ================================
app.get("/api/songs", async (req, res) => {
  const search = req.query.search?.toLowerCase() || "";

  let query = {};
  if (search) {
    query = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { artist: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ],
    };
  }

  const songs = await Song.find(query);
  res.json(songs);
});

// ================================
// AUDIO ROUTE
// ================================
app.use("/audio", express.static(path.join(__dirname, "songs")));

// ================================
// PLAYLIST ROUTES
// ================================
app.get("/api/playlists", authMiddleware, async (req, res) => {
  const playlists = await Playlist.find({ user: req.userId }).populate("songs");
  res.json(playlists);
});

app.post("/api/playlists", authMiddleware, async (req, res) => {
  const { name, songIds } = req.body;

  const playlist = await Playlist.create({
    name,
    user: req.userId,
    songs: songIds || [],
  });

  const populated = await playlist.populate("songs");
  res.json(populated);
});

// ================================
// FRONTEND
// ================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// ================================
// START SERVER
// ================================
app.listen(5000, () => {
  console.log("✅ Backend running at http://localhost:5000");
});
