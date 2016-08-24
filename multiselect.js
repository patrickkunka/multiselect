(function(window) {
    var Multiselect = function(el, config) {
        var _ = new Multiselect.Private(el, config);

        Object.seal(this);
    };

    Multiselect.Private = function(el, config) {
        this.options                = [];
        this.values                 = [];
        this.config                 = new Multiselect.Config();
        this.dom                    = new Multiselect.Dom();
        this.buttonStatus           = 'disabled';
        this.valuesMixer            = null;
        this.optionsMixer           = null;

        this.init(el, config);

        Object.seal(this);
    };

    Multiselect.Private.prototype = {
        constructor: Multiselect.Private,

        init: function(el, config) {
            var self = this;

            Object.assign(self.config, config);

            self.dom.el = el;

            if (self.dom.el.tagName === 'SELECT') {
                self.readOptionsFromSelect(self.dom.el);
            }

            self.selectInitialValue();

            self.renderUi();

            self.initMixer();

            self.updateValues();

            self.bindEvents();
        },

        readOptionsFromSelect: function(select) {
            var self        = this,
                option      = null,
                inputOption = null,
                i           = -1;

            if (!select.options.length) return;

            for (i = 0; option = select.options[i]; i++) {
                inputOption = new Multiselect.Option();

                inputOption.index     = i;
                inputOption.value     = option.value;
                inputOption.label     = option.label;
                inputOption.disabled  = option.disabled;

                self.options.push(inputOption);
            }
        },

        readOptionsFromApi: function() {

        },

        selectInitialValue: function() {
            var self            = this,
                value           = null,
                availableValues = null,
                index           = -1,
                i               = -1;

            if (!self.config.value.length) return;

            availableValues = self.options.map(function(option) {
                if (typeof self.config.mapValue === 'function') {
                    return self.config.mapValue(option.value);
                } else {
                    return option.value;
                }
            });

            for (i = 0; i < self.config.value.length; i++) {
                value = self.config.value[i];

                if ((index = availableValues.indexOf(value)) > -1) {
                    self.selectOption(self.options[index], i);
                }
            }
        },

        selectOption: function(optionsOption, insertAtIndex) {
            var self            = this,
                valuesOption    = new Multiselect.Option();

            optionsOption.selected = true;

            // Do not automap

            valuesOption.label  = optionsOption.label;
            valuesOption.index  = optionsOption.index;

            if (typeof self.config.mapValue === 'function') {
                valuesOption.value = self.config.mapValue(option.value);
            } else {
                valuesOption.value = optionsOption.value;
            }

            self.values[insertAtIndex] = valuesOption;
        },

        deselectOption: function(valueOption) {
            var self        = this,
                option      = null,
                i           = -1;

            option = self.options[valueOption.index];

            option.selected = false;

            for (i = 0; option = self.values[i]; i++) {
                // Find index of valueOption in values, and remove option

                if (valueOption.index !== option.index) continue;

                self.values.splice(i, 1);

                i--;
            }
        },

        focusOption: function(list, focusAtIndex, allowMultiple) {
            var option  = null,
                i       = -1;

            if (!allowMultiple) {
                for (i = 0; option = list[i]; i++) {
                    if (i === focusAtIndex) continue;

                    option.focussed = false;
                }
            }

            option = list[focusAtIndex];

            if (option.selected) return;

            if (option.focussed) {
                option.focussed = false;
            } else {
                option.focussed = true;
            }
        },

        blurOptions: function(list) {
            var option = null;

            for (i = 0; option = list[i]; i++) {
                option.focussed = false;
            }
        },

        reorderValues: function(fromIndex, toIndex) {
            var self = this;

            self.values.splice(toIndex, 0, self.values.splice(fromIndex, 1)[0]);
        },

        bindEvents: function() {
            var self = this;

            self.dom.options.addEventListener('click', self.handleListClick.bind(self, self.dom.options));
            self.dom.values.addEventListener('click', self.handleListClick.bind(self, self.dom.values));
            self.dom.buttonSelect.addEventListener('click', self.handleButtonClick.bind(self, self.dom.buttonSelect));
            self.dom.buttonDeselect.addEventListener('click', self.handleButtonClick.bind(self, self.dom.buttonDeselect));
        },

        handleListClick: function(listContainer, e) {
            var self                = this,
                list                = null,
                allowMultiple       = false,
                index               = -1;

            index = Multiselect.h.index(e.target);

            if (e.metaKey) {
                allowMultiple = true;
            }

            switch (listContainer) {
                case self.dom.options:
                    self.focusOption(self.options, index, allowMultiple);
                    self.blurOptions(self.values);

                    break;
                case self.dom.values:
                    self.focusOption(self.values, index, allowMultiple);
                    self.blurOptions(self.options);

                    break;
            }

            self.updateState();
        },

        handleButtonClick: function(button, e) {
            var self = this;

            switch (button) {
                case self.dom.buttonSelect:
                    self.selectFocussed();

                    break;
                case self.dom.buttonDeselect:
                    self.deselectFocussed();

                    break;
            }

            self.blurOptions(self.values);
            self.blurOptions(self.options);

            self.buttonStatus = 'disabled';

            self.updateValues();
        },

        selectFocussed: function() {
            var self    = this,
                option  = null,
                i       = -1;

            for (i = 0; option = self.options[i]; i++) {
                if (!option.focussed) continue;

                self.selectOption(option, self.values.length);
            }
        },

        deselectFocussed: function() {
            var self    = this,
                option  = null,
                i       = -1;

            for (i = 0; option = self.values[i]; i++) {
                if (!option.focussed) continue;

                self.deselectOption(option);

                i--;
            }
        },

        updateState: function() {
            var self            = this,
                state           = null,
                isSelectable    = false,
                isDeselectable  = false;

            isSelectable = self.options.filter(function(option) {
                return option.focussed;
            }).length > 0;

            isDeselectable = self.values.filter(function(option) {
                return option.focussed;
            }).length > 0;

            if (isSelectable) {
                self.buttonStatus = 'selectable';
            } else if (isDeselectable) {
                self.buttonStatus = 'deselectable';
            } else {
                self.buttonStatus = 'disabled';
            }

            state = self.buildState();

            if (typeof self.config.callbacks.onFocus === 'function') {
                self.config.callbacks.onFocus.call(null, state);
            }

            self.renderState();
        },

        updateValues: function() {
            var self    = this,
                state   = null;

            state = self.buildState();

            if (typeof self.config.callbacks.onChange === 'function') {
                self.config.callbacks.onChange.call(null, state);
            }

            self.renderState();
        },

        buildState: function() {
            var self    = this,
                state   = new Multiselect.State();

            state.value = self.values.map(function(option) {
                return option.value;
            });

            state.buttonStatus = self.buttonStatus;

            Object.freeze(state);

            return state;
        },

        renderUi: function() {
            var self        = this,
                container   = null;

            if (self.dom.el.tagName === 'SELECT') {
                container = document.createElement('div');

                self.dom.select = self.dom.el;
                self.dom.el     = container;

                self.dom.el.classList.add(self.config.classNames.el);

                self.dom.select.parentElement.replaceChild(container, self.dom.select);
            }

            if (!self.dom.options) {
                self.dom.options = document.createElement('div');

                self.dom.options.classList.add(self.config.classNames.list, self.config.classNames.options);

                self.dom.el.appendChild(self.dom.options);
            }

            if (!self.dom.controls) {
                self.dom.controls = document.createElement('div');

                self.dom.controls.classList.add(self.config.classNames.controls);

                self.dom.el.appendChild(self.dom.controls);
            }

            if (!self.dom.buttonSelect) {
                self.dom.buttonSelect = document.createElement('button');
                self.dom.buttonSelect.innerHTML = self.config.labels.buttonSelect;

                self.dom.buttonSelect.classList.add(self.config.classNames.button, self.config.classNames.buttonSelect);

                self.dom.controls.appendChild(self.dom.buttonSelect);
            }

            if (!self.dom.buttonDeselect) {
                self.dom.buttonDeselect = document.createElement('button');
                self.dom.buttonDeselect.innerHTML = self.config.labels.buttonDeselect;

                self.dom.buttonDeselect.classList.add(self.config.classNames.button, self.config.classNames.buttonDeselect);

                self.dom.controls.appendChild(self.dom.buttonDeselect);
            }

            if (!self.dom.values) {
                self.dom.values = document.createElement('div');

                self.dom.values.classList.add(self.config.classNames.list, self.config.classNames.values);

                self.dom.el.appendChild(self.dom.values);
            }
        },

        renderState: function() {
            var self = this;

            switch (self.buttonStatus) {
                case 'selectable':
                    self.dom.buttonSelect.disabled      = false;
                    self.dom.buttonDeselect.disabled    = true;

                    self.dom.el.classList.add(self.config.classNames.selectable);
                    self.dom.el.classList.remove(self.config.classNames.deselectable);

                    break;
                case 'deselectable':
                    self.dom.buttonSelect.disabled      = true;
                    self.dom.buttonDeselect.disabled    = false;

                    self.dom.el.classList.remove(self.config.classNames.selectable);
                    self.dom.el.classList.add(self.config.classNames.deselectable);

                    break;
                default:
                    self.dom.buttonSelect.disabled      = true;
                    self.dom.buttonDeselect.disabled    = true;

                    self.dom.el.classList.remove(self.config.classNames.selectable, self.config.classNames.deselectable);
            }

            self.renderOptions(self.dom.options, self.options);
            self.renderOptions(self.dom.values, self.values);
        },

        renderOptions: function(container, data) {
            var self            = this,
                mixer           = null,
                option          = null,
                children        = null,
                el              = null,
                elsRendered     = [],
                elsToRemove     = [],
                elsToAdd        = [],
                i               = -1;

            children = container.children;

            for (i = 0; option = data[i]; i++) {
                el = option.el;

                if (!el) {
                    // Create el and add to elsToAdd array

                    el = document.createElement('div');

                    el.textContent = option.label;

                    el.classList.add(self.config.classNames.option);

                    elsToAdd.push(el);

                    option.el = el;
                } else {
                    // Already rendered, Add to elsRendered array

                    elsRendered.push(el);
                }

                // Update classes as needed

                if (option.focussed) {
                    el.classList.add(self.config.classNames.optionFocussed);
                } else if (option.selected) {
                    el.classList.add(self.config.classNames.optionSelected);
                    el.classList.remove(self.config.classNames.optionFocussed);
                } else {
                    el.classList.remove(self.config.classNames.optionFocussed, self.config.classNames.optionSelected);
                }
            }

            for (i = 0; el = children[i]; i++) {
                if (elsRendered.indexOf(el) < 0) {
                    // Element no longer in data, remove

                    elsToRemove.push(el);
                }
            }

            switch (container) {
                case self.dom.values:
                    mixer = self.valuesMixer;

                    break;
                case self.dom.options:
                    mixer = self.optionsMixer;

                    break;
            }

            mixer.multiMix({
                insert: {
                    collection: elsToAdd,
                    index: self.values.length
                },
                remove: {
                    collection: elsToRemove
                }
            });
        },

        initMixer: function() {
            var self = this,
                animationConfig = {
                    duration: 120,
                    effects: 'fade translateZ(-100px)'
                };

            self.optionsMixer = mixitup(self.dom.options, {
                selectors: {
                    target: '.' + self.config.classNames.option
                },
                animation: animationConfig
            });

            self.valuesMixer = mixitup(self.dom.values, {
                selectors: {
                    target: '.' + self.config.classNames.option
                },
                animation: animationConfig,
                dragndrop: {
                    enable: true,
                    restrictY: true
                },
                callbacks: {
                    onMixDrop: function(state) {
                        self.reorderValues(state.liftIndex, state.dropIndex);

                        self.updateValues();
                    }
                }
            });

            self.optionsMixer.init();
            self.valuesMixer.init();
        }
    };

    Multiselect.Plugins = function() {
        this.mixitup = null;

        Object.seal(this);
    };

    Multiselect.Config = function() {
        this.labelKey   = '';
        this.mapValue   = null;
        this.value      = [];
        this.callbacks  = new Multiselect.ConfigCallbacks();
        this.classNames = new Multiselect.ConfigClassNames();
        this.labels     = new Multiselect.ConfigLabels();

        Object.seal(this);
    };

    Multiselect.ConfigCallbacks = function() {
        this.onChange   = null;
        this.onFocus    = null;
        this.onBlur     = null;

        Object.seal(this);
    };

    Multiselect.ConfigLabels = function() {
        this.buttonSelect   = 'Select';
        this.buttonDeselect = 'Deselect';

        Object.seal(this);
    };

    Multiselect.ConfigClassNames = function() {
        this.el             = 'multiselect';
        this.selectable     = 'multiselect__selectable';
        this.deselectable   = 'multiselect__deselectable';
        this.hasValue       = 'multiselect__has-value';
        this.list           = 'multiselect_list';
        this.options        = 'multiselect_list__options';
        this.values         = 'multiselect_list__values';
        this.controls       = 'multiselect_controls';
        this.button         = 'multiselect_button';
        this.buttonSelect   = 'multiselect_button__select';
        this.buttonDeselect = 'multiselect_button__deselect';
        this.option         = 'multiselect_option';
        this.optionFocussed = 'multiselect_option__focussed';
        this.optionSelected = 'multiselect_option__selected';

        Object.seal(this);
    };

    Multiselect.Dom = function() {
        this.el             = null;
        this.select         = null;
        this.options        = null;
        this.values         = null;
        this.controls       = null;
        this.buttonSelect   = null;
        this.buttonDeselect = null;

        Object.seal(this);
    };

    Multiselect.Option = function() {
        this.index      = -1;
        this.value      = '';
        this.label      = '';
        this.disabled   = false;
        this.focussed   = false;
        this.selected   = false;
        this.el         = null;

        Object.seal(this);
    };

    Multiselect.State = function() {
        this.value = [];
    };

    Multiselect.h = {
        /**
         * @param {HTMLElement} el
         * @param {string}      selector
         */

        index: function(el, selector) {
            var i = 0;

            while ((el = el.previousElementSibling) !== null) {
                if (!selector || el.matches(selector)) {
                    ++i;
                }
            }

            return i;
        }
    };

    Multiselect.plugins = new Multiselect.Plugins();

    Multiselect.use = function(plugin) {
        var name = plugin.NAME;

        if (name) {
            this.plugins[name] = plugin;
        } else {
            throw new Error('[multiselect] Could not identify the provided plugin');
        }
    };

    window.Multiselect = Multiselect;
})(window);