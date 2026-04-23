const API_BASE = "https://spotify-backend-t63v.onrender.com";

let audio = new Audio();
let currentSong = null;
let isPlaying = false;

// ======================================
// LOAD SONGS ON HOME PAGE
// ======================================
async function loadHomeSongs() {
    try {
        const res = await fetch(`${API_BASE}/api/songs`);
        const songs = await res.json();

        const cards = document.querySelectorAll(".trend-card");

        cards.forEach((card, index) => {
            if (songs[index]) {
                const s = songs[index];

                card.dataset.fileName = s.fileName;
                card.dataset.title = s.title;
                card.dataset.artist = s.artist;

                const img = card.querySelector("img");
                card.dataset.cover = img ? img.src : "./assets/default.jpg";

                card.addEventListener("click", () => playSongFromCard(card));
            }
        });
    } catch (err) {
        console.error("Error loading songs:", err);
    }
}

// ======================================
// PLAY SONG
// ======================================
function playSongFromCard(card) {

    const fileName = card.dataset.fileName;
    const title = card.dataset.title;
    const artist = card.dataset.artist;
    const cover = card.dataset.cover;

    if (!fileName) return;

    const url = `https://spotify-backend-t63v.onrender.com/audio/${fileName}`;

    if (currentSong === url) {
        if (audio.paused) audio.play();
        else audio.pause();
        updatePlayButton(!audio.paused);
        return;
    }

    currentSong = url;
    audio.src = url;
    audio.play();

    saveRecentlyPlayed({ title, artist, cover, fileName });

    updateBottomPlayer(title, artist, cover);
    updatePlayButton(true);
}

// ======================================
// SAVE RECENTLY PLAYED
// ======================================
function saveRecentlyPlayed(song) {
    let list = JSON.parse(localStorage.getItem("recentlyPlayed")) || [];

    list = list.filter(s => s.fileName !== song.fileName);
    list.unshift(song);
    list = list.slice(0, 10);

    localStorage.setItem("recentlyPlayed", JSON.stringify(list));
}

// ======================================
// LOAD RECENTLY PLAYED UI
// ======================================
function loadRecentlyPlayedUI() {
    const container = document.querySelector(".recently-played-row");
    const list = JSON.parse(localStorage.getItem("recentlyPlayed")) || [];

    container.innerHTML = "";

    list.forEach(song => {
        const card = document.createElement("div");
        card.classList.add("trend-card");

        card.innerHTML = `
            <img src="${song.cover}">
            <p style="margin-top:8px;font-weight:600;">${song.title}</p>
            <p style="opacity:0.7;font-size:13px;">${song.artist}</p>
        `;

        card.addEventListener("click", () => {
            const fakeCard = document.createElement("div");
            fakeCard.dataset.fileName = song.fileName;
            fakeCard.dataset.title = song.title;
            fakeCard.dataset.artist = song.artist;
            fakeCard.dataset.cover = song.cover;

            playSongFromCard(fakeCard);
        });

        container.appendChild(card);
    });
}

// ======================================
// UPDATE PLAYER INFO
// ======================================
function updateBottomPlayer(title, artist, cover) {
    document.querySelector(".sp-cover").src = cover;
    document.querySelector(".sp-title").textContent = title;
    document.querySelector(".sp-artist").textContent = artist;
}

// ======================================
// UPDATE PLAY BUTTON
// ======================================
function updatePlayButton(isPlayingNow) {
    const playBtn = document.querySelector(".sp-play");
    playBtn.textContent = isPlayingNow ? "⏸" : "▶";
}

// ======================================
// GLOBAL PLAYER CONTROLS
// ======================================
function initGlobalPlayerControls() {
    const playBtn = document.querySelector(".sp-play");
    const progressBar = document.querySelector(".sp-progress");
    const currentTimeEl = document.querySelector(".sp-current");
    const durationEl = document.querySelector(".sp-duration");
    const volumeBar = document.querySelector(".sp-volume");

    playBtn.addEventListener("click", () => {
        if (!currentSong) return;

        if (audio.paused) audio.play();
        else audio.pause();

        updatePlayButton(!audio.paused);
    });

    audio.addEventListener("loadedmetadata", () => {
        durationEl.textContent = formatTime(audio.duration);
        progressBar.max = Math.floor(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
        progressBar.value = Math.floor(audio.currentTime);
        currentTimeEl.textContent = formatTime(audio.currentTime);

        const val = (progressBar.value / progressBar.max) * 100 + "%";
        progressBar.style.setProperty("--progress", val);
    });

    progressBar.addEventListener("input", () => {
        audio.currentTime = progressBar.value;
    });

    volumeBar.addEventListener("input", () => {
        audio.volume = volumeBar.value / 100;

        const val = (volumeBar.value / volumeBar.max) * 100 + "%";
        volumeBar.style.setProperty("--vol", val);
    });
}

// ======================================
function formatTime(seconds) {
    seconds = Math.floor(seconds || 0);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ======================================
// INIT APP
// ======================================
document.addEventListener("DOMContentLoaded", () => {
    loadHomeSongs();
    loadRecentlyPlayedUI();
    initGlobalPlayerControls();
});
