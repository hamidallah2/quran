// scripts/modules/api.js
import { API_BASE_URL } from '../config.js';
import { showSpinner, hideLoadingFeedback } from './domHelpers.js'; // Import UI feedback

/**
 * Generic function to fetch JSON data with improved loading feedback and error handling
 * @param {string} endpoint - The API endpoint (e.g., 'reciters', 'suwar')
 * @param {string} language - The language code (e.g., 'ar')
 * @returns {Promise<Object|null>} - The parsed JSON data or null on error
 */
export const fetchJsonData = async (endpoint, language = 'ar') => {
    const url = `${API_BASE_URL}/${endpoint}?language=${language}`;
    try {
        showSpinner();
        console.log(`Fetching data from: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status >= 500) {
                throw new Error(`Server Error (${response.status}): ${response.statusText}`);
            } else if (response.status >= 400) {
                throw new Error(`Client Request Error (${response.status}): ${response.statusText}`);
            } else {
                throw new Error(`HTTP Error (${response.status}): ${response.statusText}`);
            }
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Received non-JSON response from server.");
        }

        const jsonData = await response.json();
        hideLoadingFeedback();
        return jsonData;
    } catch (error) {
        hideLoadingFeedback();
        console.error(`API Fetch Error for ${endpoint}:`, error);

        let userMessage = 'تعذر تحميل البيانات. ';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            userMessage += 'يرجى التحقق من اتصالك بالإنترنت.';
        } else if (error.message.includes('Server Error')) {
            userMessage += 'الخادم غير متوفر حالياً. يرجى المحاولة لاحقاً.';
        } else if (error.message.includes('Client Request Error')) {
            userMessage += 'حدث خطأ في الطلب. يرجى المحاولة لاحقاً.';
        } else {
            userMessage += 'يرجى المحاولة لاحقاً.';
        }
        alert(userMessage);
        return null;
    }
};
