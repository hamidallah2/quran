// scripts/modules/searchManager.js
import { normalizeText, highlightMatchInText, createSearchResultElement } from './domHelpers.js';

let domElements = {}; // Will be set by main.js
let recitersIndex = []; // Will be updated by dataManager
let currentFocusedResultIndex = -1;
let searchDebounceTimer = null;

export const setDomElements = (elements) => {
    domElements = elements;
};

export const updateRecitersIndex = (index) => {
    recitersIndex = index;
};

/**
 * Opens the reciter search modal
 */
export function openSearchModal() {
    if (domElements.reciterSearchOverlay) domElements.reciterSearchOverlay.style.display = 'flex';
    if (domElements.reciterSearchInput) domElements.reciterSearchInput.value = '';
    if (domElements.reciterSearchResults) domElements.reciterSearchResults.innerHTML = '';
    currentFocusedResultIndex = -1;
    updateClearSearchButtonVisibility();
    if (domElements.reciterSearchInput) domElements.reciterSearchInput.focus();
    if (domElements.reciterSearchResults) domElements.reciterSearchResults.scrollTop = 0;
}

/**
 * Closes the reciter search modal
 */
export function closeSearchModal() {
    if (domElements.reciterSearchOverlay) domElements.reciterSearchOverlay.style.display = 'none';
    currentFocusedResultIndex = -1;
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = null;
    }
}

/**
 * Handle close button click
 */
export function handleCloseButtonClick(event) {
    event.preventDefault();
    closeSearchModal();
}

/**
 * Handle clicking on overlay background to close modal
 */
export function handleOverlayClick(event) {
    // Only close if clicking directly on the overlay (not on the search box)
    if (event.target === domElements.reciterSearchOverlay) {
        closeSearchModal();
    }
}

function updateClearSearchButtonVisibility() {
    const clearButton = document.getElementById('clearSearchButton');
    if (clearButton && domElements.reciterSearchInput) {
        clearButton.style.display = domElements.reciterSearchInput.value ? 'block' : 'none';
    }
}

export function clearSearchInput() {
    if (domElements.reciterSearchInput) domElements.reciterSearchInput.value = '';
    if (domElements.reciterSearchResults) domElements.reciterSearchResults.innerHTML = '';
    currentFocusedResultIndex = -1;
    updateClearSearchButtonVisibility();
    if (domElements.reciterSearchInput) domElements.reciterSearchInput.focus();
}

export function handleSearchInput() {
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }

    const DEBOUNCE_DELAY = 300;

    searchDebounceTimer = setTimeout(() => {
        performSearch();
        searchDebounceTimer = null;
    }, DEBOUNCE_DELAY);

    updateClearSearchButtonVisibility();
}

export function performSearch() {
    if (!domElements.reciterSearchInput || !domElements.reciterSearchResults) return;

    const queryNormalized = normalizeText(domElements.reciterSearchInput.value);
    domElements.reciterSearchResults.innerHTML = '';
    currentFocusedResultIndex = -1;

    if (!queryNormalized) return;

    const filteredReciters = recitersIndex.filter(r => r._normalizedSearchName.includes(queryNormalized));

    if (filteredReciters.length === 0) {
        const noResultsItem = document.createElement('div');
        noResultsItem.className = 'search-result-item';
        noResultsItem.textContent = 'لا توجد نتائج';
        noResultsItem.style.cursor = 'default';
        noResultsItem.tabIndex = -1;
        domElements.reciterSearchResults.appendChild(noResultsItem);
    } else {
        filteredReciters.forEach((reciter, index) => {
            const highlightedName = highlightMatchInText(reciter.name, queryNormalized);
            const resultItem = createSearchResultElement(highlightedName, reciter.id, index);
            domElements.reciterSearchResults.appendChild(resultItem);
        });
    }
}

export function moveSearchResultFocus(direction) {
    if (!domElements.reciterSearchResults) return;
    const results = domElements.reciterSearchResults.querySelectorAll('.search-result-item:not([style*="cursor:default"])');
    if (results.length === 0) return;

    if (currentFocusedResultIndex >= 0 && currentFocusedResultIndex < results.length) {
        results[currentFocusedResultIndex].classList.remove('focused');
        results[currentFocusedResultIndex].blur();
    }

    let newIndex = currentFocusedResultIndex + direction;

    if (newIndex < 0) {
        newIndex = results.length - 1;
    } else if (newIndex >= results.length) {
        newIndex = 0;
    }

    currentFocusedResultIndex = newIndex;

    if (newIndex >= 0 && newIndex < results.length) {
        const newItem = results[newIndex];
        newItem.classList.add('focused');
        newItem.focus();
        newItem.scrollIntoView({ block: 'nearest' });
    }
}

export function selectFocusedSearchResult() {
    if (!domElements.reciterSearchResults || !domElements.reciterSelect) return;
    const results = domElements.reciterSearchResults.querySelectorAll('.search-result-item:not([style*="cursor:default"])');
    if (currentFocusedResultIndex >= 0 && currentFocusedResultIndex < results.length) {
        const selectedItem = results[currentFocusedResultIndex];
        if (selectedItem && selectedItem.dataset.id) {
            domElements.reciterSelect.value = selectedItem.dataset.id;
            domElements.reciterSelect.dispatchEvent(new Event('change'));
            closeSearchModal();
        }
    }
}

export function handleSearchResultClick(event) {
    if (!domElements.reciterSelect) return;
    const targetItem = event.target.closest('.search-result-item');
    if (targetItem && targetItem.dataset.id) {
        event.preventDefault();
        domElements.reciterSelect.value = targetItem.dataset.id;
        domElements.reciterSelect.dispatchEvent(new Event('change'));
        closeSearchModal();
    }
}