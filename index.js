const PRIMARY_API = 'https://restcountries.com/v3.1/all';
const FALLBACK_API = 'https://cdn.jsdelivr.net/npm/world-countries@5/countries.json';

const countriesContainer = document.getElementById('countries-container');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const filterByRegion = document.getElementById('filter-by-region');
const sortBySelect = document.getElementById('sort-by');
const countryCountBadge = document.getElementById('country-count');
const themeToggleBtn = document.getElementById('theme-toggle');

let allCountries = [];
let filteredCountries = [];

// Initialize Theme
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        updateThemeBtnUI(true);
    } else {
        updateThemeBtnUI(false);
    }
}

function updateThemeBtnUI(isDark) {
    if (!themeToggleBtn) return;
    if (isDark) {
        themeToggleBtn.innerHTML = `<i class="fa-solid fa-sun" style="color:#f59e0b;"></i> <span class="theme-text">Light Mode</span>`;
    } else {
        themeToggleBtn.innerHTML = `<i class="fa-solid fa-moon"></i> <span class="theme-text">Dark Mode</span>`;
    }
}

themeToggleBtn?.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeBtnUI(isDark);
});

// Render Skeletons during Loading
function renderSkeletons() {
    countriesContainer.innerHTML = '';
    const skeletonHTML = Array(12).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-flag"></div>
            <div class="skeleton-content">
                <div class="skeleton-title-line"></div>
                <div class="skeleton-line" style="width: 80%;"></div>
                <div class="skeleton-line" style="width: 60%;"></div>
                <div class="skeleton-line" style="width: 70%;"></div>
            </div>
        </div>
    `).join('');
    countriesContainer.innerHTML = skeletonHTML;
}

// Normalize country object so both API responses work identically
function normalizeCountry(c) {
    const cca2 = c.cca2 ? c.cca2.toLowerCase() : 'un';
    return {
        name: c.name || { common: 'Unknown', official: '' },
        capital: Array.isArray(c.capital) ? c.capital : (c.capital ? [c.capital] : []),
        region: c.region || 'Unknown',
        subregion: c.subregion || '',
        population: c.population || 0,
        area: c.area || 0,
        flags: {
            svg: c.flags?.svg || c.flags?.png || `https://flagcdn.com/${cca2}.svg`,
            png: c.flags?.png || `https://flagcdn.com/${cca2}.png`
        },
        currencies: c.currencies || {},
        languages: c.languages || {},
        borders: c.borders || [],
        cca2: c.cca2 || '',
        cca3: c.cca3 || ''
    };
}

// Fetch Countries with Automatic Fallback API Endpoint
async function fetchCountries() {
    renderSkeletons();
    countryCountBadge.textContent = 'Connecting to API...';

    let rawData = null;
    let fetchError = null;

    // Try Primary API
    try {
        const response = await fetch(PRIMARY_API);
        if (response.ok) {
            rawData = await response.json();
        } else {
            throw new Error(`Primary API returned status ${response.status}`);
        }
    } catch (err) {
        console.warn('Primary API failed, attempting Fallback CDN API...', err);
        fetchError = err;
    }

    // Try Fallback API if Primary failed
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        try {
            const fallbackResponse = await fetch(FALLBACK_API);
            if (fallbackResponse.ok) {
                rawData = await fallbackResponse.json();
            } else {
                throw new Error(`Fallback API returned status ${fallbackResponse.status}`);
            }
        } catch (err) {
            console.error('Both Primary and Fallback APIs failed:', err);
            fetchError = err;
        }
    }

    if (Array.isArray(rawData) && rawData.length > 0) {
        allCountries = rawData.map(normalizeCountry);
        applyFiltersAndSort();
    } else {
        renderErrorState(fetchError ? fetchError.message : 'Network error or CORS restriction');
    }
}

// Render Error State if API fails
function renderErrorState(errorMessage = '') {
    countryCountBadge.textContent = 'Data Not Available';
    countriesContainer.innerHTML = `
        <div class="error-card">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h2>Data Not Available</h2>
            <p>Unable to fetch country information from the API endpoints right now. This can happen if network connectivity is offline or if browser CORS security blocks direct file requests.</p>
            ${errorMessage ? `<p style="font-size:13px; opacity:0.8; margin-top:4px;">Error Info: ${errorMessage}</p>` : ''}
            <button class="retry-btn" onclick="fetchCountries()">
                <i class="fa-solid fa-rotate-right"></i>
                <span>Retry Connection</span>
            </button>
        </div>
    `;
}

// Filter and Sort
function applyFiltersAndSort() {
    if (!allCountries || allCountries.length === 0) return;

    let result = [...allCountries];

    // Search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        result = result.filter(country => {
            const commonName = country.name?.common?.toLowerCase() || '';
            const officialName = country.name?.official?.toLowerCase() || '';
            const capital = country.capital.join(' ').toLowerCase();
            return commonName.includes(searchTerm) || officialName.includes(searchTerm) || capital.includes(searchTerm);
        });
        clearSearchBtn.style.display = 'block';
    } else {
        clearSearchBtn.style.display = 'none';
    }

    // Region filter
    const selectedRegion = filterByRegion.value;
    if (selectedRegion && selectedRegion !== 'all') {
        result = result.filter(country => 
            country.region && country.region.toLowerCase() === selectedRegion.toLowerCase()
        );
    }

    // Sorting
    const sortVal = sortBySelect.value;
    result.sort((a, b) => {
        const nameA = a.name?.common || '';
        const nameB = b.name?.common || '';
        const popA = a.population || 0;
        const popB = b.population || 0;
        const areaA = a.area || 0;
        const areaB = b.area || 0;

        if (sortVal === 'name-asc') return nameA.localeCompare(nameB);
        if (sortVal === 'name-desc') return nameB.localeCompare(nameA);
        if (sortVal === 'pop-desc') return popB - popA;
        if (sortVal === 'pop-asc') return popA - popB;
        if (sortVal === 'area-desc') return areaB - areaA;
        return 0;
    });

    filteredCountries = result;
    renderCountries(filteredCountries);
}

// Render Country Cards
function renderCountries(countries) {
    countriesContainer.innerHTML = '';
    countryCountBadge.textContent = `Showing ${countries.length} ${countries.length === 1 ? 'country' : 'countries'}`;

    if (countries.length === 0) {
        countriesContainer.innerHTML = `
            <div class="error-card" style="border-color: var(--border-color); background-color: var(--card-bg);">
                <i class="fa-solid fa-magnifying-glass" style="color: var(--text-muted);"></i>
                <h2>Data Not Available</h2>
                <p>No countries matched your search term or filter options. Try searching for a different country name or clear filters.</p>
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    countries.forEach(country => {
        const card = document.createElement('a');
        card.className = 'country-card';
        card.href = `country.html?name=${encodeURIComponent(country.name?.common || '')}`;

        const capitalText = country.capital.length > 0 ? country.capital.join(', ') : 'Data Not Available';
        const populationText = country.population ? country.population.toLocaleString() : 'Data Not Available';
        const regionText = country.region || 'Data Not Available';
        const flagUrl = country.flags?.svg || country.flags?.png || 'https://flagcdn.com/un.svg';

        card.innerHTML = `
            <div class="flag-container">
                <img src="${flagUrl}" alt="${country.name?.common || 'Country'} flag" loading="lazy" onerror="this.src='https://flagcdn.com/un.svg'">
            </div>
            <div class="country-info">
                <h3 class="country-name">${country.name?.common || 'Unknown'}</h3>
                <p><b>Population:</b> ${populationText}</p>
                <p><b>Region:</b> ${regionText}</p>
                <p><b>Capital:</b> ${capitalText}</p>
            </div>
        `;

        fragment.appendChild(card);
    });

    countriesContainer.appendChild(fragment);
}

// Event Listeners
searchInput?.addEventListener('input', applyFiltersAndSort);
filterByRegion?.addEventListener('change', applyFiltersAndSort);
sortBySelect?.addEventListener('change', applyFiltersAndSort);

clearSearchBtn?.addEventListener('click', () => {
    searchInput.value = '';
    applyFiltersAndSort();
});

// App Startup
initTheme();
fetchCountries();