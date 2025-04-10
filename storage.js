let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function saveRecentlyPlayed() {
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
}
