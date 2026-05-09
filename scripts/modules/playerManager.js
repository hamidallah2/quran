// scripts/modules/playerManager.js
// Plyr is loaded globally via index.html script tag, so no import needed here.
import { formatTime } from './domHelpers.js';
// Import the appState object directly to access the current surahsData
import { appState as dataManagerAppState } from './dataManager.js';

let plyrInstance = null;
let domElements = {}; // Will be set by main.js

export const setDomElements = (elements) => {
    domElements = elements;
};

/**
 * Initializes the Plyr audio player instance
 * Uses the globally available Plyr constructor.
 */
export function initializePlayer() {
    // Check if Plyr is available globally
    if (typeof Plyr === 'undefined') {
        console.error("Plyr library is not loaded globally. Please check the script tag in index.html.");
        return;
    }

    if (!domElements.audioPlayer) {
        console.error("Audio player element not found for Plyr initialization.");
        return;
    }

    // Use the global Plyr constructor
    plyrInstance = new Plyr(domElements.audioPlayer, {
        controls: ['play', 'progress'],
        tooltips: { controls: true, seek: true }
    });

    plyrInstance.on('timeupdate', () => {
        if (domElements.currentTime) {
            domElements.currentTime.textContent = formatTime(plyrInstance.currentTime);
        }
        localStorage.setItem('quran_time', plyrInstance.currentTime);
    });

    plyrInstance.on('loadedmetadata', () => {
        if (domElements.totalTime) {
           domElements.totalTime.textContent = formatTime(plyrInstance.duration);
        }
    });
}

/**
 * Constructs the audio URL for the selected Surah and Moshaf
 * @returns {string|null} The full audio URL or null if not possible
 */
export function constructAudioUrl() {
    // Safety checks for DOM elements
    if (!domElements.surahSelect || !domElements.moshafSelect) {
        console.warn("DOM elements for Surah or Moshaf select not found in constructAudioUrl.");
        return null;
    }

    const surahId = domElements.surahSelect.value;
    // Get the selected Moshaf option element safely
    const selectedMoshafOption = domElements.moshafSelect.options[domElements.moshafSelect.selectedIndex];

    // Check if Surah is selected and Moshaf option with server data exists
    if (!surahId || !selectedMoshafOption || !selectedMoshafOption.dataset.server) {
        console.warn("Missing Surah ID or Moshaf server data in constructAudioUrl.");
        return null;
    }

    const serverBaseUrl = selectedMoshafOption.dataset.server;
    // Format Surah ID to 3 digits (e.g., 001, 012, 114)
    const formattedSurahId = String(surahId).padStart(3, '0');
    return `${serverBaseUrl}${formattedSurahId}.mp3`;
}

/**
 * Sets up the player UI and Plyr source, then optionally plays
 * @param {boolean} autoplay - Whether to start playing immediately
 * @param {number} startTime - Time in seconds to start playback
 */
export function setupAndLoadPlayer(autoplay = false, startTime = 0) {
    // Ensure Plyr instance is initialized
    if (!plyrInstance) {
        console.warn("Plyr instance not initialized in setupAndLoadPlayer.");
        return;
    }

    // --- Key Fix: Access the current surahsData from the shared dataManager state ---
    const currentSurahsData = dataManagerAppState.surahsData;
    // --- End Key Fix ---

    // Build the audio URL
    const audioUrl = constructAudioUrl();
    // console.log("playerManager: Constructed Audio URL:", audioUrl); // Optional debug log

    // Get selected Surah ID from the DOM
    const selectedSurahId = domElements.surahSelect?.value;
    // console.log("playerManager: Selected Surah ID (from DOM):", selectedSurahId); // Optional debug log

    // Find the full Surah object using the current data
    // Use == for potential string/number comparison from DOM value
    const selectedSurah = currentSurahsData.find(s => s?.id == selectedSurahId);
    // console.log("playerManager: Found Selected Surah Object:", selectedSurah); // Optional debug log

    // Get the selected Reciter's option element
    const selectedReciterOption = domElements.reciterSelect?.options[domElements.reciterSelect?.selectedIndex];
    // console.log("playerManager: Selected Reciter Option Element:", selectedReciterOption); // Optional debug log

    // Validate all required data and DOM elements are present
    if (!audioUrl || !selectedSurah || !selectedReciterOption || !domElements.playerWrapper) {
        console.warn("playerManager: Missing data to setup player, hiding player wrapper.", {
            audioUrl,
            selectedSurah,
            selectedReciterOption,
            playerWrapper: domElements.playerWrapper
        });
        // Ensure player is hidden if setup fails (using class for transition)
        if (domElements.playerWrapper) {
            domElements.playerWrapper.classList.remove('visible');
            // Fallback to ensure it's hidden if class transition has issues
            setTimeout(() => {
                if (!domElements.playerWrapper.classList.contains('visible')) {
                    domElements.playerWrapper.style.display = 'none';
                }
            }, 300); // Match CSS transition time
        }
        return; // Exit early if setup cannot proceed
    }

    // Update player UI elements with selected names
    if (domElements.playerSurahName) {
        domElements.playerSurahName.textContent = selectedSurah.name;
    }
    if (domElements.playerReciterName) {
        domElements.playerReciterName.textContent = selectedReciterOption.text; // Use .text for display name
    }
    // Update the download link href
    if (domElements.downloadLink) {
        domElements.downloadLink.href = audioUrl;
    }

    // Configure Plyr with the new audio source
    plyrInstance.source = {
        type: 'audio',
        title: selectedSurah.name, // Use Surah name as title
        sources: [{ src: audioUrl, type: 'audio/mp3' }] // Specify type
    };

    // Show the player wrapper UI (using class for transition)
    domElements.playerWrapper.style.display = 'flex'; // Ensure it's display flex
    // Trigger reflow to ensure the display change is registered
    // domElements.playerWrapper.offsetHeight; // This line might be needed in some browsers
    domElements.playerWrapper.classList.add('visible');

    // Set up playback once Plyr has loaded the metadata
    plyrInstance.once('loadedmetadata', () => {
        // console.log("playerManager: Plyr metadata loaded."); // Optional debug log
        // Set the start time if provided (e.g., from saved state)
        if (startTime > 0) {
            plyrInstance.currentTime = startTime;
        }
        // Attempt to play automatically if requested
        if (autoplay) {
            // console.log("playerManager: Attempting to play..."); // Optional debug log
            plyrInstance.play().catch(err => {
                // Autoplay might be blocked by the browser
                console.warn("playerManager: Autoplay prevented or failed:", err);
                // Could add UI feedback here if needed (e.g., show a play button hint)
            });
        }
    });
}

/**
 * Stops the player if it exists
 */
export function stopPlayer() {
    if (plyrInstance) {
        plyrInstance.stop();
    }
}

/**
 * Gets the Plyr instance (if needed by other modules)
 * @returns {Plyr|null} The Plyr instance or null if not initialized
 */
export function getPlyrInstance() {
    return plyrInstance;
}
