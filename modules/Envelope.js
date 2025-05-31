// modules/Envelope.js

export default class Envelope {
    /**
     * Pure rectangular window (all ones).
     */
    static rectangle(length) {
        const win = new Float32Array(length);
        for (let i = 0; i < length; i++) win[i] = 1;
        return win;
    }

    /**
     * Hann window for smooth fades.
     */
    static hann(length) {
        const win = new Float32Array(length);
        for (let i = 0; i < length; i++) {
            win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
        }
        return win;
    }

    /**
     * Blend between rectangle and Hann by `shape` (0–1).
     * @param {number} shape — 0 = pure rectangle; 1 = pure Hann
     * @param {number} length — window length in samples
     */
    static blended(shape, length) {
        const rect = Envelope.rectangle(length);
        const hann = Envelope.hann(length);
        const win = new Float32Array(length);
        for (let i = 0; i < length; i++) {
            win[i] = rect[i] + shape * (hann[i] - rect[i]);
        }
        return win;
    }
}
