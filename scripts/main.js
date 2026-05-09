// scripts/main.js
import { setDomElements as setDomHelpersElements, showSpinner } from './modules/domHelpers.js';
import * as dataManager     from './modules/dataManager.js';
import * as playerManager   from './modules/playerManager.js';
import * as downloadManager from './modules/downloadManager.js';
import * as searchManager   from './modules/searchManager.js';
import * as eventHandlers   from './modules/eventHandlers.js';
import * as favoritesManager from './modules/favoritesManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const DOM_ELEMENTS = {
        reciterSelect:        document.getElementById('reciterSelect'),
        moshafSelect:         document.getElementById('moshafSelect'),
        surahSelect:          document.getElementById('surahSelect'),
        loadingMessage:       document.getElementById('loadingMessage'),
        playerWrapper:        document.getElementById('player-wrapper'),
        audioPlayer:          document.getElementById('audioPlayer'),
        playerSurahName:      document.getElementById('playerSurahName'),
        playerReciterName:    document.getElementById('playerReciterName'),
        downloadLink:         document.getElementById('downloadLink'),
        currentTime:          document.getElementById('currentTime'),
        totalTime:            document.getElementById('totalTime'),
        openReciterSearch:    document.getElementById('openReciterSearch'),
        reciterSearchOverlay: document.getElementById('reciterSearchOverlay'),
        reciterSearchInput:   document.getElementById('reciterSearchInput'),
        reciterSearchResults: document.getElementById('reciterSearchResults'),
        spinner:              document.getElementById('spinner'),
    };

    const DOM_DOWNLOAD_PROGRESS = {
        container: document.getElementById('downloadProgressContainer'),
        bar:       document.getElementById('downloadProgressBar'),
        fill:      document.getElementById('downloadProgressFill'),
        text:      document.getElementById('downloadProgressText'),
    };

    setDomHelpersElements(DOM_ELEMENTS);
    dataManager.setDomElements(DOM_ELEMENTS);
    playerManager.setDomElements(DOM_ELEMENTS);
    downloadManager.setDomDownloadProgressElements(DOM_DOWNLOAD_PROGRESS);
    searchManager.setDomElements(DOM_ELEMENTS);
    eventHandlers.setDomElements(DOM_ELEMENTS);
    favoritesManager.setDomElements(DOM_ELEMENTS);

    playerManager.initializePlayer();
    eventHandlers.attachEventListeners();
    favoritesManager.init();

    // Update heart state whenever the surah dropdown changes
    DOM_ELEMENTS.surahSelect?.addEventListener('change', () => {
        favoritesManager.updateFavoriteButton();
    });
    DOM_ELEMENTS.reciterSelect?.addEventListener('change', () => {
        favoritesManager.updateFavoriteButton();
    });
    DOM_ELEMENTS.moshafSelect?.addEventListener('change', () => {
        favoritesManager.updateFavoriteButton();
    });

    (async () => {
        showSpinner();
        await dataManager.loadAndPopulateReciters('ar');
        favoritesManager.updateFavoriteButton();
    })();
});
