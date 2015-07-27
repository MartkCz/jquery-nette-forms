(function (window, $, undefined) {

    if (typeof $ !== 'function') {
        return console.error('jQuery is missing.');
    }

    if (typeof Nette !== 'object') {
        return console.error('Nette is missing.');
    }

    Nette.initForm =  function () {};
    Nette.addError = function () {};

    // Logger
    var logger = {
        show: ['warn', 'log', 'error'],
        use: true,
        sprintf: function (message) {
            var args = arguments;
            delete args[0];

            return message.replace(/{(\d+)}/g, function(match, number) {
                if (args[number] === undefined) {
                    return match;
                }

                if (args[number] instanceof Element || args[number] instanceof jQuery) {
                    return that.cssPath(args[number]);
                }

                return args[number];
            });
        },
        element: function (el) {
            $el = $(el);

            if ($el.attr('id')) {
                return '#' + $el.attr('id');
            }

            if ($el.selector) {
                return $el.selector;
            }

            if ($el.attr('class')) {
                return '.' + $el.attr('class');
            }

            if ($el.context) {
                return $el.context;
            }

            return '';
        },
        call_user_func_array: function call_user_func_array(cb, parameters) {
            var func;

            if (typeof cb === 'string') {
                func = (typeof this[cb] === 'function') ? this[cb] : func = (new Function(null, 'return ' + cb))();
            } else if (Object.prototype.toString.call(cb) === '[object Array]') {
                func = (typeof cb[0] === 'string') ? eval(cb[0] + "['" + cb[1] + "']") : func = cb[0][cb[1]];
            } else if (typeof cb === 'function') {
                func = cb;
            }

            if (typeof func !== 'function') {
                throw new Error(func + ' is not a valid function');
            }

            return (typeof cb[0] === 'string') ? func.apply(eval(cb[0]), parameters) : (typeof cb[0] !== 'object') ? func.apply(
                null, parameters) : func.apply(cb[0], parameters);
        },
        log: function() {
            if (!this.use || this.show.indexOf('log') === -1) {
                return false;
            }

            console.log(this.call_user_func_array(this.sprintf, arguments));
        },
        warn: function () {
            if (!this.use || this.show.indexOf('warn') === -1) {
                return false;
            }

            console.warn(this.call_user_func_array(this.sprintf, arguments));
        },
        error: function () {
            if (!this.use || this.show.indexOf('error') === -1) {
                return false;
            }

            console.error(this.call_user_func_array(this.sprintf, arguments));
        }
    };

    var DataProvider = function ($frm, $ctrl) {

        this.getOption = function (name, exclude) {
            name = 'data-' + name;

            if ($ctrl.attr(name) !== undefined && exclude !== 'ctrl') {
                return $ctrl.attr(name);
            } else if ($frm.attr(name) !== undefined && exclude !== 'form') {
                return $frm.attr(name);
            }

            return undefined;
        };

        this.checkOption = function (name) {
            return this.getOption(name) !== undefined;
        };

        this.isLiveValidation = function () {
            if (this.checkOption('novalidatelive') === true) {
                return false;
            }

            return $.form.liveValidationUrl !== null;
        };

        this.isValidate = function () {
            return !this.checkOption('novalidate');
        };

        this.getLiveValidationUrl = function () {
            var url = this.getOption('validatelive-url');

            if (url === undefined) {
                url = $.form.liveValidationUrl;
            }

            return url;
        };

        this.isErrorAtForm = function () {
            return this.getOption('errors-at') === 'form';
        };

        this.getRenderer = function () {
            return $.form.getRenderer(this.getOption('renderer', 'ctrl'));
        };

        this.getErrorContainer = function () {
            if (this.checkOption('error-container')) {
                return $(this.getOption('error-container'));
            }

            return undefined;
        };

        this.getErrorType = function () {
            return this.getOption('error-type');
        };

        this.useLabels = function () {
            if (this.checkOption('nolabel')) {
                return false;
            }

            return $.form.useLabels;
        };
    };

    // Single control
    var SingleControl = function (frm, $ctrl) {
        var provider = new DataProvider(frm.getElement(), $ctrl);

        this.useLabels = function () {
            return provider.useLabels();
        };

        this.getElement = function () {
            return $ctrl;
        };

        this.getFormElement = function () {
            return frm.getElement();
        };

        this.getForm = function () {
            return frm;
        };

        this.addError = function (message) {
            if (provider.getErrorContainer() !== undefined) {
                provider.getRenderer().addError(message, provider.getErrorContainer(), this, provider.getErrorType(), true);

                return;
            }

            if (provider.isErrorAtForm()) {
                provider.getRenderer().formError(message, this);
            } else {
                provider.getRenderer().controlError(message, this);
            }
        };

        this.removeError = function () {
            if (provider.getErrorContainer() !== undefined) {
                provider.getRenderer().removeBaseError(provider.getErrorContainer(), this, true);

                return;
            }

            if (provider.isErrorAtForm()) {
                provider.getRenderer().removeFormError(this);
            } else {
                provider.getRenderer().removeError(this);
            }
        };

        this.getId = function () {
            return $ctrl.attr('id');
        };

        this.getLabel = function () {
            return $ctrl.attr('data-label');
        };

        this.getPath = function () {
            if (this.getId()) {
                return this.getId().substr(4) === 'frm-' ? this.getId().substr(4) : this.getId();
            }

            return undefined;
        };

        this.blurValidation = function () {
            var that = this;

            $($ctrl).on('blur', function () {
                if (!provider.isValidate()) {
                    return;
                }

                that.removeError();

                var hasError = !that.validateControl();

                if (hasError === false && provider.isLiveValidation() === true) {
                    that.liveValidate();
                }
            });
        };

        this.liveValidate = function () {
            var url = provider.getLiveValidationUrl();
            var that = this;
            var ph = this.getPath();

            if (ph !== undefined) {
                $.get(url, {value: $ctrl.val(), path: ph}, function (data) {
                    if (data.message) {
                        that.addError(data.message);
                    }
                });
            }
        };

        /**
         * Validates form element against given rules.
         *
         * This is part of the Nette Framework (http://nette.org)
         * Copyright (c) 2004 David Grudl (http://davidgrudl.com)
         */
        this.validateControl = function(elem, rules, onlyCheck, value) {
            elem = elem === undefined ? $ctrl : elem;

            elem = elem.tagName ? elem : elem[0]; // RadioNodeList
            rules = rules || Nette.parseJSON(elem.getAttribute('data-nette-rules'));
            value = value === undefined ? {value: Nette.getEffectiveValue(elem)} : value;

            for (var id = 0, len = rules.length; id < len; id++) {
                var rule = rules[id],
                    op = rule.op.match(/(~)?([^?]+)/),
                    curElem = rule.control ? elem.form.elements.namedItem(rule.control) : elem;

                if (!curElem) {
                    continue;
                }

                rule.neg = op[1];
                rule.op = op[2];
                rule.condition = !!rule.rules;
                curElem = curElem.tagName ? curElem : curElem[0]; // RadioNodeList

                var curValue = elem === curElem ? value : {value: Nette.getEffectiveValue(curElem)},
                    success = Nette.validateRule(curElem, rule.op, rule.arg, curValue);

                if (success === null) {
                    continue;
                } else if (rule.neg) {
                    success = !success;
                }

                if (rule.condition && success) {
                    if (!Nette.validateControl(elem, rule.rules, onlyCheck, value)) {
                        return false;
                    }
                } else if (!rule.condition && !success) {
                    if (Nette.isDisabled(curElem)) {
                        continue;
                    }
                    if (!onlyCheck) {
                        var arr = Nette.isArray(rule.arg) ? rule.arg : [rule.arg],
                            message = rule.msg.replace(/%(value|\d+)/g, function(foo, m) {
                                return Nette.getValue(m === 'value' ? curElem : elem.form.elements.namedItem(arr[m].control));
                            });
                        this.addError(message);
                    }
                    return false;
                }
            }
            return true;
        };
    };

    // Single form
    var SingleForm = function ($frm) {
        $frm.attr('novalidate', 'novalidate');

        this.getElement = function () {
            return $frm;
        };

        this.getControls = function () {
            var that = this;
            var controls = [];

            $frm.find('input, textarea, select').each(function () {
                controls.push(new SingleControl(that, $(this)));
            });

            return controls;
        };

        this.init = function () {
            this.blurValidation();
            this.submitValidation();
        };

        this.blurValidation = function () {
            $.each(this.getControls(), function (v, ctrl) {
                ctrl.blurValidation();
            });
        };

        this.submitValidation = function () {
            var that = this;

            $frm.on('submit', function (e) {
                var $submittedBy = $(document.activeElement);

                if ($submittedBy.length && $(this).has($submittedBy) && $submittedBy.is('input[type="submit"]') && $submittedBy.is('[name]')) {
                    if ($submittedBy.attr('data-novalidate') !== undefined) {
                        return true;
                    }
                }

                var hasError = false;

                $.each(that.getControls(), function (v, ctrl) {
                    ctrl.removeError();
                    if (!ctrl.validateControl()) {
                        hasError = true;
                    }
                });

                if (hasError) {
                    if (e && e.stopPropagation) {
                        e.stopPropagation();
                    } else if (window.event) {
                        event.cancelBubble = true;
                    }
                    return false;
                }
            });
        };
    };

    var rendererHelper = {
        formatLabel: function (ctrl, label) {
            if (label !== undefined) {
                label = label.substr(label.length - 1) === ':' ? label + ' ' : label + ': ';
                label = '<strong>' + label + '</strong>';
            } else {
                label = '';

                $.form.logger.log('Input does not have label. Please use [data-nolabel] or [data-label] or [placeholder] for {1}', $.form.logger.element(ctrl.getElement()));
            }

            return label;
        }
    };

    var forms = function () {
        var opt = {
            defaultRenderer: 'default',
            renders: []
        };

        this.liveValidationUrl = null;
        this.useLabels = true;
        this.logger = logger;

        this.rendererHelper = rendererHelper;

        this.registerLibraries = function (translator) {
            if ($.fn.datetimepicker) {
                $('input.date-input').each(function () {
                    $(this).datetimepicker($.extend({
                        format: $(this).attr('data-format')
                    }, $.parseJSON($(this).attr('data-settings'))));
                });

                $('.date-input-container.no-js').remove();
            }

            if ($.fn.autocomplete) {
                $('input.suggestion-input').each(function () {
                    el = $(this);

                    el.autocomplete($.extend({
                        source: el.attr('data-url')
                    }, $.parseJSON(el.attr('data-suggestion'))));
                });
            }

            if ($.fn.inputmask) {
                $('input[data-mask-input]').each(function () {
                    var settings = $.parseJSON($(this).attr('data-mask-input'));
                    if (settings.regex) {
                        $(this).inputmask('Regex', $.parseJSON($(this).attr('data-mask-input')));
                    } else {
                        $(this).inputmask($.parseJSON($(this).attr('data-mask-input')));
                    }
                });
            }

            if ($.fn.selectize) {
                $('select.input-select').selectize();

                $('input.tag-input').selectize({
                    delimiter: ',',
                    createTranslate: translator ? translator.translate('Add') : 'Add',
                    persist: false,
                    create: function (input) {
                        return {value: input, text: input}
                    }
                });
            }
        };

        this.getRenderer = function (name) {
            name = name === undefined ? opt['defaultRenderer'] : name;

            if (opt['renders'][name] === undefined) throw 'Renderer "' + name + '" not exists.';

            return opt['renders'][name];
        };

        this.addRenderer = function (name, object) {
            $.each(['controlError', 'formError', 'addError', 'removeError', 'removeBaseError', 'removeFormError'], function (v, method) {
                if (typeof object[method] !== 'function') throw 'Renderer "' + name + '" has not method "' + method + '"';
            });

            if (opt['renders'][name] !== undefined) {
                throw 'Renderer with name "' + name + '" already exists.';
            }

            opt['renders'][name] = object;

            return this;
        };

        this.refresh = function () {
            $('form').not('[data-used]').each(function () {
                $el = $(this);

                var form = new SingleForm($el);

                $el.attr('data-used', '');

                Nette.toggleForm(this);

                if ($el.attr('data-novalidate') !== undefined) {
                    return false;
                }

                form.init();
            });
        };

        this.init = function () {
            this.refresh();
        };
    };

    $.form = new forms;

    // Default renderer
    $.form.addRenderer('default', {
        createErrorContainer: function ($container) {
            if ($container.children('.form-error-container').length === 0) {
                $el = $('<div class="form-error-container" />');

                $container.append($el);
            }

            return $container.children('.form-error-container');
        },
        createFormErrorContainer: function ($form) {
            if ($form.children('.form-errors').length === 0) {
                $el = $('<ul class="form-errors" />');

                $form.prepend($el);
            }

            return $form.children('.form-errors');
        },
        getControlLabel: function (ctrl) {
            return ctrl.getLabel() || ctrl.getElement().closest('tr').find('label').text() || ctrl.getElement().attr('placeholder');
        },
        /**
         * Error at control
         *
         * @param {string} message
         * @param {SingleControl} ctrl
         */
        controlError: function (message, ctrl) {
            $el = ctrl.getElement();
            $form = ctrl.getFormElement();
            $container = $el.closest('tr');

            $errorContainer = this.createErrorContainer($el.closest('td'));

            $el.closest('td').find('.form-info').hide();

            this.addError(message, $errorContainer, ctrl);

            $container.addClass('has-error');
        },
        /**
         * Errors at control
         *
         * @param {string} message
         * @param {SingleControl} ctrl
         */
        formError: function (message, ctrl) {
            var label = '';

            if (ctrl.useLabels()) {
                label = $.form.rendererHelper.formatLabel(ctrl, this.getControlLabel(ctrl));
            }

            $form = ctrl.getFormElement();

            $container = this.createFormErrorContainer($form);

            this.addError(label + message, $container, ctrl, 'li');
        },
        /**
         * Base method for adding error message
         *
         * @param {string} message
         * @param $container
         * @param {SingleControl} ctrl
         * @param {string} type
         * @param {boolean} isCustom
         */
        addError: function (message, $container, ctrl, type, isCustom) {
            type = type || 'div';

            // Custom error container
            if (isCustom) {
                // Check if exists
                if ($container.length === 0) {
                    $.form.logger.error('Custom container not exists: {1}', $.form.logger.element($container));
                }

                // Labels
                if ($container.attr('data-use-labels') !== undefined) {
                    var label = '';

                    if (ctrl.useLabels()) {
                        label = $.form.rendererHelper.formatLabel(ctrl, this.getControlLabel(ctrl));
                    }

                    message = label + message;
                }
            }

            var div = $('<' + type + ' />', {
                'data-form-control': ctrl.getId()
            }).html(message);

            $container.prepend(div);
        },
        /**
         * Base method for removing error message
         *
         * @param $container
         * @param {SingleControl} ctrl
         * @param {boolean} isCustom
         */
        removeBaseError: function ($container, ctrl, isCustom) {
            $container.find('[data-form-control="' + ctrl.getId() + '"]').remove();
        },
        /**
         * Method which removes error message at control
         *
         * @param {SingleControl} ctrl
         */
        removeError: function (ctrl) {
            $ctrl = ctrl.getId();
            $container = ctrl.getElement().closest('td');

            ctrl.getElement().closest('tr').removeClass('has-error');
            $container.find('.form-info').show();

            this.removeBaseError($container, ctrl);
        },
        /**
         * Method which removes error message at form
         *
         * @param {SingleControl} ctrl
         */
        removeFormError: function (ctrl) {
            $container = this.createFormErrorContainer(ctrl.getFormElement());

            this.removeBaseError($container, ctrl);
        }
    });

    // Bootstrap renderer
    $.form.addRenderer('bootstrap', {
        createContainer: function ($ctrl) {
            $el = $ctrl.closest('.form-group');

            if ($el.children('.error-container').length === 0) {
                $el.append($('<div class="error-container" />'));
            }

            return $el.children('.error-container');
        },
        createFormContainer: function ($form) {
            if ($form.children('.error-container').length === 0) {
                $form.prepend($('<div class="error-container" />'));
            }

            return $form.children('.error-container');
        },
        /**
         * Error at control
         *
         * @param {string} message
         * @param {SingleControl} ctrl
         */
        controlError: function (message, ctrl) {
            $ctrl = ctrl.getElement();
            $group = $ctrl.closest('.form-group');

            $group.addClass('has-error');
            $group.find('.help-block').hide();

            $container = this.createContainer($ctrl);

            this.addError(message, $container, ctrl);
        },
        getControlLabel: function (ctrl) {
            return ctrl.getLabel() || ctrl.getElement().closest('.form-group').find('label').text()  || ctrl.getElement().attr('placeholder');
        },
        /**
         * Errors at form
         *
         * @param {string} message
         * @param {SingleControl} ctrl
         */
        formError: function (message, ctrl) {
            var label = '';

            if (ctrl.useLabels()) {
                label = $.form.rendererHelper.formatLabel(ctrl, this.getControlLabel(ctrl));
            }

            $form = ctrl.getFormElement();
            $container = this.createFormContainer($form);

            this.addError(label + message, $container, ctrl, 'div class="alert alert-danger"');
        },
        /**
         * Base method for adding error message
         *
         * @param {string} message
         * @param $container
         * @param {SingleControl} ctrl
         * @param {string} type
         * @param {boolean} isCustom
         */
        addError: function (message, $container, ctrl, type, isCustom) {
            type = type || 'p class="help-block"';
            $ctrl = ctrl.getElement();

            // Custom error container
            if (isCustom) {
                // Check if exists
                if ($container.length === 0) {
                    $.form.logger.error('Custom container not exists: {1}', $.form.logger.element($container));
                }

                // Labels
                if ($container.attr('data-use-labels') !== undefined) {
                    var label = '';

                    if (ctrl.useLabels()) {
                        label = $.form.rendererHelper.formatLabel(ctrl, this.getControlLabel(ctrl));
                    }

                    message = label + message;
                }
            }

            $el = $('<' + type + ' />').html(message).attr('data-form-control', ctrl.getId());

            $container.prepend($el);
        },
        /**
         * Base method for removing error message
         *
         * @param $container
         * @param {SingleControl} ctrl
         * @param {boolean} isCustom
         */
        removeBaseError: function ($container, ctrl, isCustom) {
            $container.find('[data-form-control="' + ctrl.getId() + '"]').remove();
        },
        /**
         * Method which removes error message at control
         *
         * @param {SingleControl} ctrl
         */
        removeError: function (ctrl) {
            $ctrl = ctrl.getElement();
            $group = $ctrl.closest('.form-group');

            this.removeBaseError(this.createContainer($ctrl), ctrl);

            $group.removeClass('has-error');
            $group.find('.help-block').show();
        },
        /**
         * Method which removes error message at form
         *
         * @param {SingleControl} ctrl
         */
        removeFormError: function (ctrl) {
            $container = this.createFormContainer(ctrl.getFormElement());

            this.removeBaseError($container, ctrl);
        }
    });
})(window, jQuery);