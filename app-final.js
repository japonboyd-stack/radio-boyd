// Radio Boyd - Ultimate Web Stability Version
document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('play-btn');
    const freqDisplay = document.getElementById('freq-display');
    const stationLabel = document.getElementById('station-label');
    const volSlider = document.getElementById('volume-slider');
    const countrySelect = document.getElementById('select-country');
    const stationsContainer = document.getElementById('stations-list');
    const visualizer = document.getElementById('visualizer');

    let isPlaying = false;
    let isAM = false;
    let currentStationUrl = "https://stream.radioparadise.com/mp3_128"; // Solid fallback station

    // Simplified Audio
    const stationAudio = new Audio();
    stationAudio.crossOrigin = "anonymous";
    stationAudio.src = currentStationUrl;

    const FALLBACK_STATIONS = [
        { name: "Radio Paradise (Rock)", url: "https://stream.radioparadise.com/mp3_128" },
        { name: "SomaFM Groove Salad", url: "https://ice1.somafm.com/groovesalad-128-mp3" },
        { name: "Classic FM", url: "https://media-ice.musicradio.com/ClassicFMMP3" },
        { name: "Dance Wave", url: "https://dancewave.online/dance.mp3" }
    ];

    function togglePlay() {
        if (!isPlaying) {
            stationAudio.play().then(() => {
                isPlaying = true;
                playBtn.textContent = '⏸';
                if (stationLabel) stationLabel.textContent = "SINTONIZADO • OK";
                animateBars();
            }).catch(err => {
                console.error("Playback blocked:", err);
                alert("Pulsa en cualquier parte de la página para activar el sonido.");
            });
        } else {
            stationAudio.pause();
            isPlaying = false;
            playBtn.textContent = '▶';
        }
    }

    if (playBtn) playBtn.addEventListener('click', togglePlay);

    // Fill stations immediately
    if (stationsContainer) {
        stationsContainer.innerHTML = '';
        FALLBACK_STATIONS.forEach(s => {
            const item = document.createElement('div');
            item.className = 'station-item';
            item.innerHTML = `<div class="station-name">${s.name}</div><div class="station-tags">Streaming OK</div>`;
            item.addEventListener('click', () => {
                stationAudio.src = s.url;
                currentStationUrl = s.url;
                isPlaying = false;
                togglePlay();
                if (stationLabel) stationLabel.textContent = s.name;
            });
            stationsContainer.appendChild(item);
        });
    }

    function animateBars() {
        if (!isPlaying || !visualizer) return;
        const bars = visualizer.querySelectorAll('.bar');
        if (bars.length === 0) {
            for (let i = 0; i < 20; i++) {
                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.height = '10%';
                visualizer.appendChild(bar);
            }
        }
        const activeBars = visualizer.querySelectorAll('.bar');
        activeBars.forEach(bar => {
            bar.style.height = `${Math.random() * 70 + 10}%`;
        });
        setTimeout(() => requestAnimationFrame(animateBars), 150);
    }

    // Basic Volume
    if (volSlider) volSlider.addEventListener('input', () => {
        stationAudio.volume = volSlider.value / 100;
    });

    // AM/FM Visual Switch (Simplified)
    const btnAM = document.getElementById('btn-am');
    const btnFM = document.getElementById('btn-fm');
    if (btnAM) btnAM.addEventListener('click', () => {
        isAM = true;
        btnAM.classList.add('active');
        btnFM.classList.remove('active');
        document.body.classList.add('theme-am');
        if (freqDisplay) freqDisplay.textContent = "840";
        if (stationLabel) stationLabel.textContent = "AM BAND";
    });
    if (btnFM) btnFM.addEventListener('click', () => {
        isAM = false;
        btnFM.classList.add('active');
        btnAM.classList.remove('active');
        document.body.classList.remove('theme-am');
        if (freqDisplay) freqDisplay.textContent = "104.5";
        if (stationLabel) stationLabel.textContent = "FM STEREO";
    });

    // Clock
    const timeDisplay = document.getElementById('current-time');
    if (timeDisplay) setInterval(() => {
        timeDisplay.textContent = new Date().toLocaleTimeString('es-ES', { hour12: false });
    }, 1000);

    // Country Select Fallback
    if (countrySelect) {
        countrySelect.innerHTML = '<option value="">Selecciona País</option><option value="ES">España</option><option value="MX">México</option>';
    }

    console.log("Radio Boyd Ultimate v3.0 Loaded");
});
