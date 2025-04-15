// Radio Browser API base URL
const RADIO_BROWSER_API = 'https://de2.api.radio-browser.info/json';

// Cache for filter options
let filterCache = {
    countries: [],
    languages: [],
    genres: []
};

// Current filters
let currentFilters = {
    country: 'Romania',
    language: '',
    genre: '',
    bitrate: '',
    codec: ''
};

// Pagination settings
const STATIONS_PER_PAGE = 20;
let currentPage = 1;
let totalStations = 0;
let allStations = [];

// Initialize browse page
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('browse-page')) {
        initializeBrowsePage();
    }
    
    // Add event listener for page navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });
});

async function initializeBrowsePage() {
    // Load filter options
    await loadFilterOptions();
    
    // Set up event listeners
    setupFilterListeners();
    
    // Set default country to Romania
    document.getElementById('countryFilter').value = 'Romania';
    
    // Load initial stations
    loadStations();
}

async function loadFilterOptions() {
    try {
        // Load countries
        const countriesResponse = await fetch(`${RADIO_BROWSER_API}/countries`);
        filterCache.countries = await countriesResponse.json();
        populateSelect('countryFilter', filterCache.countries, 'name');

        // Load languages
        const languagesResponse = await fetch(`${RADIO_BROWSER_API}/languages`);
        filterCache.languages = await languagesResponse.json();
        populateSelect('languageFilter', filterCache.languages, 'name');

        // Load genres
        const genresResponse = await fetch(`${RADIO_BROWSER_API}/tags`);
        filterCache.genres = await genresResponse.json();
        populateSelect('genreFilter', filterCache.genres, 'name');
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

function populateSelect(selectId, data, nameField) {
    const select = document.getElementById(selectId);
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[nameField];
        option.textContent = item[nameField];
        select.appendChild(option);
    });
}

function setupFilterListeners() {
    // Apply filters button
    document.getElementById('applyFilters').addEventListener('click', () => {
        currentFilters = {
            country: document.getElementById('countryFilter').value,
            language: document.getElementById('languageFilter').value,
            genre: document.getElementById('genreFilter').value,
            bitrate: document.getElementById('bitrateFilter').value,
            codec: document.getElementById('codecFilter').value
        };
        currentPage = 1;
        loadStations();
    });

    // Reset filters button
    document.getElementById('resetFilters').addEventListener('click', () => {
        document.getElementById('countryFilter').value = '';
        document.getElementById('languageFilter').value = '';
        document.getElementById('genreFilter').value = '';
        document.getElementById('bitrateFilter').value = '';
        document.getElementById('codecFilter').value = '';
        currentFilters = {
            country: '',
            language: '',
            genre: '',
            bitrate: '',
            codec: ''
        };
        currentPage = 1;
        loadStations();
    });

    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (isScrolledToBottom() && !isLoading() && hasMoreStations()) {
            currentPage++;
            displayStations();
        }
    });
}

function isScrolledToBottom() {
    return window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
}

function isLoading() {
    return document.getElementById('browseLoadingSpinner').style.display === 'flex';
}

function hasMoreStations() {
    return currentPage * STATIONS_PER_PAGE < totalStations;
}

async function loadStations() {
    const stationsList = document.getElementById('browseStationsList');
    const loadingSpinner = document.getElementById('browseLoadingSpinner');
    const stationsCount = document.getElementById('stationsCount');

    // Show loading state
    stationsList.innerHTML = '';
    loadingSpinner.style.display = 'flex';
    stationsCount.textContent = 'Loading stations...';

    try {
        // Build query parameters
        const params = new URLSearchParams();
        if (currentFilters.country) params.append('country', currentFilters.country);
        if (currentFilters.language) params.append('language', currentFilters.language);
        if (currentFilters.genre) params.append('tag', currentFilters.genre);
        if (currentFilters.bitrate) params.append('bitrateMin', currentFilters.bitrate);
        if (currentFilters.codec) params.append('codec', currentFilters.codec);

        // Fetch stations
        const response = await fetch(`${RADIO_BROWSER_API}/stations/search?${params.toString()}`);
        allStations = await response.json();
        totalStations = allStations.length;

        // Update UI
        stationsCount.textContent = `${totalStations} stations found`;
        displayStations();
    } catch (error) {
        console.error('Error loading stations:', error);
        stationsCount.textContent = 'Error loading stations';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

function displayStations() {
    const stationsList = document.getElementById('browseStationsList');
    const loadingSpinner = document.getElementById('browseLoadingSpinner');
    
    // Show loading spinner if loading more stations
    if (currentPage > 1) {
        loadingSpinner.style.display = 'flex';
    }

    // Calculate the range of stations to display
    const startIndex = 0;
    const endIndex = currentPage * STATIONS_PER_PAGE;
    const stationsToDisplay = allStations.slice(startIndex, endIndex);

    // Update the stations list
    stationsList.innerHTML = stationsToDisplay.map(station => createStationCard(station)).join('');

    // Initialize play buttons for the new stations
    initializePlayButtons();
    
    // Initialize favorite buttons for the new stations
    initializeFavoriteButtons();

    // Hide loading spinner
    loadingSpinner.style.display = 'none';
}

function initializePlayButtons() {
    const playButtons = document.querySelectorAll('#browseStationsList .play-button');
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const stationSrc = this.getAttribute('data-src');
            const stationName = this.getAttribute('data-name');
            const stationImg = this.getAttribute('data-img');
            
            // Update the audio player
            const audioPlayer = document.getElementById('audio-player');
            audioPlayer.src = stationSrc;
            audioPlayer.play();
            
            // Update the now playing info
            document.getElementById('currently-playing').textContent = stationName;
            document.getElementById('station-image').src = stationImg;
            document.getElementById('station-status').textContent = 'Playing';
            
            // Update the play/pause button
            const playPauseButton = document.getElementById('playPauseButton');
            const playPauseIcon = document.getElementById('playPauseIcon');
            playPauseIcon.src = 'assets/Pause.svg';
            
            // Add to recently played
            addToRecentlyPlayed({
                name: stationName,
                src: stationSrc,
                img: stationImg
            });
        });
    });
}

function initializeFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('#browseStationsList .favorite-btn');
    favoriteButtons.forEach(button => {
        // Check if station is already in favorites
        const stationName = button.getAttribute('data-station');
        const isFavorite = isStationInFavorites(stationName);
        
        // Update button icon based on favorite status
        const icon = button.querySelector('i');
        if (isFavorite) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
        
        // Add click event listener
        button.addEventListener('click', function() {
            const stationName = this.getAttribute('data-station');
            const stationSrc = this.getAttribute('data-src');
            const stationImg = this.getAttribute('data-img');
            
            toggleFavorite({
                name: stationName,
                src: stationSrc,
                img: stationImg
            });
            
            // Update button icon
            const icon = this.querySelector('i');
            if (isStationInFavorites(stationName)) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        });
    });
}

function isStationInFavorites(stationName) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.some(station => station.name === stationName);
}

function toggleFavorite(station) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.findIndex(fav => fav.name === station.name);
    
    if (index === -1) {
        // Add to favorites
        favorites.push(station);
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Refresh favorites page if it's currently visible
    const favoritesPage = document.getElementById('favorites-page');
    if (favoritesPage && favoritesPage.style.display !== 'none') {
        updateFavoritesList();
    }
}

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(`${pageId}-page`);
    if (selectedPage) {
        selectedPage.style.display = 'block';
        setTimeout(() => {
            selectedPage.classList.add('active');
            
            // Initialize favorites page if it's being shown
            if (pageId === 'favorites') {
                updateFavoritesList();
            }
            // Initialize recently played page if it's being shown
            else if (pageId === 'recent') {
                updateRecentlyPlayedList();
            }
        }, 10);
    }
    
    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
}

// Function to update the favorites list
function updateFavoritesList() {
    const favoritesList = document.querySelector('.favorites-list');
    const emptyFavorites = document.querySelector('.empty-favorites');
    
    // Get current favorites
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (favorites.length === 0) {
        // Show empty state
        favoritesList.innerHTML = `
            <div class="empty-favorites">
                <i class="fas fa-heart"></i>
                <p>Add stations to your favorites by clicking the heart icon</p>
            </div>
        `;
    } else {
        // Clear empty state if it exists
        if (emptyFavorites) {
            emptyFavorites.remove();
        }
        
        // Update favorites list
        favoritesList.innerHTML = favorites.map(station => createStationCard(station)).join('');
        
        // Initialize play buttons for favorites
        const playButtons = favoritesList.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            button.addEventListener('click', function() {
                const stationSrc = this.getAttribute('data-src');
                const stationName = this.getAttribute('data-name');
                const stationImg = this.getAttribute('data-img');
                
                // Update the audio player
                const audioPlayer = document.getElementById('audio-player');
                audioPlayer.src = stationSrc;
                audioPlayer.play();
                
                // Update the now playing info
                document.getElementById('currently-playing').textContent = stationName;
                document.getElementById('station-image').src = stationImg;
                document.getElementById('station-status').textContent = 'Playing';
                
                // Update the play/pause button
                const playPauseIcon = document.getElementById('playPauseIcon');
                playPauseIcon.src = 'assets/Pause.svg';
                
                // Add to recently played
                addToRecentlyPlayed({
                    name: stationName,
                    src: stationSrc,
                    img: stationImg
                });
            });
        });
        
        // Initialize favorite buttons for favorites
        const favoriteButtons = favoritesList.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const stationName = this.getAttribute('data-station');
                const stationSrc = this.getAttribute('data-src');
                const stationImg = this.getAttribute('data-img');
                
                toggleFavorite({
                    name: stationName,
                    src: stationSrc,
                    img: stationImg
                });
                
                // Update the favorites list immediately
                updateFavoritesList();
            });
        });
    }
}

// Function to update the recently played list
function updateRecentlyPlayedList() {
    const recentlyPlayedList = document.querySelector('.recently-played-list');
    const emptyRecent = document.querySelector('.empty-recent');
    
    // Get current recently played stations
    const recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
    
    if (recentlyPlayed.length === 0) {
        // Show empty state
        recentlyPlayedList.innerHTML = `
            <div class="empty-recent">
                <i class="fas fa-history"></i>
                <p>No recently played stations</p>
            </div>
        `;
    } else {
        // Clear empty state if it exists
        if (emptyRecent) {
            emptyRecent.remove();
        }
        
        // Update recently played list
        recentlyPlayedList.innerHTML = recentlyPlayed.map(station => createStationCard(station)).join('');
        
        // Initialize play buttons for recently played stations
        const playButtons = recentlyPlayedList.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            button.addEventListener('click', function() {
                const stationSrc = this.getAttribute('data-src');
                const stationName = this.getAttribute('data-name');
                const stationImg = this.getAttribute('data-img');
                
                // Update the audio player
                const audioPlayer = document.getElementById('audio-player');
                audioPlayer.src = stationSrc;
                audioPlayer.play();
                
                // Update the now playing info
                document.getElementById('currently-playing').textContent = stationName;
                document.getElementById('station-image').src = stationImg;
                document.getElementById('station-status').textContent = 'Playing';
                
                // Update the play/pause button
                const playPauseIcon = document.getElementById('playPauseIcon');
                playPauseIcon.src = 'assets/Pause.svg';
                
                // Add to recently played
                addToRecentlyPlayed({
                    name: stationName,
                    src: stationSrc,
                    img: stationImg
                });
            });
        });
        
        // Initialize favorite buttons for recently played stations
        const favoriteButtons = recentlyPlayedList.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const stationName = this.getAttribute('data-station');
                const stationSrc = this.getAttribute('data-src');
                const stationImg = this.getAttribute('data-img');
                
                toggleFavorite({
                    name: stationName,
                    src: stationSrc,
                    img: stationImg
                });
                
                // Update the favorites list if it's visible
                const favoritesPage = document.getElementById('favorites-page');
                if (favoritesPage && favoritesPage.style.display !== 'none') {
                    updateFavoritesList();
                }
            });
        });
    }
}

// Function to add a station to recently played
function addToRecentlyPlayed(station) {
    let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
    
    // Remove the station if it already exists (to avoid duplicates)
    recentlyPlayed = recentlyPlayed.filter(s => s.name !== station.name);
    
    // Add the station to the beginning of the array
    recentlyPlayed.unshift(station);
    
    // Keep only the last 20 stations
    if (recentlyPlayed.length > 20) {
        recentlyPlayed = recentlyPlayed.slice(0, 20);
    }
    
    // Save to localStorage
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
    
    // Update the recently played list if it's visible
    const recentPage = document.getElementById('recent-page');
    if (recentPage && recentPage.style.display !== 'none') {
        updateRecentlyPlayedList();
    }
}

function createStationCard(station) {
    // Use station.url for Radio Browser API stations, station.src for stored stations
    const streamUrl = station.url || station.src;
    const stationName = station.name;
    const stationImage = station.favicon || station.img || './images/radio-default.jpg';
    
    return `
        <div class="item">
            <div class="station-card">
                <img src="${stationImage}" alt="${stationName}" onerror="this.src='./images/radio-default.jpg'" />
                <div class="play">
                    <button class="play-button" data-src="${streamUrl}" data-name="${stationName}" data-img="${stationImage}">
                        <i class="fa fa-play"></i>
                    </button>
                </div>
                <div class="station-info">
                    <h4>${stationName}</h4>
                    <div class="station-actions">
                        <button class="favorite-btn" data-station="${stationName}" data-src="${streamUrl}" data-img="${stationImage}">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
} 