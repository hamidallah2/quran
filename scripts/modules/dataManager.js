// scripts/modules/dataManager.js
import { fetchJsonData } from './api.js';
import { createOptionElement, normalizeText } from './domHelpers.js';
import * as playerManager from './playerManager.js'; // To call player setup
import * as searchManager from './searchManager.js'; // To update search index

// --- State Variables ---
// Export the entire appState object so other modules can access the current data
export let appState = {
    recitersData: [],
    recitersIndex: [], // For search
    surahsData: [], // This array will be updated, and others can access the current version
    // isDownloading is managed by downloadManager
    savedTime: 0,
    // plyrInstance is managed by playerManager
    // Search state is managed by searchManager
};

let domElements = {}; // Will be set by main.js

export const setDomElements = (elements) => {
    domElements = elements;
};

/**
 * Fetches and populates the list of reciters
 */
export async function loadAndPopulateReciters(language = 'ar') {
    domElements.reciterSelect.disabled = true;
    domElements.moshafSelect.disabled = true;
    domElements.surahSelect.disabled = true;
    domElements.reciterSelect.innerHTML = '';
    domElements.moshafSelect.innerHTML = '';
    domElements.surahSelect.innerHTML = '';
    domElements.playerWrapper.style.display = 'none';
    playerManager.stopPlayer(); // Stop player if playing

    const recitersData = await fetchJsonData(`reciters`, language);

    if (recitersData?.reciters) {
        appState.recitersData = recitersData.reciters;
        // Create index for fast search
        appState.recitersIndex = appState.recitersData.map(r => ({ ...r, _normalizedSearchName: normalizeText(r.name) }));
        // Update search manager's index
        searchManager.updateRecitersIndex(appState.recitersIndex);

        // Populate Reciter Select
        const defaultOption = createOptionElement("", "-- اختر القارئ --");
        domElements.reciterSelect.appendChild(defaultOption);

        appState.recitersData.forEach(reciter => {
            // Safely store moshaf data in dataset
            const moshafDataString = JSON.stringify(reciter.moshaf || []);
            const option = createOptionElement(
                reciter.id,
                reciter.name,
                { moshaf: moshafDataString }
            );
            domElements.reciterSelect.appendChild(option);
        });
        domElements.reciterSelect.disabled = false;

        // Check for saved state and auto-proceed
        const savedReciterId = localStorage.getItem('quran_reciter');
        if (savedReciterId && appState.recitersData.some(r => r.id == savedReciterId)) {
            domElements.reciterSelect.value = savedReciterId;
            loadAndPopulateMoshafs(); // Proceed to load Moshafs if saved reciter is valid
        }
    }
}

/**
 * Populates the Moshaf/Riwayat dropdown based on the selected reciter
 */
export function loadAndPopulateMoshafs() {
    domElements.moshafSelect.disabled = true;
    domElements.moshafSelect.innerHTML = ''; // Clear existing options
    domElements.surahSelect.disabled = true; // Reset dependent Surah select
    domElements.surahSelect.innerHTML = '';
    domElements.playerWrapper.style.display = 'none'; // Hide player
    playerManager.stopPlayer(); // Stop any playing audio

    // Get the currently selected Reciter's option element
    const selectedReciterOption = domElements.reciterSelect.options[domElements.reciterSelect.selectedIndex];
    // Check if the option exists and has the required moshaf data
    if (!selectedReciterOption || !selectedReciterOption.dataset.moshaf) return;

    try {
        // Parse the moshaf data stored in the data-moshaf attribute
        const moshafArray = JSON.parse(selectedReciterOption.dataset.moshaf || '[]');
        if (moshafArray.length > 0) {
            // Add the default "Select Moshaf" option
            const defaultOption = createOptionElement("", "-- اختر الرواية --");
            domElements.moshafSelect.appendChild(defaultOption);

            // Iterate through the moshaf array and create options
            moshafArray.forEach((moshafItem, index) => {
                // Extract server URL and surah list, provide fallbacks
                const server = moshafItem.server || '';
                const surahList = moshafItem.surah_list || '';
                // Use the moshaf name, or a fallback if missing
                const name = moshafItem.name || `رواية ${index + 1}`;

                // Create and append the option element using the helper
                const option = createOptionElement(
                    index,           // value
                    name,            // display text
                    { server: server, surahs: surahList } // data attributes
                );
                domElements.moshafSelect.appendChild(option);
            });
            // Enable the Moshaf select dropdown
            domElements.moshafSelect.disabled = false;

            // Check for saved Moshaf selection
            const savedMoshafIndex = localStorage.getItem('quran_moshaf');
            // Verify the saved index is valid for the current list of moshafs
            if (savedMoshafIndex !== null && domElements.moshafSelect.options[savedMoshafIndex]) {
                domElements.moshafSelect.value = savedMoshafIndex;
                loadAndPopulateSurahs(); // Proceed to load Surahs if saved moshaf is valid
            }
        } else {
            // If no moshafs, enable the select (might be empty, or handle differently)
            domElements.moshafSelect.disabled = false;
        }
    } catch (error) {
        // Log parsing errors
        console.error("Error parsing moshaf data:", error);
        // Enable the select even if parsing fails, so user isn't stuck
        domElements.moshafSelect.disabled = false;
    }
}


/**
 * Fetches Surah list and populates the Surah dropdown, filtered by selected Moshaf
 */
export async function loadAndPopulateSurahs(language = 'ar') {
    domElements.surahSelect.disabled = true; // Disable while loading
    domElements.surahSelect.innerHTML = ''; // Clear existing options

    // Fetch Surah data from the API
    const surahsData = await fetchJsonData(`suwar`, language);

    if (surahsData?.suwar) {
        // Update the global surahsData state with the fetched data
        appState.surahsData = surahsData.suwar;

        // Start with all surahs available
        let availableSurahs = appState.surahsData;

        // Get the currently selected Moshaf's option element
        const selectedMoshafOption = domElements.moshafSelect.options[domElements.moshafSelect.selectedIndex];
        // Check if a moshaf is selected and it has a surah list
        if (selectedMoshafOption && selectedMoshafOption.dataset.surahs) {
            // Create a Set of allowed Surah IDs for fast lookup
            const allowedSurahIds = new Set(selectedMoshafOption.dataset.surahs.split(','));
            // Filter the full surah list to only include allowed ones
            availableSurahs = appState.surahsData.filter(surah => allowedSurahIds.has(String(surah.id)));
        }

        // Populate Surah Select
        const defaultOption = createOptionElement("", "-- اختر السورة --");
        domElements.surahSelect.appendChild(defaultOption);

        availableSurahs.forEach(surah => {
            const option = createOptionElement(
                surah.id,
                surah.name
                // No additional dataset needed for surahs in this context
            );
            domElements.surahSelect.appendChild(option);
        });
        domElements.surahSelect.disabled = false; // Enable the Surah select dropdown

        // Check for saved Surah selection
        const savedSurahId = localStorage.getItem('quran_surah');
        // Verify the saved Surah ID is valid for the current filtered list
        if (savedSurahId && availableSurahs.some(s => s.id == savedSurahId)) {
            domElements.surahSelect.value = savedSurahId;
            // Retrieve saved playback time
            appState.savedTime = parseFloat(localStorage.getItem('quran_time')) || 0;
            // Setup and load the player with autoplay and saved time
            playerManager.setupAndLoadPlayer(true, appState.savedTime);
        } else {
             // If no valid saved surah, ensure player is hidden/stopped
            domElements.playerWrapper.style.display = 'none';
            playerManager.stopPlayer();
        }
    }
}
