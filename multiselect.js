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

            self.updateValue();
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

        selectOption: function(inputOption, insertAtIndex) {
            var self            = this,
                outputOption    = new Multiselect.Option();

            Object.assign(outputOption, inputOption);

            inputOption.selected = true;

            if (typeof self.config.mapValue === 'function') {
                outputOption.value = self.config.mapValue(option.value);
            }

            self.values[insertAtIndex] = outputOption;
        },

        deselectOption: function(option) {
            var self        = this,
                valueOption = null,
                i           = -1;

            self.options[option.index].selected = false;

            for (i = 0; valueOption = self.values[i]; i++) {
                if (valueOption.index !== option.index) continue;

                self.values.splice(i, 1);

                i--;
            }
        },

        focusOption: function(list, focusAtIndex) {
            var option  = null,
                i       = -1;

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

        reorderValue: function(fromIndex, toIndex) {
            var self = this;

            self.values.splice(toIndex, 0, self.values.splice(fromIndex, 1)[0]);
        },

        renderOptions: function(container, data) {
            var self    = this,
                item    = null,
                option  = null,
                i       = -1;

            container.innerHTML = '';

            for (i = 0; option = data[i]; i++) {
                item = document.createElement('div');

                item.textContent = option.label;

                if (option.focussed) {
                    item.style.backgroundColor = 'red';
                } else if (option.selected) {
                    item.style.backgroundColor = 'grey';
                } else {
                    item.style.backgroundColor = '';
                }

                container.appendChild(item);
            }
        },

        bindEvents: function() {
            var self = this;

            self.dom.containerOptions.addEventListener('click', self.handleListClick.bind(self, self.dom.containerOptions));
            self.dom.containerValue.addEventListener('click', self.handleListClick.bind(self, self.dom.containerValue));
            self.dom.buttonSelect.addEventListener('click', self.handleButtonClick.bind(self, self.dom.buttonSelect));
            self.dom.buttonDeselect.addEventListener('click', self.handleButtonClick.bind(self, self.dom.buttonDeselect));
        },

        handleListClick: function(listContainer, e) {
            var self                = this,
                list                = null,
                index               = -1;

            index = Multiselect.h.index(e.target);

            switch (listContainer) {
                case self.dom.containerOptions:
                    self.focusOption(self.options, index);
                    self.blurOptions(self.values);

                    break;
                case self.dom.containerValue:
                    self.focusOption(self.values, index);
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

            self.updateValue();
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

            self.render();
        },

        updateValue: function() {
            var self    = this,
                state   = null;

            state = self.buildState();

            if (typeof self.config.callbacks.onChange === 'function') {
                self.config.callbacks.onChange.call(null, state);
            }

            self.render();
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

        render: function() {
            var self        = this,
                container   = null;

            if (self.dom.el.tagName === 'SELECT') {
                container = document.createElement('div');

                self.dom.select = self.dom.el;
                self.dom.el     = container;

                self.dom.select.parentElement.replaceChild(container, self.dom.select);
            }

            if (!self.dom.containerOptions) {
                self.dom.containerOptions = document.createElement('div');

                self.dom.el.appendChild(self.dom.containerOptions);
            }

            if (!self.dom.buttonSelect) {
                self.dom.buttonSelect = document.createElement('button');
                self.dom.buttonSelect.textContent = 'Select';

                self.dom.el.appendChild(self.dom.buttonSelect);
            }

            if (!self.dom.buttonDeselect) {
                self.dom.buttonDeselect = document.createElement('button');
                self.dom.buttonDeselect.textContent = 'Deselect';

                self.dom.el.appendChild(self.dom.buttonDeselect);
            }

            switch (self.buttonStatus) {
                case 'selectable':
                    self.dom.buttonSelect.disabled      = false;
                    self.dom.buttonDeselect.disabled    = true;

                    break;
                case 'deselectable':
                    self.dom.buttonSelect.disabled      = true;
                    self.dom.buttonDeselect.disabled    = false;

                    break;
                default:
                    self.dom.buttonSelect.disabled      = true;
                    self.dom.buttonDeselect.disabled    = true;
            }

            if (!self.dom.containerValue) {
                self.dom.containerValue = document.createElement('div');

                self.dom.el.appendChild(self.dom.containerValue);
            }

            self.renderOptions(self.dom.containerOptions, self.options);
            self.renderOptions(self.dom.containerValue, self.values);
        }
    };

    Multiselect.Config = function() {
        this.labelKey   = '';
        this.mapValue   = null;
        this.mixitup    = null;
        this.value      = [];
        this.callbacks  = new Multiselect.ConfigCallbacks();

        Object.seal(this);
    };

    Multiselect.ConfigCallbacks = function() {
        this.onChange   = null;
        this.onFocus    = null;
        this.onBlur     = null;

        Object.seal(this);
    };

    Multiselect.Dom = function() {
        this.el                 = null;
        this.select             = null;
        this.containerOptions   = null;
        this.containerValue     = null;
        this.buttonSelect       = null;
        this.buttonDeselect     = null;

        Object.seal(this);
    };

    Multiselect.Option = function() {
        this.index      = -1;
        this.value      = '';
        this.label      = '';
        this.disabled   = false;
        this.focussed   = false;
        this.selected   = false;

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

    window.Multiselect = Multiselect;
})(window);