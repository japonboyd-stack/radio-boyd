// Radio Boyd - Interaction Logic

document.addEventListener('DOMContentLoaded', () => {
    const btnAM = document.getElementById('btn-am');
    const btnFM = document.getElementById('btn-fm');
    const freqDisplay = document.getElementById('freq-display');
    const stationLabel = document.getElementById('station-label');
    const visualizer = document.getElementById('visualizer');
    const playBtn = document.getElementById('play-btn');
    const timeDisplay = document.getElementById('current-time');
    const volSlider = document.getElementById('volume-slider');
    const volUp = document.getElementById('vol-up');
    const volDown = document.getElementById('vol-down');
    const dialNext = document.getElementById('dial-next');
    const dialPrev = document.getElementById('dial-prev');
    const appLogo = document.getElementById('app-logo');
    const fallbackText = document.querySelector('.logo-text-fallback');
    const stationInfo = document.querySelector('.station-info');

    // Handle Logo Fallback immediately
    if (appLogo && (appLogo.complete && appLogo.naturalHeight === 0)) {
        appLogo.style.display = 'none';
        fallbackText.style.display = 'flex';
    }
    appLogo.addEventListener('error', () => {
        appLogo.style.display = 'none';
        fallbackText.style.display = 'flex';
    });
    
    let isAM = false;
    let isPlaying = false;
    let currentFreqFM = 104.5;
    let currentFreqAM = 840;
    let stationsList = [];
    let currentStationIndex = -1;
    let currentPlatform = 'ms';

    // UI Elements
    const countrySelect = document.getElementById('select-country');
    const stationsContainer = document.getElementById('stations-list');
    const adsContainer = document.getElementById('ads-container');
    const btnMS = document.getElementById('mode-ms');
    const btnHW = document.getElementById('mode-hw');
    const hwBanner = document.getElementById('huawei-ad-banner');

    // Audio Setup
    let audioContext;
    let noiseNode;
    let noiseGain;
    let stationAudio = new Audio();
    stationAudio.crossOrigin = "anonymous";

    const STATIONS = {
        FM: {
            104.5: "https://ice1.somafm.com/groovesalad-128-mp3",
            107.7: "https://ice1.somafm.com/defcon-128-mp3",
            98.1: "https://ice1.somafm.com/fluid-128-mp3"
        },
        AM: {
            840: "https://ice1.somafm.com/u80s-128-mp3",
            720: "https://ice1.somafm.com/secretagent-128-mp3"
        }
    };

    function initAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // White Noise Generator
        const bufferSize = 2 * audioContext.sampleRate;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        noiseNode = audioContext.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;
        
        noiseGain = audioContext.createGain();
        noiseGain.gain.value = 0;

        noiseNode.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseNode.start();
    }

    const barsContainer = document.getElementById('visualizer');

    // Initialize Visualizer Bars
    function initBars() {
        if (!barsContainer) return;
        barsContainer.innerHTML = '';
        const barCount = 40;
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = '10%';
            barsContainer.appendChild(bar);
        }
    }
    initBars();

    const bars = document.querySelectorAll('.bar');

    // Update Visualizer
    function updateVisualizer() {
        if (!isPlaying) {
            bars.forEach(bar => bar.style.height = '10%');
            return;
        }

        bars.forEach(bar => {
            const height = Math.random() * 80 + 20;
            bar.style.height = `${height}%`;
        });
    }

    setInterval(updateVisualizer, 100);

    // Frequency Update Helper
    function updateFrequency() {
        stationInfo.classList.add('changing');
        
        if (noiseGain) {
            noiseGain.gain.setTargetAtTime(0.1, audioContext.currentTime, 0.05);
        }

        setTimeout(() => {
            const freq = isAM ? currentFreqAM : currentFreqFM.toFixed(1);
            
            // If we have a list of stations, use the current index
            if (stationsList.length > 0 && currentStationIndex >= 0) {
                const station = stationsList[currentStationIndex];
                freqDisplay.textContent = (currentStationIndex + 1).toString().padStart(3, '0');
                stationLabel.textContent = station.name.toUpperCase();
                
                if (stationAudio.src !== station.url_resolved) {
                    stationAudio.src = station.url_resolved;
                    if (isPlaying) stationAudio.play().catch(console.error);
                }
                if (noiseGain) noiseGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
            } else {
                // Fallback to static/demo stations
                if (isAM) {
                    freqDisplay.textContent = currentFreqAM;
                    stationLabel.textContent = STATIONS.AM[freq] ? 'AM BROADCAST • CLEAR VOICE' : 'AM • STATIC INTERFERENCE';
                } else {
                    freqDisplay.textContent = currentFreqFM.toFixed(1);
                    stationLabel.textContent = STATIONS.FM[freq] ? 'FM STEREO • HIGH FIDELITY' : 'FM • NO SIGNAL';
                }

                const streamUrl = isAM ? STATIONS.AM[freq] : STATIONS.FM[freq];
                if (streamUrl) {
                    if (stationAudio.src !== streamUrl) {
                        stationAudio.src = streamUrl;
                        if (isPlaying) stationAudio.play().catch(console.error);
                    }
                    if (noiseGain) noiseGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
                } else {
                    stationAudio.pause();
                    if (noiseGain && isPlaying) noiseGain.gain.setTargetAtTime(0.2, audioContext.currentTime, 0.1);
                }
            }

            stationInfo.classList.remove('changing');
        }, 50);
    }

    btnAM.addEventListener('click', () => {
        isAM = true;
        btnAM.classList.add('active');
        btnFM.classList.remove('active');
        document.body.style.setProperty('--active-color', 'var(--am-color)');
        document.body.style.setProperty('--active-glow', 'var(--am-glow)');
        updateFrequency();
    });

    btnFM.addEventListener('click', () => {
        isAM = false;
        btnFM.classList.add('active');
        btnAM.classList.remove('active');
        document.body.style.setProperty('--active-color', 'var(--fm-color)');
        document.body.style.setProperty('--active-glow', 'var(--fm-glow)');
        updateFrequency();
    });

    // Dial Controls
    dialNext.addEventListener('click', () => {
        if (stationsList.length > 0) {
            currentStationIndex = (currentStationIndex + 1) % stationsList.length;
        } else {
            if (isAM) currentFreqAM += 10;
            else currentFreqFM += 0.1;
        }
        updateFrequency();
    });

    dialPrev.addEventListener('click', () => {
        if (stationsList.length > 0) {
            currentStationIndex = (currentStationIndex - 1 + stationsList.length) % stationsList.length;
        } else {
            if (isAM) currentFreqAM -= 10;
            else currentFreqFM -= 0.1;
        }
        updateFrequency();
    });

    // Volume Controls
    function updateVolume() {
        const val = volSlider.value / 100;
        stationAudio.volume = val;
        if (noiseGain) noiseGain.gain.setTargetAtTime(val * 0.2, audioContext.currentTime, 0.1);
    }

    volUp.addEventListener('click', () => {
        volSlider.value = Math.min(100, parseInt(volSlider.value) + 5);
        updateVolume();
    });

    volDown.addEventListener('click', () => {
        volSlider.value = Math.max(0, parseInt(volSlider.value) - 5);
        updateVolume();
    });

    volSlider.addEventListener('input', updateVolume);



    // Play/Pause
    playBtn.addEventListener('click', () => {
        initAudio();
        isPlaying = !isPlaying;
        playBtn.textContent = isPlaying ? '⏸' : '▶';

        if (isPlaying) {
            audioContext.resume();
            updateFrequency();
        } else {
            stationAudio.pause();
            if (noiseGain) noiseGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
        }
    });

    // Clock
    function updateClock() {
        const now = new Date();
        timeDisplay.textContent = now.toLocaleTimeString('es-ES', { hour12: false });
    }

    setInterval(updateClock, 1000);
    updateClock();

    // Add ad functionality
    const btnAdd = document.querySelector('.btn-add');
    const adsContainer = document.getElementById('ads-container');

    // Advertising Platform Logic
    const PLATFORM_ADS = {
        ms: [
            { title: "Microsoft 365", desc: "Productividad en la nube", time: "12:00", type: "ms-style" },
            { title: "Azure Cloud", desc: "Escalabilidad empresarial", time: "15:45", type: "ms-style" }
        ],
        hw: [
            { title: "AppGallery", desc: "Explora nuevas apps", time: "10:30", type: "hw-style" },
            { title: "Huawei Watch GT", desc: "Batería de larga duración", time: "18:20", type: "hw-style" }
        ]
    };

    function updateAds(platform) {
        adsContainer.innerHTML = '';
        const ads = PLATFORM_ADS[platform];
        
        ads.forEach(ad => {
            const card = document.createElement('div');
            card.className = `ad-card ${ad.type}`;
            card.innerHTML = `
                <div class="ad-info">
                    <h3>${ad.title}</h3>
                    <p>${ad.desc}</p>
                </div>
                <div class="ad-stats">
                    <span class="badge active">Promocionado</span>
                    <span class="time">${ad.time}</span>
                </div>
            `;
            adsContainer.appendChild(card);
        });

        if (platform === 'hw') {
            hwBanner.classList.remove('hidden');
        } else {
            hwBanner.classList.add('hidden');
        }
    }

    btnMS.addEventListener('click', () => {
        currentPlatform = 'ms';
        btnMS.classList.add('active');
        btnHW.classList.remove('active');
        document.body.className = 'theme-ms';
        updateAds('ms');
    });

    btnHW.addEventListener('click', () => {
        currentPlatform = 'hw';
        btnHW.classList.add('active');
        btnMS.classList.remove('active');
        document.body.className = 'theme-hw';
        updateAds('hw');
    });

    // Initial Ads
    updateAds('ms');

    // Global Radio Integration
    async function fetchCountries() {
        try {
            const response = await fetch('https://de1.api.radio-browser.info/json/countries?order=name');
            const countries = await response.json();
            
            countrySelect.innerHTML = '<option value="">Selecciona País</option>';
            countries.forEach(c => {
                if (c.name) {
                    const opt = document.createElement('option');
                    opt.value = c.iso_3166_1 || c.name;
                    opt.textContent = `${c.name} (${c.stationcount})`;
                    countrySelect.appendChild(opt);
                }
            });
        } catch (err) {
            console.error('Error fetching countries:', err);
            countrySelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    async function fetchStations(country) {
        stationsContainer.innerHTML = '<p class="placeholder-text">Cargando emisoras...</p>';
        try {
            const response = await fetch(`https://de1.api.radio-browser.info/json/stations/bycountryexact/${encodeURIComponent(country)}?limit=100&hidebroken=true&order=clickcount&reverse=true`);
            stationsList = await response.json();
            renderStations();
        } catch (err) {
            console.error('Error fetching stations:', err);
            stationsContainer.innerHTML = '<p class="placeholder-text">Error al cargar emisoras</p>';
        }
    }

    function renderStations() {
        stationsContainer.innerHTML = '';
        if (stationsList.length === 0) {
            stationsContainer.innerHTML = '<p class="placeholder-text">No se encontraron emisoras.</p>';
            return;
        }

        stationsList.forEach((s, index) => {
            const item = document.createElement('div');
            item.className = 'station-item';
            if (index === currentStationIndex) item.classList.add('active');
            
            item.innerHTML = `
                <div class="station-meta">
                    <div class="station-name">${s.name}</div>
                    <div class="station-tags">${s.tags || 'General'}</div>
                </div>
                <div class="station-quality">${s.bitrate ? s.bitrate + 'k' : ''}</div>
            `;
            
            item.addEventListener('click', () => {
                initAudio();
                if (audioContext) audioContext.resume();
                currentStationIndex = index;
                isPlaying = true;
                playBtn.textContent = '⏸';
                updateFrequency();
                renderStations(); // Refresh active state
            });
            
            stationsContainer.appendChild(item);
        });
    }

    countrySelect.addEventListener('change', (e) => {
        if (e.target.value) {
            fetchStations(e.target.selectedOptions[0].text.split(' (')[0]);
        }
    });

    fetchCountries();
    updateFrequency();
});
