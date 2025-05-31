// modules/AudioContextManager.js
export default class AudioContextManager {
    constructor() {
        this.context = null;
        this._init();
    }

    async _init() {
        // Create the AudioContext
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        // Some browsers require a user action to start audio
        await this._unlockAudio();
        console.log('[AudioContextManager] state:', this.context.state);

        // === REVERB (feedback delay) setup ===
        // Only do this ONCE!
        this.reverbDelay = this.context.createDelay();
        this.reverbDelay.delayTime.value = 0.08; // 70ms, tweak to taste

        this.reverbFB = this.context.createGain();
        this.reverbFB.gain.value = 0.9; // feedback amount, tweak to taste (0.2–0.7)

        this.reverbDelay.connect(this.reverbFB);
        this.reverbFB.connect(this.reverbDelay);

        this.reverbOut = this.context.createGain();
        this.reverbDelay.connect(this.reverbOut);
        this.reverbOut.connect(this.context.destination);

        // Attach reverbDelay to the context so Grain.js can use it
        this.context.reverbDelay = this.reverbDelay;
    }

    async _unlockAudio() {
        if (this.context.state === 'suspended') {
            const resume = () => {
                this.context.resume().then(() => {
                    if (this.context.state === 'running') {
                        window.removeEventListener('click', resume);
                        console.log('[AudioContextManager] resumed on user interaction');
                    }
                });
            };
            window.addEventListener('click', resume);
        }
    }
}
