// modules/ParameterStore.js
export default class ParameterStore {
    constructor() {
        this.params = {};
        this.listeners = [];
    }

    /**
     * Set a parameter and notify listeners.
     * @param {string} name 
     * @param {number} value 
     */
    set(name, value) {
        this.params[name] = value;
        this.listeners.forEach(cb => cb(name, value));
    }

    /**
     * Get the current value of a parameter.
     * @param {string} name 
     * @returns {number|undefined}
     */
    get(name) {
        return this.params[name];
    }

    /**
     * Register a callback to be invoked on every set().
     * @param {(name: string, value: number) => void} callback 
     */
    onChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }
}
