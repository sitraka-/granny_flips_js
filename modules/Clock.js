// modules/Clock.js
export default class Clock {
    /**
     * @param {ParameterStore} paramStore
     *   Expects a parameter named exactly "Clock (BPM)".
     */
    constructor(paramStore) {
        this.paramStore = paramStore;
        this.bpm = paramStore.get('Clock (BPM)') || 120;
        this.intervalId = null;
        this.listeners = [];

        // Re-schedule ticks whenever BPM changes
        this.paramStore.onChange((name, value) => {
            if (name === 'Clock (BPM)') {
                this.setBpm(value);
            }
        });
    }

    setBpm(bpm) {
        this.bpm = bpm;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this._startInterval();
        }
    }

    _startInterval() {
        // Interval in ms per quarter-note
        const msPerBeat = (60 / this.bpm) * 1000;
        this.intervalId = setInterval(() => {
            const now = performance.now();
            this.listeners.forEach(cb => cb(now));
        }, msPerBeat);
    }

    /**
     * Start the clock ticks.
     */
    start() {
        if (!this.intervalId) {
            this._startInterval();
        }
    }

    /**
     * Stop the clock.
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Register a callback to receive tick timestamps.
     * @param {(time: number) => void} callback 
     */
    onTick(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }
}
