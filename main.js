// main.js
import ControlsPanel from './ui/ControlsPanel.js';
import ParameterStore from './modules/ParameterStore.js';
import Clock from './modules/Clock.js';
import AudioContextManager from './modules/AudioContextManager.js';
import SampleLoader from './modules/SampleLoader.js';
import GrainScheduler from './modules/GrainScheduler.js';
import WaveformVisualizer from './ui/WaveformVisualizer.js';


window.addEventListener('DOMContentLoaded', () => {
    // 1) UI & Parameter Store
    const paramStore = new ParameterStore();
    const definitions = [
        { name: 'Clock (BPM)', min: 30, max: 300, default: 120 },
        { name: 'Density', min: 0, max: 1, default: 0.5 },
        { name: 'Size', min: 0, max: 1, default: 0.5 },
        { name: 'Overlap', min: 0, max: 1, default: 0.5 },
        { name: 'Temporal Quant', min: 0, max: 1, default: 0.5 },
        { name: 'Positional Quant', min: 0, max: 1, default: 0.5 },
        { name: 'Window Center', min: 0, max: 1, default: 0.5 },
        { name: 'Window Size', min: 0, max: 1, default: 1.0 },
        {
            name: 'Grid Resolution',   // 0 → 4, 1 → 8, 2 → 16, 3 → 32, 4 → 64
            min: 0,
            max: 4,
            default: 2,
            step: 1                    // ensure snapping
        },
        { name: 'Envelope Shape', min: 0, max: 1, default: 0.5 },
    ];

    // Seed the store with defaults so params are never undefined:
    definitions.forEach(def => paramStore.set(def.name, def.default));


    new ControlsPanel(definitions, paramStore)
        .render(document.getElementById('controls'));

    paramStore.onChange((n, v) => console.log(`[ParameterStore] ${n} → ${v}`));

    const canvas = document.getElementById('waveform');
    let visualizer = null;
    let currentAudioBuffer = null;

    // 2) Clock
    const clock = new Clock(paramStore);
    clock.onTick(t => console.log(`[Clock] tick @ ${t.toFixed(1)}ms`));
    clock.start();

    // 3) Audio Context
    const audioCtxManager = new AudioContextManager();
    const audioContext = audioCtxManager.context;

    // 4) Grain Scheduler
    const scheduler = new GrainScheduler(audioContext, paramStore, clock);
    console.log('✅ GrainScheduler wired.');

    // 5) Sample Loader
    const loader = new SampleLoader(audioContext, buffer => {
        scheduler.setSampleBuffer(buffer);
        currentAudioBuffer = buffer;
        // if (!visualizer) visualizer = new WaveformVisualizer(canvas, buffer);
        // else visualizer.setAudioBuffer(buffer);
    });
    document.getElementById('sampleLoader')
        .addEventListener('change', loader.handleFileSelect.bind(loader));

    document.getElementById('sampleLoader').addEventListener('change', function (e) {
        const file = e.target.files[0];
        document.getElementById('sampleLoader-filename').textContent = file ? file.name : "No file loaded";
    });

    console.log('🚀 Ready! Load a sample to begin hearing grains.');
    // In your clock/tick or after each scheduling event, update visualizer:
    function updateVisualizer() {
        if (!visualizer || !currentAudioBuffer) return;
        // Get window/playhead from params
        const bufDur = currentAudioBuffer.duration;
        const windowWidth = paramStore.get('Window Size') * bufDur;
        const playhead = paramStore.get('Window Center') * bufDur;
        let windowStart = playhead - windowWidth / 2;
        let windowEnd = playhead + windowWidth / 2;
        windowStart = ((windowStart % bufDur) + bufDur) % bufDur;
        windowEnd = ((windowEnd % bufDur) + bufDur) % bufDur;
        // Example: grains list—should collect from scheduler's currently active grains
        const grains = scheduler.activeSources.map(grain => ({
            start: grain._startPos,         // You may need to expose this in Grain.js
            duration: grain._duration,      // Likewise, expose as property
            pitch: grain._pitch || 0        // For now, all 0
        }));
        visualizer.setGrains(grains);
        visualizer.draw({ windowStart, windowEnd, playhead, windowWidth });
    }

    // Call updateVisualizer() on every tick, or as needed
    // setInterval(updateVisualizer, 30); // or tie to animation frame / clock
});
