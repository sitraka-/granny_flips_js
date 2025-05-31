// ui/WaveformVisualizer.js

export default class WaveformVisualizer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {AudioBuffer} audioBuffer
     */
    constructor(canvas, audioBuffer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioBuffer = audioBuffer;
        this.width = canvas.width = window.innerWidth;
        this.height = canvas.height = window.innerHeight * 0.5;
        this.grains = []; // Will be set externally
        this.waveform = null; // Precomputed min/max array

        // Redraw on resize
        window.addEventListener('resize', () => {
            this.width = canvas.width = window.innerWidth;
            this.height = canvas.height = window.innerHeight * 0.5;
            // Recompute waveform for new width
            if (this.audioBuffer) {
                this.waveform = this.computeWaveform(this.audioBuffer, this.width);
            }
        });

        // Precompute waveform if audioBuffer exists
        if (audioBuffer) {
            this.waveform = this.computeWaveform(audioBuffer, this.width);
        }
    }

    setAudioBuffer(audioBuffer) {
        this.audioBuffer = audioBuffer;
        this.waveform = this.computeWaveform(audioBuffer, this.width);
    }

    setGrains(grainList) {
        this.grains = grainList;
    }

    /**
     * Compute min/max per pixel (returns array of {min, max})
     */
    computeWaveform(audioBuffer, width) {
        const data = audioBuffer.getChannelData(0);
        const samplesPerPixel = Math.floor(data.length / width);
        let result = [];
        for (let x = 0; x < width; x++) {
            let start = x * samplesPerPixel;
            let end = Math.min(start + samplesPerPixel, data.length);
            let min = 1.0, max = -1.0;
            for (let i = start; i < end; i++) {
                let v = data[i];
                if (v < min) min = v;
                if (v > max) max = v;
            }
            result.push({ min, max });
        }
        return result;
    }

    draw({ windowStart, windowEnd, playhead, windowWidth }) {
        const { ctx, width, height, audioBuffer, waveform } = this;
        ctx.clearRect(0, 0, width, height);

        // 1. Draw waveform (now using precomputed min/max)
        if (audioBuffer && waveform) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                let { min, max } = waveform[x];
                let y1 = (1 - min) * height / 2;
                let y2 = (1 - max) * height / 2;
                ctx.moveTo(x, y1);
                ctx.lineTo(x, y2);
            }
            ctx.strokeStyle = '#0ff';
            ctx.stroke();
            ctx.restore();

            // Optional: Blur outside window
            // if (windowWidth && windowEnd !== undefined && windowStart !== undefined) {
            //     let totalDur = audioBuffer.duration;
            //     let wx1 = (windowStart / totalDur) * width;
            //     let wx2 = (windowEnd / totalDur) * width;
            //     ctx.save();
            //     ctx.globalAlpha = 0.3;
            //     ctx.fillStyle = '#222';
            //     ctx.fillRect(0, 0, wx1, height);
            //     ctx.restore();
            //     ctx.save();
            //     ctx.globalAlpha = 0.3;
            //     ctx.fillStyle = '#222';
            //     ctx.fillRect(wx2, 0, width - wx2, height);
            //     ctx.restore();
            // }
        }

        // 2. Draw window borders (dotted lines)
        if (windowWidth && windowEnd !== undefined && windowStart !== undefined) {
            let totalDur = audioBuffer.duration;
            let wx1 = (windowStart / totalDur) * width;
            let wx2 = (windowEnd / totalDur) * width;

            ctx.save();
            ctx.setLineDash([8, 8]);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(wx1, 0); ctx.lineTo(wx1, height);
            ctx.moveTo(wx2, 0); ctx.lineTo(wx2, height);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // 3. Draw playhead (thin vertical line)
        if (playhead !== undefined && audioBuffer) {
            let totalDur = audioBuffer.duration;
            let px = (playhead / totalDur) * width;
            ctx.save();
            ctx.strokeStyle = '#f33';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, 0); ctx.lineTo(px, height);
            ctx.stroke();
            ctx.restore();
        }

        // 4. Draw grains (rectangles)
        if (this.grains && this.grains.length > 0 && audioBuffer) {
            this.grains.forEach(grain => {
                let gx = (grain.start / audioBuffer.duration) * width;
                let gw = (grain.duration / audioBuffer.duration) * width;
                let y = height / 2;
                let h = 10;
                ctx.save();
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = '#0ff';
                ctx.fillRect(gx, y - h / 2, Math.max(gw, 10), h);
                ctx.restore();
            });
        }
    }
}
