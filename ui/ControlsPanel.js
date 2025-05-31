// ui/ControlsPanel.js
import SliderContainer from './SliderContainer.js';

export default class ControlsPanel {
    /**
     * @param {Array<Object>} definitions
     *   Array of { name, min, max, default } for each slider
     * @param {Object} paramStore  Optional central store to write values into
     */
    constructor(definitions, paramStore = null) {
        this.definitions = definitions;
        this.paramStore = paramStore;
    }

    render(rootEl) {
        // Create a container for all sliders
        const container = document.createElement('div');
        container.classList.add('slider-container');

        // Instantiate and render the sliders
        const sliderContainer = new SliderContainer(this.definitions, this.paramStore);
        sliderContainer.render(container);

        // Append to the provided root element
        rootEl.appendChild(container);
    }
}
