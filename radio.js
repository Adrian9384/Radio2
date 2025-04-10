document.addEventListener("DOMContentLoaded", function() {
    // DOM elements
    const audioPlayer = document.getElementById("audio-player");
    const playButtons = document.querySelectorAll(".play-button");
    const currentlyPlaying = document.getElementById("currently-playing");
    const stationStatus = document.getElementById("station-status");
    const stationImage = document.getElementById("station-image");
    const playPauseIcon = document.getElementById("playPauseIcon");
    const volumeRange = document.getElementById("volumeRange");
    const searchInput = document.getElementById("searchInput");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const favoriteButtons = document.querySelectorAll(".favorite-btn");
    const currentFavoriteBtn = document.getElementById("current-favorite-btn");
    const favoritesListContainer = document.querySelector(".favorites-list");
    const emptyFavorites = document.querySelector(".empty-favorites");
    const recentlyPlayedContainer = document.querySelector(".recently-played-list");
    const prevButton = document.getElementById("prevButton");
    const nextButton = document.getElementById("nextButton");
    
    // State management
    let currentStation = null;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];
    let isPlaying = false;
    let allStationButtons = []; // To store all play buttons for cycling
    
    // Initialize the app
    initApp();
    
    function initApp() {
        // Set initial volume
        audioPlayer.volume = volumeRange.value / 100;
        
        // Store all play buttons initially
        allStationButtons = Array.from(document.querySelectorAll(".play-button"));
        
        // Add event listeners
        setupEventListeners();
        
        // Render favorites
        renderFavorites(); // This will also update allStationButtons
        
        // Render recently played
        renderRecentlyPlayed(); // This will also update allStationButtons

        // Update Prev/Next button state initially
        updatePrevNextButtonsState();
        
        // Add error handling
        audioPlayer.addEventListener('error', handleAudioError);
    }
    
    function setupEventListeners() {
        // Play buttons
        playButtons.forEach(button => {
            button.addEventListener("click", handlePlayButtonClick);
        });
        
        // Favorite buttons
        favoriteButtons.forEach(button => {
            button.addEventListener("click", handleFavoriteClick);
            updateFavoriteButtonState(button);
        });
        
        // Current favorite button
        currentFavoriteBtn.addEventListener("click", () => {
            if (currentStation) {
                toggleFavorite(currentStation.name, currentStation.src, currentStation.img);
                updateFavoriteButtonState(currentFavoriteBtn);
                renderFavorites(); // Re-render to update favorite list display
            }
        });
        
        // Volume control
        volumeRange.addEventListener("input", () => {
            audioPlayer.volume = volumeRange.value / 100;
        });
        
        // Search functionality
        searchInput.addEventListener("input", handleSearch);
        
        // Audio player events
        audioPlayer.addEventListener("play", () => {
            isPlaying = true;
            playPauseIcon.src = "assets/Pause.svg";
            stationStatus.textContent = "Playing";
            stationStatus.style.color = "#1DB954";
            updatePrevNextButtonsState(); // Update buttons when playback starts
        });
        
        audioPlayer.addEventListener("pause", () => {
            isPlaying = false;
            playPauseIcon.src = "assets/Play.svg";
            stationStatus.textContent = "Stopped";
            stationStatus.style.color = "#b3b3b3";
             // Don't disable prev/next on pause, only if station becomes null
        });
        
        // Add play/pause toggle functionality
        document.getElementById("playPauseButton").addEventListener("click", togglePlayPause);

        // Add Prev/Next button listeners
        prevButton.addEventListener("click", playPreviousStation);
        nextButton.addEventListener("click", playNextStation);
    }
    
    function handlePlayButtonClick(event) {
        const button = event.currentTarget;
        const stationSrc = button.getAttribute("data-src");
        const stationName = button.getAttribute("data-name");
        const stationImg = button.getAttribute("data-img");
        
        showLoadingOverlay();
        
        // Save current station info
        currentStation = {
            name: stationName,
            src: stationSrc,
            img: stationImg
        };
        
        // Update player UI
        currentlyPlaying.textContent = stationName;
        stationImage.src = stationImg;
        updateFavoriteButtonState(currentFavoriteBtn);
        
        // Add to recently played
        addToRecentlyPlayed(stationName, stationSrc, stationImg);
        
        // Update all station cards to show which one is playing
        updateStationCardStyling();

        // Refresh the list of all buttons (needed if dynamic lists changed)
        allStationButtons = Array.from(document.querySelectorAll(".play-button"));
        
        // Play the station
        audioPlayer.src = stationSrc;
        audioPlayer.play()
            .then(() => {
                hideLoadingOverlay();
                updatePrevNextButtonsState(); // Update buttons on successful play
            })
            .catch(error => {
                console.error("Error playing audio:", error);
                hideLoadingOverlay();
                stationStatus.textContent = "Error";
                stationStatus.style.color = "red";
                currentStation = null; // Clear current station on error
                updatePrevNextButtonsState(); // Update buttons on error
            });
    }
    
    function togglePlayPause() {
        if (!currentStation) return;
        
        if (isPlaying) {
            audioPlayer.pause();
        } else {
            audioPlayer.play();
        }
    }
    
    function handleFavoriteClick(event) {
        const button = event.currentTarget;
        const stationName = button.getAttribute("data-station");
        const stationSrc = button.getAttribute("data-src");
        const stationImg = button.getAttribute("data-img");
        
        toggleFavorite(stationName, stationSrc, stationImg);
        updateFavoriteButtonState(button);
        renderFavorites();
    }
    
    function toggleFavorite(name, src, img) {
        const index = favorites.findIndex(station => station.name === name);
        
        if (index === -1) {
            // Add to favorites
            favorites.push({ name, src, img });
        } else {
            // Remove from favorites
            favorites.splice(index, 1);
        }
        
        // Save to localStorage
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
    
    function updateFavoriteButtonState(button) {
        const stationName = button === currentFavoriteBtn && currentStation 
            ? currentStation.name 
            : button.getAttribute("data-station");
        
        const isFavorite = favorites.some(station => station.name === stationName);
        
        if (isFavorite) {
            button.classList.add("active");
            button.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            button.classList.remove("active");
            button.innerHTML = '<i class="far fa-heart"></i>';
        }
    }
    
    function renderFavorites() {
        // Clear current favorites (except the empty message)
        const elements = favoritesListContainer.querySelectorAll(".item");
        elements.forEach(el => el.remove());
        
        // Show/hide empty favorites message
        if (favorites.length === 0) {
            emptyFavorites.style.display = "flex";
        } else {
            emptyFavorites.style.display = "none";
            
            // Add favorite stations
            favorites.forEach(station => {
                const stationElement = createStationElement(station);
                favoritesListContainer.appendChild(stationElement);
            });
            
            // Add event listeners to new buttons
            const newPlayButtons = favoritesListContainer.querySelectorAll(".play-button");
            newPlayButtons.forEach(button => {
                button.addEventListener("click", handlePlayButtonClick);
            });
            
            const newFavoriteButtons = favoritesListContainer.querySelectorAll(".favorite-btn");
            newFavoriteButtons.forEach(button => {
                button.addEventListener("click", handleFavoriteClick);
                updateFavoriteButtonState(button);
            });
        }
        // Refresh the master list of buttons and update prev/next state
        allStationButtons = Array.from(document.querySelectorAll(".play-button"));
        updatePrevNextButtonsState();
    }
    
    function addToRecentlyPlayed(name, src, img) {
        // Remove if already exists
        const existingIndex = recentlyPlayed.findIndex(station => station.name === name);
        if (existingIndex !== -1) {
            recentlyPlayed.splice(existingIndex, 1);
        }
        
        // Add to the beginning
        recentlyPlayed.unshift({ name, src, img });
        
        // Keep only the last 6 stations
        if (recentlyPlayed.length > 6) {
            recentlyPlayed = recentlyPlayed.slice(0, 6);
        }
        
        // Save to localStorage
        localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
        
        // Update the UI
        renderRecentlyPlayed();
    }
    
    function renderRecentlyPlayed() {
        // Clear current recently played
        recentlyPlayedContainer.innerHTML = '';
        
        // Add recently played stations
        if (recentlyPlayed.length > 0) {
            recentlyPlayed.forEach(station => {
                const stationElement = createStationElement(station);
                recentlyPlayedContainer.appendChild(stationElement);
            });
            
            // Add event listeners to new buttons
            const newPlayButtons = recentlyPlayedContainer.querySelectorAll(".play-button");
            newPlayButtons.forEach(button => {
                button.addEventListener("click", handlePlayButtonClick);
            });
            
            const newFavoriteButtons = recentlyPlayedContainer.querySelectorAll(".favorite-btn");
            newFavoriteButtons.forEach(button => {
                button.addEventListener("click", handleFavoriteClick);
                updateFavoriteButtonState(button);
            });
        } else {
            recentlyPlayedContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No recently played stations</p></div>';
        }
        // Refresh the master list of buttons and update prev/next state
        allStationButtons = Array.from(document.querySelectorAll(".play-button"));
        updatePrevNextButtonsState();
    }
    
    function createStationElement(station) {
        const div = document.createElement('div');
        div.className = 'item col-6 col-md-4 col-lg-2';
        div.innerHTML = `
            <div class="station-card ${currentStation && currentStation.name === station.name ? 'now-playing' : ''}">
                <img src="${station.img}" alt="${station.name} Logo" />
                <div class="play">
                    <button class="play-button" data-src="${station.src}" data-name="${station.name}" data-img="${station.img}">
                        <i class="fa fa-play"></i>
                    </button>
                </div>
                <div class="station-info">
                    <h4>${station.name}</h4>
                    <div class="station-actions">
                        <button class="favorite-btn" data-station="${station.name}" data-src="${station.src}" data-img="${station.img}">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    }
    
    function updateStationCardStyling() {
        if (!currentStation) return;
        
        // Remove the 'now-playing' class from all stations
        document.querySelectorAll('.station-card').forEach(card => {
            card.classList.remove('now-playing');
        });
        
        // Find buttons that match the current station and add the 'now-playing' class
        const allPlayButtons = document.querySelectorAll('.play-button');
        allPlayButtons.forEach(button => {
            if (button.getAttribute('data-name') === currentStation.name) {
                const stationCard = button.closest('.station-card');
                if (stationCard) {
                    stationCard.classList.add('now-playing');
                }
            }
        });
    }
    
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const allStations = document.querySelectorAll('.station-card');
        
        allStations.forEach(station => {
            const stationName = station.querySelector('h4').textContent.toLowerCase();
            const stationItem = station.closest('.item');
            
            if (stationName.includes(searchTerm)) {
                stationItem.style.display = 'block';
            } else {
                stationItem.style.display = 'none';
            }
        });
    }
    
    function showLoadingOverlay() {
        loadingOverlay.classList.add('visible');
    }
    
    function hideLoadingOverlay() {
        loadingOverlay.classList.remove('visible');
    }
    
    function handleAudioError(e) {
        console.error("Audio error:", e);
        hideLoadingOverlay();
        stationStatus.textContent = "Error loading station";
        stationStatus.style.color = "red";
        currentStation = null; // Clear current station on error
        updatePrevNextButtonsState(); // Disable prev/next buttons
        
        // Show an alert to the user
        alert("Error loading the radio station. Please try another station or check your internet connection.");
    }
    
    function findCurrentStationIndex() {
        if (!currentStation || allStationButtons.length === 0) {
            return -1;
        }
        // Match based on the source URL as it's likely unique
        return allStationButtons.findIndex(button => button.getAttribute('data-src') === currentStation.src);
    }

    function playPreviousStation() {
        const currentIndex = findCurrentStationIndex();
        if (currentIndex === -1 || allStationButtons.length <= 1) {
            return; // No current station or not enough stations to cycle
        }

        // Calculate previous index, wrapping around
        const prevIndex = (currentIndex - 1 + allStationButtons.length) % allStationButtons.length;
        
        // Simulate a click on the previous button to trigger playback
        allStationButtons[prevIndex].click(); 
    }

    function playNextStation() {
        const currentIndex = findCurrentStationIndex();
        if (currentIndex === -1 || allStationButtons.length <= 1) {
            return; // No current station or not enough stations to cycle
        }

        // Calculate next index, wrapping around
        const nextIndex = (currentIndex + 1) % allStationButtons.length;
        
        // Simulate a click on the next button to trigger playback
        allStationButtons[nextIndex].click();
    }

    function updatePrevNextButtonsState() {
        // Buttons should be enabled if a station is loaded and there's more than one station overall
        const canCycle = currentStation && allStationButtons.length > 1;
        
        prevButton.disabled = !canCycle;
        nextButton.disabled = !canCycle;

        // Update visual state (gray filter)
        const prevImg = prevButton.querySelector('img');
        const nextImg = nextButton.querySelector('img');

        if (prevImg) {
            if (canCycle) {
                prevImg.classList.remove('gray-filtered');
            } else {
                prevImg.classList.add('gray-filtered');
            }
        }
        if (nextImg) {
           if (canCycle) {
                nextImg.classList.remove('gray-filtered');
            } else {
                nextImg.classList.add('gray-filtered');
            }
        }
    }
    
    // Make togglePlayPause globally accessible for the onclick attribute in HTML
    window.togglePlayPause = togglePlayPause;
});
