// audio.js
const audioPlayer = document.getElementById("audio-player");
let isPlaying = false;

function togglePlayPause() {
    if (!currentStation) return;

    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play();
    }
}

audioPlayer.addEventListener("play", () => {
    isPlaying = true;
    // Update UI
});

audioPlayer.addEventListener("pause", () => {
    isPlaying = false;
    // Update UI
});