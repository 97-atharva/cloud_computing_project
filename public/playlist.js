let playlists = JSON.parse(localStorage.getItem("playlists")) || [];

// Save new playlist
document.getElementById("savePlaylistBtn").addEventListener("click", () => {
    const name = document.getElementById("playlistName").value.trim();

    if (!name) {
        alert("Enter a playlist name!");
        return;
    }

    playlists.push({ name });
    localStorage.setItem("playlists", JSON.stringify(playlists));

    document.getElementById("playlistName").value = "";
    loadPlaylists();
});

// Load playlist cards
function loadPlaylists() {
    const container = document.getElementById("playlistContainer");
    container.innerHTML = "";

    playlists.forEach((pl) => {
        container.innerHTML += `
            <div class="playlist-card">
                <i class="fa fa-folder-music"></i>
                <div class="playlist-name">${pl.name}</div>
            </div>
        `;
    });
}

loadPlaylists();
