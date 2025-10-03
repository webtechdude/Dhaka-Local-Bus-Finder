let busData = [];
let locations = new Set();

// Theme handling
function initTheme() {
    // Default to dark when there is no saved preference.
    // If user explicitly saved 'light', respect that.
    if (localStorage.theme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        // saved 'dark' or no preference -> dark by default
        document.documentElement.classList.add('dark');
    }
}

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
}

// Keep the theme button icon and aria state in sync
function updateThemeIcon() {
    const btn = document.getElementById('themeSwitcher');
    const icon = document.getElementById('themeIcon');
    if (!btn || !icon) return;
    const isDark = document.documentElement.classList.contains('dark');
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    // swap classes: moon for dark, sun for light
    if (isDark) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
}

// Initialize theme
initTheme();

// Sync icon initial state
updateThemeIcon();

// Add theme toggle listener (exists in index.html)
document.getElementById('themeSwitcher')?.addEventListener('click', () => {
    toggleTheme();
    updateThemeIcon();
});

// Load bus data
const loadingStatus = document.getElementById('loadingStatus');
if (loadingStatus) loadingStatus.classList.remove('hidden');
fetch('bus.json')
    .then(response => response.json())
    .then(data => {
        busData = data.data || [];
        // Extract all unique locations from routes (support both "routes" array and legacy "route" string)
        busData.forEach(bus => {
            if (bus && Array.isArray(bus.routes)) {
                bus.routes.forEach(point => point && locations.add(point));
            } else if (bus && bus.route && typeof bus.route === 'string') {
                // legacy: split by separators
                bus.route.split(/⇄|→|-/).map(p => p && p.trim()).forEach(point => point && locations.add(point));
            }
        });
    })
    .catch(error => console.error('Error loading bus data:', error))
    .finally(() => {
        if (loadingStatus) loadingStatus.classList.add('hidden');
    });

function showSuggestions(inputElement, suggestionsElement, value) {
    // clear previous
    suggestionsElement.innerHTML = '';
    suggestionsElement._activeIndex = -1;

    if (!value || value.length < 1) {
        suggestionsElement.classList.add('hidden');
        return;
    }

    const suggestions = Array.from(locations)
        .filter(location => location.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 50); // limit

    if (!suggestions.length) {
        suggestionsElement.classList.add('hidden');
        return;
    }

    suggestions.forEach((suggestion, idx) => {
        const div = document.createElement('div');
        div.className = 'px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100';
        div.textContent = suggestion;
        div.tabIndex = 0;
        div.dataset.index = idx;
        // Use mousedown so the selection happens before blur/click handlers
        div.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            inputElement.value = suggestion;
            suggestionsElement.classList.add('hidden');
        });
        div.addEventListener('click', () => {
            inputElement.value = suggestion;
            suggestionsElement.classList.add('hidden');
        });
        suggestionsElement.appendChild(div);
    });

    // helper to set active item
    suggestionsElement.setActive = function (index) {
        const children = Array.from(suggestionsElement.children);
        if (!children.length) return;
        // clamp
        if (index < 0) index = 0;
        if (index >= children.length) index = children.length - 1;
        // remove previous
        children.forEach(ch => ch.classList.remove('bg-gray-200', 'dark:bg-gray-700'));
        const active = children[index];
        active.classList.add('bg-gray-200', 'dark:bg-gray-700');
        active.focus();
        suggestionsElement._activeIndex = index;
        // ensure visible
        active.scrollIntoView({ block: 'nearest' });
    };

    suggestionsElement.classList.remove('hidden');
}

function moveActive(suggestionsElement, delta) {
    if (!suggestionsElement || !suggestionsElement.children || !suggestionsElement.children.length) return;
    let idx = suggestionsElement._activeIndex || 0;
    idx = idx + delta;
    if (idx < 0) idx = 0;
    if (idx >= suggestionsElement.children.length) idx = suggestionsElement.children.length - 1;
    suggestionsElement.setActive(idx);
}

// Setup event listeners for input fields
const fromInput = document.getElementById('fromLocation');
const toInput = document.getElementById('toLocation');
const fromSuggestionsBox = document.getElementById('fromSuggestions');
const toSuggestionsBox = document.getElementById('toSuggestions');

fromInput && fromInput.addEventListener('input', (e) => {
    showSuggestions(e.target, fromSuggestionsBox, e.target.value);
});

toInput && toInput.addEventListener('input', (e) => {
    showSuggestions(e.target, toSuggestionsBox, e.target.value);
});

// Hide suggestions when clicking outside inputs or suggestion boxes
document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.closest('#fromLocation') && !target.closest('#fromSuggestions')) {
        fromSuggestionsBox.classList.add('hidden');
    }
    if (!target.closest('#toLocation') && !target.closest('#toSuggestions')) {
        toSuggestionsBox.classList.add('hidden');
    }
});

// Keyboard navigation: ArrowDown, ArrowUp, Enter, Escape
function attachKeyboardNavigation(inputEl, suggestionsEl) {
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            // open suggestions if closed
            if (suggestionsEl.classList.contains('hidden')) {
                showSuggestions(inputEl, suggestionsEl, inputEl.value || '');
            }
            moveActive(suggestionsEl, 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveActive(suggestionsEl, -1);
        } else if (e.key === 'Enter') {
            const idx = suggestionsEl._activeIndex;
            if (typeof idx === 'number' && suggestionsEl.children[idx]) {
                e.preventDefault();
                const val = suggestionsEl.children[idx].textContent;
                inputEl.value = val;
                suggestionsEl.classList.add('hidden');
            }
        } else if (e.key === 'Escape') {
            suggestionsEl.classList.add('hidden');
        }
    });
}

fromInput && attachKeyboardNavigation(fromInput, fromSuggestionsBox);
toInput && attachKeyboardNavigation(toInput, toSuggestionsBox);

// Toggle buttons to open suggestions
const fromToggle = document.getElementById('fromToggle');
const toToggle = document.getElementById('toToggle');
if (fromToggle) fromToggle.addEventListener('click', () => {
    if (fromSuggestionsBox.classList.contains('hidden')) {
        showSuggestions(fromInput, fromSuggestionsBox, fromInput.value || '');
        // focus first after a tick
        setTimeout(() => fromSuggestionsBox.setActive && fromSuggestionsBox.setActive(0), 0);
    } else {
        fromSuggestionsBox.classList.add('hidden');
    }
});
if (toToggle) toToggle.addEventListener('click', () => {
    if (toSuggestionsBox.classList.contains('hidden')) {
        showSuggestions(toInput, toSuggestionsBox, toInput.value || '');
        setTimeout(() => toSuggestionsBox.setActive && toSuggestionsBox.setActive(0), 0);
    } else {
        toSuggestionsBox.classList.add('hidden');
    }
});

// When a suggestion item (or the suggestions container) has focus, handle Enter/Arrows/Escape
function attachSuggestionKeyHandlers(suggestionsEl, inputEl) {
    if (!suggestionsEl) return;
    suggestionsEl.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveActive(suggestionsEl, 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveActive(suggestionsEl, -1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // prefer activeIndex, otherwise use focused element
            let idx = suggestionsEl._activeIndex;
            let el = (typeof idx === 'number' && suggestionsEl.children[idx]) ? suggestionsEl.children[idx] : document.activeElement;
            if (el && el.textContent) {
                inputEl.value = el.textContent;
                suggestionsEl.classList.add('hidden');
                inputEl.focus();
            }
        } else if (e.key === 'Escape') {
            suggestionsEl.classList.add('hidden');
            inputEl.focus();
        }
    });
}

attachSuggestionKeyHandlers(fromSuggestionsBox, fromInput);
attachSuggestionKeyHandlers(toSuggestionsBox, toInput);

function findRoutes() {
    const fromLocation = document.getElementById('fromLocation').value;
    const toLocation = document.getElementById('toLocation').value;
    const resultsDiv = document.getElementById('results');

    if (!fromLocation || !toLocation) {
        resultsDiv.innerHTML = '<p class="text-red-600 dark:text-red-400">Please enter both locations</p>';
        return;
    }

    const matchingRoutes = busData.filter(bus => {
        const points = Array.isArray(bus.routes) ? bus.routes : (bus.route ? bus.route.split(/⇄|→|-/).map(p => p.trim()) : []);
        if (!points || !points.length) return false;

        const fromIndex = points.findIndex(point => point.toLowerCase().includes(fromLocation.toLowerCase()));
        const toIndex = points.findIndex(point => point.toLowerCase().includes(toLocation.toLowerCase()));
        return fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex;
    });

    if (matchingRoutes.length === 0) {
        resultsDiv.innerHTML = '<p class="text-gray-700 dark:text-gray-200">No direct routes found</p>';
        return;
    }

    let html = '<h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Available Routes:</h2>';
    matchingRoutes.forEach(bus => {
        const name = bus.english || bus.bus || 'Unnamed';
        const bangla = bus.bangla ? ` (${bus.bangla})` : '';
        const routeStr = Array.isArray(bus.routes) ? bus.routes.join(' ⇄ ') : (bus.route || '');
        html += `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
                <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">${name}${bangla}</h3>
                <p class="text-gray-700 dark:text-gray-200 mb-2"><strong>Route:</strong> ${routeStr}</p>
                ${bus.service_type ? `<p class="text-gray-700 dark:text-gray-200 mb-2"><strong>Service Type:</strong> ${bus.service_type}</p>` : ''}
                ${bus.time ? `<p class="text-gray-700 dark:text-gray-200 mb-2"><strong>Time:</strong> ${bus.time}</p>` : ''}
                ${bus.image ? `<img src="${bus.image}" alt="${name}" class="max-w-[200px] mt-4 rounded-lg">` : ''}
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
}