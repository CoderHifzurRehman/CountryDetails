const url='https://restcountries.com/v3.1/all';

const countryContainer=document.querySelector('.countries-container');
const filterByRegion=document.querySelector('#filter-by-region');
const searchByCountry=document.querySelector('.search-container input');
const themeChange=document.querySelector('.themeChange');

 
let allCountryData;

fetch(url)
.then((res)=>res.json())
.then((data) =>{
    renderCountries(data);
    allCountryData=data;

});


// filter data by region

filterByRegion.addEventListener('change', (e) =>{
    fetch(`https://restcountries.com/v3.1/region/${filterByRegion.value}`)
        .then((res)=>res.json())
        .then(renderCountries);

})

function renderCountries(data){
    countryContainer.innerHTML='';
    data.forEach(country => {
         //console.log(country.name.common);
        const countryCard=document.createElement('a');
        countryCard.classList.add('country-card');
        countryCard.href=`/country.html?name=${country.name.common}`;

    
        const cardHTML=`
            <img src="${country.flags.svg}" alt="flag">
            <div class="country-info">
                <h3 class="country-name">${country.name.common}</h3>
                <p><b>Population : </b>${country.population.toLocaleString('en-IN')}</p>
                <p><b>Region : </b>${country.region}</p>
                <p><b>Capital : </b>${country.capital}</p>
            </div>
            `;

        countryCard.innerHTML=cardHTML;

        countryContainer.append(countryCard);
        
    });
    
}

searchByCountry.addEventListener('input', (e) =>{
    allCountryData.filter((country) =>{
        const filteredCountries = allCountryData.filter((country) => country.name.common.toLowerCase().includes(e.target.value.toLowerCase()))
        renderCountries(filteredCountries);
    })
})

const themeContainer = document.querySelector('.theme-container');

// localStorage.setItem('theme','light');
themeChange.addEventListener('click', () => {
    if(themeChange.innerHTML!='<i class="fa-regular fa-sun"></i>&nbsp;&nbsp;Light Mode'){
    localStorage.setItem('theme','dark');
    themeChange.innerHTML=`<i class="fa-regular fa-sun"></i>&nbsp;&nbsp;Light Mode`;
    document.body.classList.add('dark');
    }
    else{
        localStorage.setItem('theme','light');
        themeChange.innerHTML=`<i class="fa-regular fa-moon"></i>&nbsp;&nbsp;Dark Mode`;
        document.body.classList.remove('dark');
    }
  })
const currentTheme = localStorage.getItem('theme');
  if(currentTheme=="dark"){
        document.body.classList.add('dark');
        themeChange.innerHTML=`<i class="fa-regular fa-sun"></i>&nbsp;&nbsp;Light Mode`;
    }
    else{
        themeChange.innerHTML=`<i class="fa-regular fa-moon"></i>&nbsp;&nbsp;Dark Mode`;
       }