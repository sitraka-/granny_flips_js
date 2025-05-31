// ui/SliderContainer.js
import Slider from './Slider.js';

export default class SliderContainer {
    constructor(definitions, paramStore = null) {
        this.definitions = definitions;
        this.sliders = [];
        this.paramStore = paramStore;
    }

    render(rootEl) {
        this.definitions.forEach(def => {
            const slider = new Slider(def);
            rootEl.appendChild(slider.element);
            this.sliders.push(slider);

            // If we have a ParameterStore, wire changes automatically
            if (this.paramStore) {
                slider.onChange(value => {
                    this.paramStore.set(def.name, value);
                });
            }
        });
    }
}
