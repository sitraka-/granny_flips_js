// modules/Grain.js
import Envelope from './Envelope.js';

export default class Grain {
    /**
     * @param {AudioContext} ctx
     * @param {AudioBuffer} buffer
     */
    constructor(ctx, buffer) {
        this.ctx = ctx;
        this.buffer = buffer;
    }

    /**
     * Play a grain and return its source node.
     * @param {number} startTime     — ctx.currentTime + offset (s)
     * @param {number} bufferOffset  — where in buffer to start (s)
     * @param {number} duration      — grain length (s)
     * @param {number} envShape      — 0–1 from slider
     * @returns {AudioBufferSourceNode}
     */
    play(startTime, bufferOffset, duration, envShape = 1, wet = 0) {
        const { ctx, buffer } = this;
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        src.buffer = buffer;

        // Envelope curve
        const sampleRate = ctx.sampleRate;
        const envLen = Math.floor(duration * sampleRate);
        const curve = Envelope.blended(envShape, envLen);

        gain.gain.setValueCurveAtTime(curve, startTime, duration);

        // Wet/dry split
        const dryGain = ctx.createGain();
        const wetGain = ctx.createGain();
        dryGain.gain.value = 1 - wet;
        wetGain.gain.value = wet;

        src.connect(gain);

        // --- DRY: to speakers
        gain.connect(dryGain).connect(ctx.destination);

        // --- WET: to delay loop (the reverb), then to output
        // Access the delay node created above (see note below)
        gain.connect(wetGain).connect(ctx.reverbDelay);

        // src.connect(gain).connect(ctx.destination);
        src.start(startTime, bufferOffset, duration);
        src.stop(startTime + duration + 0.001);

        // Attach properties for visualization
        src._startPos = bufferOffset;
        src._duration = duration;
        // src._pitch = pitch;

        return src;
    }
}
