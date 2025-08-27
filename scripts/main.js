// scripts/main.js
// Import helper functions for DOM manipulation and UI feedback
import { setDomElements as setDomHelpersElements, showSpinner } from './modules/domHelpers.js';
// Import modules for different aspects of the application
import * as dataManager from './modules/dataManager.js';
import * as playerManager from './modules/playerManager.js';
import * as downloadManager from './modules/downloadManager.js';
import * as searchManager from './modules/searchManager.js';
import * as eventHandlers from './modules/eventHandlers.js';
// api module is imported by dataManager, no direct import needed here

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selection (Centralized) ---
    // Get references to all the important DOM elements the app needs.
    // This is done once at startup for efficiency.
    const DOM_ELEMENTS = {
        // Language Select is removed/commented out in HTML
        // languageSelect: document.getElementById('languageSelect'),
        reciterSelect: document.getElementById('reciterSelect'),
        moshafSelect: document.getElementById('moshafSelect'),
        surahSelect: document.getElementById('surahSelect'),
        loadingMessage: document.getElementById('loadingMessage'),
        playerWrapper: document.getElementById('player-wrapper'),
        audioPlayer: document.getElementById('audioPlayer'),
        playerSurahName: document.getElementById('playerSurahName'),
        playerReciterName: document.getElementById('playerReciterName'),
        downloadLink: document.getElementById('downloadLink'),
        currentTime: document.getElementById('currentTime'),
        totalTime: document.getElementById('totalTime'),
        openReciterSearch: document.getElementById('openReciterSearch'),
        reciterSearchOverlay: document.getElementById('reciterSearchOverlay'),
        reciterSearchInput: document.getElementById('reciterSearchInput'),
        reciterSearchResults: document.getElementById('reciterSearchResults'),
        spinner: document.getElementById('spinner'), // Added for visual feedback
    };

    // Get references to the download progress bar elements
    const DOM_DOWNLOAD_PROGRESS = {
        container: document.getElementById('downloadProgressContainer'),
        bar: document.getElementById('downloadProgressBar'),
        fill: document.getElementById('downloadProgressFill'),
        text: document.getElementById('downloadProgressText')
    };

    // --- Share DOM Elements and State with Modules ---
    // Pass the DOM element references to the modules that need them.
    // This allows modules to interact with the page without needing
    // direct access to `document.getElementById` everywhere.
    setDomHelpersElements(DOM_ELEMENTS); // For UI feedback functions
    dataManager.setDomElements(DOM_ELEMENTS); // For data loading/population
    playerManager.setDomElements(DOM_ELEMENTS); // For Plyr player control
    // NOTE: playerManager now gets surahsData directly from dataManager's exported appState
    downloadManager.setDomDownloadProgressElements(DOM_DOWNLOAD_PROGRESS); // For download UI
    searchManager.setDomElements(DOM_ELEMENTS); // For search modal logic
    eventHandlers.setDomElements(DOM_ELEMENTS); // For main event listeners

    // --- Initialize Components ---
    // Set up the Plyr audio player. This must happen after the audio element exists.
    playerManager.initializePlayer();
    // Attach all the event listeners (e.g., for dropdown changes, button clicks).
    eventHandlers.attachEventListeners();

    // --- Initial Data Load ---
    // Start the process by loading the list of reciters.
    // Show a spinner while this initial data is being fetched.
    (async () => {
        showSpinner(); // Show visual loading indicator
        // Assuming language is fixed to 'ar' as per previous simplification
        await dataManager.loadAndPopulateReciters('ar');
    })();
});
