// scripts/modules/downloadManager.js
import { showLoadingMessage, hideLoadingFeedback } from './domHelpers.js';

let isDownloading = false;
let domDownloadProgress = {}; // Will be set by main.js

export const setDomDownloadProgressElements = (elements) => {
    domDownloadProgress = elements;
};

/**
 * Forces download of a file with visual progress indication
 */
export async function forceDownloadWithProgress(url, filename) {
    if (isDownloading) {
        console.warn("Download already in progress.");
        return;
    }
    isDownloading = true;

    try {
        if (domDownloadProgress.container) domDownloadProgress.container.style.display = 'block';
        if (domDownloadProgress.fill) domDownloadProgress.fill.style.width = '0%';
        if (domDownloadProgress.text) domDownloadProgress.text.textContent = '0%';

        console.log(`Starting download from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        if (!contentLength) {
            console.warn("Content-Length header missing, cannot show precise progress.");
            if (domDownloadProgress.text) domDownloadProgress.text.textContent = '...جاري التحميل';
        }

        const totalBytes = contentLength ? parseInt(contentLength, 10) : null;
        let loadedBytes = 0;

        const reader = response.body.getReader();
        const chunks = [];

        const reportProgress = () => {
            if (totalBytes) {
                const percentComplete = Math.floor((loadedBytes / totalBytes) * 100);
                if (domDownloadProgress.fill) domDownloadProgress.fill.style.width = `${percentComplete}%`;
                if (domDownloadProgress.text) domDownloadProgress.text.textContent = `${percentComplete}%`;
            } else {
                const fakePercent = Math.min(99, Math.floor((loadedBytes / (1024 * 1024 * 10)) * 100));
                if (domDownloadProgress.fill) domDownloadProgress.fill.style.width = `${fakePercent}%`;
                if (domDownloadProgress.text) domDownloadProgress.text.textContent = `...جاري التحميل ${fakePercent}%`;
            }
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loadedBytes += value.length;
            reportProgress();
        }

        if (domDownloadProgress.fill) domDownloadProgress.fill.style.width = '100%';
        if (domDownloadProgress.text) domDownloadProgress.text.textContent = '100%';
        await new Promise(resolve => setTimeout(resolve, 300));

        const blob = new Blob(chunks);
        const blobUrl = URL.createObjectURL(blob);

        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = blobUrl;
        downloadAnchor.download = filename;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        URL.revokeObjectURL(blobUrl);
        console.log(`Download completed: ${filename}`);
    } catch (error) {
        console.error("Download Error:", error);
        alert('فشل التنزيل. يرجى التحقق من الرابط أو المحاولة لاحقاً.');
    } finally {
        isDownloading = false;
        setTimeout(() => {
            if (domDownloadProgress.container) domDownloadProgress.container.style.display = 'none';
        }, 500);
    }
}
