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
        if (fallbackText) fallbackText.style.display = 'flex';
    }
    if (appLogo) {
        appLogo.addEventListener('error', () => {
            appLogo.style.display = 'none';
            if (fallbackText) fallbackText.style.display = 'flex';
        });
    }
    
    let isAM = false;
    let isPlaying = false;
    let currentFreqFM = 104.5;
    let currentFreqAM = 840;
    let stationsList = [];
    let currentStationIndex = -1;
    const platform = window.PLATFORM || 'ms';

    // UI Elements
    const countrySelect = document.getElementById('select-country');
    const stationsContainer = document.getElementById('stations-list');
    const adsContainer = document.getElementById('ads-container');

    // Audio Setup
    let audioContext;
    let noiseNode;
    let noiseGain;
    let stationAudio = new Audio();
    stationAudio.crossOrigin = "anonymous";

    const STATIONS = {
        FM: {
            "104.5": "https://ice1.somafm.com/groovesalad-128-mp3",
            "107.7": "https://ice1.somafm.com/defcon-128-mp3",
            "98.1": "https://ice1.somafm.com/fluid-128-mp3"
        },
        AM: {
            "840": "https://ice1.somafm.com/u80s-128-mp3",
            "720": "https://ice1.somafm.com/secretagent-128-mp3",
            "540": "https://ice1.somafm.com/dronezone-128-mp3"
        }
    };

    function initAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
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

    function updateFrequency() {
        if (stationInfo) stationInfo.classList.add('changing');
        setTimeout(() => {
            const freq = isAM ? currentFreqAM : currentFreqFM.toFixed(1);
            if (freqDisplay) freqDisplay.textContent = freq;
            
            if (isAM) {
                if (stationLabel) stationLabel.textContent = STATIONS.AM[currentFreqAM] ? 'AM BAND • ANALOG SIGNAL' : 'AM • NO SIGNAL';
                document.body.classList.add('theme-am');
                document.querySelector('.app-container').classList.add('am-filter');
            } else {
                if (stationLabel) stationLabel.textContent = STATIONS.FM[currentFreqFM.toFixed(1)] ? 'FM STEREO • HIGH FIDELITY' : 'FM • NO SIGNAL';
                document.body.classList.remove('theme-am');
                document.querySelector('.app-container').classList.remove('am-filter');
            }

            const streamUrl = isAM ? STATIONS.AM[currentFreqAM] : STATIONS.FM[currentFreqFM.toFixed(1)];
            if (streamUrl) {
                if (stationAudio.src !== streamUrl) {
                    stationAudio.src = streamUrl;
                    if (isPlaying) stationAudio.play().catch(console.error);
                }
                if (noiseGain) noiseGain.gain.setTargetAtTime(isAM ? 0.05 : 0, audioContext.currentTime, 0.1);
            } else {
                stationAudio.pause();
                if (noiseGain && isPlaying) noiseGain.gain.setTargetAtTime(isAM ? 0.5 : 0.2, audioContext.currentTime, 0.1);
            }
            if (stationInfo) stationInfo.classList.remove('changing');
        }, 100);
    }

    if (btnAM) btnAM.addEventListener('click', () => {
        isAM = true;
        btnAM.classList.add('active');
        btnFM.classList.remove('active');
        updateFrequency();
    });

    if (btnFM) btnFM.addEventListener('click', () => {
        isAM = false;
        btnFM.classList.add('active');
        btnAM.classList.remove('active');
        updateFrequency();
    });

    dialNext.addEventListener('click', () => {
        if (isAM) currentFreqAM += 10; else currentFreqFM += 0.1;
        updateFrequency();
    });

    dialPrev.addEventListener('click', () => {
        if (isAM) currentFreqAM -= 10; else currentFreqFM -= 0.1;
        updateFrequency();
    });

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

    volSlider.addEventListener('input', () => {
        const val = volSlider.value / 100;
        stationAudio.volume = val;
    });

    if (volUp) volUp.addEventListener('click', () => {
        volSlider.value = Math.min(100, parseInt(volSlider.value) + 5);
        stationAudio.volume = volSlider.value / 100;
    });

    if (volDown) volDown.addEventListener('click', () => {
        volSlider.value = Math.max(0, parseInt(volSlider.value) - 5);
        stationAudio.volume = volSlider.value / 100;
    });

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
            console.error('Error:', err);
        }
    }

    async function fetchStations(country) {
        stationsContainer.innerHTML = '<p class="placeholder-text">Cargando emisoras...</p>';
        try {
            const response = await fetch(`https://de1.api.radio-browser.info/json/stations/bycountryexact/${encodeURIComponent(country)}?limit=100&hidebroken=true&order=clickcount&reverse=true`);
            stationsList = await response.json();
            renderStations();
        } catch (err) {
            stationsContainer.innerHTML = '<p class="placeholder-text">Error al cargar</p>';
        }
    }

    function renderStations() {
        stationsContainer.innerHTML = '';
        stationsList.forEach((s, index) => {
            const item = document.createElement('div');
            item.className = 'station-item';
            item.innerHTML = `<div class="station-name">${s.name}</div><div class="station-tags">${s.tags || 'Radio'}</div>`;
            item.addEventListener('click', () => {
                initAudio();
                currentStationIndex = index;
                stationAudio.src = s.url_resolved || s.url;
                isPlaying = true;
                playBtn.textContent = '⏸';
                stationLabel.textContent = s.name;
                freqDisplay.textContent = 'WEB';
                stationAudio.play().catch(console.error);
                if (noiseGain) noiseGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
            });
            stationsContainer.appendChild(item);
        });
    }

    countrySelect.addEventListener('change', (e) => {
        if (e.target.value) fetchStations(e.target.value);
    });

    fetchCountries();

    // Clock
    setInterval(() => {
        timeDisplay.textContent = new Date().toLocaleTimeString('es-ES', { hour12: false });
    }, 1000);

    // Initial Platform Setup
    document.body.className = `theme-${platform}`;
    const PLATFORM_ADS = {
        ms: [{ title: "Microsoft Store", desc: "Elite Apps Suite", time: "NOW", type: "ms-style" }],
        hw: [{ title: "Huawei Gallery", desc: "Premium Mobile Experience", time: "NOW", type: "hw-style" }]
    };
    
    adsContainer.innerHTML = '';
    PLATFORM_ADS[platform].forEach(ad => {
        const card = document.createElement('div');
        card.className = `ad-card ${ad.type}`;
        card.innerHTML = `<div class="ad-info"><h3>${ad.title}</h3><p>${ad.desc}</p></div><div class="ad-stats"><span class="time">${ad.time}</span></div>`;
        adsContainer.appendChild(card);
    });
});
