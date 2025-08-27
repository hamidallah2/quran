// scripts/modules/domHelpers.js

/**
 * Normalizes text for search (handles Arabic & Latin diacritics/variants)
 */
export const normalizeText = (text) => (text || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .toLowerCase()
    .trim();

/**
 * Highlights matched text within a string for search results
 */
export const highlightMatchInText = (originalText, normalizedQuery) => {
    const normalizedText = normalizeText(originalText);
    const index = normalizedText.indexOf(normalizedQuery);
    if (index === -1) return originalText;
    let result = "";
    let charCount = 0;
    for (const char of originalText) {
        const normChar = normalizeText(char);
        if (charCount === index) result += "<mark>";
        result += char;
        if (charCount === index + normalizedQuery.length - 1) result += "</mark>";
        if (normChar.length) charCount++;
    }
    return result;
};

/**
 * Formats time in seconds to HH:MM:SS or MM:SS
 */
export function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

/**
 * Safely creates an HTML option element for select dropdowns.
 * @param {string} value - The option's value attribute.
 * @param {string} text - The option's display text.
 * @param {Object} [dataset={}] - An object containing data-* attributes to set.
 * @returns {HTMLOptionElement} The created option element.
 */
export function createOptionElement(value, text, dataset = {}) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    for (const [key, val] of Object.entries(dataset)) {
        if (/^[a-zA-Z0-9_-]+$/.test(key)) {
            option.dataset[key] = val;
        }
    }
    return option;
}

/**
 * Safely creates a search result item element.
 * @param {string} innerHTML - The inner HTML content (should be pre-sanitized if from user input).
 * @param {string} id - The data-id attribute value.
 * @param {number} index - The data-index attribute value.
 * @returns {HTMLDivElement} The created search result item element.
 */
export function createSearchResultElement(innerHTML, id, index) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = innerHTML; // Assumed safe from highlightMatchInText
    item.dataset.id = id;
    item.dataset.index = index;
    item.tabIndex = -1;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    return item;
}

// --- UI Update Functions ---
// These will need access to DOM elements, so we'll pass them in or manage them differently.
// Let's define them here but expect DOM elements to be passed or managed via a central object/context.

let domElements = {}; // This will be set by main.js

export const setDomElements = (elements) => {
    domElements = elements;
};

export const showLoadingMessage = (message) => {
    if (domElements.loadingMessage) {
        domElements.loadingMessage.textContent = message;
        domElements.loadingMessage.style.display = 'block';
    }
    if (domElements.spinner) {
        domElements.spinner.style.display = 'none';
    }
};

export const showSpinner = () => {
    if (domElements.spinner) {
        domElements.spinner.style.display = 'block';
    }
    if (domElements.loadingMessage) {
        domElements.loadingMessage.textContent = '';
        domElements.loadingMessage.style.display = 'none';
    }
};

export const hideLoadingFeedback = () => {
    if (domElements.spinner) {
        domElements.spinner.style.display = 'none';
    }
    if (domElements.loadingMessage) {
        domElements.loadingMessage.textContent = '';
        domElements.loadingMessage.style.display = 'none';
    }
};
