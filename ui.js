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

// Page navigation
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    
    function showPage(pageId) {
        // Hide all pages
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
            }, 10);
        }
        
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
    }
    
    // Add click event listeners to nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });
    
    // Show home page by default
    showPage('home');
});