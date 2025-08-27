// scripts/modules/eventHandlers.js
import * as dataManager from './dataManager.js';
import * as playerManager from './playerManager.js';
import * as downloadManager from './downloadManager.js';
import * as searchManager from './searchManager.js';

let domElements = {}; // Will be set by main.js

export const setDomElements = (elements) => {
    domElements = elements;
};

// --- Event Listener Handlers ---

export function handleLanguageChange() { // Even though language select is removed, keep for potential future reintroduction or error handling
    console.warn("Language change handler called, but language select is removed.");
    // localStorage.setItem('quran_language', domElements.languageSelect?.value);
    // playerManager.stopPlayer();
    // if (domElements.playerWrapper) domElements.playerWrapper.style.display = 'none';
    // dataManager.loadAndPopulateReciters(domElements.languageSelect?.value || 'ar');
}

export function handleReciterChange() {
    if (!domElements.reciterSelect) return;
    localStorage.setItem('quran_reciter', domElements.reciterSelect.value);
    localStorage.removeItem('quran_surah');
    localStorage.removeItem('quran_time');
    // Reset downstream selects (Moshaf, Surah, Player) - handled in dataManager
    dataManager.loadAndPopulateMoshafs();
}

export function handleMoshafChange() {
    if (!domElements.moshafSelect) return;
    localStorage.setItem('quran_moshaf', domElements.moshafSelect.value);
    localStorage.removeItem('quran_surah');
    localStorage.removeItem('quran_time');
    // Reset downstream selects (Surah, Player) - handled in dataManager
    dataManager.loadAndPopulateSurahs(); // Assuming language is fixed to 'ar'
}

// scripts/modules/eventHandlers.js (inside the handleSurahChange function)

export function handleSurahChange() {
    console.log("eventHandlers.handleSurahChange called"); // <-- Add this
    if (!domElements.surahSelect) {
        console.error("surahSelect element not found in handleSurahChange");
        return;
    }
    localStorage.setItem('quran_surah', domElements.surahSelect.value);
    localStorage.removeItem('quran_time');
    console.log("Selected Surah ID:", domElements.surahSelect.value); // <-- Add this
    if (domElements.surahSelect.value) {
        console.log("Calling playerManager.setupAndLoadPlayer(true)"); // <-- Add this
        playerManager.setupAndLoadPlayer(true); // Autoplay on selection
    } else {
        console.log("No Surah selected, hiding player"); // <-- Add this
        if (domElements.playerWrapper) domElements.playerWrapper.style.display = 'none';
        playerManager.stopPlayer();
    }
}

export function handleDownloadClick(event) {
    event.preventDefault();
    if (!domElements.reciterSelect || !domElements.surahSelect || !domElements.downloadLink) return;

    const selectedReciterOption = domElements.reciterSelect.options[domElements.reciterSelect.selectedIndex];
    const selectedSurah = dataManager.appState.surahsData.find(s => s.id == domElements.surahSelect.value);
    const audioUrl = domElements.downloadLink.href;

    if (audioUrl && audioUrl !== '#' && selectedReciterOption && selectedSurah) {
        const filename = `${selectedReciterOption.text}_${selectedSurah.name}.mp3`;
        downloadManager.forceDownloadWithProgress(audioUrl, filename);
    } else {
        alert('لا يمكن تحميل السورة المحددة.');
    }
}

// --- Event Listener Attachment ---
export function attachEventListeners() {
    // Main controls
    // domElements.languageSelect?.addEventListener('change', handleLanguageChange); // Removed
    domElements.reciterSelect?.addEventListener('change', handleReciterChange);
    domElements.moshafSelect?.addEventListener('change', handleMoshafChange);
    domElements.surahSelect?.addEventListener('change', handleSurahChange);
    domElements.downloadLink?.addEventListener('click', handleDownloadClick);

    // Search modal - Open button
    domElements.openReciterSearch?.addEventListener('click', searchManager.openSearchModal);
    
    // Search modal - Close button
    const closeSearchButton = document.getElementById('closeSearchButton');
    if (closeSearchButton) {
        closeSearchButton.addEventListener('click', searchManager.handleCloseButtonClick);
    }
    
    // Search modal - Overlay background click to close
    domElements.reciterSearchOverlay?.addEventListener('click', searchManager.handleOverlayClick);

    // Search modal - Global keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Only handle keys when search overlay is visible
        if (domElements.reciterSearchOverlay?.style.display === 'flex') {
            switch(e.key) {
                case 'Escape':
                    e.preventDefault();
                    e.stopPropagation();
                    searchManager.closeSearchModal();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    searchManager.moveSearchResultFocus(1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    searchManager.moveSearchResultFocus(-1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    searchManager.selectFocusedSearchResult();
                    break;
            }
        }
    });

    // Search input events
    domElements.reciterSearchInput?.addEventListener('input', searchManager.handleSearchInput);
    domElements.reciterSearchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            searchManager.clearSearchInput();
        }
    });

    // Search results click
    domElements.reciterSearchResults?.addEventListener('click', searchManager.handleSearchResultClick);

    // Clear search button
    const clearSearchButton = document.getElementById('clearSearchButton');
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', (e) => {
            e.preventDefault();
            searchManager.clearSearchInput();
        });
    }
}