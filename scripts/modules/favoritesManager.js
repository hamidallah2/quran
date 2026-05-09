// scripts/modules/favoritesManager.js
import { appState } from './dataManager.js';
import * as dataManager from './dataManager.js';
import * as playerManager from './playerManager.js';

const STORAGE_KEY = 'quran_favorites';

let domElements = {};
let favoritesPanel = null;
let favoriteBtn = null;
let favCount = null;

export function setDomElements(elements) {
    domElements = elements;
}

// ── Storage helpers ────────────────────────────────────────────────────────────

export function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveFavorites(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Build a unique key for a specific reciter+moshaf+surah combo */
function makeKey(reciterId, moshafIndex, surahId) {
    return `${reciterId}__${moshafIndex}__${surahId}`;
}

export function isFavorite(reciterId, moshafIndex, surahId) {
    const key = makeKey(reciterId, moshafIndex, surahId);
    return getFavorites().some(f => f.key === key);
}

export function toggleFavorite() {
    const { reciterSelect, moshafSelect, surahSelect } = domElements;
    if (!reciterSelect || !moshafSelect || !surahSelect) return;

    const reciterId   = reciterSelect.value;
    const moshafIndex = moshafSelect.value;
    const surahId     = surahSelect.value;
    if (!reciterId || !moshafIndex || !surahId) return;

    const reciterName = reciterSelect.options[reciterSelect.selectedIndex]?.text || '';
    const moshafName  = moshafSelect.options[moshafSelect.selectedIndex]?.text  || '';
    const surahName   = surahSelect.options[surahSelect.selectedIndex]?.text    || '';

    const key  = makeKey(reciterId, moshafIndex, surahId);
    let list   = getFavorites();
    const idx  = list.findIndex(f => f.key === key);

    if (idx === -1) {
        list.push({ key, reciterId, reciterName, moshafIndex, moshafName, surahId, surahName });
    } else {
        list.splice(idx, 1);
    }

    saveFavorites(list);
    updateFavoriteButton();
    updateFavCount();
    if (favoritesPanel && !favoritesPanel.classList.contains('hidden')) {
        renderFavoritesList();
    }
}

// ── UI: heart button state ────────────────────────────────────────────────────

export function updateFavoriteButton() {
    if (!favoriteBtn) return;
    const { reciterSelect, moshafSelect, surahSelect } = domElements;
    const active = reciterSelect?.value && moshafSelect?.value && surahSelect?.value
        ? isFavorite(reciterSelect.value, moshafSelect.value, surahSelect.value)
        : false;

    favoriteBtn.classList.toggle('active', active);
    favoriteBtn.title = active ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة';
}

function updateFavCount() {
    if (!favCount) return;
    const n = getFavorites().length;
    favCount.textContent = n;
    favCount.style.display = n > 0 ? 'flex' : 'none';
}

// ── Panel: render list ────────────────────────────────────────────────────────

function renderFavoritesList() {
    const list = getFavorites();
    const container = document.getElementById('favoritesList');
    if (!container) return;

    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `
            <div class="fav-empty">
                <i class="fas fa-heart-broken"></i>
                <p>لا توجد مفضلات بعد</p>
                <span>اضغط على القلب أثناء الاستماع لإضافة سورة</span>
            </div>`;
        return;
    }

    list.forEach((fav, i) => {
        const item = document.createElement('div');
        item.className = 'fav-item';
        item.innerHTML = `
            <div class="fav-item-info">
                <div class="fav-surah-name">${escapeHtml(fav.surahName)}</div>
                <div class="fav-meta">${escapeHtml(fav.reciterName)} · ${escapeHtml(fav.moshafName)}</div>
            </div>
            <div class="fav-item-actions">
                <button class="fav-play-btn" data-idx="${i}" title="تشغيل">
                    <i class="fas fa-play"></i>
                </button>
                <button class="fav-remove-btn" data-idx="${i}" title="إزالة">
                    <i class="fas fa-times"></i>
                </button>
            </div>`;
        container.appendChild(item);
    });

    // Play
    container.querySelectorAll('.fav-play-btn').forEach(btn => {
        btn.addEventListener('click', () => loadFavorite(list[+btn.dataset.idx]));
    });

    // Remove
    container.querySelectorAll('.fav-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const updated = getFavorites();
            updated.splice(+btn.dataset.idx, 1);
            saveFavorites(updated);
            updateFavCount();
            updateFavoriteButton();
            renderFavoritesList();
        });
    });
}

// ── Load a favorite ───────────────────────────────────────────────────────────

async function loadFavorite(fav) {
    closeFavoritesPanel();

    const { reciterSelect, moshafSelect, surahSelect } = domElements;
    if (!reciterSelect) return;

    // 1. Set reciter
    reciterSelect.value = fav.reciterId;
    if (reciterSelect.value !== String(fav.reciterId)) {
        console.warn('Reciter not found in list:', fav.reciterId);
        return;
    }
    localStorage.setItem('quran_reciter', fav.reciterId);
    localStorage.removeItem('quran_surah');
    localStorage.removeItem('quran_time');

    // 2. Populate moshafs synchronously (no async needed)
    dataManager.loadAndPopulateMoshafs();

    // 3. Set moshaf
    if (moshafSelect) {
        moshafSelect.value = fav.moshafIndex;
        localStorage.setItem('quran_moshaf', fav.moshafIndex);
    }

    // 4. Load & populate surahs, then set surah
    await dataManager.loadAndPopulateSurahs();

    if (surahSelect) {
        surahSelect.value = fav.surahId;
        localStorage.setItem('quran_surah', fav.surahId);
    }

    // 5. Play
    playerManager.setupAndLoadPlayer(true);
    updateFavoriteButton();
}

// ── Panel open/close ──────────────────────────────────────────────────────────

function openFavoritesPanel() {
    if (!favoritesPanel) return;
    renderFavoritesList();
    favoritesPanel.classList.remove('hidden');
    favoritesPanel.classList.add('visible');
}

function closeFavoritesPanel() {
    if (!favoritesPanel) return;
    favoritesPanel.classList.remove('visible');
    favoritesPanel.classList.add('hidden');
}

// ── Init ──────────────────────────────────────────────────────────────────────

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function init() {
    favoritesPanel = document.getElementById('favoritesPanel');
    favoriteBtn    = document.getElementById('favoriteBtn');
    favCount       = document.getElementById('favCount');

    favoriteBtn?.addEventListener('click', toggleFavorite);

    document.getElementById('openFavoritesPanel')
        ?.addEventListener('click', openFavoritesPanel);

    document.getElementById('closeFavoritesPanel')
        ?.addEventListener('click', closeFavoritesPanel);

    // Close on overlay click
    favoritesPanel?.addEventListener('click', e => {
        if (e.target === favoritesPanel) closeFavoritesPanel();
    });

    updateFavCount();
}
