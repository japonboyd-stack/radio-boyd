// Radio Boyd - Interaction Logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Elements
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
    const countrySelect = document.getElementById('select-country');
    const stationsContainer = document.getElementById('stations-list');
    const adsContainer = document.getElementById('ads-container');

    // 2. State
    let isAM = false;
    let isPlaying = false;
    let currentFreqFM = 104.5;
    let currentFreqAM = 840;
    let stationsList = [];
    let currentStationIndex = -1;
    const platform = window.PLATFORM || 'ms';

    // 3. Audio Setup
    let audioContext;
    let noiseGain;
    let stationAudio = new Audio();
    stationAudio.crossOrigin = "anonymous";

    const FALLBACK_COUNTRIES = [
        { name: "España", code: "ES" },
        { name: "México", code: "MX" },
        { name: "Argentina", code: "AR" },
        { name: "Colombia", code: "CO" },
        { name: "Estados Unidos", code: "US" },
        { name: "Reino Unido", code: "GB" }
    ];

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
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = 2 * audioContext.sampleRate;
            const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

            const noiseNode = audioContext.createBufferSource();
            noiseNode.buffer = noiseBuffer;
            noiseNode.loop = true;
            noiseGain = audioContext.createGain();
            noiseGain.gain.value = 0;
            noiseNode.connect(noiseGain);
            noiseGain.connect(audioContext.destination);
            noiseNode.start();
            initBars();
        } catch (e) { console.error("Audio init failed", e); }
    }

    function initBars() {
        if (!visualizer) return;
        visualizer.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = '10%';
            visualizer.appendChild(bar);
        }
    }

    function animateBars() {
        if (!isPlaying) return;
        const bars = document.querySelectorAll('.bar');
        bars.forEach(bar => {
            bar.style.height = `${Math.random() * 80 + 10}%`;
        });
        setTimeout(() => requestAnimationFrame(animateBars), 100);
    }

    function updateFrequency() {
        if (stationInfo) stationInfo.classList.add('changing');
        setTimeout(() => {
            const freqStr = isAM ? currentFreqAM.toString() : currentFreqFM.toFixed(1);
            if (freqDisplay) freqDisplay.textContent = freqStr;
            
            if (isAM) {
                if (stationLabel) stationLabel.textContent = STATIONS.AM[freqStr] ? 'AM BAND • ANALOG' : 'AM • NO SIGNAL';
                document.body.classList.add('theme-am');
                document.querySelector('.app-container').classList.add('am-filter');
            } else {
                if (stationLabel) stationLabel.textContent = STATIONS.FM[freqStr] ? 'FM STEREO • HD' : 'FM • NO SIGNAL';
                document.body.classList.remove('theme-am');
                document.querySelector('.app-container').classList.remove('am-filter');
            }

            const streamUrl = isAM ? STATIONS.AM[freqStr] : STATIONS.FM[freqStr];
            if (streamUrl) {
                stationAudio.src = streamUrl;
                if (isPlaying) stationAudio.play().catch(() => {});
                if (noiseGain) noiseGain.gain.setTargetAtTime(isAM ? 0.02 : 0, audioContext.currentTime, 0.1);
            } else {
                stationAudio.pause();
                if (noiseGain && isPlaying) noiseGain.gain.setTargetAtTime(isAM ? 0.4 : 0.1, audioContext.currentTime, 0.1);
            }
            if (stationInfo) stationInfo.classList.remove('changing');
        }, 100);
    }

    // 4. Events
    if (playBtn) playBtn.addEventListener('click', () => {
        initAudio();
        isPlaying = !isPlaying;
        playBtn.textContent = isPlaying ? '⏸' : '▶';
        if (isPlaying) {
            audioContext.resume();
            updateFrequency();
            animateBars();
        } else {
            stationAudio.pause();
            if (noiseGain) noiseGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
        }
    });

    if (btnAM) btnAM.addEventListener('click', () => { isAM = true; btnAM.classList.add('active'); btnFM.classList.remove('active'); updateFrequency(); });
    if (btnFM) btnFM.addEventListener('click', () => { isAM = false; btnFM.classList.add('active'); btnAM.classList.remove('active'); updateFrequency(); });
    if (dialNext) dialNext.addEventListener('click', () => { if (isAM) currentFreqAM += 10; else currentFreqFM += 0.1; updateFrequency(); });
    if (dialPrev) dialPrev.addEventListener('click', () => { if (isAM) currentFreqAM -= 10; else currentFreqFM -= 0.1; updateFrequency(); });

    if (volSlider) volSlider.addEventListener('input', () => { stationAudio.volume = volSlider.value / 100; });
    if (volUp) volUp.addEventListener('click', () => { volSlider.value = Math.min(100, parseInt(volSlider.value) + 5); stationAudio.volume = volSlider.value / 100; });
    if (volDown) volDown.addEventListener('click', () => { volSlider.value = Math.max(0, parseInt(volSlider.value) - 5); stationAudio.volume = volSlider.value / 100; });

    // 5. Radio Browser API
    async function fetchCountries() {
        if (countrySelect) {
            countrySelect.innerHTML = '<option value="">Cargando...</option>';
            // Add fallbacks immediately
            FALLBACK_COUNTRIES.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.code;
                opt.textContent = c.name;
                countrySelect.appendChild(opt);
            });
        }
        try {
            const response = await fetch('https://all.api.radio-browser.info/json/countries?order=name');
            const countries = await response.json();
            if (countrySelect) {
                countrySelect.innerHTML = '<option value="">Selecciona País</option>';
                countries.forEach(c => {
                    if (c.name) {
                        const opt = document.createElement('option');
                        opt.value = c.iso_3166_1 || c.name;
                        opt.textContent = `${c.name} (${c.stationcount})`;
                        countrySelect.appendChild(opt);
                    }
                });
            }
        } catch (err) {
            console.log("API mirrored failed, using fallbacks.");
        }
    }

    async function fetchStations(country) {
        if (stationsContainer) stationsContainer.innerHTML = '<p class="placeholder-text">Sintonizando...</p>';
        try {
            const response = await fetch(`https://all.api.radio-browser.info/json/stations/bycountryexact/${encodeURIComponent(country)}?limit=50&hidebroken=true&order=clickcount&reverse=true`);
            stationsList = await response.json();
            renderStations();
        } catch (err) {
            if (stationsContainer) stationsContainer.innerHTML = '<p class="placeholder-text">Error de señal.</p>';
        }
    }

    function renderStations() {
        if (!stationsContainer) return;
        stationsContainer.innerHTML = '';
        stationsList.forEach((s, index) => {
            const item = document.createElement('div');
            item.className = 'station-item';
            item.innerHTML = `<div class="station-name">${s.name}</div><div class="station-tags">${s.tags || 'General'}</div>`;
            item.addEventListener('click', () => {
                initAudio();
                currentStationIndex = index;
                stationAudio.src = s.url_resolved || s.url;
                isPlaying = true;
                playBtn.textContent = '⏸';
                stationLabel.textContent = s.name;
                freqDisplay.textContent = 'WEB';
                stationAudio.play().catch(() => {});
                if (noiseGain) noiseGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
                animateBars();
            });
            stationsContainer.appendChild(item);
        });
    }

    if (countrySelect) countrySelect.addEventListener('change', (e) => { if (e.target.value) fetchStations(e.target.value); });

    // 6. Init
    fetchCountries();
    if (timeDisplay) setInterval(() => { timeDisplay.textContent = new Date().toLocaleTimeString('es-ES', { hour12: false }); }, 1000);
    document.body.className = `theme-${platform}`;
    if (adsContainer) {
        adsContainer.innerHTML = '<div class="ad-card ms-style"><div class="ad-info"><h3>Radio Boyd Pro</h3><p>Elite Audio Streaming</p></div><div class="ad-stats"><span class="time">ON</span></div></div>';
    }
});
