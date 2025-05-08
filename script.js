document.addEventListener('DOMContentLoaded', () => {
    setupNav();
    setupAudio();
    const page = document.body.id;
    if (page === 'home') setupHome();
    if (page === 'stocks') setupStocks();
    if (page === 'dogs') setupDogs();
  });
  
  function setupNav() {
    document.querySelectorAll('nav li').forEach(li => {
      li.addEventListener('mouseenter', () => li.style.backgroundColor = '#ddd');
      li.addEventListener('mouseleave', () => li.style.backgroundColor = '');
    });
  }
  
  function setupAudio() {
    if (!annyang) return;
    const commands = {
      'hello': () => alert('Hello World'),
      'change the color to *color': color => document.body.style.backgroundColor = color,
      'navigate to *page': page => window.location.href = `${page.toLowerCase()}.html`,
      'lookup *ticker': ticker => renderChart(ticker.toUpperCase(), 30),
      'load dog breed *breed': breed => {
        document.querySelectorAll('#breedButtons button').forEach(btn => {
          if (btn.textContent.toLowerCase() === breed.toLowerCase()) btn.click();
        });
      }
    };
    annyang.addCommands(commands);
    document.getElementById('audioOn').onclick = () => annyang.start();
    document.getElementById('audioOff').onclick = () => annyang.abort();
  }
  
  async function setupHome() {
    const res = await fetch('https://api.quotable.io/random');
    const quote = await res.json();
    document.getElementById('quote').textContent = `"${quote.content}" — ${quote.author}`;
  }
  
  async function setupStocks() {
    document.getElementById('lookupBtn').onclick = () => {
      const ticker = document.getElementById('stockTicker').value;
      const range = document.getElementById('dateRange').value;
      renderChart(ticker, range);
    };
    loadRedditStocks();
  }
  
  async function fetchStockData(ticker, range) {
    const apiKey = 'pfnOuEgogPIpcJa64gomLcL5YPjBQO11';
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - range);
  
    const end = today.toISOString().split('T')[0];
    const start = pastDate.toISOString().split('T')[0];
  
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${start}/${end}?adjusted=true&sort=asc&limit=120&apiKey=${apiKey}`;
  
    const res = await fetch(url);
    const data = await res.json();
  
    if (data.status !== 'OK' || !data.results) {
      throw new Error(`Failed to fetch stock data: ${data.message || 'No results'}`);
    }
  
    return data.results.map(d => ({
      date: new Date(d.t).toLocaleDateString(),
      close: d.c
    }));
  }
  
  fetch('https://zenquotes.io/api/random')
  .then(response => response.json())
  .then(data => {
    const quoteText = data[0].q;  
    const quoteAuthor = data[0].a;  

    const quoteContainer = document.getElementById('quote-container');
    const quoteTextElement = document.getElementById('quote-text');
    const quoteAuthorElement = document.getElementById('quote-author');

    quoteTextElement.textContent = `"${quoteText}"`;
    quoteAuthorElement.textContent = `- ${quoteAuthor}`;
  })
  .catch(error => {
    console.error("Error fetching quote:", error);
    const quoteContainer = document.getElementById('quote-container');
    quoteContainer.textContent = "Sorry, we couldn't load a quote right now.";
  });

  
  let chartInstance;

async function renderChart(ticker, range) {
  try {
    const data = await fetchStockData(ticker, range);
    const ctx = document.getElementById('stockChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label: `${ticker} Closing Price`,
          data: data.map(d => d.close),
          borderColor: 'blue',
          fill: false
        }]
      }
    });
  } catch (err) {
    alert(`Error: ${err.message}`);
    console.error(err);
  }
}

function setupStocks() {
    document.getElementById('lookupBtn').addEventListener('click', () => {
      const ticker = document.getElementById('stockTicker').value.toUpperCase();
      const range = parseInt(document.getElementById('dateRange').value);
      renderChart(ticker, range);
    });
  
    loadRedditStocks();
  }
  
  
  async function loadRedditStocks() {
    const res = await fetch('https://tradestie.com/api/v1/apps/reddit?date=2022-04-03');
    const stocks = await res.json();
    const table = document.getElementById('redditTable');
    table.innerHTML = '';
    stocks.slice(0,5).forEach(s => {
      table.innerHTML += `
        <tr>
          <td><a href="https://finance.yahoo.com/quote/${s.ticker}" target="_blank">${s.ticker}</a></td>
          <td>${s.no_of_comments}</td>
          <td>${s.sentiment} ${s.sentiment === 'Bullish' ? '🐂' : '🐻'}</td>
        </tr>`;
    });
  }
  
  async function setupDogs() {
    const res = await fetch('https://dog.ceo/api/breeds/image/random/10');
    const data = await res.json();
    document.getElementById('dogCarousel').innerHTML = data.message.map(img => `<img src="${img}">`).join('');
    
    loadDogBreeds();
  }
  
  
  async function loadDogBreeds() {
    try {
      const res = await fetch('https://api.thedogapi.com/v1/breeds');
      const breeds = await res.json();
      const container = document.getElementById('breedButtons');
  
      container.innerHTML = '';
  
      breeds.forEach(breed => {
        const btn = document.createElement('button');
        btn.className = 'custom-btn';
        btn.textContent = breed.name;
        btn.onclick = () => showBreedInfo(breed);
        container.appendChild(btn);
      });
    } catch (error) {
      console.error('Failed to load dog breeds:', error);
      document.getElementById('breedButtons').innerHTML = 'Failed to load breeds.';
    }
  }
  
  
  async function showBreedInfo(breed) {
    document.getElementById('breedName').textContent = breed.name;
    document.getElementById('breedDescription').textContent = breed.temperament || 'No description';
    
    const life = breed.life_span.split('–').map(s => s.trim());
    document.getElementById('minLife').textContent = life[0];
    document.getElementById('maxLife').textContent = life[1] || life[0];
  
    document.getElementById('breedInfo').style.display = 'block';
  
    const breedName = breed.name.toLowerCase().replace(/\s+/g, '');
    const res = await fetch(`https://dog.ceo/api/breed/${breedName}/images`);
    const data = await res.json();
  
    const carousel = document.getElementById('dogCarousel');
    carousel.innerHTML = data.message.slice(0, 10).map(img => `<img src="${img}" class="carousel-img">`).join('');
  
    new SimpleSlider('.slider', { autoPlay: true, interval: 2000 });
  }
  
  
