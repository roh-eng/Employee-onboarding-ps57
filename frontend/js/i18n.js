/**
 * Simple i18n module for Enterprise Workflow Hub
 * Supports EN, ES, FR via JSON dictionaries
 */

const I18N = (function () {
    const DEFAULT_LANG = 'en';
    let currentLang = localStorage.getItem('lang') || DEFAULT_LANG;
    let dictionary = {};

    async function load(lang) {
        try {
            const res = await fetch(`i18n/${lang}.json`);
            if (!res.ok) throw new Error('Language not found');
            dictionary = await res.json();
            currentLang = lang;
            localStorage.setItem('lang', lang);
            apply();
            return true;
        } catch (e) {
            console.warn('i18n load failed for', lang, e);
            return false;
        }
    }

    function t(key, fallback) {
        return dictionary[key] || fallback || key;
    }

    function apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else {
                el.textContent = text;
            }
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = t(key);
        });
    }

    // Load default language on init
    load(currentLang);

    return { load, t, apply, getLang: () => currentLang };
})();
