// modules/SampleLoader.js

export default class SampleLoader {
    /**
     * @param {AudioContext} audioContext
     * @param {(buffer: AudioBuffer) => void} onLoadCallback
     */
    constructor(audioContext, onLoadCallback) {
        this.audioContext = audioContext;
        this.onLoad = onLoadCallback;
    }

    /**
     * Bind this to your file-input’s change event.
     * @param {Event} event
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('[SampleLoader] Loaded sample:', file.name, `(${audioBuffer.duration.toFixed(2)}s)`);
            this.onLoad(audioBuffer);
        } catch (err) {
            console.error('[SampleLoader] Error decoding audio:', err);
        }
    }
}
