// ui.js
document.addEventListener("DOMContentLoaded", function() {
    const playButtons = document.querySelectorAll(".play-button");
    const favoriteButtons = document.querySelectorAll(".favorite-btn");
    const currentFavoriteBtn = document.getElementById("current-favorite-btn");
    const prevButton = document.getElementById("prevButton");
    const nextButton = document.getElementById("nextButton");
    const searchInput = document.getElementById("searchInput");

    function setupEventListeners() {
        playButtons.forEach(button => {
            button.addEventListener("click", handlePlayButtonClick);
        });

        favoriteButtons.forEach(button => {
            button.addEventListener("click", handleFavoriteClick);
        });

        currentFavoriteBtn.addEventListener("click", toggleCurrentFavorite);
        prevButton.addEventListener("click", playPreviousStation);
        nextButton.addEventListener("click", playNextStation);
        searchInput.addEventListener("input", handleSearch);
    }

    setupEventListeners();
});