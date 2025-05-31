// ui/Slider.js
export default class Slider {
    constructor({ name, min, max, default: defaultValue, step }) {
        // Container
        this.element = document.createElement('div');
        this.element.classList.add('slider');

        // Label
        const label = document.createElement('label');
        label.textContent = `${name}: `;
        this.element.appendChild(label);

        // Range input
        this.input = document.createElement('input');
        this.input.type = 'range';
        this.input.min = min;
        this.input.max = max;
        this.input.step = step != null ? step : (max - min) / 100;  // reasonable granularity
        this.input.value = defaultValue;
        this.element.appendChild(this.input);

        this.valueDisplay = document.createElement('span');
        this.valueDisplay.className = 'slider-value';
        this.valueDisplay.textContent = defaultValue;
        this.element.appendChild(this.valueDisplay);

        // Update value display on input
        this.input.addEventListener('input', () => {
            this.valueDisplay.textContent = this.input.value;
        });
    }

    onChange(callback) {
        this.input.addEventListener('input', () => {
            callback(parseFloat(this.input.value));
        });
    }
}
