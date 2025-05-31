// modules/GrainScheduler.js

import Grain from './Grain.js';

export default class GrainScheduler {
    /**
     * @param {AudioContext} audioContext
     * @param {ParameterStore} paramStore
     */
    constructor(audioContext, paramStore) {
        this.ctx = audioContext;
        this.store = paramStore;
        this.sampleBuffer = null;
        this.activeSources = [];
        this.maxPolyphony = 16;  // maximum simultaneous grains
        this.maxDensity = 20;  // maps Density [0–1] to 1…10 grains/beat
        this.maxSubdivs = 32;  // finest grid at TemporalQuant = 0
        this._prevSteps = undefined;

        this._startSubdivisionLoop();
    }

    /**
     * Supply the audio buffer to chop/granularise.
     * @param {AudioBuffer} buffer
     */
    setSampleBuffer(buffer) {
        this.sampleBuffer = buffer;
        console.log('[GrainScheduler] buffer set:', buffer.duration.toFixed(2), 's');
    }

    /**
     * Unified scheduling loop: fires at every subdivision,
     * with subdivision count driven by Temporal Quant,
     * and spawn count driven by Density.
     */
    // _startSubdivisionLoop() {
    //     const loop = () => {
    //         if (!this.sampleBuffer) {
    //             setTimeout(loop, 100);
    //             return;
    //         }

    //         // 1) Read parameters
    //         const bpm = this.store.get('Clock (BPM)');
    //         const beatSec = 60 / bpm;
    //         const TQ = this.store.get('Temporal Quant');   // 0 (cloud) - 1 (groove)
    //         const posQ = this.store.get('Positional Quant');
    //         const gridIndex = this.store.get('Grid Resolution');
    //         const windowParam = this.store.get('Window Size');
    //         const centerParam = this.store.get('Window Center');
    //         const envShape = this.store.get('Envelope Shape');
    //         const grainDur = this.store.get('Size') * 3 + 0.01;
    //         const bufDur = this.sampleBuffer.duration;

    //         // Window/playhead logic
    //         const windowWidth = Math.max(0.01, windowParam * bufDur);
    //         const playheadPos = centerParam * bufDur;
    //         let windowStart = playheadPos - windowWidth / 2;
    //         let windowEnd = playheadPos + windowWidth / 2;
    //         windowStart = ((windowStart % bufDur) + bufDur) % bufDur;
    //         windowEnd = ((windowEnd % bufDur) + bufDur) % bufDur;

    //         // Spatial grid within window
    //         const gridSizes = [4, 8, 16, 32, 64];
    //         const steps = gridSizes[Math.round(gridIndex)];
    //         const gridPoints = [];
    //         for (let i = 0; i < steps; i++) {
    //             let rel = i / steps;
    //             let pos = playheadPos - windowWidth / 2 + rel * windowWidth;
    //             pos = ((pos % bufDur) + bufDur) % bufDur;
    //             gridPoints.push(pos);
    //         }

    //         // --- MAIN CHANGES BELOW ---

    //         // Temporal morph: Grid (groove) vs. free (cloud)
    //         // let intervalMs, grooveMode;
    //         // if (TQ >= 0.7) {
    //         //     // Groove/boombap mode: interval is grid-locked, based on clock
    //         //     const grooveSteps = steps; // e.g. 16 steps per bar
    //         //     intervalMs = (beatSec * 1000) / grooveSteps;
    //         //     grooveMode = true;
    //         //     // Groove pattern: spawn only at certain steps (e.g. 1 & 3)
    //         //     if (!this._groovePattern || this._groovePattern.length !== grooveSteps) {
    //         //         this._groovePattern = new Array(grooveSteps).fill(0);
    //         //         this._groovePattern[0] = 1;
    //         //         this._groovePattern[Math.floor(grooveSteps / 2)] = 1;
    //         //     }
    //         // } else {
    //         //     // Cloud mode: interval is short and not tied to tempo
    //         //     // Let density [0,1] map to ~100ms (sparse) down to ~10ms (very dense)
    //         //     const minInterval = 0.01; // 10ms
    //         //     const maxInterval = 0.1;  // 100ms
    //         //     intervalMs = maxInterval - (maxInterval - minInterval) * this.store.get('Density');
    //         //     grooveMode = false;
    //         //     this._groovePattern = null;
    //         // }

    //         // --- Smooth morphing interval and pattern logic --- //
    //         const minInterval = 0.01; // 10ms (cloud)
    //         const maxGridSteps = steps;
    //         const gridInterval = (beatSec * 1000) / maxGridSteps; // ms (groove)
    //         const intervalMs = minInterval * (1 - TQ) + gridInterval * TQ; // Smooth blend


    //         if (this._prevSteps !== steps) {
    //             this._groovePattern = new Array(steps).fill(0);

    //             // Always ON at downbeat and halfway (snare)
    //             this._groovePattern[0] = 1;
    //             this._groovePattern[Math.floor(steps / 2)] = 1;

    //             // At high grid resolution, add ghost notes (simulate 16th swing)
    //             if (steps >= 32) {
    //                 // Example: ghost on "3", "7", "11", "15" (in a 16, 32, 64 grid these are classic swing points)
    //                 for (let i = 3; i < steps; i += 4) {
    //                     // Don’t overwrite strong beats
    //                     if (!this._groovePattern[i]) {
    //                         this._groovePattern[i] = 1;
    //                     }
    //                 }
    //             }

    //             this._prevSteps = steps;
    //         }



    //         // Groove "strength" controls how much pattern matters
    //         const grooveStrength = TQ; // 0 = ignore pattern, 1 = only pattern


    //         // --- STATE FOR WHICH TICK WE'RE ON ---
    //         if (!this._tickCounter) this._tickCounter = 0;

    //         // let spawnGrain = false;
    //         // const density = this.store.get('Density'); // 0–1, used as probability in both modes

    //         // if (grooveMode) {
    //         //     // Only spawn if current step is in pattern
    //         //     let grooveSteps = steps;
    //         //     let patternIdx = this._tickCounter % grooveSteps;
    //         //     // spawnGrain = !!this._groovePattern[patternIdx];
    //         //     spawnGrain = !!this._groovePattern[patternIdx] && (Math.random() < density);
    //         // } else {
    //         //     // Cloud: spawn on every tick, possibly randomly drop some based on density
    //         //     // spawnGrain = Math.random() < this.store.get('Density');
    //         //     spawnGrain = Math.random() < density;
    //         // }
    //         // --- GOOD WORKING
    //         let spawnGrain = false;
    //         const density = this.store.get('Density'); // 0–1

    //         let grooveSteps = steps;
    //         let patternIdx = this._tickCounter % grooveSteps;
    //         const patternOn = !!this._groovePattern[patternIdx];
    //         const patternProb = patternOn ? density * grooveStrength : 0;
    //         const randomProb = density * (1 - grooveStrength);
    //         spawnGrain = Math.random() < (patternProb + randomProb);
    //         // --- END GOOD WORKING


    //         // Smooth fade of allowedVoices from maxPolyphony (cloud) to 1 (groove)
    //         const allowedVoices = Math.max(1, Math.round(this.maxPolyphony * (1 - grooveStrength) + 1 * grooveStrength));

    //         // Only one grain per tick, interval morphs between groove/clock and dense ms
    //         // if (spawnGrain) {
    //         //     this._playOneGrain({
    //         //         now: this.ctx.currentTime,
    //         //         playheadPos,
    //         //         windowWidth,
    //         //         gridPoints,
    //         //         posQ,
    //         //         grainDur,
    //         //         envShape,
    //         //         allowedVoices: grooveMode ? 1 : this.maxPolyphony,
    //         //         bufDur,
    //         //         grooveMode
    //         //     });
    //         // }
    //         if (spawnGrain) {
    //             this._playOneGrain({
    //                 now: this.ctx.currentTime,
    //                 playheadPos,
    //                 windowWidth,
    //                 gridPoints,
    //                 posQ,
    //                 grainDur,
    //                 envShape,
    //                 allowedVoices,
    //                 bufDur,
    //                 grooveStrength // Pass grooveStrength, not a boolean grooveMode
    //             });
    //         }


    //         // Advance tick counter
    //         this._tickCounter = (this._tickCounter + 1) % steps;

    //         // Schedule next loop
    //         setTimeout(loop, intervalMs);
    //     };

    //     loop();
    // }
    _startSubdivisionLoop() {
        const loop = () => {
            if (!this.sampleBuffer) {
                setTimeout(loop, 100);
                return;
            }

            // 1) Parameters
            const bpm = this.store.get('Clock (BPM)');
            const beatSec = 60 / bpm;
            const TQ = this.store.get('Temporal Quant');
            const posQ = this.store.get('Positional Quant');
            const gridIndex = this.store.get('Grid Resolution');
            const windowParam = this.store.get('Window Size');
            const centerParam = this.store.get('Window Center');
            const envShape = this.store.get('Envelope Shape');
            const grainDur = this.store.get('Size') * 3 + 0.01;
            const bufDur = this.sampleBuffer.duration;

            // Window/playhead logic
            const windowWidth = Math.max(0.01, windowParam * bufDur);
            const playheadPos = centerParam * bufDur;
            let windowStart = playheadPos - windowWidth / 2;
            let windowEnd = playheadPos + windowWidth / 2;
            windowStart = ((windowStart % bufDur) + bufDur) % bufDur;
            windowEnd = ((windowEnd % bufDur) + bufDur) % bufDur;

            // Spatial grid (timing grid)
            const gridSizes = [4, 8, 16, 32, 64];
            const steps = gridSizes[Math.round(gridIndex)];
            const gridPoints = [];
            for (let i = 0; i < steps; i++) {
                let rel = i / steps;
                let pos = playheadPos - windowWidth / 2 + rel * windowWidth;
                pos = ((pos % bufDur) + bufDur) % bufDur;
                gridPoints.push(pos);
            }

            // --- Major pattern per grid resolution ---
            // Define "classic" boombap major beats for each resolution.
            // These can be changed to taste for different swing/groove.
            const MAJOR_PATTERNS = {
                4: [0], // Just downbeat (e.g. grid: 1/4)
                8: [0, 4], // 1 & 3 (e.g. 1/8)
                16: [0, 4, 8, 12], // 1, 2, 3, 4 (e.g. 1/16)
                32: [0, 6, 12, 18, 24], // e.g. more Dilla swing feel
                64: [0, 12, 24, 36, 48, 60] // more micro-timing
            };
            const majorIdxs = MAJOR_PATTERNS[steps] || [0]; // fallback: downbeat
            if (!this._tickCounter) this._tickCounter = 0;

            // --- Pattern mask for this resolution ---
            // 1 = major beat, 0 = minor/subdivision
            if (!this._groovePattern || this._groovePattern.length !== steps) {
                this._groovePattern = new Array(steps).fill(0);
                majorIdxs.forEach(idx => {
                    if (idx < steps) this._groovePattern[idx] = 1;
                });
            }

            // --- Calculate timing interval ---
            // At TQ=1, locked to the grid; at TQ=0, minimum interval (cloud)
            const minInterval = 0.01; // 10ms
            const gridInterval = (beatSec * 1000) / steps;
            const intervalMs = minInterval * (1 - TQ) + gridInterval * TQ;

            // --- Actual spawning logic ---
            const density = this.store.get('Density'); // 0–1
            const patternIdx = this._tickCounter % steps;
            const patternOn = !!this._groovePattern[patternIdx];

            let spawnGrain = false;
            if (patternOn) {
                // Major beat: always spawn at TQ=1, always some chance at lower TQ
                spawnGrain = true;
            } else {
                // Non-major: only spawn with probability = density
                spawnGrain = Math.random() < density;
            }

            // Polyphony fades: as TQ → 1, force only one grain; as → 0, allow more
            const grooveStrength = TQ;
            const allowedVoices = Math.max(1, Math.round(this.maxPolyphony * (1 - grooveStrength) + 1 * grooveStrength));

            if (spawnGrain) {
                this._playOneGrain({
                    now: this.ctx.currentTime,
                    playheadPos,
                    windowWidth,
                    gridPoints,
                    posQ,
                    grainDur,
                    envShape,
                    allowedVoices,
                    bufDur,
                    grooveStrength
                });
            }

            this._tickCounter = (this._tickCounter + 1) % steps;
            setTimeout(loop, intervalMs);
        };

        loop();
    }



    /**
     * Play one grain, enforcing polyphony.
     */
    _playOneGrain({
        now, playheadPos, windowWidth, gridPoints, posQ,
        grainDur, envShape, allowedVoices, bufDur, grooveStrength
    }) {
        // Polyphony/muting fades: as grooveStrength → 1, force only one grain; as → 0, allow more grains
        // We'll enforce muting with probability = grooveStrength
        if (grooveStrength > 0.9 && this.activeSources.length > 0) {
            // In near-full groove mode, force single grain
            this.activeSources.forEach(src => { if (src.stop) src.stop(); });
            this.activeSources = [];
        } else if (this.activeSources.length >= allowedVoices) {
            // In cloud mode, enforce maxPolyphony
            return;
        }
        // ...rest unchanged...
        let rel = Math.random();
        let startPos = playheadPos - windowWidth / 2 + rel * windowWidth;
        startPos = ((startPos % bufDur) + bufDur) % bufDur;

        if (posQ > 0 && gridPoints.length > 1) {
            let nearest = gridPoints.reduce((a, b) => Math.abs(b - startPos) < Math.abs(a - startPos) ? b : a);
            startPos = startPos * (1 - posQ) + nearest * posQ;
            startPos = ((startPos % bufDur) + bufDur) % bufDur;
        }

        // const src = new Grain(this.ctx, this.sampleBuffer)
        //     .play(now + 0.01, startPos, grainDur, envShape);
        const overlap = this.store.get('Overlap'); // 0–1 from slider
        const src = new Grain(this.ctx, this.sampleBuffer)
            .play(now + 0.01, startPos, grainDur, envShape, overlap);

        src.onended = () => {
            this.activeSources = this.activeSources.filter(s => s !== src);
        };
        this.activeSources.push(src);
    }


}
