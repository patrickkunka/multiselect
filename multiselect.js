(function(window) {
    var MultiSelect = function(el, config) {
        var _ = new MultiSelect.Private(el, config);

        Object.seal(this);
    };

    MultiSelect.Private = function(el, config) {
        this.value                  = [];
        this.options                = [];
        this.config                 = new MultiSelect.Config();
        this.dom                    = new MultiSelect.Dom();

        this.init(el, config);

        Object.seal(this);
    };

    MultiSelect.Private.prototype = {
        constructor: MultiSelect.Private,

        init: function(el, config) {
            var self = this;

            Object.assign(self.config, config);

            self.dom.el = el;

            if (self.dom.el.tagName === 'SELECT') {
                self.readOptionsFromSelect(self.dom.el);
            }
        },

        readOptionsFromSelect: function(select) {
            var self        = this,
                option      = null,
                inputOption = null,
                i           = -1;

            if (!select.options.length) return;

            for (i = 0; option = select.options[i]; i++) {
                inputOption = new MultiSelect.Option();

                inputOption.index     = i;
                inputOption.value     = option.value;
                inputOption.label     = option.label;
                inputOption.disabled  = option.disabled;
            }

            self.options.push(inputOption);
        },

        selectOption: function(inputOption, insertAtIndex) {
            var self            = this,
                outputOption    = new MultiSelect.Option();

            Object.assign(outputOption, inputOption);

            inputOption.selected = true;

            if (typeof self.config.mapValue === 'function') {
                outputOption.value = self.config.mapValue(option.value);
            }

            self.value[insertAtIndex] = outputOption;
        },

        deselectOption: function(removeAtIndex) {
            var self        = this,
                inputOption = null;

            inputOption = self.value[removeAtIndex];

            self.options[inputOption.index].selected = false;

            self.value.splice(removeAtIndex, 1);
        },

        focusOption: function(list, focusAtIndex) {
            var option  = null,
                i       = -1;

            for (i = 0; option = list[i]; i++) {
                option.focussed = false;

                if (i !== focusAtIndex) continue;

                option.focussed = true;
            }

            option.focussed = true;
        },

        blurOption: function(list, blurAtIndex) {
            var option = list[blurAtIndex];

            option.focussed = false;
        },

        reorderValue: function(fromIndex, toIndex) {
            var self = this;

            self.value.splice(toIndex, 0, self.value.splice(fromIndex, 1)[0]);
        },

        render: function() {
            var self        = this,
                container   = null;

            if (self.dom.el.tagName === 'SELECT') {
                container = document.createElement('div');

                self.dom.select = self.dom.el;
                self.dom.el     = container;

                self.dom.el.parentElement.replaceChild(container, self.dom.select);
            }

            if (!self.dom.inputList) {
                self.dom.inputList = document.createElement('div');

                self.dom.el.appendChild(self.dom.inputList);
            }

            if (!self.dom.outputList) {
                self.dom.outputList = document.createElement('div');

                self.dom.el.appendChild(self.dom.outputList);
            }

            self.renderOptions(self.dom.inputList, self.options);
            self.renderOptions(self.dom.outputList, self.value);
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

                container.appendChild(item);
            }
        },

        bindEvents: function() {
            var self = this;

            self.dom.inputList.addEventListener('click', self.handleListClick.bind(self, self.dom.inputList));
            self.dom.outputList.addEventListener('click', self.handleListClick.bind(self, self.dom.outputList));
        },

        handleListClick: function(list, e) {
            var self = this;


        }
    };

    MultiSelect.Config = function() {
        this.labelKey = '';
        this.mapValue = null;
        this.mixitup  = null;

        Object.seal(this);
    };

    MultiSelect.Dom = function() {
        this.el         = null;
        this.select     = null;
        this.inputList  = null;
        this.outputList = null;

        Object.seal(this);
    };

    MultiSelect.Option = function() {
        this.index      = -1;
        this.value      = '';
        this.label      = '';
        this.disabled   = false;
        this.focussed   = false;
        this.selected   = false;

        Object.seal(this);
    };

    window.MultiSelect = MultiSelect;
})(window);