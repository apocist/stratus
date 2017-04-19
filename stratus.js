//     Stratus.js 1.0

//     Copyright (c) 2016 by Sitetheory, All Rights Reserved
//
//     All information contained herein is, and remains the
//     property of Sitetheory and its suppliers, if any.
//     The intellectual and technical concepts contained herein
//     are proprietary to Sitetheory and its suppliers and may be
//     covered by U.S. and Foreign Patents, patents in process,
//     and are protected by trade secret or copyright law.
//     Dissemination of this information or reproduction of this
//     material is strictly forbidden unless prior written
//     permission is obtained from Sitetheory.
//
//     For full details and documentation:
//     http://docs.sitetheory.io

// Overview
// --------

// Using a mixture of synchronous and asynchronous code, which begins my organizing and ordering
// tasks through a forest->tree building process, fragmenting each tree into its own asynchronous
// routines, which query the API and use a passive, event-driven infrastructure to maintain
// responsiveness and speed in correlation with a user's input.

// Require.js
// ----------

// We use this function factory to ensure that the Stratus Layer can work outside of a
// Require.js environment.  This function needs to exist on every module defined within
// the Stratus environment to ensure its acceptance regardless of page context.
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            'text',
            'underscore',
            'bowser',
            'promise'
        ], function (text, _, bowser) {
            return (root.Stratus = factory(text, _, bowser));
        });
    } else {
        root.Stratus = factory(root.text, root._, root.bowser);
    }
}(this, function (text, _, bowser) {

    // Underscore Settings
    // -------------------

    // These template settings intend to mimic a Twig-like bracket format for internal
    // Javascript templates.  The '{% %}' tag Evaluates anything inside as if it were
    // native Javascript code.  The '{{ }}' tag Interpolates any variables inside for
    // use with String Interpolation.  The '{# #}' tag Interpolates any variables and
    // HTML Escapes the output for use with HTML Escaped String Interpolation.
    /**
     * @type {{evaluate: RegExp, interpolate: RegExp, escape: RegExp}}
     */
    _.templateSettings = {
        evaluate: /\{%(.+?)%\}/g,
        interpolate: /\{\{(.+?)\}\}/g,
        escape: /\{#(.+?)#\}/g
    };

    // Stratus Layer Prototype
    // -----------------------

    // This prototype is the only Global Object that should ever be used within the
    // Stratus layer.  Currently, all Stratus Backbone Objects (Models, Collections,
    // Views, Routers, and Events) are defined within each Stratus Property.  Each
    // individual instance of Stratus Objects are currently not maintained within
    // the Stratus Layer's Global Object.  There may be a future implementation of a
    // Stratus Property to contain these instances within the Stratus Layer as well.
    var Stratus = {
        /* Settings */
        Settings: {
            image: {
                size: { xs: 200, s: 400, m: 600, l: 800, xl: 1200, hq: 1600 }
            },
            status: {
                reset: -2,
                deleted: -1,
                inactive: 0,
                active: 1
            },
            consent: {
                reject: -1,
                pending: 0,
                accept: 1
            }
        },

        /* Native */
        DOM: {},
        Key: {},
        PostMessage: {},

        /* Selector Logic */
        Selector: {},
        Select: null,

        /* Boot */
        BaseUrl: ((requirejs && _.has(requirejs.s.contexts._, 'config')) ? requirejs.s.contexts._.config.baseUrl : null) || '/',

        // TODO: Change each of these "namespaces" into Backbone.Models references so that we can easily
        // use the events of type changes to hook different initialization routines to wait for the type
        // to be created before continuing with view creation.  This will take a little finesse for the
        // initial writing of a view, since they actually are created as "Stratus.Collections.Generic"
        // inside the individual modules at runtime.

        /* Backbone */
        Collections: null,
        Models: null,
        Routers: null,
        Views: {
            Plugins: {},
            Widgets: {}
        },
        Events: {},
        Relations: {},

        /* Angular */
        Apps: {},
        Catalog: {},
        Components: {},
        Controllers: {},
        Directives: {},
        Filters: {},
        Modules: {
            ngMaterial: true,
            ngMessages: true
            /* ngMdIcons: true */
        },
        Services: {},

        /* Bowser */
        Client: bowser,

        /* Stratus */
        CSS: {},
        Chronos: null,
        Environment: {
            ip: null,
            production: !(typeof document.cookie === 'string' && document.cookie.indexOf('env=') !== -1),
            context: null,
            contextId: null,
            contextMasterSiteId: null,
            siteId: null,
            masterSiteId: null,
            language: navigator.language,
            timezone: null,
            trackLocation: 0,
            trackLocationConsent: 0,
            lat: null,
            lng: null,
            postalCode: null,
            city: null,
            region: null,
            country: null,
            debugNest: false,
            liveEdit: false,
            viewPortChange: false,
            lastScroll: false
        },
        History: {},
        Instances: {},
        Internals: {},
        Prototypes: {},
        Resources: {},
        Roster: {
            controller: {
                selector: '[ng-controller]',
                namespace: 'stratus.controllers.'
            },
            components: {
                namespace: 'stratus.components.'
            },
            directives: {
                namespace: 'stratus.directives.',
                type: 'attribute'
            },
            flex: {
                selector: '[flex]',
                require: ['angular', 'angular-material']
            },
            chart: {
                selector: '[chart]',
                require: ['angular', 'angular-chart'],
                module: true,
                suffix: '.js'
            },
            sortable: {
                selector: '[ng-sortable]',
                require: ['angular-sortable'],
                module: 'ng-sortable'
            },

            // TODO: Move Froala to Sitetheory since it is specific to Sitetheory
            modules: {
                selector: [
                    '[ng-sanitize]', '[froala]'
                ],
                namespace: 'angular-',
                module: true
            },

            // TODO: Move these to Sitetheory since they are specific to Sitetheory
            countUp: {
                selector: [
                    '[count-up]', '[scroll-spy]'
                ],
                namespace: 'angular-',
                module: true,
                suffix: 'Module'
            }
        },

        // Plugins */
        PluginMethods: {},
        /* Methods that need to be called as a group later, e.g. OnScroll */
        RegisterGroup: {},

        // TODO: Turn this into a Dynamic Object loaded from the DOM in Sitetheory
        Api: {
            GoogleMaps: 'AIzaSyBatGvzPR7u7NZ3tsCy93xj4gEBfytffyA',
            Froala: 'KybxhzguB-7j1jC3A-16y=='
        }
    };

    // Declare Warm Up
    if (!Stratus.Environment.production) {
        console.group('Stratus Warm Up');
    }

    // Underscore Mixins
    // ------------------

    /**
     * @param string
     * @returns {*}
     * @constructor
     */
    _.mixin({

        // Babel class inheritace block
        createClass: (function () {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ('value' in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function (Constructor, protoProps, staticProps) {
                if (protoProps) defineProperties(Constructor.prototype, protoProps);
                if (staticProps) defineProperties(Constructor, staticProps);
                return Constructor;
            };
        })(),
        possibleConstructorReturn: function (self, call) {
            if (!self) {
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            }
            return call && (typeof call === 'object' || typeof call === 'function') ? call : self;
        },
        inherits: function (subClass, superClass) {
            if (typeof superClass !== 'function' && superClass !== null) {
                throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
            }
            subClass.prototype = Object.create(superClass && superClass.prototype, {
                constructor: {
                    value: subClass,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
            if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
        },
        classCallCheck: function (instance, Constructor) {
            if (!(instance instanceof Constructor)) {
                throw new TypeError('Cannot call a class as a function');
            }
        },

        // This function simply capitalizes the first letter of a string.
        /**
         * @param string
         * @returns {*}
         */
        ucfirst: function (string) {
            return (typeof string === 'string' && string) ? string.charAt(0).toUpperCase() + string.substring(1) : null;
        },

        // This function simply changes the first letter of a string to a lower case.
        /**
         * @param string
         * @returns {*}
         */
        lcfirst: function (string) {
            return (typeof string === 'string' && string) ? string.charAt(0).toLowerCase() + string.substring(1) : null;
        },

        // This function allows creation, edit, retrieval and deletion of cookies.
        // Note: Delete with `_.cookie(name, '', -1)`
        /**
         * @param name
         * @param value
         * @param expires
         * @param path
         * @param domain
         * @returns {Array|{index: number, input: string}}
         */
        cookie: function (name, value, expires, path, domain) {
            if (typeof value === 'undefined') {
                var search = new RegExp('(?:^' + name + '|;\\s*' + name + ')=(.*?)(?:;|$)', 'g');
                var data = search.exec(document.cookie);
                return (data === null) ? null : data[1];
            } else {
                var cookie = name + '=' + escape(value) + ';';
                if (expires) {
                    if (expires instanceof Date) {
                        if (isNaN(expires.getTime())) {
                            expires = new Date();
                        }
                    } else {
                        expires = new Date(new Date().getTime() + parseInt(expires) * 1000 * 60 * 60 * 24);
                    }
                    cookie += 'expires=' + expires.toGMTString() + ';';
                }
                if (path) cookie += 'path=' + path + ';';
                if (domain) cookie += 'domain=' + domain + ';';
                document.cookie = cookie;
            }
        },

        // Converge a list and return the prime key through specified method.
        /**
         * @param list
         * @param method
         * @returns {*}
         */
        converge: function (list, method) {
            if (typeof method !== 'string') {
                method = 'min';
            }
            if (method === 'min') {
                var lowest = _.min(list);
                return _.findKey(list, function (element) {
                    return (element === lowest);
                });
            } else if (method === 'radial') {
                // Eccentricity
                // Radians
                // Diameter
                // Focal Point
            } else if (method === 'gauss') {
                // Usage: Node Connection or Initialization
            } else {
                return list;
            }
        },

        // This synchronously repeats a function a certain number of times
        /**
         * @param fn
         * @param times
         */
        repeat: function (fn, times) {
            if (typeof fn === 'function' && typeof times === 'number') {
                var i;
                for (i = 0; i < times; i++) fn();
            } else {
                console.warn('Underscore cannot repeat function:', fn, 'with number of times:', times);
            }
        },

        // This function hydrates a string into an Object, Boolean, or Null value, if applicable.
        /**
         * @param string
         * @returns {*}
         */
        hydrate: function (string) {
            return _.isJSON(string) ? JSON.parse(string) : string;
        },

        // This is an alias to the hydrate function for backwards compatibility.
        /**
         * @param string
         * @returns {*}
         */
        hydrateString: function (string) {
            return _.hydrate(string);
        },

        // This function utilizes tree building to clone an object.
        /**
         * @param obj
         * @returns {*}
         */
        cloneDeep: function (obj) {
            if (typeof obj !== 'object') return obj;
            var shallow = _.clone(obj);
            _.each(shallow, function (value, key) {
                shallow[key] = _.cloneDeep(value);
            });
            return shallow;
        },

        // This function utilizes tree building to clone an object.
        /**
         * @param target
         * @param merger
         * @returns {*}
         */
        extendDeep: function (target, merger) {
            var shallow = _.clone(target);
            if (merger && typeof merger === 'object') {
                _.each(merger, function (value, key) {
                    if (shallow && typeof shallow === 'object') {
                        shallow[key] = (key in shallow) ? _.extendDeep(shallow[key], merger[key]) : merger[key];
                    }
                });
            } else {
                shallow = merger;
            }
            return shallow;
        },

        // Get a specific value or all values located in the URL
        /**
         * TODO: This is somewhat farther than underscore's ideology and should be moved into Stratus.Internals
         * @param key
         * @param href
         * @returns {{}}
         */
        getUrlParams: function (key, href) {
            var vars = {};
            href = typeof href !== 'undefined' ? href : window.location.href;
            href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return (typeof key !== 'undefined' && key) ? vars[key] : vars;
        },

        // Ensure all values in an array or object are true
        /**
         * @param values
         * @returns {boolean}
         */
        allTrue: function (values) {
            return (typeof values === 'object') ? _.every(values, function (value) {
                    return value;
                }) : false;
        },

        // Determines whether or not the string supplied is in a valid JSON format
        /**
         * @param str
         * @returns {boolean}
         */
        isJSON: function (str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        },
        /**
         * @param str
         * @returns {number|null}
         */
        seconds: function (str) {
            var seconds = 0;
            if (typeof str === 'string') {
                var timePairs = str.match(/([\d+\.]*[\d+])(?=[sSmMhHdDwWyY]+)([sSmMhHdDwWyY]+)/gi);
                if (_.size(timePairs)) {
                    var digest = /([\d+\.]*[\d+])(?=[sSmMhHdDwWyY]+)([sSmMhHdDwWyY]+)/i;
                    var time;
                    var unit;
                    var value;
                    _.each(timePairs, function (timePair) {
                        time = digest.exec(timePair);
                        value = parseFloat(time[1]);
                        unit = time[2];
                        if (!isNaN(value)) {
                            switch (time[2]) {
                                case 's':
                                    unit = 1;
                                    break;
                                case 'm':
                                    unit = 60;
                                    break;
                                case 'h':
                                    unit = 3.6e+3;
                                    break;
                                case 'd':
                                    unit = 8.64e+4;
                                    break;
                                case 'w':
                                    unit = 6.048e+5;
                                    break;
                                case 'y':
                                    unit = 3.1558149504e+7;
                                    break;
                                default:
                                    unit = 0;
                            }
                            seconds += value * unit;
                        }
                    }, this);
                } else {
                    seconds = null;
                }
            } else if (typeof str === 'number') {
                seconds = str;
            } else {
                seconds = null;
            }
            return seconds;
        },
        /**
         * @param target
         */
        camelToHyphen: function (target) {
            return target.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        },
        /**
         * @param target
         */
        hyphenToCamel: function (target) {
            return target.replace(/(-\w)/g, function (m) {
                return m[1].toUpperCase();
            });
        },
        /**
         * @param target
         */
        snakeToCamel: function (target) {
            return target.replace(/(_\w)/g, function (m) {
                return m[1].toUpperCase();
            });
        },
        /**
         * @param target
         * @param search
         * @returns {boolean}
         */
        startsWith: function (target, search) {
            return (typeof target === 'string' && target.substr(0, search.length).toUpperCase() === search.toUpperCase());
        },
        /**
         * @param a
         * @param b
         * @returns {number}
         */
        strcmp: function (a, b) {
            a = a.toString();
            b = b.toString();
            for (var i = 0, n = Math.max(a.length, b.length); i < n && a.charAt(i) === b.charAt(i); ++i);
            if (i === n) return 0;
            return a.charAt(i) > b.charAt(i) ? -1 : 1;
        },
        /**
         * @param target
         * @param limit
         * @param suffix
         * @returns {string}
         */
        truncate: function (target, limit, suffix) {
            limit = limit || 100;
            suffix = suffix || '...';

            var arr = target.replace(/</g, '\n<')
                .replace(/>/g, '>\n')
                .replace(/\n\n/g, '\n')
                .replace(/^\n/g, '')
                .replace(/\n$/g, '')
                .split('\n');

            var sum = 0;
            var row;
            var cut;
            var add;
            var tagMatch;
            var tagName;
            var tagStack = [];
            var more = false;

            for (var i = 0; i < arr.length; i++) {

                row = arr[i];

                // count multiple spaces as one character
                var rowCut = row.replace(/[ ]+/g, ' ');

                if (!row.length) continue;

                if (row[0] !== '<') {

                    if (sum >= limit) {
                        row = '';
                    } else if ((sum + rowCut.length) >= limit) {

                        cut = limit - sum;

                        if (row[cut - 1] === ' ') {
                            while (cut) {
                                cut -= 1;
                                if (row[cut - 1] !== ' ') {
                                    break;
                                }
                            }
                        } else {

                            add = row.substring(cut).split('').indexOf(' ');
                            if (add !== -1) {
                                cut += add;
                            } else {
                                cut = row.length;
                            }
                        }

                        row = row.substring(0, cut) + suffix;

                        /*
                         if (moreLink) {
                         row += '<a href="' + moreLink + '" style="display:inline">' + moreText + '</a>';
                         }
                         */

                        sum = limit;
                        more = true;
                    } else {
                        sum += rowCut.length;
                    }
                } else if (sum >= limit) {

                    tagMatch = row.match(/[a-zA-Z]+/);
                    tagName = tagMatch ? tagMatch[0] : '';

                    if (tagName) {
                        if (row.substring(0, 2) !== '</') {

                            tagStack.push(tagName);
                            row = '';
                        } else {

                            while (tagStack[tagStack.length - 1] !== tagName && tagStack.length) {
                                tagStack.pop();
                            }

                            if (tagStack.length) {
                                row = '';
                            }

                            tagStack.pop();
                        }
                    } else {
                        row = '';
                    }
                }

                arr[i] = row;
            }

            return arr.join('\n').replace(/\n/g, '');
        }
    });

    // Native Selector
    // ---------------

    // This function intends to allow native jQuery-Type chaining and plugins
    /**
     * @param selector
     * @returns {NodeList}
     * @constructor
     */
    Stratus.Select = function (selector) {
        if (!selector) return null;
        var selection = selector;
        if (typeof selector === 'string') {
            var target;
            if (_.startsWith(selector, '.') || _.contains(selector, '[')) {
                target = 'querySelectorAll';
            } else if (_.contains(['html', 'head', 'body'], selector) || _.startsWith(selector, '#')) {
                target = 'querySelector';
            } else {
                target = 'querySelectorAll';
            }
            selection = document[target](selector);
        }
        if (selection && typeof selection === 'object') {
            if (typeof jQuery === 'function' && selection instanceof jQuery) {
                selection = selection.length ? selection[0] : {};
            }
            selection = _.extend({}, Stratus.Selector, {
                context: this,
                length: _.size(selection),
                selection: selection,
                selector: selector
            });
        }
        return selection;
    };

    // Selector Plugins
    // ----------------

    /**
     * @param className
     * @returns {*}
     * @constructor
     */
    Stratus.Selector.addClass = function (className) {
        var that = this;
        if (that.selection instanceof NodeList) {
            if (!Stratus.Environment.get('production')) console.log('List:', that);
        } else {
            _.each(className.split(' '), function (name) {
                if (that.selection.classList) {
                    that.selection.classList.add(name);
                } else {
                    that.selection.className += ' ' + name;
                }
            });
        }
        return that;
    };

    /**
     * @param attr
     * @param value
     * @returns {*}
     * @constructor
     */
    Stratus.Selector.attr = function (attr, value) {
        var that = this;
        if (that.selection instanceof NodeList) {
            if (!Stratus.Environment.get('production')) console.log('List:', that);
        } else if (attr) {
            if (!value) {
                value = that.selection.getAttribute(attr);
                return _.isJSON(value) ? JSON.parse(value) : value;
            } else {
                that.selection.setAttribute(attr, JSON.stringify(value));
            }
        }
        return that;
    };

    /**
     * @param callable
     * @returns {*}
     */
    Stratus.Selector.each = function (callable) {
        var that = this;
        if (typeof callable !== 'function') {
            callable = function (element) {
                console.warn('each running on element:', element);
            };
        }
        if (that.selection instanceof NodeList) {
            _.each(that.selection, callable);
        }
        return that;
    };

    /**
     * @param selector
     * @returns {*}
     */
    Stratus.Selector.find = function (selector) {
        var that = this;
        if (that.selection instanceof NodeList) {
            if (!Stratus.Environment.get('production')) console.log('List:', that);
        } else if (selector) {
            return that.selection.querySelectorAll(selector);
        }
        return that;
    };

    /**
     * @param callable
     * @returns {*}
     */
    Stratus.Selector.map = function (callable) {
        var that = this;
        if (typeof callable !== 'function') {
            callable = function (element) {
                console.warn('map running on element:', element);
            };
        }
        if (that.selection instanceof NodeList) {
            return _.map(that.selection, callable);
        }
        return that;
    };

    /**
     * @param child
     * @returns {*}
     */
    Stratus.Selector.prepend = function (child) {
        var that = this;
        if (that.selection instanceof NodeList) {
            if (!Stratus.Environment.get('production')) console.log('List:', that);
        } else if (child) {
            that.selection.insertBefore(child, that.selection.firstChild);
        }
        return that;
    };

    /**
     * @param className
     * @returns {*}
     * @constructor
     */
    Stratus.Selector.removeClass = function (className) {
        var that = this;
        if (that.selection instanceof NodeList) {
            if (!Stratus.Environment.get('production')) {
                console.log('List:', that);
            }
        } else {
            if (that.selection.classList) {
                _.each(className.split(' '), function (name) {
                    that.selection.classList.remove(name);
                });
            } else {
                that.selection.className = that.selection.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
            }
        }
        return that;
    };

    // Stratus Event System
    // --------------------

    // This is largely based on the work of Backbone.Events
    // to provide the logic in case we don't have Backbone
    // loaded at this time.

    // Regular expression used to split event strings.
    var eventSplitter = /\s+/;

    // Iterates over the standard `event, callback` (as well as the fancy multiple
    // space-separated events `"change blur", callback` and jQuery-style event
    // maps `{event: callback}`).
    var eventsApi = function (iteratee, events, name, callback, opts) {
        var i = 0;
        var names;
        if (name && typeof name === 'object') {
            // Handle event maps.
            if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
            for (names = _.keys(name); i < names.length; i++) {
                events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
            }
        } else if (name && eventSplitter.test(name)) {
            // Handle space-separated event names by delegating them individually.
            for (names = name.split(eventSplitter); i < names.length; i++) {
                events = iteratee(events, names[i], callback, opts);
            }
        } else {
            // Finally, standard events.
            events = iteratee(events, name, callback, opts);
        }
        return events;
    };

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    Stratus.Events.on = function (name, callback, context) {
        return internalOn(this, name, callback, context);
    };

    // Guard the `listening` argument from the public API.
    var internalOn = function (obj, name, callback, context, listening) {
        obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
            context: context,
            ctx: obj,
            listening: listening
        });

        if (listening) {
            var listeners = obj._listeners || (obj._listeners = {});
            listeners[listening.id] = listening;
        }

        return obj;
    };

    // Inversion-of-control versions of `on`. Tell *this* object to listen to
    // an event in another object... keeping track of what it's listening to
    // for easier unbinding later.
    Stratus.Events.listenTo = function (obj, name, callback) {
        if (!obj) return this;
        var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
        var listeningTo = this._listeningTo || (this._listeningTo = {});
        var listening = listeningTo[id];

        // This object is not listening to any other events on `obj` yet.
        // Setup the necessary references to track the listening callbacks.
        if (!listening) {
            var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
            listening = listeningTo[id] = { obj: obj, objId: id, id: thisId, listeningTo: listeningTo, count: 0 };
        }

        // Bind callbacks on obj, and keep track of them on listening.
        internalOn(obj, name, callback, this, listening);
        return this;
    };

    // The reducing API that adds a callback to the `events` object.
    var onApi = function (events, name, callback, options) {
        if (callback) {
            var handlers = events[name] || (events[name] = []);
            var context = options.context;
            var ctx = options.ctx;
            var listening = options.listening;
            if (listening) listening.count++;

            handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
        }
        return events;
    };

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    Stratus.Events.off = function (name, callback, context) {
        if (!this._events) return this;
        this._events = eventsApi(offApi, this._events, name, callback, {
            context: context,
            listeners: this._listeners
        });
        return this;
    };

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    Stratus.Events.stopListening = function (obj, name, callback) {
        var listeningTo = this._listeningTo;
        if (!listeningTo) return this;

        var ids = obj ? [obj._listenId] : _.keys(listeningTo);

        for (var i = 0; i < ids.length; i++) {
            var listening = listeningTo[ids[i]];

            // If listening doesn't exist, this object is not currently
            // listening to obj. Break out early.
            if (!listening) break;

            listening.obj.off(name, callback, this);
        }

        return this;
    };

    // The reducing API that removes a callback from the `events` object.
    var offApi = function (events, name, callback, options) {
        if (!events) return;

        var i = 0;
        var listening;
        var context = options.context;
        var listeners = options.listeners;

        // Delete all events listeners and "drop" events.
        if (!name && !callback && !context) {
            var ids = _.keys(listeners);
            for (; i < ids.length; i++) {
                listening = listeners[ids[i]];
                delete listeners[listening.id];
                delete listening.listeningTo[listening.objId];
            }
            return;
        }

        var names = name ? [name] : _.keys(events);
        for (; i < names.length; i++) {
            name = names[i];
            var handlers = events[name];

            // Bail out if there are no events stored.
            if (!handlers) break;

            // Replace events if there are any remaining.  Otherwise, clean up.
            var remaining = [];
            for (var j = 0; j < handlers.length; j++) {
                var handler = handlers[j];
                if (
                    callback && callback !== handler.callback &&
                    callback !== handler.callback._callback ||
                    context && context !== handler.context
                ) {
                    remaining.push(handler);
                } else {
                    listening = handler.listening;
                    if (listening && --listening.count === 0) {
                        delete listeners[listening.id];
                        delete listening.listeningTo[listening.objId];
                    }
                }
            }

            // Update tail event if the list has any events.  Otherwise, clean up.
            if (remaining.length) {
                events[name] = remaining;
            } else {
                delete events[name];
            }
        }
        return events;
    };

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, its listener will be removed. If multiple events
    // are passed in using the space-separated syntax, the handler will fire
    // once for each event, not once for a combination of all events.
    Stratus.Events.once = function (name, callback, context) {
        // Map the event into a `{event: once}` object.
        var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
        if (typeof name === 'string' && context == null) callback = void 0;
        return this.on(events, callback, context);
    };

    // Inversion-of-control versions of `once`.
    Stratus.Events.listenToOnce = function (obj, name, callback) {
        // Map the event into a `{event: once}` object.
        var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
        return this.listenTo(obj, events);
    };

    // Reduces the event callbacks into a map of `{event: onceWrapper}`.
    // `offer` unbinds the `onceWrapper` after it has been called.
    var onceMap = function (map, name, callback, offer) {
        if (callback) {
            var once = map[name] = _.once(function () {
                offer(name, once);
                callback.apply(this, arguments);
            });
            once._callback = callback;
        }
        return map;
    };

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    Stratus.Events.trigger = function (name) {
        if (!this._events) return this;

        var length = Math.max(0, arguments.length - 1);
        var args = Array(length);
        for (var i = 0; i < length; i++) args[i] = arguments[i + 1];

        eventsApi(triggerApi, this._events, name, void 0, args);
        return this;
    };

    // Handles triggering the appropriate event callbacks.
    var triggerApi = function (objEvents, name, callback, args) {
        if (objEvents) {
            var events = objEvents[name];
            var allEvents = objEvents.all;
            if (events && allEvents) allEvents = allEvents.slice();
            if (events) triggerEvents(events, args);
            if (allEvents) triggerEvents(allEvents, [name].concat(args));
        }
        return objEvents;
    };

    // A difficult-to-believe, but optimized internal dispatch function for
    // triggering events. Tries to keep the usual cases speedy (most internal
    // Backbone events have 3 arguments).
    var triggerEvents = function (events, args) {
        var ev;
        var i = -1;
        var l = events.length;
        var a1 = args[0];
        var a2 = args[1];
        var a3 = args[2];
        switch (args.length) {
            case 0:
                while (++i < l) (ev = events[i]).callback.call(ev.ctx);
                return;
            case 1:
                while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1);
                return;
            case 2:
                while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2);
                return;
            case 3:
                while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
                return;
            default:
                while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
                return;
        }
    };

    // Aliases for backwards compatibility.
    Stratus.Events.bind = Stratus.Events.on;
    Stratus.Events.unbind = Stratus.Events.off;

    // Model Prototype
    // ---------------

    // This function is meant to be extended models that want to use internal data in a native Backbone way.
    /**
     * @param data
     * @returns {Stratus.Prototypes.Model}
     * @constructor
     */
    Stratus.Prototypes.Model = function (data) {
        /**
         * @type {{}}
         */
        this.data = {};
        /**
         * @type {{}}
         */
        this.attributes = this.data;
        /**
         * @type {{}}
         */
        this.temps = {};
        /**
         * @param options
         * @returns {*}
         */
        this.toObject = function (options) {
            return _.clone(this.data);
        };
        /**
         * @param options
         * @returns {{meta: (*|string|{type, data}), payload: *}}
         */
        this.toJSON = function (options) {
            return _.clone(this.data);
        };
        /**
         * @param callback
         * @param scope
         */
        this.each = function (callback, scope) {
            _.each.apply((scope === undefined) ? this : scope, _.union([this.data], arguments));
        };
        /**
         * @param attr
         * @returns {*}
         */
        this.get = function (attr) {
            return _.reduce(typeof attr === 'string' ? attr.split('.') : [], function (attrs, a) {
                return attrs && attrs[a];
            }, this.data);
        };
        /**
         * @param attr
         * @returns {boolean}
         */
        this.has = function (attr) {
            return (typeof this.get(attr) !== 'undefined');
        };
        /**
         * @returns {number}
         */
        this.size = function () {
            return _.size(this.data);
        };
        /**
         * @param attr
         * @param value
         */
        this.set = function (attr, value) {
            if (attr && typeof attr === 'object') {
                _.each(attr, function (value, attr) {
                    this.setAttribute(attr, value);
                }, this);
            } else {
                this.setAttribute(attr, value);
            }
        };
        /**
         * @param attr
         * @param value
         */
        this.setAttribute = function (attr, value) {
            if (typeof attr === 'string') {
                if (attr.indexOf('.') !== -1) {
                    var reference = this.data;
                    var chain = attr.split('.');
                    _.find(_.initial(chain), function (link) {
                        if (!_.has(reference, link) || !reference[link]) reference[link] = {};
                        if (typeof reference !== 'undefined' && reference && typeof reference === 'object') {
                            reference = reference[link];
                        } else {
                            reference = this.data;
                            return true;
                        }
                    }, this);
                    if (!_.isEqual(reference, this.data)) {
                        var link = _.last(chain);
                        if (reference && typeof reference === 'object' && (!_.has(reference, link) || !_.isEqual(reference[link], value))) {
                            reference[link] = value;
                            this.trigger('change:' + attr, this);
                        }
                    }
                } else if (!_.has(this.data, attr) || !_.isEqual(this.data[attr], value)) {
                    this.data[attr] = value;
                    this.trigger('change:' + attr, this);
                }
            }
        };
        /**
         * @param attr
         * @param value
         */
        this.temp = function (attr, value) {
            this.set(attr, value);
            if (attr && typeof attr === 'object') {
                _.each(attr, function (value, attr) {
                    this.temps[attr] = value;
                }, this);
            } else {
                this.temps[attr] = value;
            }
        };
        /**
         * @param attr
         * @param value
         * @returns {*}
         */
        this.add = function (attr, value) {
            // Ensure a placeholder exists
            if (!this.has(attr)) this.set(attr, []);

            // only add value if it's supplied (sometimes we want to create an empty placeholder first)
            if (typeof value !== 'undefined' && !_.contains(this.data[attr], value)) {
                this.data[attr].push(value);
                return value;
            }
        };
        /**
         * @param attr
         * @param value
         * @returns {*}
         */
        this.remove = function (attr, value) {
            if (value === undefined) {
                // delete this.data[attr];
            } else {
                // TODO: use dot notation for nested removal or _.without for array values (these should be separate functions)
                this.data[attr] = _.without(this.data[attr], value);
            }
            return this.data[attr];
        };
        /**
         * @param attr
         * @returns {number}
         */
        this.iterate = function (attr) {
            if (!this.has(attr)) this.set(attr, 0);
            return ++this.data[attr];
        };
        /**
         * Clear all internal data
         */
        this.clear = function () {
            for (var attribute in this.data) {
                if (this.data.hasOwnProperty(attribute)) {
                    delete this.data[attribute];
                }
            }
        };
        /**
         * Clear all temporary data
         */
        this.clearTemp = function () {
            for (var attribute in this.temps) {
                if (this.temps.hasOwnProperty(attribute)) {
                    // delete this.data[attribute];
                    // this.remove(attribute);
                    delete this.temps[attribute];
                }
            }
        };

        /**
         * @returns {boolean}
         */
        this.initialize = function () {
            return true;
        };

        // Evaluate object or array
        if (data) {
            // TODO: Evaluate object or array into a string of sets
            /*
             attrs = _.defaults(_.extend({}, defaults, attrs), defaults);
             this.set(attrs, options);
             */
            _.extend(this.data, data);
        }

        // Add Event Logic
        _.extend(this, Stratus.Events);

        // Initialize
        this.reinitialize = function () {
            this.initialize.apply(this, arguments);
        }.bind(this);
        this.reinitialize();

        return this;
    };

    // Internal Collections
    Stratus.Collections = new Stratus.Prototypes.Model();
    Stratus.Models = new Stratus.Prototypes.Model();
    Stratus.Routers = new Stratus.Prototypes.Model();
    Stratus.Environment = new Stratus.Prototypes.Model(Stratus.Environment);

    // jQuery Plugins
    // --------------

    // FIXME: These are deprecated, since they will never load in the core now that jQuery is gone
    if (typeof $ === 'function' && $.fn) {
        /**
         * @param event
         * @returns {boolean}
         */
        $.fn.notClicked = function (event) {
            if (!this.selector) console.error('No Selector:', this);
            return (!sandbox(event.target).closest(this.selector).length && !sandbox(event.target).parents(this.selector).length);
        };
    }

    // Stratus Environment Initialization
    // ----------------------------------

    // This needs to run after the jQuery library is configured.
    /**
     * @constructor
     */
    Stratus.Internals.LoadEnvironment = function () {
        var initialLoad = Stratus.Select('body').attr('data-environment');
        if (initialLoad && typeof initialLoad === 'object' && _.size(initialLoad)) {
            Stratus.Environment.set(initialLoad);
        }
    };

    // Instance Clean
    // --------------

    // This function is meant to delete instances by their unique id for Garbage Collection.
    /**
     * @param instances
     * @returns {boolean}
     * @constructor
     */
    Stratus.Instances.Clean = function (instances) {
        if (typeof instances === 'undefined') {
            console.error('Stratus.Instances.Clean() requires a string or array containing Unique ID(s).');
        } else if (typeof instances === 'string') {
            instances = [instances];
        }

        if (typeof instances === 'object' && Array.isArray(instances)) {
            _.each(instances, function (value) {
                if (_.has(Stratus.Instances, value)) {
                    if (typeof Stratus.Instances[value].remove === 'function') {
                        Stratus.Instances[value].remove();
                    }
                    delete Stratus.Instances[value];
                }
            });
        } else {
            return false;
        }
    };

    // Error Prototype
    // ---------------

    /**
     * @param error
     * @param chain
     * @constructor
     */
    Stratus.Prototypes.Error = function (error, chain) {
        this.code = 'Internal';
        this.message = 'No discernible data received.';
        this.chain = [];

        if (typeof error === 'string') {
            this.message = error;
        } else if (error && typeof error === 'object') {
            _.extend(this, error);
        }

        this.chain.push(chain);
    };

    // Dispatch Prototype
    // ----------------

    /**
     * @returns {Object}
     * @constructor
     */
    Stratus.Prototypes.Dispatch = function () {
        // if Backbone
        return _.extend(this, Stratus.Events);
    };

    // Chronos System
    // --------------

    // This constructor builds jobs for various methods.
    /**
     * @param time
     * @param method
     * @param scope
     * @constructor
     */
    Stratus.Prototypes.Job = function (time, method, scope) {
        this.enabled = false;
        if (time && typeof time === 'object') {
            _.extend(this, time);
        } else {
            this.time = time;
            this.method = method;
            this.scope = scope;
        }
        this.time = _.seconds(this.time);
        this.scope = this.scope || window;
        return this;
    };

    /**
     * @param request
     * @constructor
     */
    Stratus.Internals.Ajax = function (request) {

        // Defaults
        this.method = 'GET';
        this.url = '/Api';
        this.data = {};
        this.type = '';

        /**
         * @param response
         * @returns {*}
         */
        this.success = function (response) {
            return response;
        };

        /**
         * @param response
         * @returns {*}
         */
        this.error = function (response) {
            return response;
        };

        // Customize & Hoist
        _.extend(this, request);
        var that = this;

        // Make Request
        this.xhr = new XMLHttpRequest();
        var promise = new Promise(function (resolve, reject) {
            that.xhr.open(that.method, that.url, true);
            if (typeof that.type === 'string' && that.type.length) {
                that.xhr.setRequestHeader('Content-Type', that.type);
            }
            that.xhr.onload = function () {
                if (that.xhr.status >= 200 && that.xhr.status < 400) {
                    var response = that.xhr.responseText;
                    if (_.isJSON(response)) response = JSON.parse(response);
                    resolve(response);
                } else {
                    reject(that.xhr);
                }
            };

            that.xhr.onerror = function () {
                reject(that.xhr);
            };

            if (Object.keys(that.data).length) {
                that.xhr.send(JSON.stringify(that.data));
            } else {
                that.xhr.send();
            }
        });
        promise.then(that.success, that.error);
        return promise;
    };

    // Sentinel Prototype
    // ------------------

    // This class intends to handle typical Sentinel operations.
    /**
     * @returns {Stratus.Sentinel.Prototypes}
     * @constructor
     */
    Stratus.Prototypes.Sentinel = function () {
        this.view = false;
        this.create = false;
        this.edit = false;
        this.delete = false;
        this.publish = false;
        this.design = false;
        this.dev = false;
        this.master = false;
        this.zero = function () {
            _.extend(this, {
                view: false,
                create: false,
                edit: false,
                delete: false,
                publish: false,
                design: false,
                dev: false,
                master: false
            });
        };
        this.permissions = function (value) {
            if (!isNaN(value)) {
                _.each(value.toString(2).split('').reverse(), function (bit, key) {
                    if (bit == '1') {
                        switch (key) {
                            case 0:
                                this.view = true;
                                break;
                            case 1:
                                this.create = true;
                                break;
                            case 2:
                                this.edit = true;
                                break;
                            case 3:
                                this.delete = true;
                                break;
                            case 4:
                                this.publish = true;
                                break;
                            case 5:
                                this.design = true;
                                break;
                            case 6:
                                this.dev = true;
                                break;
                            case 7:
                                this.view = true;
                                this.create = true;
                                this.edit = true;
                                this.delete = true;
                                this.publish = true;
                                this.design = true;
                                this.dev = true;
                                this.master = true;
                                break;
                        }
                    }
                }, this);
            } else {
                var decimal = 0;
                decimal += (this.view) ? (1 << 0) : (0 << 0);
                decimal += (this.create) ? (1 << 1) : (0 << 1);
                decimal += (this.edit) ? (1 << 2) : (0 << 2);
                decimal += (this.delete) ? (1 << 3) : (0 << 3);
                decimal += (this.publish) ? (1 << 4) : (0 << 4);
                decimal += (this.design) ? (1 << 5) : (0 << 5);
                decimal += (this.dev) ? (1 << 6) : (0 << 6);
                decimal += (this.master) ? (1 << 7) : (0 << 7);
                return decimal;
            }
        };
        this.summary = function () {
            var output = [];
            _.each(this, function (value, key) {
                if (typeof value === 'boolean' && value) output.push(_.ucfirst(key));
            });
            return output;
        };
        return this;
    };

    // Chronos System
    // --------------

    // This model handles all time related jobs.
    Stratus.Chronos = _.extend(new Stratus.Prototypes.Model(), {
        /**
         * @param options
         */
        initialize: function (options) {
            if (!Stratus.Environment.get('production')) console.info('Chronos Invoked!');
            this.on('change', this.synchronize, this);
        },
        synchronize: function () {
            _.each(this.changed, function (job, key) {
                if (typeof key === 'string' && key.indexOf('.') !== -1) {
                    key = _.first(key.split('.'));
                    job = this.get(key);
                }
                if (!job.code && job.enabled) {
                    job.code = setInterval(function (job) {
                        job.method.call(job.scope);
                    }, job.time * 1000, job);
                } else if (job.code && !job.enabled) {
                    clearInterval(job.code);
                    job.code = 0;
                }
            }, this);
        },
        /**
         * @param time
         * @param method
         * @param scope
         * @returns {string}
         */
        add: function (time, method, scope) {
            var uid = null;
            var job = new Stratus.Prototypes.Job(time, method, scope);
            if (job.time !== null && typeof job.method === 'function') {
                uid = _.uniqueId('job_');
                this.set(uid, job);
                Stratus.Instances[uid] = job;
            }
            return uid;
        },
        /**
         * @param uid
         * @returns {boolean|*}
         */
        enable: function (uid) {
            var success = this.has(uid);
            if (success) this.set(uid + '.enabled', true);
            return success;
        },
        /**
         * @param uid
         * @returns {boolean|*}
         */
        disable: function (uid) {
            var success = this.has(uid);
            if (success) this.set(uid + '.enabled', false);
            return success;
        },
        /**
         * @param uid
         * @param value
         * @returns {boolean|*}
         */
        toggle: function (uid, value) {
            var success = this.has(uid);
            if (success) this.set(uid + '.enabled', (typeof value === 'boolean') ? value : !this.get(uid + '.enabled'));
            return success;
        }
    });
    Stratus.Chronos.reinitialize();

    // Internal CSS Loader
    // -------------------

    // This function allows asynchronous CSS Loading and returns a promise.
    // It Prepends CSS files to the top of the list, so that it
    // doesn't overwrite the site.css. So we reverse the order of the list of urls so they load the order specified.
    /**
     * TODO: Determine relative or CDN based URLs
     * @param urls
     * @returns {Promise}
     * @constructor
     */
    Stratus.Internals.LoadCss = function (urls) {
        return new Promise(function (resolve, reject) {
            if (typeof urls === 'undefined' || typeof urls === 'function') {
                reject(new Stratus.Prototypes.Error({
                    code: 'LoadCSS',
                    message: 'CSS Resource URLs must be defined as a String, Array, or Object.'
                }, this));
            }
            if (typeof urls === 'string') urls = [urls];
            var cssEntries = {
                total: urls.length,
                iteration: 0
            };
            if (cssEntries.total > 0) {
                _.each(urls.reverse(), function (url) {
                    cssEntries.iteration++;
                    var cssEntry = _.uniqueId('css_');
                    cssEntries[cssEntry] = false;
                    if (typeof url === 'undefined' || !url) {
                        cssEntries[cssEntry] = true;
                        if (cssEntries.total === cssEntries.iteration && _.allTrue(cssEntries)) {
                            resolve(cssEntries);
                        }
                    } else {
                        Stratus.Internals.CssLoader(url).then(function (entry) {
                            cssEntries[cssEntry] = true;
                            if (cssEntries.total === cssEntries.iteration && _.allTrue(cssEntries)) {
                                resolve(cssEntries);
                            }
                        }, reject);
                    }
                });
            } else {
                reject(new Stratus.Prototypes.Error({ code: 'LoadCSS', message: 'No CSS Resource URLs found!' }, this));
            }
        });
    };

    // OnScroll()
    // -----------
    // Since different plugins or methods may need to listen to the Scroll, we don't want lots of different listeners on the scroll event, so we register them and then execute them all at once
    // Each element must include:
    // method: the function to callback
    // options: an object of options that the function uses
    // TODO: Move this somewhere.
    /**
     * @param elements
     * @returns {boolean}
     * @constructor
     */
    Stratus.Internals.OnScroll = _.once(function (elements) {

        // Reset Elements:
        // if (!elements || elements.length === 0) return false;

        // Execute the methods for every registered object ONLY when there is a change to the viewPort
        Stratus.Environment.on('change:viewPortChange', function (model) {
            if (model.get('viewPortChange')) {
                model.set('lastScroll', Stratus.Internals.GetScrollDir());

                // Cycle through all the registered objects an execute their function
                // We must use the registered onScroll objects, because they get removed in some cases (e.g. lazy load)
                var elements = Stratus.RegisterGroup.get('OnScroll');

                _.each(elements, function (obj) {
                    if (typeof obj !== 'undefined' && _.has(obj, 'method')) {
                        obj.method(obj);
                    }
                });
                model.set('viewPortChange', false);
                model.set('windowTop', $(window).scrollTop());
            }
        });

        // jQuery Binding
        if (typeof $ === 'function' && $.fn) {
            $(window).scroll(function () {
                if (Stratus.Environment.get('viewPortChange') === false) {
                    Stratus.Environment.set('viewPortChange', true);
                }
            });

            // Resizing can change what's on screen so we need to check the scrolling
            $(window).resize(function () {
                if (Stratus.Environment.get('viewPortChange') === false) {
                    Stratus.Environment.set('viewPortChange', true);
                }
            });
        }

        // Run Once initially
        Stratus.Environment.set('viewPortChange', true);
    });

    // GetScrollDir()
    // --------------
    // Checks whether there has been any scroll yet, and returns down, up, or false
    /**
     * @returns {string}
     * @constructor
     */
    Stratus.Internals.GetScrollDir = function () {
        var wt = $(window).scrollTop();
        var lwt = Stratus.Environment.get('windowTop');
        var wh = $(window).height();
        var dh = $(document).height();

        // return NULL if there is no scroll, otherwise up or down
        var down = lwt ? (wt > lwt) : false;
        var up = lwt ? (wt < lwt && (wt + wh) < dh) : false;
        return down ? 'down' : (up ? 'up' : false);
    };

    // IsOnScreen()
    // ---------------
    // Check whether an element is on screen, returns true or false.
    /**
     * @param el
     * @param offset
     * @returns {boolean}
     * @constructor
     */
    Stratus.Internals.IsOnScreen = function (el, offset) {
        offset = offset || 0;
        var wt = $(window).scrollTop();
        var wb = wt + $(window).height();
        var et = el.offset() ? el.offset().top : null;
        var eb = et + el.height();
        return (eb >= wt + offset && et <= wb - offset);
    };

    // Internal Anchor Capture
    // -----------------------

    // This function allows anchor capture for smooth scrolling before propagation.
    /**
     * @type {*|Function|void}
     */
    Stratus.Internals.Anchor = (function Anchor() {
        Anchor.initialize = true;
        return (typeof Backbone !== 'object') ? Anchor : Backbone.View.extend({
            el: 'a[href*=\\#]:not([href=\\#]):not([data-scroll="false"])',
            events: {
                click: 'clickAction'
            },
            clickAction: function (event) {
                if (location.pathname.replace(/^\//, '') === event.currentTarget.pathname.replace(/^\//, '') && location.hostname === event.currentTarget.hostname) {
                    var reserved = ['new', 'filter', 'page', 'version'];
                    var valid = _.every(reserved, function (keyword) {
                        return !_.startsWith(event.currentTarget.hash, '#' + keyword);
                    }, this);
                    if (valid) {
                        if (typeof $ === 'function' && $.fn && typeof Backbone === 'object') {
                            var $target = $(event.currentTarget.hash);
                            var anchor = event.currentTarget.hash.slice(1);
                            $target = ($target.length) ? $target : $('[name=' + anchor + ']');
                            /* TODO: Ensure that this animation only stops propagation of click event son anchors that are confirmed to exist on the page */
                            if ($target.length) {
                                $('html,body').animate({
                                    scrollTop: $target.offset().top
                                }, 1000, function () {
                                    Backbone.history.navigate(anchor);
                                });
                                return false;
                            }
                        }
                    }
                }
            }
        });
    })();

    // Lazy Load Image
    // ---------------
    /**
     * @param obj
     * @returns {boolean}
     * @constructor
     */
    Stratus.Internals.LoadImage = function (obj) {
        obj.el.addClass('placeholder');
        if (Stratus.Internals.IsOnScreen(obj.spy) && !Stratus.Select(obj.el).attr('data-loading')) {
            obj.el.attr('data-loading', 'true');
            Stratus.DOM.complete(function () {

                // By default we'll load larger versions of an image to look good on HD displays, but if you
                // don't want that, you can bypass it with data-hd="false"
                var hd = obj.el.data('hd');
                hd = (typeof hd === 'undefined') ? true : (_.isJSON(hd) ? JSON.parse(hd) : hd);

                // Don't Get the Width, until it's "onScreen" (in case it was collapsed offscreen originally)
                var src = obj.el.data('src');

                // Handle precedence
                if (!src || src === 'lazy') {
                    src = obj.el.attr('src');
                }

                var size = null;

                // if a specific valid size is requested, use that
                if (obj.el.data('size') && size.indexOf(obj.el.data('size')) !== false) {
                    size = obj.el.data('size');
                } else {
                    var width = null;
                    var unit = null;
                    var percentage = null;

                    if (obj.el.prop('style').width) {
                        // Check if there is CSS width hard coded on the element
                        width = obj.el.prop('style').width;
                    } else if (obj.el.attr('width')) {
                        width = obj.el.attr('width');
                    }

                    // Digest Width Attribute
                    if (width) {
                        var digest = /([\d]+)(.*)/;
                        width = digest.exec(width);
                        unit = width[2];
                        width = parseInt(width[1]);
                        percentage = (unit === '%') ? (width / 100) : null;
                    }

                    // FIXME: This should only happen if the CSS has completely loaded.
                    // Gather Container (Calculated) Width
                    if (!width || unit === '%') {
                        // If there is no CSS width, calculate the parent container's width
                        // The image may be inside an element that is invisible (e.g. Carousel has items display:none)
                        // So we need to find the first parent that is visible and use that width
                        // NOTE: when lazy-loading in a slideshow, the containers that determine the size, might be invisible
                        // so in some cases we need to flag to find the parent regardless of invisibility.
                        var visibilitySelector = (obj.el.data('ignorevisibility')) ? null : ':visible';
                        var $visibleParent = $(_.first(obj.el.parents(visibilitySelector)));
                        width = $visibleParent.width();

                        // If one of parents of the image (and child of the found parent) has a bootstrap col-*-* set
                        // divide width by that in anticipation (e.g. Carousel that has items grouped)
                        var $col = $(_.first($visibleParent.find('[class*="col-"]')));

                        if ($col.length > 0) {
                            var colWidth = Stratus.Internals.GetColWidth($col);
                            if (colWidth) {
                                width = Math.round(width / colWidth);
                            }
                        }

                        // Calculate Percentage
                        if (percentage) {
                            width = Math.round(width * percentage);
                        }
                    }

                    // If no appropriate width was found, abort
                    if (width <= 0) {
                        obj.el.attr('data-loading', 'false');
                        setTimeout(function () {
                            Stratus.Internals.LoadImage(obj);
                        }, 500);
                        return false;
                    }

                    // Double for HD
                    if (hd) {
                        width = width * 2;
                    }

                    // Return the first size that is bigger than container width
                    size = _.findKey(Stratus.Settings.image.size, function (s) {
                        var ratio = s / width;
                        return ((0.85 < ratio && ratio < 1.15) || s > width);
                    });

                    // default to largest size if the container is larger and it didn't find a size
                    size = size || 'hq';
                }

                // Change Source to right size (get the base and extension and ignore size)
                var srcRegex = /^(.+?)(-[A-Z]{2})?\.(?=[^.]*$)(.+)/gi;
                var srcMatch = srcRegex.exec(src);
                src = srcMatch[1] + '-' + size + '.' + srcMatch[3];

                // Change the Source to be the desired path
                obj.el.attr('src', src);
                obj.el.addClass('loading');
                obj.el.load(function () {
                    Stratus.Select(this).addClass('loaded').removeClass('placeholder loading');
                });

                // Remove from registration
                Stratus.RegisterGroup.remove('OnScroll', obj);

            });
        }
    };

    /**
     * TODO: Move this to an underscore mixin
     * @param el
     * @returns {boolean}
     * @constructor
     */
    Stratus.Internals.GetColWidth = function (el) {
        var classes = el.attr('class');
        var regexp = /col-.{2}-([0-9]*)/g;
        var match = regexp.exec(classes);
        return (typeof match[1] !== 'undefined') ? match[1] : false;
    };

    /**
     * @param options
     * @constructor
     */
    Stratus.Internals.Location = function (options) {
        return new Promise(function (resolve, reject) {
            if (!('geolocation' in navigator)) {
                reject(new Stratus.Prototypes.Error({
                    code: 'Location',
                    message: 'HTML5 Geo-Location isn\'t supported on this browser.'
                }, this));
            } else {
                options = _.extend({
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 50000
                }, options || {});
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            }
        });
    };

    /**
     * @param url
     * @returns {Promise}
     * @constructor
     */
    Stratus.Internals.CssLoader = function (url) {
        return new Promise(function (resolve, reject) {
            /* Digest Extension */
            /*
             FIXME: Less files won't load correctly due to less.js not being able to parse new stylesheets after runtime
             var extension = /\.([0-9a-z]+)$/i;
             extension = extension.exec(url);
             */
            /* Verify Identical Calls */
            if (url in Stratus.CSS) {
                if (Stratus.CSS[url]) {
                    resolve();
                } else {
                    Stratus.Events.once('onload:' + url, resolve);
                }
            } else {
                /* Set CSS State */
                Stratus.CSS[url] = false;

                /* Create Link */
                var link = document.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.href = url;

                /* Track Resolution */
                Stratus.Events.once('onload:' + url, function () {
                    Stratus.CSS[url] = true;
                    resolve();
                });

                /* Capture OnLoad or Fallback */
                if ('onload' in link && !Stratus.Client.android) {
                    link.onload = function () {
                        Stratus.Events.trigger('onload:' + url);
                    };
                } else {
                    Stratus.CSS[url] = true;
                    Stratus.Events.trigger('onload:' + url);
                }

                /* Inject Link into Head */
                Stratus.Select('head').prepend(link);
            }
        });
    };

    // Internal Convoy Dispatcher
    // --------------------------

    // This function allows Stratus to make SOAP-like API calls for
    // very specific, decoupled, data sets.
    /**
     * @param convoy
     * @param query
     * @returns {Promise}
     * @constructor
     */
    Stratus.Internals.Convoy = function (convoy, query) {
        return new Promise(function (resolve, reject) {
            if (convoy === undefined) {
                reject(new Stratus.Prototypes.Error({
                    code: 'Convoy',
                    message: 'No Convoy defined for dispatch.'
                }, this));
            }
            if (typeof $ === 'function' && $.fn) {
                reject('jQuery is not defined and there isn\t a native AJAX alternative at the moment.');
                return;
            }
            $.ajax({
                type: 'POST',
                url: '/Api' + encodeURIComponent(query || ''),
                data: { convoy: JSON.stringify(convoy) },
                dataType: (_.has(convoy, 'meta') && _.has(convoy.meta, 'dataType')) ? convoy.meta.dataType : 'json',
                xhrFields: {
                    withCredentials: true
                },
                crossDomain: true,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                success: function (response) {
                    resolve(response);
                    return response;
                },
                error: function (response) {
                    reject(new Stratus.Prototypes.Error({ code: 'Convoy', message: response }, this));
                    return response;
                }
            });
        });
    };

    // Internal Convoy Builder
    // -----------------------

    // This function is simply a convoy builder for a SOAP-like API call.
    /**
     * @param route
     * @param meta
     * @param payload
     * @returns {*}
     * @constructor
     */
    Stratus.Internals.Api = function (route, meta, payload) {
        if (route === undefined) route = 'Default';
        if (meta === undefined || meta === null) meta = {};
        if (payload === undefined) payload = {};

        if (typeof meta !== 'object') meta = { method: meta };
        if (!_.has(meta, 'method')) meta.method = 'GET';

        return Stratus.Internals.Convoy({
            route: {
                controller: route
            },
            meta: meta,
            payload: payload
        });
    };

    // Internal Resource Loader
    // ------------------------

    // This will either retrieve a resource from a URL and cache it for future reference.
    /**
     * @param path
     * @param elementId
     * @returns {Promise}
     * @constructor
     */
    Stratus.Internals.Resource = function (path, elementId) {
        return new Promise(function (resolve, reject) {
            if (typeof path === 'undefined') {
                reject(new Stratus.Prototypes.Error({
                    code: 'Resource',
                    message: 'Resource path is not defined.'
                }, this));
            }
            if (_.has(Stratus.Resources, path)) {
                if (Stratus.Resources[path].success) {
                    resolve(Stratus.Resources[path].data);
                } else {
                    Stratus.Events.once('resource:' + path, resolve);
                }
            } else {
                Stratus.Resources[path] = {
                    success: false,
                    data: null
                };
                Stratus.Events.once('resource:' + path, resolve);
                var meta = { path: path, dataType: 'text' };
                if (elementId !== undefined) {
                    meta.elementId = elementId;
                }
                Stratus.Internals.Api('Resource', meta, {}).then(function (data) {
                    Stratus.Resources[path].success = true;
                    Stratus.Resources[path].data = data;
                    Stratus.Events.trigger('resource:' + path, data);
                }, reject);
            }
        });
    };

    // Internal Browser Compatibility
    // ------------------------------

    // This function gathers information about the Client's Browser
    // and respectively adds informational classes to the DOM's Body.
    /**
     * @constructor
     */
    Stratus.Internals.Compatibility = function () {
        var profile = [];

        // Operating System
        if (Stratus.Client.android) {
            profile.push('android');
        } else if (Stratus.Client.ios) {
            profile.push('ios');
        } else if (Stratus.Client.mac) {
            profile.push('mac');
        } else if (Stratus.Client.windows) {
            profile.push('windows');
        } else if (Stratus.Client.linux) {
            profile.push('linux');
        } else {
            profile.push('os');
        }

        // Browser Type
        if (Stratus.Client.chrome) {
            profile.push('chrome');
        } else if (Stratus.Client.firefox) {
            profile.push('firefox');
        } else if (Stratus.Client.safari) {
            profile.push('safari');
        } else if (Stratus.Client.opera) {
            profile.push('opera');
        } else if (Stratus.Client.msie) {
            profile.push('msie');
        } else if (Stratus.Client.iphone) {
            profile.push('iphone');
        } else {
            profile.push('browser');
        }

        // Browser Major Version
        if (Stratus.Client.version) {
            profile.push('version' + Stratus.Client.version.split('.')[0]);
        }

        // Platform
        if (Stratus.Client.mobile) {
            profile.push('mobile');
        } else if (Stratus.Client.tablet) {
            profile.push('tablet');
        } else {
            profile.push('desktop');
        }

        /*Stratus.Events.trigger('alert', profile + JSON.stringify(Stratus.Client));*/
        Stratus.Select('body').addClass(profile.join(' '));
    };

    // Internal View Model
    // ---------------------

    // This non-relational model is instantiated every time a Stratus Loader
    // finds a Stratus DOM element.
    /**
     * @type {void|*}
     */

    // TODO: Combine this inheritance logic into a single underscore function
    Stratus.Internals.View = (function (_Model) {
        _.inherits(View, _Model);

        function View(length) {
            _.classCallCheck(this, View);
            var that = _.possibleConstructorReturn(this, (View.__proto__ || Object.getPrototypeOf(View)).call(this, length, length));
            _.extend(that, {
                toObject: function () {
                    var sanitized = _.clone(this.data);
                    if (sanitized.el && sanitized.el.selection) {
                        sanitized.el = sanitized.el.selection;
                        /* TODO: This may not be necessary */
                        if (typeof $ === 'function' && $.fn) {
                            sanitized.$el = $(sanitized.el);
                        }
                        /* */
                    }
                    return sanitized;
                },

                // TODO: This function's documentation needs to be moved to the Sitetheory-Docs repo
                hydrate: function () {
                    var nel = this.get('el');
                    this.set({
                        // Unique IDs
                        // -----------

                        // This is set as the widgets are gathered
                        uid: _.uniqueId('view_'),

                        // This is set as a widget is created to ensure duplicates don't exist
                        guid: (typeof nel.attr('data-guid') !== 'undefined') ? nel.attr('data-guid') : null,

                        // Model or Collection
                        // -----------

                        // Entity Type (i.e. 'View' which would correlate to a Restful /Api/View Request)
                        entity: (typeof nel.attr('data-entity') !== 'undefined') ? _.ucfirst(nel.attr('data-entity')) : null,

                        // Entity ID (Determines Model or Collection)
                        id: (typeof nel.attr('data-id') !== 'undefined') ? nel.attr('data-id') : null,

                        // Determines whether or not we should create an Entity Stub to render the dependent widgets
                        manifest: (typeof nel.attr('data-manifest') !== 'undefined') ? nel.attr('data-manifest') : null,

                        // API Options are added to the Request URL
                        api: (typeof nel.attr('data-api') !== 'undefined') ? nel.attr('data-api') : null,

                        // Determine whether this widget will fetch
                        fetch: (typeof nel.attr('data-fetch') !== 'undefined') ? nel.attr('data-fetch') : true,

                        // Specify Target
                        target: (typeof nel.attr('data-target') !== 'undefined') ? nel.attr('data-target') : null,

                        // This is determines what a new Entity's settings would be on creation
                        prototype: (typeof nel.attr('data-prototype') !== 'undefined') ? nel.attr('data-prototype') : null,

                        // Stuff
                        autoSave: (typeof nel.attr('data-autoSave') !== 'undefined') ? nel.attr('data-autoSave') : null,

                        // View
                        // -----------

                        type: (typeof nel.attr('data-type') !== 'undefined') ? nel.attr('data-type') : null,
                        types: (typeof nel.attr('data-types') !== 'undefined') ? nel.attr('data-types') : null,
                        template: (typeof nel.attr('data-template') !== 'undefined') ? nel.attr('data-template') : null,
                        templates: (typeof nel.attr('data-templates') !== 'undefined') ? nel.attr('data-templates') : null,
                        dialogue: (typeof nel.attr('data-dialogue') !== 'undefined') ? nel.attr('data-dialogue') : null,
                        pagination: (typeof nel.attr('data-pagination') !== 'undefined') ? nel.attr('data-pagination') : null,
                        property: (typeof nel.attr('data-property') !== 'undefined') ? nel.attr('data-property') : null,
                        field: (typeof nel.attr('data-field') !== 'undefined') ? nel.attr('data-field') : null,
                        load: (typeof nel.attr('data-load') !== 'undefined') ? nel.attr('data-load') : null,
                        options: (typeof nel.attr('data-options') !== 'undefined') ? nel.attr('data-options') : null,

                        // Versioning
                        // -----------

                        versionEntity: (typeof nel.attr('data-versionentity') !== 'undefined') ? nel.attr('data-versionentity') : null,
                        versionRouter: (typeof nel.attr('data-versionrouter') !== 'undefined') ? nel.attr('data-versionrouter') : null,
                        versionId: (typeof nel.attr('data-versionid') !== 'undefined') ? nel.attr('data-versionid') : null,

                        // Plugins
                        // -----------

                        plugin: (typeof nel.attr('data-plugin') !== 'undefined') ? nel.attr('data-plugin') : null,
                        plugins: []
                    });

                    if (this.get('plugin') !== null) {
                        var plugins = this.get('plugin').split(' ');
                        if (this.get('type') !== null) {
                            this.set('plugins', (plugins.length > 1) ? plugins : [this.get('plugin')]);
                        } else if (plugins.length > 1) {
                            this.set('plugin', _.first(plugins));

                            // Add additional plugins
                            this.set('plugins', _.rest(plugins));
                        }
                    }
                    var id = this.get('id');
                    var type = (this.get('type') !== null) ? this.get('type') : this.get('plugin');
                    var loaderType = (this.get('type') !== null) ? 'widgets' : 'plugins';
                    this.set({
                        scope: (id !== null) ? 'model' : 'collection',
                        alias: (type !== null) ? 'stratus.views.' + loaderType + '.' + type.toLowerCase() : null,
                        path: (type !== null) ? type : null
                    });
                    if (!id && this.get('entity') !== null && this.get('manifest') !== null) {
                        this.set('scope', 'model');
                    }
                },
                clean: function () {
                    if (!this.get('entity') || this.get('entity').toLowerCase() === 'none') {
                        this.set({ entity: null, scope: null });
                    }
                },

                // Give Nested Attributes for Child Views
                /**
                 * @returns {{entity: *, id: *, versionEntity: *, versionRouter: *, versionId: *, scope: *, manifest: *}}
                 */
                nest: function () {
                    var nest = {
                        entity: this.get('entity'),
                        id: this.get('id'),
                        versionEntity: this.get('versionEntity'),
                        versionRouter: this.get('versionRouter'),
                        versionId: this.get('versionId'),
                        scope: this.get('scope'),
                        manifest: this.get('manifest')
                    };

                    // Add Model or Collection to Nest
                    if (this.has(nest.scope)) {
                        nest[nest.scope] = this.get(nest.scope);
                    }
                    return nest;
                },
                /**
                 * @returns {{id: *}}
                 */
                modelAttributes: function () {
                    return {
                        id: this.get('id')
                    };
                }
            });
            return that;
        }

        return View;
    })(Stratus.Prototypes.Model);

    /**
     * @constructor
     */
    Stratus.Internals.AngularLoader = function () {
        var requirements = [];
        var requirement;
        var nodes;
        var modules = [];

        _.each(Stratus.Roster, function (element, key) {
            if (typeof element === 'object' && element) {
                if (_.isUndefined(element.selector) && element.namespace) {
                    element.selector = _.filter(
                        _.map(requirejs.s.contexts._.config.paths, function (path, key) {
                            // if (_.isString(key)) console.log(key.match(/([a-zA-Z]+)/g));
                            return _.startsWith(key, element.namespace) ? (element.type === 'attribute' ? '[' : '') + _.camelToHyphen(key.replace(element.namespace, 'stratus-')) + (element.type === 'attribute' ? ']' : '') : null;
                        })
                    );
                }
                if (_.isArray(element.selector)) {
                    element.length = 0;
                    _.each(element.selector, function (selector) {
                        nodes = document.querySelectorAll(selector);
                        element.length += nodes.length;
                        if (nodes.length) {
                            var name = selector.replace('[', '').replace(']', '');
                            requirement = element.namespace + _.lcfirst(_.hyphenToCamel(name.replace('stratus', '').replace('ng', '')));
                            if (_.has(requirejs.s.contexts._.config.paths, requirement)) {
                                requirements.push(requirement);
                                if (element.module) {
                                    modules.push(_.isString(element.module) ? element.module : _.lcfirst(_.hyphenToCamel(name + (element.suffix || ''))));
                                }
                            }
                        }
                    });
                } else if (_.isString(element.selector)) {
                    nodes = document.querySelectorAll(element.selector);
                    element.length = nodes.length;
                    if (nodes.length) {
                        var attribute = element.selector.replace('[', '').replace(']', '');
                        if (element.namespace) {
                            _.each(nodes, function (node) {
                                var name = node.getAttribute(attribute);
                                if (name) {
                                    requirement = element.namespace + _.lcfirst(_.hyphenToCamel(name.replace('Stratus', '')));
                                    if (_.has(requirejs.s.contexts._.config.paths, requirement)) {
                                        requirements.push(requirement);
                                    }
                                }
                            });
                        } else if (element.require) {
                            requirements = _.union(requirements, element.require);
                            if (element.module) {
                                modules.push(_.isString(element.module) ? element.module : _.lcfirst(_.hyphenToCamel(attribute + (element.suffix || ''))));
                            }
                        }
                    }
                }
            }
        });

        // Ensure Modules enabled are in the requirements
        // TODO: store the require config in a stratus key: requirejs.s.contexts._.config
        requirements.push('angular-material');
        requirements = _.uniq(requirements);
        window.requirements = requirements;

        // Angular Injector
        if (requirements.length) {
            // TODO: Load Dynamically
            if (_.contains(requirements, 'angular-froala') || _.contains(requirements, 'stratus-froala')) {
                [
                    'codemirror/mode/htmlmixed/htmlmixed',
                    'codemirror/addon/edit/matchbrackets',
                    'codemirror',
                    'froala-align',
                    'froala-code-beautifier',
                    'froala-code-view',
                    'froala-draggable',
                    'froala-entities',
                    'froala-file',
                    'froala-forms',
                    'froala-fullscreen',
                    'froala-help',
                    'froala-image',
                    'froala-image-manager',
                    'froala-inline-style',
                    'froala-link',
                    'froala-lists',
                    'froala-paragraph-format',
                    'froala-paragraph-style',
                    'froala-quick-insert',
                    'froala-quote',
                    'froala-table',
                    'froala-url',
                    'froala-video',
                    'froala-word-paste'
                ].forEach(function (requirement) {
                    requirements.push(requirement);
                });
            }

            // We are currently forcing all filters to load because we don't have a selector to find them on the DOM, yet.
            [
                'stratus.filters.map',
                'stratus.filters.moment',
                'stratus.filters.reduce',
                'stratus.filters.truncate',
                'stratus.filters.gravatar'
            ].forEach(function (requirement) {
                requirements.push(requirement);
            });
            require(requirements, function () {
                // App Reference
                angular.module('stratusApp', _.union(Object.keys(Stratus.Modules), modules)).config(['$sceDelegateProvider', function ($sceDelegateProvider) {
                    var whitelist = [
                        'self',
                        'http://*.sitetheory.io/**',
                        'https://*.sitetheory.io/**'
                    ];
                    if (boot.host) {
                        if (_.startsWith(boot.host, '//')) {
                            _.each(['https:', 'http:'], function (proto) {
                                whitelist.push(proto + boot.host + '/**');
                            });
                        } else {
                            whitelist.push(boot.host + '/**');
                        }
                    }
                    $sceDelegateProvider.resourceUrlWhitelist(whitelist);
                }]);

                // TODO: Make Dynamic
                // Froala Configuration
                if (typeof $ === 'function' && $.fn && $.FroalaEditor) {
                    $.FroalaEditor.DEFAULTS.key = Stratus.Api.Froala;

                    // 'insertOrderedList', 'insertUnorderedList', 'createLink', 'table'
                    var buttons = [
                        'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', '|', 'formatBlock',
                        'blockStyle', 'inlineStyle', 'paragraphStyle', 'paragraphFormat', 'align', 'formatOL',
                        'formatUL', 'outdent', 'indent', '|', 'insertLink', 'insertImage', 'insertVideo', 'insertFile',
                        'insertTable', '|', 'undo', 'redo', 'removeFormat', 'wordPaste', 'help', 'html', 'fullscreen'
                    ];
                    angular.module('stratusApp').value('froalaConfig', {
                        codeBeautifierOptions: {
                            end_with_newline: true,
                            indent_inner_html: true,
                            extra_liners: "['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'ul', 'ol', 'table', 'dl']",
                            brace_style: 'expand',
                            indent_char: ' ',
                            indent_size: 4,
                            wrap_line_length: 0
                        },
                        codeMirror: true,
                        codeMirrorOptions: {
                            indentWithTabs: false,
                            lineNumbers: true,
                            lineWrapping: true,
                            mode: 'text/html',
                            tabMode: 'space',
                            tabSize: 4
                        },
                        fileUploadURL: 'https://app.sitetheory.io:3000/?session=' + _.cookie('SITETHEORY'),
                        htmlAllowedAttrs: ['.*'],
                        htmlAllowedEmptyTags: [
                            'textarea', 'a', '.fa',
                            'iframe', 'object', 'video',
                            'style', 'script', 'div'
                        ],
                        htmlAllowedTags: ['.*'],
                        htmlRemoveTags: [''],
                        htmlUntouched: true,
                        imageManagerPageSize: 20,
                        imageManagerScrollOffset: 10,
                        imageManagerLoadURL: '/Api/Media?payload-only=true',
                        imageManagerLoadMethod: 'GET',
                        imageManagerDeleteMethod: 'DELETE',
                        multiLine: true,
                        pasteDeniedAttrs: [''],
                        pasteDeniedTags: [''],
                        pastePlain: false,
                        toolbarSticky: false,
                        toolbarButtons: buttons,
                        toolbarButtonsMD: buttons,
                        toolbarButtonsSM: buttons,
                        toolbarButtonsXS: buttons
                    });
                }

                // Services
                _.each(Stratus.Services, function (service) {
                    angular.module('stratusApp').config(service);
                });

                // Components
                _.each(Stratus.Components, function (component, name) {
                    angular.module('stratusApp').component('stratus' + _.ucfirst(name), component);
                });

                // Directives
                _.each(Stratus.Directives, function (directive, name) {
                    angular.module('stratusApp').directive('stratus' + _.ucfirst(name), directive);
                });

                // Filters
                _.each(Stratus.Filters, function (filter, name) {
                    angular.module('stratusApp').filter(_.lcfirst(name), filter);
                });

                // Controllers
                _.each(Stratus.Controllers, function (controller, name) {
                    angular.module('stratusApp').controller(name, controller);
                });

                // Load CSS
                // TODO: Make Dynamic
                var css = [];
                var cssLoaded = Stratus.Select('link[satisfies]').map(function (node) {
                    return node.getAttribute('satisfies');
                });
                if (!_.contains(cssLoaded, 'angular-material.css')) {
                    css.push(
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/angular-material/angular-material' + (Stratus.Environment.get('production') ? '.min' : '') + '.css'
                    );
                }
                /**
                if (Stratus.Select('stratus-help').length) {
                    css.push(Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/font-awesome/css/font-awesome.min.css');
                }
                /**/
                if (Stratus.Select('[froala]').length || Stratus.Select('[stratus-froala]').length) {
                    [
                        Stratus.BaseUrl + 'sitetheorycore/css/sitetheory.codemirror.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/codemirror/lib/codemirror.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/froala_editor.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/froala_style.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/code_view.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/draggable.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/file.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/fullscreen.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/help.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/image.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/image_manager.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/quick_insert.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/special_characters.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/table.min.css',
                        Stratus.BaseUrl + 'sitetheorystratus/stratus/bower_components/froala-wysiwyg-editor/css/plugins/video.min.css'
                    ].forEach(function (stylesheet) {
                        css.push(stylesheet);
                    });
                }

                if (css.length) {
                    var counter = 0;
                    _.each(css, function (url) {
                        Stratus.Internals.CssLoader(url).then(function () {
                            /**
                            if (++counter === css.length) {
                                angular.bootstrap(document.querySelector('html'), ['stratusApp']);
                            }
                            /**/
                        });
                    });
                } /** else {
                    angular.bootstrap(document.querySelector('html'), ['stratusApp']);
                }
                /**/
                angular.bootstrap(document.querySelector('html'), ['stratusApp']);
            });
        }
    };

    // Internal View Loader
    // ----------------------

    // This will hydrate every entity data attribute into a model or
    // collection either by reference or instantiation and attach said
    // 'scope' to a view instance.
    /**
     * Events:
     *
     * Editable
     * Manipulate
     * Container Overlay (View)
     * Container Inlay (View)
     *
     * @param selector
     * @param view
     * @param requirements
     * @returns {Promise}
     * @constructor
     */
    Stratus.Internals.Loader = function (selector, view, requirements) {
        if (typeof selector === 'undefined') {
            var body = Stratus.Select('body');
            selector = !body.attr('data-loaded') ? '[data-entity],[data-plugin]' : null;
            if (selector) {
                body.attr('data-loaded', true);
            } else {
                console.warn('Attempting to load Stratus root repeatedly!');
            }
        }
        /*
         if (typeof selector === 'string') selector = $(selector);
         if (view && selector) selector.find('[data-type],[data-plugin]');
         */
        /* We check view, selector, and type in this order to save a small amount of power */
        if (selector) {
            selector = (view && selector && typeof selector === 'object') ? Stratus.Select(selector).find('[data-type],[data-plugin]') : Stratus.Select(selector);
        }
        return new Promise(function (resolve, reject) {
            var entries = {
                total: (selector && typeof selector === 'object') ? selector.length : 0,
                iteration: 0,
                views: {}
            };
            if (entries.total > 0) {
                selector.each(function (el, index, list) {
                    entries.iteration++;
                    var entry = _.uniqueId('entry_');
                    entries.views[entry] = false;
                    Stratus.Internals.ViewLoader(el, view, requirements).then(function (view) {
                        entries.views[entry] = view;
                        if (entries.total === entries.iteration && _.allTrue(entries.views)) {
                            resolve(entries);
                        }
                    }, reject);
                });
            } else {
                resolve(entries);
            }
        });
    };

    // This function creates and hydrates a view from the DOM,
    // then either references or creates a Model or Collection
    // instance (if present), then, upon View instantiation, calls
    // the Internal Loader on that element to build the nested
    // view tree.
    /**
     * @param el
     * @param view
     * @param requirements
     * @returns {Promise}
     * @constructor
     */
    Stratus.Internals.ViewLoader = function (el, view, requirements) {
        var parentView = (view) ? view : null;
        var parentChild = false;

        var element = Stratus.Select(el);
        view = new Stratus.Internals.View();
        view.set('el', element);
        view.hydrate();
        if (parentView) {
            if (!view.has('entity')) {
                view.set(parentView.nest());
            } else {
                parentChild = true;
            }
        }
        view.clean();

        if (!parentChild) {

            // TODO: Add Previous Requirements Here!
            if (typeof requirements === 'undefined') requirements = ['stratus'];
            var template = view.get('template');
            var templates = view.get('templates');
            var dialogue = view.get('dialogue');
            var templateMap = [];

            // Add Scope
            if (view.get('scope') !== null) {
                requirements.push('stratus.' + view.get('scope') + 's.generic');
            }

            // Handle Alias or External Link
            if (view.get('alias') && _.has(requirejs.s.contexts._.config.paths, view.get('alias'))) {
                requirements.push(view.get('alias'));
            } else if (view.get('path')) {
                requirements.push(view.get('path'));
                var srcRegex = /(?=[^\/]*$)([a-zA-Z]+)/i;
                var srcMatch = srcRegex.exec(view.get('path'));
                view.set('type', _.ucfirst(srcMatch[1]));
            } else {
                view.set({
                    type: null,
                    alias: null,
                    path: null
                });
            }

            // Aggregate Template
            if (template !== null) {
                templates = _.extend((templates !== null) ? templates : {}, { combined: template });
            }

            // Aggregate Dialogue
            if (dialogue !== null) {
                templates = _.extend((templates !== null) ? templates : {}, { dialogue: dialogue });
            }

            // Gather All Templates
            if (templates !== null) {
                for (var key in templates) {
                    if (!templates.hasOwnProperty(key) || typeof templates[key] === 'function') continue;
                    if (templates[key].indexOf('#') === 0) {
                        var $domTemplate = $(templates[key]);
                        if ($domTemplate.length > 0) {
                            templates[key] = $domTemplate.html();
                        }
                    } else if (templates[key] in requirejs.s.contexts._.config.paths) {
                        requirements.push('text!' + templates[key]);
                        templateMap.push(key);
                    } else {
                        requirements.push('text!' + templates[key]);
                        templateMap.push(key);
                    }
                }
                view.set('templates', templates);
                templates = view.get('templates');
            }
        }

        return new Promise(function (resolve, reject) {
            if (view.get('guid')) {
                if (!Stratus.Environment.get('production')) console.warn('View hydration halted on', view.get('guid'), 'due to repeat calls on the same element.', view.toObject());
                resolve(true);
                return true;
            }
            if (parentChild) {
                /* if (!Stratus.Environment.get('production')) console.warn('Parent Child Detected:', view.toObject()); */
                resolve(true);
                return true;
            }
            require(requirements, function (Stratus) {
                if (!Stratus.Environment.get('production') && Stratus.Environment.get('nestDebug')) console.group('Stratus View');
                var hydrationKey = 0;
                if (templates && templateMap.length > 0) {
                    for (var i = 0; i < arguments.length; i++) {
                        if (typeof arguments[i] === 'string') {
                            if (arguments[i].indexOf('<html') === -1) {
                                templates[templateMap[hydrationKey]] = arguments[i];
                            } else {
                                console.error('Template', templates[templateMap[hydrationKey]], 'failed to load.');
                            }
                            hydrationKey++;
                        }
                    }
                }

                /* Refresh Template HTML on View */
                view.set('templates', templates);
                templates = view.get('templates');

                var subRequirements = [];

                /* Handle Custom Templates */
                if (_.size(templates) > 0) {
                    var re = /<.+?data-type=["|'](.+?)["|'].*>/gi;

                    /* Hydrate Underscore Templates */
                    _.each(templates, function (value, key) {
                        if (typeof value === 'string') {
                            if (value.search(re) !== -1) {
                                var match = re.exec(value);
                                while (match !== null) {
                                    var subRequirement = 'stratus.views.' + (view.get('plugin') ? 'plugins' : 'widgets') + '.' + match[1].toLowerCase();
                                    if (subRequirement && !_.has(requirejs.s.contexts._.config.paths, subRequirement)) {
                                        if (!Stratus.Environment.get('production')) console.warn('Sub Type:', subRequirement, 'not configured in require.js');
                                    }
                                    subRequirements.push(subRequirement);
                                    match = re.exec(value);
                                }
                            }
                            templates[key] = _.template(value);
                        }
                    });

                    /* Refresh Template Functions on View */
                    view.set('templates', templates);
                    templates = view.get('templates');
                }

                // Gather subRequirements
                if (view.get('plugins').length) {
                    _.each(view.get('plugins'), function (plugin) {
                        subRequirements.push('stratus.views.plugins.' + plugin.toLowerCase());
                    });
                }

                // Detect Loader Types
                var loaderTypes = [];
                if (view.get('plugin') !== null) loaderTypes.push('PluginLoader');
                if (view.get('type') !== null) loaderTypes.push('WidgetLoader');

                // Set Default Path
                if (!loaderTypes.length) loaderTypes.push('WidgetLoader');

                // Start Loader for each type detected
                _.each(loaderTypes, function (loaderType) {
                    /* If subRequirements are detected in Custom Template, load their types before the View is instantiated. */
                    if (_.size(subRequirements) === 0) {
                        Stratus.Internals[loaderType](resolve, reject, view, requirements);
                    } else {
                        requirements = _.union(requirements, subRequirements);
                        new Promise(function (resolve, reject) {
                            require(requirements, function (Stratus) {
                                Stratus.Internals[loaderType](resolve, reject, view, requirements);
                            });
                        }).then(resolve, reject);
                    }
                });
            });
        });
    };

    // Load Widgets
    /**
     * @param resolve
     * @param reject
     * @param view
     * @param requirements
     * @constructor
     */
    Stratus.Internals.WidgetLoader = function (resolve, reject, view, requirements) {
        /* TODO: In the a model scope, we are more likely to want a collection of the View to create the original reference, since it will be able to determine the model's relational data at runtime */
        if (view.get('scope') === 'model') {
            if (!Stratus.Models.has(view.get('entity'))) {
                /* TODO: Add Relations */
                Stratus.Models.set(view.get('entity'), Stratus.Models.Generic.extend({}));
            }

            var modelReference;
            var modelInstance;
            var modelInit = false;
            var ModelType = Stratus.Models.has(view.get('entity')) ? Stratus.Models.get(view.get('entity')) : null;

            if (!view.get('id') && view.get('manifest')) {
                modelInstance = view.get('entity') + 'Manifest';
                modelReference = Stratus.Instances[modelInstance];
                if (!modelReference) {
                    Stratus.Instances[modelInstance] = new ModelType();
                    modelReference = Stratus.Instances[modelInstance];
                    modelInit = true;
                }
            } else {
                if (ModelType && _.has(ModelType, 'findOrCreate')) {
                    modelReference = ModelType.findOrCreate(view.get('id'));
                    if (!modelReference) {
                        modelReference = new ModelType(view.modelAttributes());
                        modelInit = true;
                    }
                } else {
                    modelInstance = view.get('entity') + view.get('id');
                    modelReference = Stratus.Instances[modelInstance];
                    if (!modelReference) {
                        Stratus.Instances[modelInstance] = new ModelType(view.modelAttributes());
                        modelReference = Stratus.Instances[modelInstance];
                        modelInit = true;
                    }
                }
            }

            if (modelInit) {
                modelReference.safeInitialize(view.toObject());
            }
            view.set({ model: modelReference });
        } else if (view.get('scope') === 'collection') {
            // Create reference, if not defined
            if (!Stratus.Collections.has(view.get('entity'))) {
                Stratus.Collections.set(view.get('entity'), new Stratus.Collections.Generic(view.toObject()));

                // TODO: Inject prototype into Dynamic, Event-Controlled Namespace
                /*
                 Stratus.Collections.set(view.get('entity'), Stratus.Collections.Generic);
                 */
            }

            var collectionReference = Stratus.Collections.get(view.get('entity'));

            // Run initialization when the correct settings are present
            if (!collectionReference.initialized && view.get('fetch')) {
                collectionReference.safeInitialize(view.toObject());
            }

            // Set collection reference
            view.set({ collection: collectionReference });
        }

        if (view.get('type') !== null) {
            var type = _.ucfirst(view.get('type'));
            if (typeof Stratus.Views.Widgets[type] !== 'undefined') {
                // if (!Stratus.Environment.get('production')) console.info('View:', view.toObject());
                var options = view.toObject();
                options.view = view;
                Stratus.Instances[view.get('uid')] = new Stratus.Views.Widgets[type](options);
                Stratus.Instances[view.get('uid')].$el.attr('data-guid', view.get('uid'));
                if (_.has(Stratus.Instances[view.get('uid')], 'promise')) {
                    Stratus.Instances[view.get('uid')].initializer.then(resolve, reject);
                } else {
                    resolve(Stratus.Instances[view.get('uid')]);
                }
            } else {
                if (!Stratus.Environment.get('production')) console.warn('Stratus.Views.Widgets.' + type + ' is not correctly configured.');
                reject(new Stratus.Prototypes.Error({
                    code: 'WidgetLoader',
                    message: 'Stratus.Views.Widgets.' + type + ' is not correctly configured.'
                }, view.toObject()));
            }
            if (!Stratus.Environment.get('production') && Stratus.Environment.get('nestDebug')) console.groupEnd();
        } else {
            var nest = view.get('el').find('[data-type],[data-plugin]');
            if (nest.length > 0) {
                Stratus.Internals.Loader(view.get('el'), view, requirements).then(function (resolution) {
                    if (!Stratus.Environment.get('production') && Stratus.Environment.get('nestDebug')) console.groupEnd();
                    resolve(resolution);
                }, function (rejection) {
                    if (!Stratus.Environment.get('production') && Stratus.Environment.get('nestDebug')) console.groupEnd();
                    reject(new Stratus.Prototypes.Error(rejection, nest));
                });
            } else {
                if (!Stratus.Environment.get('production') && Stratus.Environment.get('nestDebug')) {
                    console.warn('No Innate or Nested Type Found:', view.toObject());
                    resolve(view.toObject());
                    console.groupEnd();
                } else {
                    resolve(view.toObject());
                }
            }
        }
    };

    // Load Plugins Like we Load Views
    /**
     * @param resolve
     * @param reject
     * @param view
     * @param requirements
     * @constructor
     */
    Stratus.Internals.PluginLoader = function (resolve, reject, view, requirements) {
        var types = _.union([view.get('plugin')], view.get('plugins'));
        _.each(types, function (type) {
            type = _.ucfirst(type);
            if (typeof Stratus.Views.Plugins[type] !== 'undefined') {
                var options = view.toObject();
                options.view = view;
                Stratus.Instances[view.get('uid')] = new Stratus.Views.Plugins[type](options);
                Stratus.Instances[view.get('uid')].$el.attr('data-guid', view.get('uid'));
                if (_.has(Stratus.Instances[view.get('uid')], 'promise')) {
                    Stratus.Instances[view.get('uid')].initializer.then(resolve, reject);
                } else {
                    resolve(Stratus.Instances[view.get('uid')]);
                }
            } else {
                if (!Stratus.Environment.get('production')) console.warn('Stratus.Views.Plugins.' + type + ' is not correctly configured.');
                reject(new Stratus.Prototypes.Error({
                    code: 'PluginLoader',
                    message: 'Stratus.Views.Plugins.' + type + ' is not correctly configured.'
                }, view.toObject()));
            }
        });
    };

    // Internal URL Handling
    // ---------------------

    // This function digests URLs into an object containing their respective
    // values, which will be merged with requested parameters and formulated
    // into a new URL. TODO: Move this into underscore as a mixin.
    /**
     * @param params
     * @param url
     * @returns {string|*}
     * @constructor
     */
    Stratus.Internals.SetUrlParams = function (params, url) {
        if (typeof url === 'undefined') url = window.location.href;
        if (typeof $ === 'function' && $.fn) {
            console.error('jQuery is not defined.');
            return url;
        }
        var vars = {};
        var glue = url.indexOf('?');
        url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
            vars[key] = value;
        });
        vars = _.extend(vars, params);
        url = (glue >= 0) ? url.substring(0, glue) : url;
        url += '?' + $.param(vars);
        return url;
    };

    // Update Environment
    // ------------------

    // This function requires more details.
    /**
     * @param request
     * @returns {boolean}
     * @constructor
     */
    Stratus.Internals.UpdateEnvironment = function (request) {
        if (!request) request = {};
        if (typeof document.cookie !== 'string' || !_.cookie('SITETHEORY')) return false;
        if (typeof request === 'object' && Object.keys(request).length) {
            // TODO: Create a better URL, switching between relative APIs based on environment
            Stratus.Internals.Ajax({
                method: 'PUT',
                url: '/Api/Session',
                data: request,
                type: 'application/json',
                success: function (response) {
                    var settings = response.payload || response;
                    if (typeof settings === 'object') {
                        _.each(Object.keys(settings), function (key) {
                            Stratus.Environment.set(key, settings[key]);
                        });
                    }
                },
                error: function (error) {
                    console.error('error:', error);
                }
            });
        }
    };

    // Track Location
    // --------------

    // This function requires more details.
    /**
     * @constructor
     */
    Stratus.Internals.TrackLocation = function () {
        var envData = {};
        if (!Stratus.Environment.has('timezone') || true) {
            envData.timezone = new Date().toString().match(/\((.*)\)/)[1];
        }
        if (Stratus.Environment.get('trackLocation')) {
            if (Stratus.Environment.get('trackLocationConsent')) {
                Stratus.Internals.Location().then(function (pos) {
                    envData.lat = pos.coords.latitude;
                    envData.lng = pos.coords.longitude;
                    Stratus.Environment.set('lat', pos.coords.latitude);
                    Stratus.Environment.set('lng', pos.coords.longitude);
                    Stratus.Internals.UpdateEnvironment(envData);
                }, function (error) {
                    console.error('Stratus Location:', error);
                });
            } else {
                Stratus.Internals.Ajax({
                    url: 'https://ipapi.co/' + Stratus.Environment.get('ip') + '/json/',
                    success: function (data) {
                        if (!data) data = {};
                        if (typeof data === 'object' && Object.keys(data).length && data.postal) {
                            envData.postalCode = data.postal;
                            envData.lat = data.latitude;
                            envData.lng = data.longitude;
                            envData.city = data.city;
                            envData.region = data.region;
                            envData.country = data.country;
                            Stratus.Internals.UpdateEnvironment(envData);
                        }
                    }
                });
            }
        } else {
            Stratus.Internals.UpdateEnvironment(envData);
        }
    };

    // Post Message Handling
    // ---------------------

    // This function executes when the window receives a Post Message
    // Convoy from another source as a (i.e. Window, iFrame, etc.)
    /**
     * @param fn
     * @constructor
     */
    Stratus.PostMessage.Convoy = function (fn) {
        window.addEventListener('message', function () {
            if (event.origin !== 'https://auth.sitetheory.io') return false;
            fn(_.isJSON(event.data) ? JSON.parse(event.data) : {});
        }, false);
    };

    // When a message arrives from another source, handle the Convoy
    // appropriately.
    Stratus.PostMessage.Convoy(function (convoy) {
        var ssoEnabled = _.cookie('sso');
        ssoEnabled = (ssoEnabled === null) ? true : (_.isJSON(ssoEnabled) ? JSON.parse(ssoEnabled) : false);
        if (convoy.meta.session && convoy.meta.session !== _.cookie('SITETHEORY') && ssoEnabled) {
            _.cookie('SITETHEORY', convoy.meta.session, { expires: 365, path: '/' });
            if (!Stratus.Client.safari) location.reload(true);
        }
    });

    // DOM Listeners
    // -------------

    // This function executes when the DOM is Ready, which means
    // the DOM is fully parsed, but still loading sub-resources
    // (CSS, Images, Frames, etc).
    /**
     * @param fn
     */
    Stratus.DOM.ready = function (fn) {
        (document.readyState !== 'loading') ? fn() : document.addEventListener('DOMContentLoaded', fn);
    };

    // This function executes when the DOM is Complete, which means
    // the DOM is fully parsed and all resources are rendered.
    /**
     * @param fn
     */
    Stratus.DOM.complete = function (fn) {
        (document.readyState === 'complete') ? fn() : window.addEventListener('load', fn);
    };

    // This function executes before the DOM has completely Unloaded,
    // which means the window/tab has been closed or the user has
    // navigated from the current page.
    /**
     * @param fn
     */
    Stratus.DOM.unload = function (fn) {
        window.addEventListener('beforeunload', fn);
    };

    // Key Maps
    // --------

    // These constants intend to map keys for most browsers.
    Stratus.Key.Enter = 13;
    Stratus.Key.Escape = 27;

    // Stratus Layer Events
    // --------------------

    // When these events are triggered, all functions attached to the event name
    // will execute in order of initial creation.  This becomes supremely useful
    // when adding to the Initialization and Exit Routines as AMD Modules, views
    // and custom script(s) progressively add Objects within the Stratus Layer.

    Stratus.Events.on('initialize', function () {
        if (!Stratus.Environment.get('production')) {
            console.groupEnd();
            console.group('Stratus Initialize');
        }
        Stratus.Internals.LoadEnvironment();
        Stratus.Internals.Compatibility();
        Stratus.RegisterGroup = new Stratus.Prototypes.Model();

        /* FIXME: This breaks outside of Sitetheory *
        // Start Generic Router
        require(['stratus.routers.generic'], function () {
            Stratus.Routers.set('generic', new Stratus.Routers.Generic());
            Stratus.Instances[_.uniqueId('router.generic_')] = Stratus.Routers.get('generic');
        });
        /**/

        // Handle Location
        Stratus.Internals.TrackLocation();

        // Load Angular
        Stratus.Internals.AngularLoader();

        // Load Views
        Stratus.Internals.Loader().then(function (views) {
            if (!Stratus.Environment.get('production')) console.info('Views:', views);
            window.views = views;
            Stratus.Events.on('finalize', function (views) {
                if (typeof Backbone !== 'undefined' && !Backbone.History.started) {
                    Backbone.history.start();
                }
                Stratus.Events.trigger('finalized', views);
            });
            Stratus.Events.trigger('finalize', views);
        }, function (error) {
            console.error('Stratus Loader:', error);
        });

    });
    Stratus.Events.on('finalize', function () {
        if (!Stratus.Environment.get('production')) {
            console.groupEnd();
            console.group('Stratus Finalize');
        }

        // Load Internals after Widgets and Plugins
        if (typeof Backbone === 'object') {
            if (Stratus.Internals.Anchor.initialize) {
                Stratus.Internals.Anchor = Stratus.Internals.Anchor();
            }
            new Stratus.Internals.Anchor();
        }

        // Call Any Registered Group Methods that plugins might use, e.g. OnScroll
        if (Stratus.RegisterGroup.size()) {
            Stratus.RegisterGroup.each(function (objs, key) {
                // for each different type of registered plugin, pass all the registered elements
                if (_.has(Stratus.Internals, key)) {
                    Stratus.Internals[key](objs);
                }
            });
        }
    });
    Stratus.Events.on('terminate', function () {
        if (!Stratus.Environment.get('production')) {
            console.groupEnd();
            console.group('Stratus Terminate');
        }
    });

    // This is the prototype for a bootbox event, in which one could be
    // supplied for any bootbox message (i.e. confirm or delete), or one
    // will automatically be created at runtime using current arguments.
    /**
     * @param message
     * @param handler
     * @constructor
     */
    Stratus.Prototypes.Bootbox = function (message, handler) {
        if (message && typeof message === 'object') {
            _.extend(this, message);
            this.message = this.message || 'Message';
        } else {
            this.message = message || 'Message';
        }
        this.handler = this.handler || handler;
        if (typeof this.handler !== 'function') {
            this.handler = function (result) {
                console.info('Client ' + (result === undefined ? 'closed' : (result ? 'confirmed' : 'cancelled')) + ' dialog.');
            };
        }
    };

    // This event supports both Native and Bootbox styling to generate
    // an alert box with an optional message and handler callback.
    Stratus.Events.on('alert', function (message, handler) {
        if (!(message instanceof Stratus.Prototypes.Bootbox)) {
            message = new Stratus.Prototypes.Bootbox(message, handler);
        }
        /*if (typeof jQuery !== 'undefined' && typeof $().modal === 'function' && typeof bootbox !== 'undefined') {*/
        if (typeof bootbox !== 'undefined') {
            bootbox.alert(message.message, message.handler);
        } else {
            alert(message.message);
            message.handler();
        }
    });

    // This event supports both Native and Bootbox styling to generate
    // a confirmation box with an optional message and handler callback.
    Stratus.Events.on('confirm', function (message, handler) {
        if (!(message instanceof Stratus.Prototypes.Bootbox)) {
            message = new Stratus.Prototypes.Bootbox(message, handler);
        }
        /*if (typeof jQuery !== 'undefined' && typeof $().modal === 'function' && typeof bootbox !== 'undefined') {*/
        if (typeof bootbox !== 'undefined') {
            bootbox.confirm(message.message, message.handler);
        } else {
            handler(confirm(message.message));
        }
    });

    // This is the prototype for the toaster, in which one could be supplied
    // for a toast message, or one will automatically be created at runtime
    // using current arguments.
    /**
     * @param message
     * @param title
     * @param priority
     * @param settings
     * @constructor
     */
    Stratus.Prototypes.Toast = function (message, title, priority, settings) {
        if (message && typeof message === 'object') {
            _.extend(this, message);
            this.message = this.message || 'Message';
        } else {
            this.message = message || 'Message';
        }
        this.title = this.title || title || 'Toast';
        this.priority = this.priority || priority || 'danger';
        this.settings = this.settings || settings;
        if (!this.settings || typeof this.settings !== 'object') {
            this.settings = {};
        }
        this.settings.timeout = this.settings.timeout || 10000;
    };

    // This event only supports Toaster styling to generate a message
    // with either a Bootbox or Native Alert as a fallback, respectively.
    Stratus.Events.on('toast', function (message, title, priority, settings) {
        if (!(message instanceof Stratus.Prototypes.Toast)) {
            message = new Stratus.Prototypes.Toast(message, title, priority, settings);
        }
        /*if (typeof jQuery !== 'undefined' && typeof $().modal === 'function' && typeof bootbox !== 'undefined') {*/
        if (typeof $ !== 'undefined' && $.toaster) {
            $.toaster(message);
        } else {
            Stratus.Events.trigger('alert', message.message);
        }
    });

    // DOM Ready Routines
    // ------------------
    // On DOM Ready, add browser compatible CSS classes and digest DOM data-entity attributes.
    Stratus.DOM.ready(function () {
        Stratus.Select('body').removeClass('loaded unloaded').addClass('loading');
        Stratus.Events.trigger('initialize');
    });

    // DOM Complete Routines
    // ---------------------

    // Stratus Events are more accurate than the DOM, so nothing is added to this stub.
    Stratus.DOM.complete(function () {
        Stratus.Select('body').removeClass('loading unloaded').addClass('loaded');
    });

    // DOM Unload Routines
    // -------------------

    // On DOM Unload, all inherent Stratus functions will cleanly
    // break any open connections or currently operating routines,
    // while providing the user with a confirmation box, if necessary,
    // before close routines are triggered.
    Stratus.DOM.unload(function (event) {
        Stratus.Select('body').removeClass('loading loaded').addClass('unloaded');
        Stratus.Events.trigger('terminate', event);
        /* *
        if (event.cancelable === true) {
            // TODO: Check if any unsaved changes exist on any Stratus Models then request confirmation of navigation
            event.preventDefault();
            var confirmationMessage = 'You have pending changes, if you leave now, they may not be saved.';
            (event || window.event).returnValue = confirmationMessage;
            return confirmationMessage;
        }
        /* */
    });

    // Handle Scope
    // ------------

    // Return the Stratus Object so it can be attached in the correct context as either a Global Variable or Object Reference
    return Stratus;

}));
