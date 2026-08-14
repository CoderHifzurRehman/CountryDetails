const PRIMARY_NAME_API = 'https://restcountries.com/v3.1/name/';
const FALLBACK_ALL_API = 'https://cdn.jsdelivr.net/npm/world-countries@5/countries.json';

const countryDetailWrapper = document.getElementById('country-detail-wrapper');
const themeToggleBtn = document.getElementById('theme-toggle');

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

// Extract URL parameter
const params = new URLSearchParams(window.location.search);
const rawCountryName = params.get('name');

if (!rawCountryName) {
    renderErrorState('No country specified in URL parameters.');
} else {
    fetchCountryDetail(rawCountryName);
}

// Fetch Country Detail using Primary API and Fallback CDN
async function fetchCountryDetail(countryName) {
    let countryData = null;
    let fetchError = null;

    // 1. Try Primary API exact fullText search
    try {
        const response = await fetch(`${PRIMARY_NAME_API}${encodeURIComponent(countryName)}?fullText=true`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) countryData = data[0];
        }
    } catch (err) {
        fetchError = err;
    }

    // 2. Try Primary API loose search if fullText failed
    if (!countryData) {
        try {
            const response = await fetch(`${PRIMARY_NAME_API}${encodeURIComponent(countryName)}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) countryData = data[0];
            }
        } catch (err) {
            fetchError = err;
        }
    }

    // 3. Try Fallback CDN API if Primary API failed
    if (!countryData) {
        try {
            const fbResponse = await fetch(FALLBACK_ALL_API);
            if (fbResponse.ok) {
                const allData = await fbResponse.json();
                const targetLower = countryName.toLowerCase();
                const matched = allData.find(c => 
                    c.name?.common?.toLowerCase() === targetLower ||
                    c.name?.official?.toLowerCase() === targetLower ||
                    c.cca3?.toLowerCase() === targetLower ||
                    c.cca2?.toLowerCase() === targetLower
                );
                if (matched) countryData = matched;
            }
        } catch (err) {
            fetchError = err;
        }
    }

    if (countryData) {
        document.title = `${countryData.name?.common || 'Country'} - Details`;
        renderCountryDetails(countryData);
    } else {
        renderErrorState(fetchError ? fetchError.message : `Data Not Available for "${countryName}".`);
    }
}

// Render Error State
function renderErrorState(message = '') {
    countryDetailWrapper.innerHTML = `
        <div class="error-card">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h2>Data Not Available</h2>
            <p>Unable to retrieve country details from the API. This can happen if network connectivity is offline or if browser CORS rules block direct file requests.</p>
            ${message ? `<p style="font-size:13px; opacity:0.8; margin-top:4px;">Details: ${message}</p>` : ''}
            <button class="retry-btn" onclick="location.reload()">
                <i class="fa-solid fa-rotate-right"></i>
                <span>Reload Page</span>
            </button>
        </div>
    `;
}

// Render Rich Country Details
async function renderCountryDetails(country) {
    const commonName = country.name?.common || 'Data Not Available';
    const officialName = country.name?.official || 'Data Not Available';
    const cca2 = country.cca2 ? country.cca2.toLowerCase() : 'un';
    const flagSvg = country.flags?.svg || country.flags?.png || `https://flagcdn.com/${cca2}.svg`;
    const coatOfArms = country.coatOfArms?.svg || country.coatOfArms?.png || '';
    
    // Native Name
    let nativeNameText = 'Data Not Available';
    if (country.name?.nativeName) {
        const nativeValues = Object.values(country.name.nativeName);
        if (nativeValues.length > 0) nativeNameText = nativeValues[0].common || nativeValues[0].official;
    } else if (country.name?.native) {
        const nativeValues = Object.values(country.name.native);
        if (nativeValues.length > 0) nativeNameText = nativeValues[0].common || nativeValues[0].official;
    }

    // Population & Area
    const population = country.population ? country.population.toLocaleString() : 'Data Not Available';
    const area = country.area ? `${country.area.toLocaleString()} sq km` : 'Data Not Available';
    const region = country.region || 'Data Not Available';
    const subregion = country.subregion || 'Data Not Available';
    const capital = Array.isArray(country.capital) && country.capital.length > 0 ? country.capital.join(', ') : (country.capital || 'Data Not Available');

    // Currencies
    let currencyText = 'Data Not Available';
    if (country.currencies) {
        currencyText = Object.values(country.currencies)
            .map(c => `${c.name || ''} (${c.symbol || 'N/A'})`.trim())
            .join(', ');
    }

    // Languages
    let languagesText = 'Data Not Available';
    if (country.languages) {
        languagesText = Object.values(country.languages).join(', ');
    }

    // Top Level Domain
    const tldText = Array.isArray(country.tld) && country.tld.length > 0 ? country.tld.join(', ') : 'Data Not Available';

    // Continents
    const continentsText = Array.isArray(country.continents) ? country.continents.join(', ') : 'Data Not Available';

    // Demonym / Nationality
    const demonymText = country.demonyms?.eng?.m || country.demonyms?.eng?.f || 'Data Not Available';

    // Timezones
    const timezonesText = Array.isArray(country.timezones) ? country.timezones.join(', ') : 'Data Not Available';

    // UN Member & Independence
    const isUnMember = country.unMember ? 'Yes (Member)' : 'No';
    const isIndependent = country.independent !== undefined ? (country.independent ? 'Yes' : 'No') : 'Data Not Available';

    // Google Maps Link
    const googleMapsUrl = country.maps?.googleMaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(commonName)}`;

    countryDetailWrapper.innerHTML = `
        <div class="country-details-container">
            <div class="media-container">
                <div class="detail-flag-wrapper">
                    <img src="${flagSvg}" alt="${commonName} flag" onerror="this.src='https://flagcdn.com/un.svg'">
                </div>

                ${coatOfArms ? `
                    <div class="emblem-wrapper">
                        <img src="${coatOfArms}" alt="${commonName} Coat of Arms">
                        <div class="emblem-text">
                            <h4>National Coat of Arms</h4>
                            <p>Official Emblem of ${commonName}</p>
                        </div>
                    </div>
                ` : ''}
            </div>

            <div class="details-content">
                <div class="detail-header">
                    <div class="country-title-row">
                        <h1 class="detail-country-name">${commonName}</h1>
                        <div class="status-pills">
                            <span class="pill pill-un"><i class="fa-solid fa-flag"></i> UN: ${isUnMember}</span>
                            <span class="pill pill-ind"><i class="fa-solid fa-shield-halved"></i> Independent: ${isIndependent}</span>
                        </div>
                    </div>
                    <p class="detail-official-name">Official Name: ${officialName}</p>
                </div>

                <div class="info-sections-grid">
                    <div class="info-card">
                        <h3><i class="fa-solid fa-compass"></i> Key Overview</h3>
                        <ul>
                            <li><b>Native Name:</b> ${nativeNameText}</li>
                            <li><b>Capital:</b> ${capital}</li>
                            <li><b>Population:</b> ${population}</li>
                            <li><b>Region:</b> ${region}</li>
                            <li><b>Subregion:</b> ${subregion}</li>
                            <li><b>Continents:</b> ${continentsText}</li>
                        </ul>
                    </div>

                    <div class="info-card">
                        <h3><i class="fa-solid fa-coins"></i> Economy & Identity</h3>
                        <ul>
                            <li><b>Currencies:</b> ${currencyText}</li>
                            <li><b>Languages:</b> ${languagesText}</li>
                            <li><b>Top Level Domain:</b> ${tldText}</li>
                            <li><b>Demonym:</b> ${demonymText}</li>
                            <li><b>Total Area:</b> ${area}</li>
                            <li><b>Timezones:</b> ${timezonesText}</li>
                        </ul>
                    </div>
                </div>

                <div class="actions-bar">
                    <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="map-link-btn">
                        <i class="fa-solid fa-map-location-dot"></i>
                        <span>View on Google Maps</span>
                    </a>
                </div>

                <div class="border-countries-section">
                    <h3><i class="fa-solid fa-route"></i> Border Countries</h3>
                    <div class="border-tags-container" id="border-tags">
                        <span class="no-borders-text">Loading border countries...</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderBorderCountries(country.borders);
}

// Fetch and render border country tags
async function renderBorderCountries(borders) {
    const borderTagsContainer = document.getElementById('border-tags');
    if (!borderTagsContainer) return;

    if (!Array.isArray(borders) || borders.length === 0) {
        borderTagsContainer.innerHTML = '<span class="no-borders-text">This country has no land borders (Island or Isolated territory).</span>';
        return;
    }

    try {
        const borderCodesStr = borders.join(',');
        const response = await fetch(`https://restcountries.com/v3.1/alpha?codes=${borderCodesStr}`);
        
        if (response.ok) {
            const borderCountries = await response.json();
            borderTagsContainer.innerHTML = '';
            borderCountries.forEach(bCountry => {
                const tag = document.createElement('a');
                tag.className = 'border-tag';
                tag.href = `country.html?name=${encodeURIComponent(bCountry.name?.common || '')}`;
                tag.innerText = bCountry.name?.common || bCountry.cca3;
                borderTagsContainer.appendChild(tag);
            });
            return;
        }
    } catch (err) {
        console.warn('Border API fetch warning:', err);
    }

    // Fallback if alpha API endpoint fails
    borderTagsContainer.innerHTML = '';
    borders.forEach(code => {
        const tag = document.createElement('a');
        tag.className = 'border-tag';
        tag.href = `country.html?name=${encodeURIComponent(code)}`;
        tag.innerText = code;
        borderTagsContainer.appendChild(tag);
    });
}

// Startup
initTheme();