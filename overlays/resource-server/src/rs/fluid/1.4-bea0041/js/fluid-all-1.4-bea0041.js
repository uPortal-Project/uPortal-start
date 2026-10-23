/*!
 * Fluid Infusion v1.3
 *
 * Infusion is distributed under the Educational Community License 2.0 and new BSD licenses: 
 * http://wiki.fluidproject.org/display/fluid/Fluid+Licensing
 *
 * For information on copyright, see the individual Infusion source code files: 
 * https://source.fluidproject.org/svn/fluid/infusion/
 */

/*
Copyright 2007-2010 University of Cambridge
Copyright 2007-2009 University of Toronto
Copyright 2007-2009 University of California, Berkeley
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global console, window, fluid:true, fluid_1_4:true, jQuery, opera, YAHOO*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};
var fluid = fluid || fluid_1_4;

(function ($, fluid) {
    
    fluid.version = "Infusion 1.3";
    
    fluid.environment = {
        fluid: fluid
    };
    var globalObject = window || {};
    
    var softFailure = [false];
    
    /**
     * Causes an error message to be logged to the console and a real runtime error to be thrown.
     * 
     * @param {String|Error} message the error message to log
     */
    fluid.fail = function (message) {
        fluid.setLogging(true);
        fluid.log(message.message ? message.message : message);
        if (softFailure[0]) {
            throw new Error(message);
        } else {
            message.fail(); // Intentionally cause a browser error by invoking a nonexistent function.
        }
    };
    
    fluid.pushSoftFailure = function (condition) {
        if (typeof (condition) === "boolean") {
            softFailure.unshift(condition);
        } else if (condition === -1) {
            softFailure.shift();
        }
    };
    
    // TODO: rescued from kettleCouchDB.js - clean up in time
    fluid.expect = function (name, members, target) {
        fluid.transform($.makeArray(members), function (key) {
            if (typeof target[key] === "undefined") {
                fluid.fail(name + " missing required parameter " + key);
            }
        });
    };

    // Logging
        
    /** Returns whether logging is enabled **/
    fluid.isLogging = function() {
        return logging;
    };

    var logging;
    /** method to allow user to enable logging (off by default) */
    fluid.setLogging = function (enabled) {
        if (typeof enabled === "boolean") {
            logging = enabled;
        } else {
            logging = false;
        }
    };

    /** Log a message to a suitable environmental console. If the standard "console" 
     * stream is available, the message will be sent there - otherwise either the
     * YAHOO logger or the Opera "postError" stream will be used. Logging must first
     * be enabled with a call fo the fluid.setLogging(true) function.
     */
    fluid.log = function (str) {
        if (logging) {
            str = fluid.renderTimestamp(new Date()) + ":  " + str;
            if (typeof (console) !== "undefined") {
                if (console.debug) {
                    console.debug(str);
                } else {
                    console.log(str);
                }
            } else if (typeof (YAHOO) !== "undefined") {
                YAHOO.log(str);
            } else if (typeof (opera) !== "undefined") {
                opera.postError(str);
            }
        }
    };
    
    /**
     * Wraps an object in a jQuery if it isn't already one. This function is useful since
     * it ensures to wrap a null or otherwise falsy argument to itself, rather than the
     * often unhelpful jQuery default of returning the overall document node.
     * 
     * @param {Object} obj the object to wrap in a jQuery
     */
    fluid.wrap = function (obj) {
        return ((!obj || obj.jquery) ? obj : $(obj)); 
    };
    
    /**
     * If obj is a jQuery, this function will return the first DOM element within it.
     * 
     * @param {jQuery} obj the jQuery instance to unwrap into a pure DOM element
     */
    fluid.unwrap = function (obj) {
        return obj && obj.jquery && obj.length === 1 ? obj[0] : obj; // Unwrap the element if it's a jQuery.
    };
    
    // Functional programming utilities.
            
    /** Return an empty container as the same type as the argument (either an
     * array or hash */
    fluid.freshContainer = function (tocopy) {
        return fluid.isArrayable(tocopy) ? [] : {};   
    };
    
    /** Performs a deep copy (clone) of its argument **/
    
    fluid.copy = function (tocopy) {
        if (fluid.isPrimitive(tocopy)) {
            return tocopy;
        }
        return $.extend(true, fluid.freshContainer(tocopy), tocopy);
    };
    
    /** A basic utility that returns its argument unchanged */
    
    fluid.identity = function (arg) {
        return arg;
    };
    
    // Framework and instantiation functions.

    
    /** Returns true if the argument is a value other than null or undefined **/
    fluid.isValue = function (value) {
        return value !== undefined && value !== null;
    };
    
    /** Returns true if the argument is a primitive type **/
    fluid.isPrimitive = function (value) {
        var valueType = typeof (value);
        return !value || valueType === "string" || valueType === "boolean" || valueType === "number" || valueType === "function";
    };
    
    fluid.isDOMNode = function (obj) {
      // This could be more sound, but messy: 
      // http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
        return obj && typeof (obj.nodeType) === "number";  
    };
    
    /** Determines whether the supplied object can be treated as an array, by 
     * iterating an index towards its length. The test functions by detecting
     * a property named "length" which is of type "number", but excluding objects
     * which are themselves of primitive types (in particular functions and strings)
     */
    fluid.isArrayable = function (totest) {
        return totest && !fluid.isPrimitive(totest) && typeof (totest.length) === "number";
    };
    
            
    /** Corrected version of jQuery makeArray that returns an empty array on undefined rather than crashing **/
    fluid.makeArray = function (arg) {
        if (arg === null || arg === undefined) {
            return [];
        } else {
            return $.makeArray(arg);
        }
    };
    
    function transformInternal(source, togo, key, args) {
        var transit = source[key];
        for (var j = 0; j < args.length - 1; ++j) {
            transit = args[j + 1](transit, key);
        }
        togo[key] = transit; 
    }
    
    /** Return a list or hash of objects, transformed by one or more functions. Similar to
     * jQuery.map, only will accept an arbitrary list of transformation functions and also
     * works on non-arrays.
     * @param source {Array or Object} The initial container of objects to be transformed.
     * @param fn1, fn2, etc. {Function} An arbitrary number of optional further arguments,
     * all of type Function, accepting the signature (object, index), where object is the
     * list member to be transformed, and index is its list index. Each function will be
     * applied in turn to each list member, which will be replaced by the return value
     * from the function.
     * @return The finally transformed list, where each member has been replaced by the
     * original member acted on by the function or functions.
     */
    fluid.transform = function (source) {
        var togo = fluid.freshContainer(source);
        if (fluid.isArrayable(source)) {
            for (var i = 0; i < source.length; ++i) {
                transformInternal(source, togo, i, arguments);
            }
        } else {
            for (var key in source) {
                transformInternal(source, togo, key, arguments);
            }
        }  
        return togo;
    };
    
    /** Better jQuery.each which works on hashes as well as having the arguments
     * the right way round. 
     * @param source {Arrayable or Object} The container to be iterated over
     * @param func {Function} A function accepting (value, key) for each iterated
     * object. This function may return a value to terminate the iteration
     */
    fluid.each = function (source, func) {
        if (fluid.isArrayable(source)) {
            for (var i = 0; i < source.length; ++i) {
                func(source[i], i);
            }
        } else {
            for (var key in source) {
                func(source[key], key);
            }
        }
    };
    
    /** Scan through a list or hash of objects, terminating on the first member which
     * matches a predicate function.
     * @param source {Arrayable or Object} The list or hash of objects to be searched.
     * @param func {Function} A predicate function, acting on a member. A predicate which
     * returns any value which is not <code>undefined</code> will terminate
     * the search. The function accepts (object, index).
     * @param deflt {Object} A value to be returned in the case no predicate function matches
     * a list member. The default will be the natural value of <code>undefined</code>
     * @return The first return value from the predicate function which is not <code>undefined</code>
     */
    fluid.find = function (source, func, deflt) {
        var disp;
        if (fluid.isArrayable(source)) {
            for (var i = 0; i < source.length; ++i) {
                disp = func(source[i], i);
                if (disp !== undefined) {
                    return disp;
                }
            }
        } else {
            for (var key in source) {
                disp = func(source[key], key);
                if (disp !== undefined) {
                    return disp;
                }
            }
        }
        return deflt;
    };
    
    /** Scan through a list of objects, "accumulating" a value over them 
     * (may be a straightforward "sum" or some other chained computation).
     * @param list {Array} The list of objects to be accumulated over.
     * @param fn {Function} An "accumulation function" accepting the signature (object, total, index) where
     * object is the list member, total is the "running total" object (which is the return value from the previous function),
     * and index is the index number.
     * @param arg {Object} The initial value for the "running total" object.
     * @return {Object} the final running total object as returned from the final invocation of the function on the last list member.
     */
    fluid.accumulate = function (list, fn, arg) {
        for (var i = 0; i < list.length; ++i) {
            arg = fn(list[i], arg, i);
        }
        return arg;
    };
    
    /** Can through a list of objects, removing those which match a predicate. Similar to
     * jQuery.grep, only acts on the list in-place by removal, rather than by creating
     * a new list by inclusion.
     * @param source {Array|Object} The list of objects to be scanned over.
     * @param fn {Function} A predicate function determining whether an element should be
     * removed. This accepts the standard signature (object, index) and returns a "truthy"
     * result in order to determine that the supplied object should be removed from the list.
     * @return The list, transformed by the operation of removing the matched elements. The
     * supplied list is modified by this operation.
     */
    fluid.remove_if = function (source, fn) {
        if (fluid.isArrayable(source)) {
            for (var i = 0; i < source.length; ++i) {
                if (fn(source[i], i)) {
                    source.splice(i, 1);
                    --i;
                }
            }
        } else {
            for (var key in source) {
                if (fn(source[key], key)) {
                    delete source[key];
                }
            }
        }
        return source;
    };
    
    /** Accepts an object to be filtered, and a list of keys. Either all keys not present in
     * the list are removed, or only keys present in the list are returned.
     * @param toFilter {Array|Object} The object to be filtered - this will be modified by the operation
     * @param keys {Array of String} The list of keys to operate with
     * @param exclude {boolean} If <code>true</code>, the keys listed are removed rather than included
     * @return the filtered object (the same object that was supplied as <code>toFilter</code>
     */
    
    fluid.filterKeys = function (toFilter, keys, exclude) {
        return fluid.remove_if($.extend({}, toFilter), function (value, key) {
            return exclude ^ ($.inArray(key, keys) === -1);
        });
    };
    
    /** A convenience wrapper for <code>fluid.filterKeys</code> with the parameter <code>exclude</code> set to <code>true</code>
     *  Returns the supplied object with listed keys removed */

    fluid.censorKeys = function (toCensor, keys) {
        return fluid.filterKeys(toCensor, keys, true);
    };
    
    /** Return the keys in the supplied object as an array **/
    fluid.keys = function (obj) {
        var togo = [];
        fluid.each(obj, function(value, key) {
            togo.push(key);
        });
        return togo;
    };
    
    /** 
     * Searches through the supplied object, and returns <code>true</code> if the supplied value
     * can be found 
     */
    fluid.contains = function(obj, value) {
        return obj? fluid.find(obj, function (thisValue, key) {
            if (value === thisValue) {
                return true;
            }
        }): undefined;
    };
    
    /** 
     * Searches through the supplied object for the first value which matches the one supplied.
     * @param obj {Object} the Object to be searched through
     * @param value {Object} the value to be found. This will be compared against the object's
     * member using === equality.
     * @return {String} The first key whose value matches the one supplied, or <code>null</code> if no
     * such key is found.
     */
    fluid.keyForValue = function (obj, value) {
        return fluid.find(obj, function (thisValue, key) {
            if (value === thisValue) {
                return key;
            }
        });
    };
    
    /**
     * This method is now deprecated and will be removed in a future release of Infusion. 
     * See fluid.keyForValue instead.
     */
    fluid.findKeyInObject = fluid.keyForValue;
    
    /** 
     * Clears an object or array of its contents. For objects, each property is deleted.
     * 
     * @param {Object|Array} target the target to be cleared
     */
    fluid.clear = function (target) {
        if (target instanceof Array) {
            target.length = 0;
        } else {
            for (var i in target) {
                delete target[i];
            }
        }
    };
        
    // Model functions
    fluid.model = {}; // cannot call registerNamespace yet since it depends on fluid.model
       
    /** Another special "marker object" representing that a distinguished 
     * (probably context-dependent) value should be substituted.
     */
    fluid.VALUE = {type: "fluid.marker", value: "VALUE"};
    
    /** Another special "marker object" representing that no value is present (where
     * signalling using the value "undefined" is not possible) */
    fluid.NO_VALUE = {type: "fluid.marker", value: "NO_VALUE"};
    
    /** A marker indicating that a value requires to be expanded after component construction begins **/
    fluid.EXPAND = {type: "fluid.marker", value: "EXPAND"};
    /** A marker indicating that a value requires to be expanded immediately**/
    fluid.EXPAND_NOW = {type: "fluid.marker", value: "EXPAND_NOW"};
    
    /** Determine whether an object is any marker, or a particular marker - omit the
     * 2nd argument to detect any marker
     */
    fluid.isMarker = function (totest, type) {
        if (!totest || typeof (totest) !== 'object' || totest.type !== "fluid.marker") {
            return false;
        }
        if (!type) {
            return true;
        }
        return totest === type;
    };
   
    /** Copy a source "model" onto a target **/
    fluid.model.copyModel = function (target, source) {
        fluid.clear(target);
        $.extend(true, target, source);
    };
    
    /** Parse an EL expression separated by periods (.) into its component segments.
     * @param {String} EL The EL expression to be split
     * @return {Array of String} the component path expressions.
     * TODO: This needs to be upgraded to handle (the same) escaping rules (as RSF), so that
     * path segments containing periods and backslashes etc. can be processed, and be harmonised
     * with the more complex implementations in fluid.pathUtil(data binding).
     */
    fluid.model.parseEL = function (EL) {
        return EL === "" ? [] : String(EL).split('.');
    };
    
    /** Compose an EL expression from two separate EL expressions. The returned 
     * expression will be the one that will navigate the first expression, and then
     * the second, from the value reached by the first. Either prefix or suffix may be
     * the empty string **/
    
    fluid.model.composePath = function (prefix, suffix) {
        return prefix === "" ? suffix : (suffix === "" ? prefix : prefix + "." + suffix);
    };
    
    /** Compose any number of path segments, none of which may be empty **/
    fluid.model.composeSegments = function () {
        return $.makeArray(arguments).join(".");
    };
    
    /** Helpful alias for old-style API **/
    fluid.path = fluid.model.composeSegments;
    fluid.composePath = fluid.model.composePath;

    /** Standard strategies for resolving path segments **/
    fluid.model.environmentStrategy = function (initEnvironment) {
        return {
            init: function () {
                var environment = initEnvironment;
                return function (root, segment, index) {
                    var togo;
                    if (environment && environment[segment]) {
                        togo = environment[segment];
                    }
                    environment = null;
                    return togo; 
                };
            }
        };
    };

    fluid.model.defaultCreatorStrategy = function (root, segment) {
        if (root[segment] === undefined) {
            root[segment] = {};
            return root[segment];
        }
    };
    
    fluid.model.defaultFetchStrategy = function (root, segment) {
        return segment === "" ? root : root[segment];
    };
        
    fluid.model.funcResolverStrategy = function (root, segment) {
        if (root.resolvePathSegment) {
            return root.resolvePathSegment(segment);
        }
    };
    
    // unsupported, NON-API function
    fluid.model.applyStrategy = function (strategy, root, segment, index) {
        if (typeof (strategy) === "function") { 
            return strategy(root, segment, index);
        } else if (strategy && strategy.next) {
            return strategy.next(root, segment, index);
        }
    };
    
    // unsupported, NON-API function
    fluid.model.initStrategy = function (baseStrategy, index, oldStrategies) {
        return baseStrategy.init ? baseStrategy.init(oldStrategies ? oldStrategies[index] : undefined) : baseStrategy;
    };
    
    // unsupported, NON-API function
    fluid.model.makeTrundler = function (root, config, oldStrategies) {
        var that = {
            root: root,
            strategies: fluid.isArrayable(config) ? config : 
                fluid.transform(config.strategies, function (strategy, index) {
                    return fluid.model.initStrategy(strategy, index, oldStrategies); 
                })
        };
        that.trundle = function (EL, uncess) {
            uncess = uncess || 0;
            var newThat = fluid.model.makeTrundler(that.root, config, that.strategies);
            newThat.segs = fluid.model.parseEL(EL);
            newThat.index = 0;
            newThat.step(newThat.segs.length - uncess);
            return newThat;
        };
        that.next = function () {
            if (!that.root) {
                return;
            }
            var accepted;
            for (var i = 0; i < that.strategies.length; ++i) {
                var value = fluid.model.applyStrategy(that.strategies[i], that.root, that.segs[that.index], that.index);
                if (accepted === undefined) {
                    accepted = value;
                }
            }
            if (accepted === fluid.NO_VALUE) {
                accepted = undefined;
            }
            that.root = accepted;
            ++that.index;
        };
        that.step = function (limit) {
            for (var i = 0; i < limit; ++i) {
                that.next();
            }
            that.last = that.segs[that.index];
        };
        return that;
    };

    fluid.model.defaultSetConfig = {
        strategies: [fluid.model.funcResolverStrategy, fluid.model.defaultFetchStrategy, fluid.model.defaultCreatorStrategy]
    };
    
    // unsupported, NON-API function
    // core trundling recursion point
    fluid.model.trundleImpl = function (trundler, EL, config, uncess) {
        if (typeof (EL) === "string") {
            trundler = trundler.trundle(EL, uncess);
        } else {
            var key = EL.type || "default";
            var resolver = config.resolvers[key];
            if (!resolver) {
                fluid.fail("Unable to find resolver of type " + key);
            }
            trundler = resolver(EL, trundler) || {};
            if (EL.path && trundler.trundle && trundler.root !== undefined) {
                trundler = fluid.model.trundleImpl(trundler, EL.path, config, uncess);
            }
        }
        return trundler;  
    };
    
    // unsupported, NON-API function
    // entry point for initially unbased trundling
    fluid.model.trundle = function (root, EL, config, uncess) {
        EL = EL || "";
        config = config || fluid.model.defaultGetConfig;
        var trundler = fluid.model.makeTrundler(root, config);
        return fluid.model.trundleImpl(trundler, EL, config, uncess);
    };
    
    fluid.model.getPenultimate = function (root, EL, config) {
        return fluid.model.trundle(root, EL, config, 1);
    };
    
    fluid.set = function (root, EL, newValue, config) {
        config = config || fluid.model.defaultSetConfig;
        var trundler = fluid.model.getPenultimate(root, EL, config);
        trundler.root[trundler.last] = newValue;
    };
    
    fluid.model.defaultGetConfig = {
        strategies: [fluid.model.funcResolverStrategy, fluid.model.defaultFetchStrategy]
    };
    
    /** Evaluates an EL expression by fetching a dot-separated list of members
     * recursively from a provided root.
     * @param root The root data structure in which the EL expression is to be evaluated
     * @param {string} EL The EL expression to be evaluated
     * @param environment An optional "environment" which, if it contains any members
     * at top level, will take priority over the root data structure.
     * @return The fetched data value.
     */
    
    fluid.get = function (root, EL, config) {
        return fluid.model.trundle(root, EL, config).root;
    };

    // This backward compatibility will be maintained for a number of releases, probably until Fluid 2.0
    fluid.model.setBeanValue = fluid.set;
    fluid.model.getBeanValue = fluid.get;
    
    fluid.getGlobalValue = function (path, env) {
        if (path) {
            env = env || fluid.environment;
            var envFetcher = fluid.model.environmentStrategy(env);
            return fluid.get(globalObject, path, {strategies: [envFetcher].concat(fluid.model.defaultGetConfig.strategies)});
        }
    };
    
    /**
     * Allows for the calling of a function from an EL expression "functionPath", with the arguments "args", scoped to an framework version "environment".
     * @param {Object} functionPath - An EL expression
     * @param {Object} args - An array of arguments to be applied to the function, specified in functionPath
     * @param {Object} environment - (optional) The object to scope the functionPath to  (typically the framework root for version control)
     */
    fluid.invokeGlobalFunction = function (functionPath, args, environment) {
        var func = fluid.getGlobalValue(functionPath, environment);
        if (!func) {
            fluid.fail("Error invoking global function: " + functionPath + " could not be located");
        } else {
            return func.apply(null, args);
        }
    };
    
    /** Registers a new global function at a given path (currently assumes that
     * it lies within the fluid namespace)
     */
    
    fluid.registerGlobalFunction = function (functionPath, func, env) {
        env = env || fluid.environment;
        var envFetcher = fluid.model.environmentStrategy(env);
        fluid.set(globalObject, functionPath, func, {strategies: [envFetcher].concat(fluid.model.defaultSetConfig.strategies)});
    };
    
    fluid.setGlobalValue = fluid.registerGlobalFunction;
    
    /** Ensures that an entry in the global namespace exists **/
    fluid.registerNamespace = function (naimspace, env) {
        env = env || fluid.environment;
        var existing = fluid.getGlobalValue(naimspace, env);
        if (!existing) {
            existing = {};
            fluid.setGlobalValue(naimspace, existing, env);
        }
        return existing;
    };
    
    // stubs for two functions in FluidDebugging.js
    fluid.dumpEl = fluid.identity;
    fluid.renderTimestamp = fluid.identity;
    
    
    /*** The Model Events system. ***/
    
    fluid.registerNamespace("fluid.event");
    
    var fluid_guid = 1;
    
    /** Allocate an integer value that will be unique for this session **/
    
    fluid.allocateGuid = function () {
        return fluid_guid++;
    };
    
    fluid.event.identifyListener = function (listener) {
        if (typeof(listener) === "string") {
            return listener; 
        }
        if (!listener.$$guid) {
            listener.$$guid = fluid.allocateGuid();
        }
        return listener.$$guid;
    };
    
    fluid.event.mapPriority = function (priority) {
        return (priority === null || priority === undefined ? 0 : 
           (priority === "last" ? -Number.MAX_VALUE :
              (priority === "first" ? Number.MAX_VALUE : priority)));
    };
    
    fluid.event.listenerComparator = function (recA, recB) {
        return recB.priority - recA.priority;
    };
    
    fluid.event.sortListeners = function (listeners) {
        var togo = [];
        fluid.each(listeners, function (listener) {
            togo.push(listener);
        });
        return togo.sort(fluid.event.listenerComparator);
    };
    /** Construct an "event firer" object which can be used to register and deregister 
     * listeners, to which "events" can be fired. These events consist of an arbitrary
     * function signature. General documentation on the Fluid events system is at
     * http://wiki.fluidproject.org/display/fluid/The+Fluid+Event+System .
     * @param {Boolean} unicast If <code>true</code>, this is a "unicast" event which may only accept
     * a single listener.
     * @param {Boolean} preventable If <code>true</code> the return value of each handler will 
     * be checked for <code>false</code> in which case further listeners will be shortcircuited, and this
     * will be the return value of fire()
     */
    
    fluid.event.getEventFirer = function (unicast, preventable) {
        var listeners = {};
        var sortedListeners = [];
        
        function fireToListeners(listeners, args, wrapper) {
            for (var i in listeners) {
                var lisrec = listeners[i];
                var listener = lisrec.listener;
                if (typeof(listener) === "string") {
                    listenerFunc = fluid.getGlobalValue(listener);
                    if (!listenerFunc) {
                        fluid.fail("Unable to look up name " + listener + " as a global function"); 
                    }
                    else {
                        listener = lisrec.listener = listenerFunc;
                    }
                }
                if (lisrec.predicate && !lisrec.predicate(listener, args)) {
                    continue;
                }
                try {
                    var ret = (wrapper ? wrapper(listener) : listener).apply(null, args);
                    if (preventable && ret === false) {
                        return false;
                    }
                    if (unicast) {
                        return ret;
                    }
                } catch (e) {
                    fluid.log("FireEvent received exception " + e.message + " e " + e + " firing to listener " + i);
                    throw (e);       
                }
            }
        }
        
        return {
            addListener: function (listener, namespace, predicate, priority) {
                if (!listener) {
                    return;
                }
                if (unicast) {
                    namespace = "unicast";
                }
                if (!namespace) {
                    namespace = fluid.event.identifyListener(listener);
                }

                listeners[namespace] = {listener: listener, predicate: predicate, priority: 
                    fluid.event.mapPriority(priority)};
                sortedListeners = fluid.event.sortListeners(listeners);
            },

            removeListener: function (listener) {
                if (typeof (listener) === 'string') {
                    delete listeners[listener];
                } else if (listener.$$guid) {
                    delete listeners[listener.$$guid];
                }
                sortedListeners = fluid.event.sortListeners(listeners);
            },
            // NB - this method exists currently solely for the convenience of the new,
            // transactional changeApplier. As it exists it is hard to imagine the function
            // being helpful to any other client. We need to get more experience on the kinds
            // of listeners that are useful, and ultimately factor this method away.
            fireToListeners: function (listeners, args, wrapper) {
                return fireToListeners(listeners, args, wrapper);
            },
            fire: function () {
                return fireToListeners(sortedListeners, arguments);
            }
        };
    };
    
    fluid.event.addListenerToFirer = function (firer, value, namespace) {
        if (fluid.isArrayable(value)) {
            for (var i = 0; i < value.length; ++i) {
                fluid.event.addListenerToFirer(firer, value[i], namespace); 
            }
        }
        else if (typeof(value) === "function" || typeof(value) === "string") {
            firer.addListener(value, namespace);
        } 
        else if (value && typeof(value) === "object") {
            firer.addListener(value.listener, namespace || value.namespace, value.predicate, value.priority);
        }
    };
    /**
     * Attaches the user's listeners to a set of events.
     * 
     * @param {Object} events a collection of named event firers
     * @param {Object} listeners optional listeners to add
     */
    fluid.mergeListeners = function (that, events, listeners) {
        fluid.each(listeners, function (value, key) {
            var firer, namespace;
            if (key.charAt(0) === "{") {
                if (!fluid.expandOptions) {
                    fluid.fail("fluid.expandOptions could not be loaded - please include FluidIoC.js in order to operate IoC-driven event with descriptor " + 
                        key);
                }
                firer = fluid.expandOptions(key, that);
            } else {
                var keydot = key.indexOf(".");
            
                if (keydot !== -1) {
                    namespace = key.substring(keydot + 1);
                    key = key.substring(0, keydot);
                }
                if (!events[key]) {
                    fluid.fail("Listener registered for event " + key + " which is not defined for this component");
                    events[key] = fluid.event.getEventFirer();
                }
                firer = events[key];
            }
            fluid.event.addListenerToFirer(firer, value, namespace);
        });
    };
    
    function initEvents(that, events, pass) {
        fluid.each(events, function (eventSpec, eventKey) { 
            var isIoCEvent = eventSpec && (typeof (eventSpec) !== "string" || eventSpec.charAt(0) === "{");
            var event;
            if (isIoCEvent && pass === "IoC") {
                if (!fluid.event.resolveEvent) {
                    fluid.fail("fluid.event.resolveEvent could not be loaded - please include FluidIoC.js in order to operate IoC-driven event with descriptor " + 
                        JSON.stringify(eventSpec));
                } else {
                    event = fluid.event.resolveEvent(that, eventKey, eventSpec);
                }
            } else if (pass === "flat") {
                event = fluid.event.getEventFirer(eventSpec === "unicast", eventSpec === "preventable");
            }
            if (event) {
                that.events[eventKey] = event;
            } 
        });
    }
    
    /**
     * Sets up a component's declared events.
     * Events are specified in the options object by name. There are three different types of events that can be
     * specified: 
     * 1. an ordinary multicast event, specified by "null". 
     * 2. a unicast event, which allows only one listener to be registered
     * 3. a preventable event
     * 
     * @param {Object} that the component
     * @param {Object} options the component's options structure, containing the declared event names and types
     */
    fluid.instantiateFirers = function (that, options) {
        that.events = {};
        // TODO: manual 2-phase instantiation since we have no GINGER WORLD
        initEvents(that, options.events, "flat"); 
        initEvents(that, options.events, "IoC");
        // TODO: manually expand these late so that members attached to ourselves with preInitFunction can be detected
        var listeners = fluid.expandOptions? fluid.expandOptions(options.listeners, that) : options.listeners;
        fluid.mergeListeners(that, that.events, listeners);
    };
    
    fluid.mergeListenersPolicy = function (target, source) {
        var togo = target || {};
        fluid.each(source, function(listeners, key) {
            togo[key] = fluid.makeArray(source[key]).concat(fluid.makeArray(listeners));
        });
        return togo;
    };
    
    /*** DEFAULTS AND OPTIONS MERGING SYSTEM ***/
    
    var defaultsStore = {};
        
    var resolveGradesImpl = function (gs, gradeNames) {
        gradeNames = fluid.makeArray(gradeNames);
        fluid.each(gradeNames, function (gradeName) {
            var options = fluid.rawDefaults(gradeName) || {};
            gs.gradeHash[gradeName] = true;
            gs.gradeChain.push(gradeName);
            gs.optionsChain.push(options);
            fluid.each(options.gradeNames, function (parent) {
                if (!gs.gradeHash[parent]) {
                    resolveGradesImpl(gs, parent);
                }
            });
        });
        return gs;
    };
    
    // unsupported, NON-API function
    fluid.resolveGradeStructure = function (gradeNames) {
        var gradeStruct = {
            gradeChain: [],
            gradeHash: {},
            optionsChain: []
        };
        return resolveGradesImpl(gradeStruct, gradeNames);
    };
    
    fluid.lifecycleFunctions = {
        preInitFunction: true,
        postInitFunction: true,
        finalInitFunction: true
    };
    
    // unsupported, NON-API function
    fluid.mergeLifecycleFunction = function(target, source) {
        fluid.event.addListenerToFirer(target, source);
        return target;
    };
    
    fluid.rootMergePolicy = fluid.transform(fluid.lifecycleFunctions, function() {
            return fluid.mergeLifecycleFunction;
        }
    );
        
    // unsupported, NON-API function
    fluid.makeLifecycleFirers = function() {
        return fluid.transform(fluid.lifecycleFunctions, function() {
            return fluid.event.getEventFirer()
            }
        );
    };
    
    // unsupported, NON-API function
    fluid.resolveGrade = function (defaults, gradeNames) {
        var mergeArgs = [defaults];
        if (gradeNames) {
            var gradeStruct = fluid.resolveGradeStructure(gradeNames);
            mergeArgs = gradeStruct.optionsChain.reverse().concat(mergeArgs).concat({gradeNames: gradeStruct.gradeChain});
        }
        mergeArgs = [fluid.rootMergePolicy, fluid.makeLifecycleFirers()].concat(mergeArgs);
        var mergedDefaults = fluid.merge.apply(null, mergeArgs);
        return mergedDefaults;  
    };

    // unsupported, NON-API function
    fluid.resolveGradedOptions = function (componentName) {
        var defaults = fluid.rawDefaults(componentName);
        if (!defaults) {
            return defaults;
        } else {
            return fluid.resolveGrade(defaults, defaults.gradeNames);
        }
    };
    
    // unsupported, NON-API function
    fluid.rawDefaults = function (componentName, options) {
        if (options === undefined) {
            return defaultsStore[componentName];
        } else {
            defaultsStore[componentName] = options;
        }
    };
    
        
    fluid.hasGrade = function (options, gradeName) {
        return !options || !options.gradeNames ? false : fluid.contains(options.gradeNames, gradeName);
    };
    
     /**
     * Retrieves and stores a component's default settings centrally.
     * @param {boolean} (options) if true, manipulate a global option (for the head
     *   component) rather than instance options. NB - the use of "global options" 
     *   is deprecated and will be removed from the framework in release 1.5 
     * @param {String} componentName the name of the component
     * @param {Object} (optional) an container of key/value pairs to set
     */
     
    fluid.defaults = function () {
        var offset = 0;
        if (typeof arguments[0] === "boolean") {
            offset = 1;
        }
        var componentName = (offset === 0 ? "" : "*.global-") + arguments[offset];
        var options = arguments[offset + 1];
        if (options === undefined) {
            return fluid.resolveGradedOptions(componentName);
        } else {
            fluid.rawDefaults(componentName, options);
            if (fluid.hasGrade(options, "autoInit")) {
                fluid.makeComponent(componentName, fluid.resolveGradedOptions(componentName));
            }
        }
    };
    
    fluid.makeComponent = function (componentName, options) {
        if (!options.initFunction || !options.gradeNames) {
            fluid.fail("Cannot autoInit component " + componentName + " which does not have an initFunction and gradeName defined");
        }
        var creator = function() {
            return fluid.initComponent(componentName, arguments);
        };
        var existing = fluid.getGlobalValue(componentName);
        if (existing) {
            $.extend(creator, existing);
        }
        fluid.setGlobalValue(componentName, creator);
    };
        
    fluid.makeComponents = function(components, env) {
        fluid.each(components, function(value, key) {
            var options = {
                gradeNames: fluid.makeArray(value).concat(["autoInit"])
            };
            fluid.defaults(key, options);
        });
    };
    
    // The base system grade definitions
    
    fluid.defaults("fluid.littleComponent", {
        initFunction: "fluid.initLittleComponent",
        argumentMap: {
            options: 0
        }
    });
    
    fluid.defaults("fluid.eventedComponent", {
        gradeNames: ["fluid.littleComponent"],
        mergePolicy: {
            listeners: "fluid.mergeListenersPolicy"
        }
    });
    
        
    fluid.preInitModelComponent = function (that) {
        that.model = that.options.model || {};
        that.applier = that.options.applier || fluid.makeChangeApplier(that.model, that.options.changeApplierOptions);
    };
    
    fluid.defaults("fluid.modelComponent", {
        gradeNames: ["fluid.littleComponent"],
        preInitFunction: {
            namespace: "preInitModelComponent",
            listener: "fluid.preInitModelComponent"
        },
        mergePolicy: {
            model: "preserve",
            applier: "nomerge"
        }
    });
    
    fluid.defaults("fluid.viewComponent", {
        gradeNames: ["fluid.littleComponent", "fluid.modelComponent", "fluid.eventedComponent"],
        initFunction: "fluid.initView",
        argumentMap: {
            container: 0,
            options: 1
        }
    });
    
    // unsupported, NON-API function
    fluid.guardCircularity = function (seenIds, source, message1, message2) {
        if (source && source.id) {
            if (!seenIds[source.id]) {
                seenIds[source.id] = source;
            } else if (seenIds[source.id] === source) {
                fluid.fail("Circularity in options " + message1 + " - component with typename " + source.typeName + " and id " + source.id 
                    + " has already been seen" + message2);  
            }
        }      
    };
                
    fluid.mergePolicyIs = function (policy, test) {
        return typeof (policy) === "string" && $.inArray(test, policy.split(/\s*,\s*/)) !== -1;
    };
    
    function mergeImpl(policy, basePath, target, source, thisPolicy, rec) {
        if (typeof (thisPolicy) === "function") {
            thisPolicy.call(null, target, source);
            return target;
        }
        if (fluid.mergePolicyIs(thisPolicy, "replace")) {
            fluid.clear(target);
        }
        fluid.guardCircularity(rec.seenIds, source, "merging", " when evaluating path " + basePath + " - please protect components from merging using the \"nomerge\" merge policy");
      
        for (var name in source) {
            var path = (basePath ? basePath + "." : "") + name;
            var newPolicy = policy && typeof(policy) !== "string" ? policy[path] : policy;
            var thisTarget = target[name];
            var thisSource = source[name];
            var primitiveTarget = fluid.isPrimitive(thisTarget);
    
            if (thisSource !== undefined) {
                if (thisSource !== null && typeof(thisSource) === "object" &&
                        !fluid.isDOMNode(thisSource) && !thisSource.jquery && thisSource !== fluid.VALUE &&
                        !fluid.mergePolicyIs(newPolicy, "preserve") && !fluid.mergePolicyIs(newPolicy, "nomerge") && !fluid.mergePolicyIs(newPolicy, "noexpand")) {
                    if (primitiveTarget) {
                        target[name] = thisTarget = thisSource instanceof Array ? [] : {};
                    }
                    mergeImpl(policy, path, thisTarget, thisSource, newPolicy, rec);
                } else {
                    if (typeof(newPolicy) === "function") {
                        target[name] = newPolicy.call(null, thisTarget, thisSource, name);
                    } else if (!fluid.isValue(thisTarget) || !fluid.mergePolicyIs(newPolicy, "reverse")) {
                        // TODO: When "grades" are implemented, grandfather in any paired applier to perform these operations
                        // NB: mergePolicy of "preserve" now creates dependency on DataBinding.js
                        target[name] = fluid.isValue(thisTarget) && fluid.mergePolicyIs(newPolicy, "preserve") ? fluid.model.mergeModel(thisTarget, thisSource) : thisSource;
                    }
                }
            }
        }
        return target;
    }
    
    /** Merge a collection of options structures onto a target, following an optional policy.
     * This function is typically called automatically, as a result of an invocation of
     * <code>fluid.initLittleComponent</code>. The behaviour of this function is explained more fully on
     * the page http://wiki.fluidproject.org/display/fluid/Options+Merging+for+Fluid+Components .
     * @param policy {Object/String} A "policy object" specifiying the type of merge to be performed.
     * If policy is of type {String} it should take on the value "reverse" or "replace" representing
     * a static policy. If it is an
     * Object, it should contain a mapping of EL paths onto these String values, representing a
     * fine-grained policy. If it is an Object, the values may also themselves be EL paths 
     * representing that a default value is to be taken from that path.
     * @param target {Object} The options structure which is to be modified by receiving the merge results.
     * @param options1, options2, .... {Object} an arbitrary list of options structure which are to
     * be merged "on top of" the <code>target</code>. These will not be modified.    
     */
    
    fluid.merge = function (policy, target) {
        var path = "";
        
        for (var i = 2; i < arguments.length; ++i) {
            var source = arguments[i];
            if (source !== null && source !== undefined) {
                mergeImpl(policy, path, target, source, policy ? policy[""] : null, {seenIds: {}});
            }
        }
        if (policy && typeof (policy) !== "string") {
            for (var key in policy) {
                var elrh = policy[key];
                if (typeof (elrh) === "string" && elrh !== "replace" && elrh !== "preserve") {
                    var oldValue = fluid.get(target, key);
                    if (oldValue === null || oldValue === undefined) {
                        var value = fluid.get(target, elrh);
                        fluid.set(target, key, value);
                    }
                }
            }
        }
        return target;     
    };

    // unsupported, NON-API function
    fluid.transformOptions = function (mergeArgs) {
        var transRec = mergeArgs[1].transformOptions;
        fluid.expect("Options transformation record", ["transformer", "config"], transRec);
        var transFunc = fluid.getGlobalValue(transRec.transformer);
        var togo = fluid.transform(mergeArgs, function(value, key) {
            return key === 0? value : transFunc.call(null, value, transRec.config);
        });
        return togo;
    };

    /**
     * Merges the component's declared defaults, as obtained from fluid.defaults(),
     * with the user's specified overrides.
     * 
     * @param {Object} that the instance to attach the options to
     * @param {String} componentName the unique "name" of the component, which will be used
     * to fetch the default options from store. By recommendation, this should be the global
     * name of the component's creator function.
     * @param {Object} userOptions the user-specified configuration options for this component
     */
    // unsupported, NON-API function
    fluid.mergeComponentOptions = function (that, componentName, userOptions, localOptions) {
        var defaults = fluid.defaults(componentName);
        var mergePolicy = $.extend({}, fluid.rootMergePolicy, defaults ? defaults.mergePolicy : {});
        var defaultGrades = defaults && defaults.gradeNames;
        var mergeArgs;
        if (!defaultGrades) {
            defaults = fluid.censorKeys(defaults, fluid.keys(fluid.lifecycleFunctions));
            mergeArgs = [mergePolicy, localOptions];
        }
        else {
            mergeArgs = [mergePolicy];
        }
        var extraArgs;
        if (fluid.expandComponentOptions) {
            extraArgs = fluid.expandComponentOptions(defaults, userOptions, that);
        } else {
            extraArgs = [defaults, userOptions];
        }
        if (extraArgs[1] && extraArgs[1].transformOptions) {
            extraArgs = fluid.transformOptions(extraArgs);
        }
        mergeArgs = mergeArgs.concat(extraArgs);
        that.options = fluid.merge.apply(null, mergeArgs);
    };
    
    // The Fluid Component System proper   
            
    /** A special "marker object" which is recognised as one of the arguments to 
     * fluid.initSubcomponents. This object is recognised by reference equality - 
     * where it is found, it is replaced in the actual argument position supplied
     * to the specific subcomponent instance, with the particular options block
     * for that instance attached to the overall "that" object.
     * NOTE: The use of this marker has been deprecated as of the Fluid 1.4 release in 
     * favour of the contextual EL path "{options}" - it will be removed in a future
     * release of the framework.
     */
    fluid.COMPONENT_OPTIONS = {type: "fluid.marker", value: "COMPONENT_OPTIONS"};
    
    /** Construct a dummy or "placeholder" subcomponent, that optionally provides empty
     * implementations for a set of methods.
     */
    fluid.emptySubcomponent = function (options) {
        var that = {};
        options = $.makeArray(options);
        var empty = function () {};
        for (var i = 0; i < options.length; ++i) {
            that[options[i]] = empty;
        }
        return that;
    };
    
    /** Compute a "nickname" given a fully qualified typename, by returning the last path
     * segment.
     */
    
    fluid.computeNickName = function (typeName) {
        var segs = fluid.model.parseEL(typeName);
        return segs[segs.length - 1];
    };
        
    /** Create a "type tag" component with no state but simply a type name and id. The most 
     *  minimal form of Fluid component */
       
    fluid.typeTag = function (name) {
        return {
            typeName: name,
            id: fluid.allocateGuid()
        };
    };
    
    /** A combined "component and grade name" which allows type tags to be declaratively constructed
     * from options material */
    
    fluid.typeFount = function (options) {
        var that = fluid.initLittleComponent("fluid.typeFount", options);
        return that.options.targetTypeName? fluid.typeTag(that.options.targetTypeName) : null;
    };
    
    /**
     * Creates a new "little component": a that-ist object with options merged into it by the framework.
     * This method is a convenience for creating small objects that have options but don't require full
     * View-like features such as the DOM Binder or events
     * 
     * @param {Object} name the name of the little component to create
     * @param {Object} options user-supplied options to merge with the defaults
     */
    // NOTE: the 3rd argument localOptions is NOT to be advertised as part of the stable API, it is present
    // just to allow backward compatibility whilst grade specifications are not mandatory
    fluid.initLittleComponent = function (name, options, localOptions) {
        var that = fluid.typeTag(name);
        // TODO: nickName must be available earlier than other merged options so that component may resolve to itself
        that.nickName = options && options.nickName ? options.nickName : fluid.computeNickName(that.typeName);
        localOptions = localOptions || {gradeNames: "fluid.littleComponent"};
        localOptions = fluid.resolveGrade({}, localOptions.gradeNames);
        
        fluid.mergeComponentOptions(that, name, options, localOptions);
        that.options.preInitFunction.fire(that);

        if (fluid.hasGrade(that.options, "fluid.eventedComponent")) {
            fluid.instantiateFirers(that, that.options);
        }
        if (!fluid.hasGrade(that.options, "autoInit")) {
            fluid.clearLifecycleFunctions(that.options);
        }
        return that;
    };
    
    fluid.clearLifecycleFunctions = function(options) {
        fluid.each(fluid.lifecycleFunctions, function(value, key) {
            delete options[key];
        });
        delete options.initFunction; 
    };
    
    fluid.initComponent = function (componentName, initArgs) {
        var options = fluid.defaults(componentName);
        if (!options.gradeNames) {
            fluid.fail("Cannot initialise component " + componentName + " which has no gradeName registered");
        }
        var args = [componentName].concat(fluid.makeArray(initArgs)); // TODO: support different initFunction variants
        var that = fluid.invokeGlobalFunction(options.initFunction, args);
        that.options.postInitFunction.fire(that);
        if (fluid.initDependents) {
            fluid.initDependents(that);
        }
        that.options.finalInitFunction.fire(that);
        fluid.clearLifecycleFunctions(that.options);
        return that.options.returnedPath? fluid.get(that, that.options.returnedPath) : that;
    };

    // unsupported, NON-API function
    fluid.initSubcomponentImpl = function (that, entry, args) {
        var togo;
        if (typeof (entry) !== "function") {
            var entryType = typeof (entry) === "string" ? entry : entry.type;
            var globDef = fluid.defaults(true, entryType);
            fluid.merge("reverse", that.options, globDef);
            togo = entryType === "fluid.emptySubcomponent" ?
                fluid.emptySubcomponent(entry.options) : 
                fluid.invokeGlobalFunction(entryType, args);
        } else {
            togo = entry.apply(null, args);
        }

        var returnedOptions = togo ? togo.returnedOptions : null;
        if (returnedOptions) {
            fluid.merge(that.options.mergePolicy, that.options, returnedOptions);
            if (returnedOptions.listeners) {
                fluid.mergeListeners(that, that.events, returnedOptions.listeners);
            }
        }
        return togo;
    };
    
    /** Initialise all the "subcomponents" which are configured to be attached to 
     * the supplied top-level component, which share a particular "class name".
     * @param {Component} that The top-level component for which sub-components are
     * to be instantiated. It contains specifications for these subcomponents in its
     * <code>options</code> structure.
     * @param {String} className The "class name" or "category" for the subcomponents to
     * be instantiated. A class name specifies an overall "function" for a class of 
     * subcomponents and represents a category which accept the same signature of
     * instantiation arguments.
     * @param {Array of Object} args The instantiation arguments to be passed to each 
     * constructed subcomponent. These will typically be members derived from the
     * top-level <code>that</code> or perhaps globally discovered from elsewhere. One
     * of these arguments may be <code>fluid.COMPONENT_OPTIONS</code> in which case this
     * placeholder argument will be replaced by instance-specific options configured
     * into the member of the top-level <code>options</code> structure named for the
     * <code>className</code>
     * @return {Array of Object} The instantiated subcomponents, one for each member
     * of <code>that.options[className]</code>.
     */
    
    fluid.initSubcomponents = function (that, className, args) {
        var entry = that.options[className];
        if (!entry) {
            return;
        }
        var entries = $.makeArray(entry);
        var optindex = -1;
        var togo = [];
        args = $.makeArray(args);
        for (var i = 0; i < args.length; ++i) {
            if (args[i] === fluid.COMPONENT_OPTIONS) {
                optindex = i;
            }
        }
        for (i = 0; i < entries.length; ++i) {
            entry = entries[i];
            if (optindex !== -1) {
                args[optindex] = entry.options;
            }
            togo[i] = fluid.initSubcomponentImpl(that, entry, args);
        }
        return togo;
    };
        
    fluid.initSubcomponent = function (that, className, args) {
        return fluid.initSubcomponents(that, className, args)[0];
    };


  // **** VIEW-DEPENDENT DEFINITIONS BELOW HERE

    /**
     * Fetches a single container element and returns it as a jQuery.
     * 
     * @param {String||jQuery||element} containerSpec an id string, a single-element jQuery, or a DOM element specifying a unique container
     * @param {Boolean} fallible <code>true</code> if an empty container is to be reported as a valid condition
     * @return a single-element jQuery of container
     */
    fluid.container = function (containerSpec, fallible) {
        var container = fluid.wrap(containerSpec);
        if (fallible && (!container || container.length === 0)) {
            return null;
        }
        
        // Throw an exception if we've got more or less than one element.
        if (!container || !container.jquery || container.length !== 1) {
            if (typeof (containerSpec) !== "string") {
                containerSpec = container.selector;
            }
            var count = container.length !== undefined ? container.length : 0;
            fluid.fail({
                name: "NotOne",
                message: count > 1 ? "More than one (" + count + ") container elements were "
                    : "No container element was found for selector " + containerSpec
            });
        }
        if (!fluid.isDOMNode(container[0])) {
            fluid.fail("fluid.container was supplied a non-jQueryable element");  
        }
        
        return container;
    };
    
    /**
     * Creates a new DOM Binder instance, used to locate elements in the DOM by name.
     * 
     * @param {Object} container the root element in which to locate named elements
     * @param {Object} selectors a collection of named jQuery selectors
     */
    fluid.createDomBinder = function (container, selectors) {
        var cache = {}, that = {};
        
        function cacheKey(name, thisContainer) {
            return fluid.allocateSimpleId(thisContainer) + "-" + name;
        }

        function record(name, thisContainer, result) {
            cache[cacheKey(name, thisContainer)] = result;
        }

        that.locate = function (name, localContainer) {
            var selector, thisContainer, togo;
            
            selector = selectors[name];
            thisContainer = localContainer ? localContainer : container;
            if (!thisContainer) {
                fluid.fail("DOM binder invoked for selector " + name + " without container");
            }

            if (!selector) {
                return thisContainer;
            }

            if (typeof (selector) === "function") {
                togo = $(selector.call(null, fluid.unwrap(thisContainer)));
            } else {
                togo = $(selector, thisContainer);
            }
            if (togo.get(0) === document) {
                togo = [];
                //fluid.fail("Selector " + name + " with value " + selectors[name] +
                //            " did not find any elements with container " + fluid.dumpEl(container));
            }
            if (!togo.selector) {
                togo.selector = selector;
                togo.context = thisContainer;
            }
            togo.selectorName = name;
            record(name, thisContainer, togo);
            return togo;
        };
        that.fastLocate = function (name, localContainer) {
            var thisContainer = localContainer ? localContainer : container;
            var key = cacheKey(name, thisContainer);
            var togo = cache[key];
            return togo ? togo : that.locate(name, localContainer);
        };
        that.clear = function () {
            cache = {};
        };
        that.refresh = function (names, localContainer) {
            var thisContainer = localContainer ? localContainer : container;
            if (typeof names === "string") {
                names = [names];
            }
            if (thisContainer.length === undefined) {
                thisContainer = [thisContainer];
            }
            for (var i = 0; i < names.length; ++i) {
                for (var j = 0; j < thisContainer.length; ++j) {
                    that.locate(names[i], thisContainer[j]);
                }
            }
        };
        that.resolvePathSegment = that.locate;
        
        return that;
    };
    
    /** Expect that jQuery selector query has resulted in a non-empty set of 
     * results. If none are found, this function will fail with a diagnostic message, 
     * with the supplied message prepended.
     */
    fluid.expectFilledSelector = function (result, message) {
        if (result && result.length === 0 && result.jquery) {
            fluid.fail(message + ": selector \"" + result.selector + "\" with name " + result.selectorName +
                       " returned no results in context " + fluid.dumpEl(result.context));
        }
    };
    
    /** 
     * The central initialiation method called as the first act of every Fluid
     * component. This function automatically merges user options with defaults,
     * attaches a DOM Binder to the instance, and configures events.
     * 
     * @param {String} componentName The unique "name" of the component, which will be used
     * to fetch the default options from store. By recommendation, this should be the global
     * name of the component's creator function.
     * @param {jQueryable} container A specifier for the single root "container node" in the
     * DOM which will house all the markup for this component.
     * @param {Object} userOptions The configuration options for this component.
     */
     // 4th argument is NOT SUPPORTED, see comments for initLittleComponent
    fluid.initView = function (componentName, container, userOptions, localOptions) {
        fluid.expectFilledSelector(container, "Error instantiating component with name \"" + componentName);
        container = fluid.container(container, true);
        if (!container) {
            return null;
        }
        var that = fluid.initLittleComponent(componentName, userOptions, localOptions || {gradeNames: ["fluid.viewComponent"]}); 
        that.container = container;
        fluid.initDomBinder(that);

        return that;
    };
    
    /**
     * Creates a new DOM Binder instance for the specified component and mixes it in.
     * 
     * @param {Object} that the component instance to attach the new DOM Binder to
     */
    fluid.initDomBinder = function (that) {
        that.dom = fluid.createDomBinder(that.container, that.options.selectors);
        that.locate = that.dom.locate;      
    };

    // DOM Utilities.
    
    /**
     * Finds the nearest ancestor of the element that passes the test
     * @param {Element} element DOM element
     * @param {Function} test A function which takes an element as a parameter and return true or false for some test
     */
    fluid.findAncestor = function (element, test) {
        element = fluid.unwrap(element);
        while (element) {
            if (test(element)) {
                return element;
            }
            element = element.parentNode;
        }
    };
    
    /**
     * Returns a jQuery object given the id of a DOM node. In the case the element
     * is not found, will return an empty list.
     */
    fluid.jById = function (id, dokkument) {
        dokkument = dokkument && dokkument.nodeType === 9 ? dokkument : document;
        var element = fluid.byId(id, dokkument);
        var togo = element ? $(element) : [];
        togo.selector = "#" + id;
        togo.context = dokkument;
        return togo;
    };
    
    /**
     * Returns an DOM element quickly, given an id
     * 
     * @param {Object} id the id of the DOM node to find
     * @param {Document} dokkument the document in which it is to be found (if left empty, use the current document)
     * @return The DOM element with this id, or null, if none exists in the document.
     */
    fluid.byId = function (id, dokkument) {
        dokkument = dokkument && dokkument.nodeType === 9 ? dokkument : document;
        var el = dokkument.getElementById(id);
        if (el) {
            if (el.getAttribute("id") !== id) {
                fluid.fail("Problem in document structure - picked up element " +
                    fluid.dumpEl(el) + " for id " + id +
                    " without this id - most likely the element has a name which conflicts with this id");
            }
            return el;
        } else {
            return null;
        }
    };
    
    /**
     * Returns the id attribute from a jQuery or pure DOM element.
     * 
     * @param {jQuery||Element} element the element to return the id attribute for
     */
    fluid.getId = function (element) {
        return fluid.unwrap(element).getAttribute("id");
    };
    
    /** 
     * Allocate an id to the supplied element if it has none already, by a simple
     * scheme resulting in ids "fluid-id-nnnn" where nnnn is an increasing integer.
     */
    
    fluid.allocateSimpleId = function (element) {
        element = fluid.unwrap(element);
        if (!element.id) {
            element.id = "fluid-id-" + fluid.allocateGuid(); 
        }
        return element.id;
    };
    

    // Message resolution and templating
    
    /**
     * Simple string template system. 
     * Takes a template string containing tokens in the form of "%value".
     * Returns a new string with the tokens replaced by the specified values.
     * Keys and values can be of any data type that can be coerced into a string. Arrays will work here as well.
     * 
     * @param {String}    template    a string (can be HTML) that contains tokens embedded into it
     * @param {object}    values        a collection of token keys and values
     */
    fluid.stringTemplate = function (template, values) {
        var newString = template;
        for (var key in values) {
            var searchStr = "%" + key;
            newString = newString.replace(searchStr, values[key]);
        }
        return newString;
    };
    

    fluid.messageResolver = function (options) {
        var that = fluid.initLittleComponent("fluid.messageResolver", options);
        that.messageBase = that.options.parseFunc(that.options.messageBase);
        
        that.lookup = function (messagecodes) {
            var resolved = fluid.messageResolver.resolveOne(that.messageBase, messagecodes);
            if (resolved === undefined) {
                return fluid.find(that.options.parents, function (parent) {
                    return parent.lookup(messagecodes);
                });
            } else {
                return {template: resolved, resolveFunc: that.options.resolveFunc};
            }
        };
        that.resolve = function (messagecodes, args) {
            if (!messagecodes) {
                return "[No messagecodes provided]";
            }
            messagecodes = fluid.makeArray(messagecodes);
            var looked = that.lookup(messagecodes);
            return looked ? looked.resolveFunc(looked.template, args) :
                "[Message string for key " + messagecodes[0] + " not found]";
        };
        
        return that;  
    };
    
    fluid.defaults("fluid.messageResolver", {
        mergePolicy: {
            messageBase: "preserve"  
        },
        resolveFunc: fluid.stringTemplate,
        parseFunc: fluid.identity,
        messageBase: {},
        parents: []
    });
    
    fluid.messageResolver.resolveOne = function (messageBase, messagecodes) {
        for (var i = 0; i < messagecodes.length; ++i) {
            var code = messagecodes[i];
            var message = messageBase[code];
            if (message !== undefined) {
                return message;
            }
        }
    };
          
    /** Converts a data structure consisting of a mapping of keys to message strings,
     * into a "messageLocator" function which maps an array of message codes, to be 
     * tried in sequence until a key is found, and an array of substitution arguments,
     * into a substituted message string.
     */
    fluid.messageLocator = function (messageBase, resolveFunc) {
        var resolver = fluid.messageResolver({messageBase: messageBase, resolveFunc: resolveFunc});
        return function (messagecodes, args) {
            return resolver.resolve(messagecodes, args);
        };
    };

})(jQuery, fluid_1_4);
/*
Copyright 2007-2010 University of Cambridge
Copyright 2007-2009 University of Toronto
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

/** This file contains functions which depend on the presence of a DOM document
 * but which do not depend on the contents of Fluid.js **/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    // Private constants.
    var NAMESPACE_KEY = "fluid-scoped-data";

    /**
     * Gets stored state from the jQuery instance's data map.
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.getScopedData = function(target, key) {
        var data = $(target).data(NAMESPACE_KEY);
        return data ? data[key] : undefined;
    };

    /**
     * Stores state in the jQuery instance's data map. Unlike jQuery's version,
     * accepts multiple-element jQueries.
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.setScopedData = function(target, key, value) {
        $(target).each(function() {
            var data = $.data(this, NAMESPACE_KEY) || {};
            data[key] = value;

            $.data(this, NAMESPACE_KEY, data);
        });
    };

    /** Global focus manager - makes use of "focusin" event supported in jquery 1.4.2 or later.
     */

    var lastFocusedElement = null;
    
    $(document).bind("focusin", function(event){
        lastFocusedElement = event.target;
    });
    
    fluid.getLastFocusedElement = function() {
        return lastFocusedElement;
    }


    var ENABLEMENT_KEY = "enablement";

    /** Queries or sets the enabled status of a control. An activatable node
     * may be "disabled" in which case its keyboard bindings will be inoperable
     * (but still stored) until it is reenabled again.
     * This function is unsupported: It is not really intended for use by implementors.
     */
     
    fluid.enabled = function(target, state) {
        target = $(target);
        if (state === undefined) {
            return fluid.getScopedData(target, ENABLEMENT_KEY) !== false;
        }
        else {
            $("*", target).add(target).each(function() {
                if (fluid.getScopedData(this, ENABLEMENT_KEY) !== undefined) {
                    fluid.setScopedData(this, ENABLEMENT_KEY, state);
                }
                else if (/select|textarea|input/i.test(this.nodeName)) {
                    $(this).attr("disabled", !state);
                }
            });
            fluid.setScopedData(target, ENABLEMENT_KEY, state);
        }
    };
    
    fluid.initEnablement = function(target) {
        fluid.setScopedData(target, ENABLEMENT_KEY, true);
    };
    
    // This function is necessary since simulation of focus events by jQuery under IE
    // is not sufficiently good to intercept the "focusin" binding. Any code which triggers
    // focus or blur synthetically throughout the framework and client code must use this function,
    // especially if correct cross-platform interaction is required with the "deadMansBlur" function.
    
    function applyOp(node, func) {
        node = $(node);
        node.trigger("fluid-"+func);
        node[func]();
    }
    
    $.each(["focus", "blur"], function(i, name) {
        fluid[name] = function(elem) {
            applyOp(elem, name);
        }
    });
    
})(jQuery, fluid_1_4);
/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery */

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    fluid.dom = fluid.dom || {};
    
    // Node walker function for iterateDom.
    var getNextNode = function (iterator) {
        if (iterator.node.firstChild) {
            iterator.node = iterator.node.firstChild;
            iterator.depth += 1;
            return iterator;
        }
        while (iterator.node) {
            if (iterator.node.nextSibling) {
                iterator.node = iterator.node.nextSibling;
                return iterator;
            }
            iterator.node = iterator.node.parentNode;
            iterator.depth -= 1;
        }
        return iterator;
    };
    
    /**
     * Walks the DOM, applying the specified acceptor function to each element.
     * There is a special case for the acceptor, allowing for quick deletion of elements and their children.
     * Return "delete" from your acceptor function if you want to delete the element in question.
     * Return "stop" to terminate iteration. 
     
     * Implementation note - this utility exists mainly for performance reasons. It was last tested
     * carefully some time ago (around jQuery 1.2) but at that time was around 3-4x faster at raw DOM
     * filtration tasks than the jQuery equivalents, which was an important source of performance loss in the
     * Reorderer component. General clients of the framework should use this method with caution if at all, and
     * the performance issues should be reassessed when we have time. 
     * 
     * @param {Element} node the node to start walking from
     * @param {Function} acceptor the function to invoke with each DOM element
     * @param {Boolean} allnodes Use <code>true</code> to call acceptor on all nodes, 
     * rather than just element nodes (type 1)
     */
    fluid.dom.iterateDom = function (node, acceptor, allNodes) {
        var currentNode = {node: node, depth: 0};
        var prevNode = node;
        var condition;
        while (currentNode.node !== null && currentNode.depth >= 0 && currentNode.depth < fluid.dom.iterateDom.DOM_BAIL_DEPTH) {
            condition = null;
            if (currentNode.node.nodeType === 1 || allNodes) {
                condition = acceptor(currentNode.node, currentNode.depth);
            }
            if (condition) {
                if (condition === "delete") {
                    currentNode.node.parentNode.removeChild(currentNode.node);
                    currentNode.node = prevNode;
                }
                else if (condition === "stop") {
                    return currentNode.node;
                }
            }
            prevNode = currentNode.node;
            currentNode = getNextNode(currentNode);
        }
    };
    
    // Work around IE circular DOM issue. This is the default max DOM depth on IE.
    // http://msdn2.microsoft.com/en-us/library/ms761392(VS.85).aspx
    fluid.dom.iterateDom.DOM_BAIL_DEPTH = 256;
    
    /**
     * Checks if the specified container is actually the parent of containee.
     * 
     * @param {Element} container the potential parent
     * @param {Element} containee the child in question
     */
    fluid.dom.isContainer = function (container, containee) {
        for (; containee; containee = containee.parentNode) {
            if (container === containee) {
                return true;
            }
        }
        return false;
    };
       
    /** Return the element text from the supplied DOM node as a single String.
     * Implementation note - this is a special-purpose utility used in the framework in just one
     * position in the Reorderer. It only performs a "shallow" traversal of the text and was intended
     * as a quick and dirty means of extracting element labels where the user had not explicitly provided one.
     * It should not be used by general users of the framework and its presence here needs to be 
     * reassessed.
     */
    fluid.dom.getElementText = function (element) {
        var nodes = element.childNodes;
        var text = "";
        for (var i = 0; i < nodes.length; ++i) {
            var child = nodes[i];
            if (child.nodeType === 3) {
                text = text + child.nodeValue;
            }
        }
        return text; 
    };
    
})(jQuery, fluid_1_4);
/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
      
  var unUnicode = /(\\u[\dabcdef]{4}|\\x[\dabcdef]{2})/g;
  
  fluid.unescapeProperties = function (string) {
    string = string.replace(unUnicode, function(match) {
      var code = match.substring(2);
      var parsed = parseInt(code, 16);
      return String.fromCharCode(parsed);
      }
    );
    var pos = 0;
    while (true) {
        var backpos = string.indexOf("\\", pos);
        if (backpos === -1) {
            break;
        }
        if (backpos === string.length - 1) {
          return [string.substring(0, string.length - 1), true];
        }
        var replace = string.charAt(backpos + 1);
        if (replace === "n") replace = "\n";
        if (replace === "r") replace = "\r";
        if (replace === "t") replace = "\t";
        string = string.substring(0, backpos) + replace + string.substring(backpos + 2);
        pos = backpos + 1;
    }
    return [string, false];
  };
  
  var breakPos = /[^\\][\s:=]/;
  
  fluid.parseJavaProperties = function(text) {
    // File format described at http://java.sun.com/javase/6/docs/api/java/util/Properties.html#load(java.io.Reader)
    var togo = {};
    text = text.replace(/\r\n/g, "\n");
    text = text.replace(/\r/g, "\n");
    lines = text.split("\n");
    var contin, key, valueComp, valueRaw, valueEsc;
    for (var i = 0; i < lines.length; ++ i) {
      var line = $.trim(lines[i]);
      if (!line || line.charAt(0) === "#" || line.charAt(0) === '!') {
          continue;
      }
      if (!contin) {
        valueComp = "";
        var breakpos = line.search(breakPos);
        if (breakpos === -1) {
          key = line;
          valueRaw = "";
          }
        else {
          key = $.trim(line.substring(0, breakpos + 1)); // +1 since first char is escape exclusion
          valueRaw = $.trim(line.substring(breakpos + 2));
          if (valueRaw.charAt(0) === ":" || valueRaw.charAt(0) === "=") {
            valueRaw = $.trim(valueRaw.substring(1));
          }
        }
      
        key = fluid.unescapeProperties(key)[0];
        valueEsc = fluid.unescapeProperties(valueRaw);
      }
      else {
        valueEsc = fluid.unescapeProperties(line);
      }

      contin = valueEsc[1];
      if (!valueEsc[1]) { // this line was not a continuation line - store the value
        togo[key] = valueComp + valueEsc[0];
      }
      else {
        valueComp += valueEsc[0];
      }
    }
    return togo;
  };
      
    /** 
     * Expand a message string with respect to a set of arguments, following a basic
     * subset of the Java MessageFormat rules. 
     * http://java.sun.com/j2se/1.4.2/docs/api/java/text/MessageFormat.html
     * 
     * The message string is expected to contain replacement specifications such
     * as {0}, {1}, {2}, etc.
     * @param messageString {String} The message key to be expanded
     * @param args {String/Array of String} An array of arguments to be substituted into the message.
     * @return The expanded message string. 
     */
    fluid.formatMessage = function (messageString, args) {
        if (!args) {
            return messageString;
        } 
        if (typeof(args) === "string") {
            args = [args];
        }
        for (var i = 0; i < args.length; ++ i) {
            messageString = messageString.replace("{" + i + "}", args[i]);
        }
        return messageString;
    };
      
})(jQuery, fluid_1_4);
/*
Copyright 2007-2010 University of Cambridge
Copyright 2007-2009 University of Toronto
Copyright 2007-2009 University of California, Berkeley
Copyright 2010 OCAD University
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid:true, fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};
var fluid = fluid || fluid_1_4;

(function ($, fluid) {
       
    fluid.renderTimestamp = function (date) {
        var zeropad = function (num, width) {
             if (!width) width = 2;
             var numstr = (num == undefined? "" : num.toString());
             return "00000".substring(5 - width + numstr.length) + numstr;
             }
        return zeropad(date.getHours()) + ":" + zeropad(date.getMinutes()) + ":" + zeropad(date.getSeconds()) + "." + zeropad(date.getMilliseconds(), 3);
    };

    // Exception stripping code taken from https://github.com/emwendelin/javascript-stacktrace/blob/master/stacktrace.js
    // BSD licence, see header
    
    fluid.detectStackStyle = function (e) {
        var style = "other";
        var stackStyle = {
            offset: 0  
        };
        if (e["arguments"]) {
            style = "chrome";
        } else if (typeof window !== "undefined" && window.opera && e.stacktrace) {
            style = "opera10";
        } else if (e.stack) {
            style = "firefox";
            // Detect FireFox 4-style stacks which are 1 level less deep
            stackStyle.offset = e.stack.indexOf("Trace exception") === -1? 1 : 0;
        } else if (typeof window !== 'undefined' && window.opera && !('stacktrace' in e)) { //Opera 9-
            style = "opera";
        }
        stackStyle.style = style;
        return stackStyle;
    };
    
    fluid.obtainException = function() {
        try {
            throw new Error("Trace exception");
        }
        catch (e) {
            return e;
        }
    };
    
    var stackStyle = fluid.detectStackStyle(fluid.obtainException());

    fluid.registerNamespace("fluid.exceptionDecoders");
    
    fluid.decodeStack = function() {
        if (stackStyle.style !== "firefox") {
            return null;
        }
        var e = fluid.obtainException();
        return fluid.exceptionDecoders[stackStyle.style](e);
    };

    fluid.exceptionDecoders.firefox = function(e) {
        var lines = e.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anonymous}(').split('\n');
        return fluid.transform(lines, function(line) {
            var atind = line.indexOf("@");
            return atind === -1? [line] : [line.substring(atind + 1), line.substring(0, atind)];  
        });
    };
    
    fluid.getCallerInfo = function(atDepth) {
        atDepth = (atDepth || 3) - stackStyle.offset;
        var stack = fluid.decodeStack();
        return stack? stack[atDepth][0] : null;
    };
    
    function generate(c, count) {
        var togo = "";
        for (var i = 0; i < count; ++ i) {
            togo += c;
        }
        return togo;
    }
    
    function printImpl(obj, small, options) {
        var big = small + options.indentChars;
        if (obj === null) {
            return "null";
        }
        else if (fluid.isPrimitive(obj)) {
            return JSON.stringify(obj);
        }
        else {
            var j = [];
            if (fluid.isArrayable(obj)) {
                if (obj.length === 0) {
                    return "[]";
                }
                for (var i = 0; i < obj.length; ++ i) {
                    j[i] = printImpl(obj[i], big, options);
                }
                return "[\n" + big + j.join(",\n" + big) + "\n" + small + "]";
                }
            else {
                var i = 0;
                fluid.each(obj, function(value, key) {
                    j[i++] = JSON.stringify(key) + ": " + printImpl(value, big, options);
                });
                return "{\n" + big + j.join(",\n" + big) + "\n" + small + "}"; 
            }
        }
    }
    
    fluid.prettyPrintJSON = function(obj, options) {
        options = $.extend({indent: 4}, options);
        options.indentChars = generate(" ", options.indent);
        return printImpl(obj, "", options);
    }
        
    /** 
     * Dumps a DOM element into a readily recognisable form for debugging - produces a
     * "semi-selector" summarising its tag name, class and id, whichever are set.
     * 
     * @param {jQueryable} element The element to be dumped
     * @return A string representing the element.
     */
    fluid.dumpEl = function (element) {
        var togo;
        
        if (!element) {
            return "null";
        }
        if (element.nodeType === 3 || element.nodeType === 8) {
            return "[data: " + element.data + "]";
        } 
        if (element.nodeType === 9) {
            return "[document: location " + element.location + "]";
        }
        if (!element.nodeType && fluid.isArrayable(element)) {
            togo = "[";
            for (var i = 0; i < element.length; ++ i) {
                togo += fluid.dumpEl(element[i]);
                if (i < element.length - 1) {
                    togo += ", ";
                }
            }
            return togo + "]";
        }
        element = $(element);
        togo = element.get(0).tagName;
        if (element.attr("id")) {
            togo += "#" + element.attr("id");
        }
        if (element.attr("class")) {
            togo += "." + element.attr("class");
        }
        return togo;
    };
        
})(jQuery, fluid_1_4);
    /*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    fluid.BINDING_ROOT_KEY = "fluid-binding-root";
    
    /** Recursively find any data stored under a given name from a node upwards
     * in its DOM hierarchy **/
     
    fluid.findData = function (elem, name) {
        while (elem) {
            var data = $.data(elem, name);
            if (data) {
                return data;
            }
            elem = elem.parentNode;
        }
    };
  
    fluid.bindFossils = function (node, data, fossils) {
        $.data(node, fluid.BINDING_ROOT_KEY, {data: data, fossils: fossils});
    };
        
    fluid.boundPathForNode = function (node, fossils) {
        node = fluid.unwrap(node);
        var key = node.name || node.id;
        var record = fossils[key];
        return record ? record.EL: null;
    };
  
    fluid.findForm = function (node) {
        return fluid.findAncestor(node, function (element) {
            return element.nodeName.toLowerCase() === "form";
        });
    };
    
    /** A generalisation of jQuery.val to correctly handle the case of acquiring and
     * setting the value of clustered radio button/checkbox sets, potentially, given
     * a node corresponding to just one element.
     */
    fluid.value = function (nodeIn, newValue) {
        var node = fluid.unwrap(nodeIn);
        var multiple = false;
        if (node.nodeType === undefined && node.length > 1) {
            node = node[0];
            multiple = true;
        }
        if ("input" !== node.nodeName.toLowerCase() || ! /radio|checkbox/.test(node.type)) {
            // resist changes to contract of jQuery.val() in jQuery 1.5.1 (see FLUID-4113)
            return newValue === undefined? $(node).val() : $(node).val(newValue);
        }
        var name = node.name;
        if (name === undefined) {
            fluid.fail("Cannot acquire value from node " + fluid.dumpEl(node) + " which does not have name attribute set");
        }
        var elements;
        if (multiple) {
            elements = nodeIn;
        }
        else {
            elements = document.getElementsByName(name);
            var scope = fluid.findForm(node);
            elements = $.grep(elements, 
            function (element) {
                if (element.name !== name) {
                    return false;
                }
                return !scope || fluid.dom.isContainer(scope, element);
            });
        }
        if (newValue !== undefined) {
            if (typeof(newValue) === "boolean") {
                newValue = (newValue ? "true" : "false");
            }
          // jQuery gets this partially right, but when dealing with radio button array will
          // set all of their values to "newValue" rather than setting the checked property
          // of the corresponding control. 
            $.each(elements, function () {
                this.checked = (newValue instanceof Array ? 
                    $.inArray(this.value, newValue) !== -1 : newValue === this.value);
            });
        }
        else { // this part jQuery will not do - extracting value from <input> array
            var checked = $.map(elements, function (element) {
                return element.checked ? element.value : null;
            });
            return node.type === "radio" ? checked[0] : checked;
        }
    };
    
    /** "Automatically" apply to whatever part of the data model is
     * relevant, the changed value received at the given DOM node*/
    fluid.applyChange = function (node, newValue, applier) {
        node = fluid.unwrap(node);
        if (newValue === undefined) {
            newValue = fluid.value(node);
        }
        if (node.nodeType === undefined && node.length > 0) {
            node = node[0];
        } // assume here that they share name and parent
        var root = fluid.findData(node, fluid.BINDING_ROOT_KEY);
        if (!root) {
            fluid.fail("Bound data could not be discovered in any node above " + fluid.dumpEl(node));
        }
        var name = node.name;
        var fossil = root.fossils[name];
        if (!fossil) {
            fluid.fail("No fossil discovered for name " + name + " in fossil record above " + fluid.dumpEl(node));
        }
        if (typeof(fossil.oldvalue) === "boolean") { // deal with the case of an "isolated checkbox"
            newValue = newValue[0] ? true: false;
        }
        var EL = root.fossils[name].EL;
        if (applier) {
            applier.fireChangeRequest({path: EL, value: newValue, source: node.id});
        }
        else {
            fluid.set(root.data, EL, newValue);
        }    
    };
   
    // Implementation notes: The EL path manipulation utilities here are somewhat more thorough
    // and expensive versions of those provided in Fluid.js - there is some duplication of 
    // functionality. This is a tradeoff between stability and performance - the versions in
    // Fluid.js are the most frequently used and do not implement escaping of characters .
    // as \. and \ as \\ as the versions here. The implementations here are not quite complete
    // or very performant and are left here partially as an implementation note. Problems will
    // arise if clients manipulate JSON structures containing "." characters in keys as if they
    // are models, treating these is best left until the cases where they occur. The now standard
    // utilities fluid.path(), fluid.parseEL and fluid.composePath are the ones recommended for
    // general users and their implementation can be upgraded if required.
   
    fluid.pathUtil = {};
   
    var getPathSegmentImpl = function (accept, path, i) {
        var segment = null; // TODO: rewrite this with regexes and replaces
        if (accept) {
            segment = "";
        }
        var escaped = false;
        var limit = path.length;
        for (; i < limit; ++i) {
            var c = path.charAt(i);
            if (!escaped) {
                if (c === '.') {
                    break;
                }
                else if (c === '\\') {
                    escaped = true;
                }
                else if (segment !== null) {
                    segment += c;
                }
            }
            else {
                escaped = false;
                if (segment !== null) {
                    accept += c;
                }
            }
        }
        if (segment !== null) {
            accept[0] = segment;
        }
        return i;
    };
    
    var globalAccept = []; // TODO: serious reentrancy risk here, why is this impl like this?
    
    fluid.pathUtil.getPathSegment = function (path, i) {
        getPathSegmentImpl(globalAccept, path, i);
        return globalAccept[0];
    }; 
  
    fluid.pathUtil.getHeadPath = function (path) {
        return fluid.pathUtil.getPathSegment(path, 0);
    };
  
    fluid.pathUtil.getFromHeadPath = function (path) {
        var firstdot = getPathSegmentImpl(null, path, 0);
        return firstdot === path.length ? null
            : path.substring(firstdot + 1);
    };
    
    function lastDotIndex(path) {
        // TODO: proper escaping rules
        return path.lastIndexOf(".");
    }
    
    fluid.pathUtil.getToTailPath = function (path) {
        var lastdot = lastDotIndex(path);
        return lastdot === -1 ? null : path.substring(0, lastdot);
    };

  /** Returns the very last path component of a bean path */
    fluid.pathUtil.getTailPath = function (path) {
        var lastdot = lastDotIndex(path);
        return fluid.pathUtil.getPathSegment(path, lastdot + 1);
    };
    
    var composeSegment = function (prefix, toappend) {
        for (var i = 0; i < toappend.length; ++i) {
            var c = toappend.charAt(i);
            if (c === '.' || c === '\\' || c === '}') {
                prefix += '\\';
            }
            prefix += c;
        }
        return prefix;
    };
    
    /**
     * Compose a prefix and suffix EL path, where the prefix is already escaped.
     * Prefix may be empty, but not null. The suffix will become escaped.
     */
    fluid.pathUtil.composePath = function (prefix, suffix) {
        if (prefix.length !== 0) {
            prefix += '.';
        }
        return composeSegment(prefix, suffix);
    };    
   
    fluid.pathUtil.matchPath = function (spec, path) {
        var togo = "";
        while (true) {
            if (!spec || path === "") {
                break;
            }
            if (!path) {
                return null;
            }
            var spechead = fluid.pathUtil.getHeadPath(spec);
            var pathhead = fluid.pathUtil.getHeadPath(path);
            // if we fail to match on a specific component, fail.
            if (spechead !== "*" && spechead !== pathhead) {
                return null;
            }
            togo = fluid.pathUtil.composePath(togo, pathhead);
            spec = fluid.pathUtil.getFromHeadPath(spec);
            path = fluid.pathUtil.getFromHeadPath(path);
        }
        return togo;
    };
    
    fluid.model.mergeModel = function (target, source, applier) {
        var copySource = fluid.copy(source);
        applier = applier || fluid.makeChangeApplier(source);
        if (!fluid.isPrimitive(target)) {
            applier.fireChangeRequest({type: "ADD", path: "", value: target});
        }
        applier.fireChangeRequest({type: "MERGE", path: "", value: copySource});
        return source; 
    };
        
      
    fluid.model.isNullChange = function (model, request, resolverGetConfig) {
        if (request.type === "ADD") {
            var existing = fluid.get(model, request.path, resolverGetConfig);
            if (existing === request.value) {
                return true;
            }
        }
    };
    /** Applies the supplied ChangeRequest object directly to the supplied model.
     */
    fluid.model.applyChangeRequest = function (model, request, resolverSetConfig) {
        var pen = fluid.model.getPenultimate(model, request.path, resolverSetConfig || fluid.model.defaultSetConfig);
        
        if (request.type === "ADD" || request.type === "MERGE") {
            if (request.path === "" || request.type === "MERGE") {
                if (request.type === "ADD") {
                    fluid.clear(pen.root);
                }
                $.extend(true, request.path === "" ? pen.root: pen.root[pen.last], request.value);
            }
            else {
                pen.root[pen.last] = request.value;
            }
        }
        else if (request.type === "DELETE") {
            if (request.path === "") {
                fluid.clear(pen.root);
            }
            else {
                delete pen.root[pen.last];
            }
        }
    };
    
    // Utility shared between changeApplier and superApplier
    
    function bindRequestChange(that) {
        that.requestChange = function (path, value, type) {
            var changeRequest = {
                path: path,
                value: value,
                type: type
            };
            that.fireChangeRequest(changeRequest);
        };
    }
    
  
    fluid.makeChangeApplier = function (model, options) {
        options = options || {};
        var baseEvents = {
            guards: fluid.event.getEventFirer(false, true),
            postGuards: fluid.event.getEventFirer(false, true),
            modelChanged: fluid.event.getEventFirer(false, false)
        };
        var that = {
            model: model
        };
        
        function makeGuardWrapper(cullUnchanged) {
            if (!cullUnchanged) {
                return null;
            }
            var togo = function (guard) {
                return function (model, changeRequest, internalApplier) {
                    var oldRet = guard(model, changeRequest, internalApplier);
                    if (oldRet === false) {
                        return false;
                    }
                    else {
                        if (fluid.model.isNullChange(model, changeRequest)) {
                            togo.culled = true;
                            return false;
                        }
                    }
                };
            };
            return togo;
        }

        function wrapListener(listener, spec) {
            var pathSpec = spec;
            var transactional = false;
            var priority = Number.MAX_VALUE;
            if (typeof (spec) !== "string") {
                pathSpec = spec.path;
                transactional = spec.transactional;
                if (spec.priority !== undefined) {
                    priority = spec.priority;
                }
            }
            else {
                if (pathSpec.charAt(0) === "!") {
                    transactional = true;
                    pathSpec = pathSpec.substring(1);
                }
            }
            return function (changePath, fireSpec, accum) {
                var guid = fluid.event.identifyListener(listener);
                var exist = fireSpec.guids[guid];
                if (!exist) {
                    var match = fluid.pathUtil.matchPath(pathSpec, changePath);
                    if (match !== null) {
                        var record = {
                            changePath: changePath,
                            pathSpec: pathSpec,
                            listener: listener,
                            priority: priority,
                            transactional: transactional
                        };
                        if (accum) {
                            record.accumulate = [accum];
                        }
                        fireSpec.guids[guid] = record;
                        var collection = transactional ? "transListeners": "listeners";
                        fireSpec[collection].push(record);
                        fireSpec.all.push(record);
                    }
                }
                else if (accum) {
                    if (!exist.accumulate) {
                        exist.accumulate = [];
                    }
                    exist.accumulate.push(accum);
                }
            };
        }
        
        function fireFromSpec(name, fireSpec, args, category, wrapper) {
            return baseEvents[name].fireToListeners(fireSpec[category], args, wrapper);
        }
        
        function fireComparator(recA, recB) {
            return recA.priority - recB.priority;
        }

        function prepareFireEvent(name, changePath, fireSpec, accum) {
            baseEvents[name].fire(changePath, fireSpec, accum);
            fireSpec.all.sort(fireComparator);
            fireSpec.listeners.sort(fireComparator);
            fireSpec.transListeners.sort(fireComparator);
        }
        
        function makeFireSpec() {
            return {guids: {}, all: [], listeners: [], transListeners: []};
        }
        
        function getFireSpec(name, changePath) {
            var fireSpec = makeFireSpec();
            prepareFireEvent(name, changePath, fireSpec);
            return fireSpec;
        }
        
        function fireEvent(name, changePath, args, wrapper) {
            var fireSpec = getFireSpec(name, changePath);
            return fireFromSpec(name, fireSpec, args, "all", wrapper);
        }
        
        function adaptListener(that, name) {
            that[name] = {
                addListener: function (spec, listener, namespace) {
                    baseEvents[name].addListener(wrapListener(listener, spec), namespace);
                },
                removeListener: function (listener) {
                    baseEvents[name].removeListener(listener);
                }
            };
        }
        adaptListener(that, "guards");
        adaptListener(that, "postGuards");
        adaptListener(that, "modelChanged");
        
        function preFireChangeRequest(changeRequest) {
            if (!changeRequest.type) {
                changeRequest.type = "ADD";
            }
        }

        var bareApplier = {
            fireChangeRequest: function (changeRequest) {
                that.fireChangeRequest(changeRequest, true);
            }
        };
        bindRequestChange(bareApplier);

        that.fireChangeRequest = function (changeRequest, defeatGuards) {
            preFireChangeRequest(changeRequest);
            var guardFireSpec = defeatGuards ? null : getFireSpec("guards", changeRequest.path);
            if (guardFireSpec && guardFireSpec.transListeners.length > 0) {
                var ation = that.initiate();
                ation.fireChangeRequest(changeRequest, guardFireSpec);
                ation.commit();
            }
            else {
                if (!defeatGuards) {
                    // TODO: this use of "listeners" seems pointless since we have just verified that there are no transactional listeners
                    var prevent = fireFromSpec("guards", guardFireSpec, [model, changeRequest, bareApplier], "listeners");
                    if (prevent === false) {
                        return false;
                    }
                }
                var oldModel = model;
                if (!options.thin) {
                    oldModel = {};
                    fluid.model.copyModel(oldModel, model);                    
                }
                fluid.model.applyChangeRequest(model, changeRequest, options.resolverSetConfig);
                fireEvent("modelChanged", changeRequest.path, [model, oldModel, [changeRequest]]);
            }
        };
        
        bindRequestChange(that);

        function fireAgglomerated(eventName, formName, changes, args, accpos) {
            var fireSpec = makeFireSpec();
            for (var i = 0; i < changes.length; ++ i) {
                prepareFireEvent(eventName, changes[i].path, fireSpec, changes[i]);
            }
            for (var j = 0; j < fireSpec[formName].length; ++ j) {
                var spec = fireSpec[formName][j];
                if (accpos) {
                    args[accpos] = spec.accumulate;
                }
                var ret = spec.listener.apply(null, args);
                if (ret === false) {
                    return false;
                }
            }
        }

        that.initiate = function (newModel) {
            var cancelled = false;
            var changes = [];
            if (options.thin) {
                newModel = model;
            }
            else {
                newModel = newModel || {};
                fluid.model.copyModel(newModel, model);
            }
            // the guard in the inner world is given a private applier to "fast track"
            // and glob collateral changes it requires
            var internalApplier = 
              {fireChangeRequest: function (changeRequest) {
                    preFireChangeRequest(changeRequest);
                    fluid.model.applyChangeRequest(newModel, changeRequest, options.resolverSetConfig);
                    changes.push(changeRequest);
                }};
            bindRequestChange(internalApplier);
            var ation = {
                commit: function () {
                    var oldModel;
                    if (cancelled) {
                        return false;
                    }
                    var ret = fireAgglomerated("postGuards", "transListeners", changes, [newModel, null, internalApplier], 1);
                    if (ret === false) {
                        return false;
                    }
                    if (options.thin) {
                        oldModel = model;
                    }
                    else {
                        oldModel = {};
                        fluid.model.copyModel(oldModel, model);
                        fluid.clear(model);
                        fluid.model.copyModel(model, newModel);
                    }
                    fireAgglomerated("modelChanged", "all", changes, [model, oldModel, null], 2);
                },
                fireChangeRequest: function (changeRequest) {
                    preFireChangeRequest(changeRequest);
                    if (options.cullUnchanged && fluid.model.isNullChange(model, changeRequest, options.resolverGetConfig)) {
                        return;
                    } 
                    var wrapper = makeGuardWrapper(options.cullUnchanged);
                    var prevent = fireEvent("guards", changeRequest.path, [newModel, changeRequest, internalApplier], wrapper);
                    if (prevent === false && !(wrapper && wrapper.culled)) {
                        cancelled = true;
                    }
                    if (!cancelled) {
                        if (!(wrapper && wrapper.culled)) {
                            fluid.model.applyChangeRequest(newModel, changeRequest, options.resolverSetConfig);
                            changes.push(changeRequest);
                        }
                    }
                }
            };
            bindRequestChange(ation);

            return ation;
        };
        
        return that;
    };
    
    fluid.makeSuperApplier = function () {
        var subAppliers = [];
        var that = {};
        that.addSubApplier = function (path, subApplier) {
            subAppliers.push({path: path, subApplier: subApplier});
        };
        that.fireChangeRequest = function (request) {
            for (var i = 0; i < subAppliers.length; ++ i) {
                var path = subAppliers[i].path;
                if (request.path.indexOf(path) === 0) {
                    var subpath = request.path.substring(path.length + 1);
                    var subRequest = fluid.copy(request);
                    subRequest.path = subpath;
                    // TODO: Deal with the as yet unsupported case of an EL rvalue DAR
                    subAppliers[i].subApplier.fireChangeRequest(subRequest);
                }
            }
        };
        bindRequestChange(that);
        return that;
    };
    
    fluid.attachModel = function (baseModel, path, model) {
        var segs = fluid.model.parseEL(path);
        for (var i = 0; i < segs.length - 1; ++ i) {
            var seg = segs[i];
            var subModel = baseModel[seg];
            if (!subModel) {
                baseModel[seg] = subModel = {};
            }
            baseModel = subModel;
        }
        baseModel[segs[segs.length - 1]] = model;
    };
    
    fluid.assembleModel = function (modelSpec) {
        var model = {};
        var superApplier = fluid.makeSuperApplier();
        var togo = {model: model, applier: superApplier};
        for (var path in modelSpec) {
            var rec = modelSpec[path];
            fluid.attachModel(model, path, rec.model);
            if (rec.applier) {
                superApplier.addSubApplier(path, rec.applier);
            }
        }
        return togo;
    };

})(jQuery, fluid_1_4);
/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2010 University of Toronto
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid:true, fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};
var fluid = fluid || fluid_1_4;

(function ($, fluid) {

    // $().fluid("selectable", args)
    // $().fluid("selectable".that()
    // $().fluid("pager.pagerBar", args)
    // $().fluid("reorderer", options)

/** Create a "bridge" from code written in the Fluid standard "that-ist" style,
 *  to the standard JQuery UI plugin architecture specified at http://docs.jquery.com/UI/Guidelines .
 *  Every Fluid component corresponding to the top-level standard signature (JQueryable, options)
 *  will automatically convert idiomatically to the JQuery UI standard via this adapter. 
 *  Any return value which is a primitive or array type will become the return value
 *  of the "bridged" function - however, where this function returns a general hash
 *  (object) this is interpreted as forming part of the Fluid "return that" pattern,
 *  and the function will instead be bridged to "return this" as per JQuery standard,
 *  permitting chaining to occur. However, as a courtesy, the particular "this" returned
 *  will be augmented with a function that() which will allow the original return
 *  value to be retrieved if desired.
 *  @param {String} name The name under which the "plugin space" is to be injected into
 *  JQuery
 *  @param {Object} peer The root of the namespace corresponding to the peer object.
 */

    fluid.thatistBridge = function (name, peer) {

        var togo = function(funcname) {
            var segs = funcname.split(".");
            var move = peer;
            for (var i = 0; i < segs.length; ++i) {
                move = move[segs[i]];
            }
            var args = [this];
            if (arguments.length === 2) {
                args = args.concat($.makeArray(arguments[1]));
            }
            var ret = move.apply(null, args);
            this.that = function() {
                return ret;
            }
            var type = typeof(ret);
            return !ret || type === "string" || type === "number" || type === "boolean"
              || ret && ret.length !== undefined? ret: this;
        };
        $.fn[name] = togo;
        return togo;
    };

    fluid.thatistBridge("fluid", fluid);
    fluid.thatistBridge("fluid_1_4", fluid_1_4);

/*************************************************************************
 * Tabindex normalization - compensate for browser differences in naming
 * and function of "tabindex" attribute and tabbing order.
 */

    // -- Private functions --
    
    
    var normalizeTabindexName = function() {
        return $.browser.msie ? "tabIndex" : "tabindex";
    };

    var canHaveDefaultTabindex = function(elements) {
       if (elements.length <= 0) {
           return false;
       }

       return $(elements[0]).is("a, input, button, select, area, textarea, object");
    };
    
    var getValue = function(elements) {
        if (elements.length <= 0) {
            return undefined;
        }

        if (!fluid.tabindex.hasAttr(elements)) {
            return canHaveDefaultTabindex(elements) ? Number(0) : undefined;
        }

        // Get the attribute and return it as a number value.
        var value = elements.attr(normalizeTabindexName());
        return Number(value);
    };

    var setValue = function(elements, toIndex) {
        return elements.each(function(i, item) {
            $(item).attr(normalizeTabindexName(), toIndex);
        });
    };
    
    // -- Public API --
    
    /**
     * Gets the value of the tabindex attribute for the first item, or sets the tabindex value of all elements
     * if toIndex is specified.
     * 
     * @param {String|Number} toIndex
     */
    fluid.tabindex = function(target, toIndex) {
        target = $(target);
        if (toIndex !== null && toIndex !== undefined) {
            return setValue(target, toIndex);
        } else {
            return getValue(target);
        }
    };

    /**
     * Removes the tabindex attribute altogether from each element.
     */
    fluid.tabindex.remove = function(target) {
        target = $(target);
        return target.each(function(i, item) {
            $(item).removeAttr(normalizeTabindexName());
        });
    };

    /**
     * Determines if an element actually has a tabindex attribute present.
     */
    fluid.tabindex.hasAttr = function(target) {
        target = $(target);
        if (target.length <= 0) {
            return false;
        }
        var togo = target.map(
            function() {
                var attributeNode = this.getAttributeNode(normalizeTabindexName());
                return attributeNode ? attributeNode.specified : false;
            }
            );
        return togo.length === 1? togo[0] : togo;
    };

    /**
     * Determines if an element either has a tabindex attribute or is naturally tab-focussable.
     */
    fluid.tabindex.has = function(target) {
        target = $(target);
        return fluid.tabindex.hasAttr(target) || canHaveDefaultTabindex(target);
    };

    // Keyboard navigation
    // Public, static constants needed by the rest of the library.
    fluid.a11y = $.a11y || {};

    fluid.a11y.orientation = {
        HORIZONTAL: 0,
        VERTICAL: 1,
        BOTH: 2
    };

    var UP_DOWN_KEYMAP = {
        next: $.ui.keyCode.DOWN,
        previous: $.ui.keyCode.UP
    };

    var LEFT_RIGHT_KEYMAP = {
        next: $.ui.keyCode.RIGHT,
        previous: $.ui.keyCode.LEFT
    };

    // Private functions.
    var unwrap = function(element) {
        return element.jquery ? element[0] : element; // Unwrap the element if it's a jQuery.
    };


    var makeElementsTabFocussable = function(elements) {
        // If each element doesn't have a tabindex, or has one set to a negative value, set it to 0.
        elements.each(function(idx, item) {
            item = $(item);
            if (!item.fluid("tabindex.has") || item.fluid("tabindex") < 0) {
                item.fluid("tabindex", 0);
            }
        });
    };

    // Public API.
    /**
     * Makes all matched elements available in the tab order by setting their tabindices to "0".
     */
    fluid.tabbable = function(target) {
        target = $(target);
        makeElementsTabFocussable(target);
    };

    /*********************************************************************** 
     * Selectable functionality - geometrising a set of nodes such that they
     * can be navigated (by setting focus) using a set of directional keys
     */

    var CONTEXT_KEY = "selectionContext";
    var NO_SELECTION = -32768;

    var cleanUpWhenLeavingContainer = function(selectionContext) {
        if (selectionContext.activeItemIndex !== NO_SELECTION) {
            if (selectionContext.options.onLeaveContainer) {
                selectionContext.options.onLeaveContainer(
                  selectionContext.selectables[selectionContext.activeItemIndex]);
            } else if (selectionContext.options.onUnselect) {
                selectionContext.options.onUnselect(
                selectionContext.selectables[selectionContext.activeItemIndex]);
            }
        }

        if (!selectionContext.options.rememberSelectionState) {
            selectionContext.activeItemIndex = NO_SELECTION;
        }
    };

    /**
     * Does the work of selecting an element and delegating to the client handler.
     */
    var drawSelection = function(elementToSelect, handler) {
        if (handler) {
            handler(elementToSelect);
        }
    };

    /**
     * Does does the work of unselecting an element and delegating to the client handler.
     */
    var eraseSelection = function(selectedElement, handler) {
        if (handler && selectedElement) {
            handler(selectedElement);
        }
    };

    var unselectElement = function(selectedElement, selectionContext) {
        eraseSelection(selectedElement, selectionContext.options.onUnselect);
    };

    var selectElement = function(elementToSelect, selectionContext) {
        // It's possible that we're being called programmatically, in which case we should clear any previous selection.
        unselectElement(selectionContext.selectedElement(), selectionContext);

        elementToSelect = unwrap(elementToSelect);
        var newIndex = selectionContext.selectables.index(elementToSelect);

        // Next check if the element is a known selectable. If not, do nothing.
        if (newIndex === -1) {
           return;
        }

        // Select the new element.
        selectionContext.activeItemIndex = newIndex;
        drawSelection(elementToSelect, selectionContext.options.onSelect);
    };

    var selectableFocusHandler = function(selectionContext) {
        return function(evt) {
            // FLUID-3590: newer browsers (FF 3.6, Webkit 4) have a form of "bug" in that they will go bananas
            // on attempting to move focus off an element which has tabindex dynamically set to -1.
            $(evt.target).fluid("tabindex", 0);
            selectElement(evt.target, selectionContext);

            // Force focus not to bubble on some browsers.
            return evt.stopPropagation();
        };
    };

    var selectableBlurHandler = function(selectionContext) {
        return function(evt) {
            $(evt.target).fluid("tabindex", selectionContext.options.selectablesTabindex);
            unselectElement(evt.target, selectionContext);

            // Force blur not to bubble on some browsers.
            return evt.stopPropagation();
        };
    };

    var reifyIndex = function(sc_that) {
        var elements = sc_that.selectables;
        if (sc_that.activeItemIndex >= elements.length) {
            sc_that.activeItemIndex = 0;
        }
        if (sc_that.activeItemIndex < 0 && sc_that.activeItemIndex !== NO_SELECTION) {
            sc_that.activeItemIndex = elements.length - 1;
        }
        if (sc_that.activeItemIndex >= 0) {
            fluid.focus(elements[sc_that.activeItemIndex]);
        }
    };

    var prepareShift = function(selectionContext) {
        // FLUID-3590: FF 3.6 and Safari 4.x won't fire blur() when programmatically moving focus.
        var selElm = selectionContext.selectedElement();
        if (selElm) {
            fluid.blur(selElm);
        }

        unselectElement(selectionContext.selectedElement(), selectionContext);
        if (selectionContext.activeItemIndex === NO_SELECTION) {
          selectionContext.activeItemIndex = -1;
        }
    };

    var focusNextElement = function(selectionContext) {
        prepareShift(selectionContext);
        ++selectionContext.activeItemIndex;
        reifyIndex(selectionContext);
    };

    var focusPreviousElement = function(selectionContext) {
        prepareShift(selectionContext);
        --selectionContext.activeItemIndex;
        reifyIndex(selectionContext);
    };

    var arrowKeyHandler = function(selectionContext, keyMap, userHandlers) {
        return function(evt) {
            if (evt.which === keyMap.next) {
                focusNextElement(selectionContext);
                evt.preventDefault();
            } else if (evt.which === keyMap.previous) {
                focusPreviousElement(selectionContext);
                evt.preventDefault();
            }
        };
    };

    var getKeyMapForDirection = function(direction) {
        // Determine the appropriate mapping for next and previous based on the specified direction.
        var keyMap;
        if (direction === fluid.a11y.orientation.HORIZONTAL) {
            keyMap = LEFT_RIGHT_KEYMAP;
        } 
        else if (direction === fluid.a11y.orientation.VERTICAL) {
            // Assume vertical in any other case.
            keyMap = UP_DOWN_KEYMAP;
        }

        return keyMap;
    };

    var tabKeyHandler = function(selectionContext) {
        return function(evt) {
            if (evt.which !== $.ui.keyCode.TAB) {
                return;
            }
            cleanUpWhenLeavingContainer(selectionContext);

            // Catch Shift-Tab and note that focus is on its way out of the container.
            if (evt.shiftKey) {
                selectionContext.focusIsLeavingContainer = true;
            }
        };
    };

    var containerFocusHandler = function(selectionContext) {
        return function(evt) {
            var shouldOrig = selectionContext.options.autoSelectFirstItem;
            var shouldSelect = typeof(shouldOrig) === "function" ? 
                 shouldOrig() : shouldOrig;

            // Override the autoselection if we're on the way out of the container.
            if (selectionContext.focusIsLeavingContainer) {
                shouldSelect = false;
            }

            // This target check works around the fact that sometimes focus bubbles, even though it shouldn't.
            if (shouldSelect && evt.target === selectionContext.container.get(0)) {
                if (selectionContext.activeItemIndex === NO_SELECTION) {
                    selectionContext.activeItemIndex = 0;
                }
                fluid.focus(selectionContext.selectables[selectionContext.activeItemIndex]);
            }

           // Force focus not to bubble on some browsers.
           return evt.stopPropagation();
        };
    };

    var containerBlurHandler = function(selectionContext) {
        return function(evt) {
            selectionContext.focusIsLeavingContainer = false;

            // Force blur not to bubble on some browsers.
            return evt.stopPropagation();
        };
    };

    var makeElementsSelectable = function(container, defaults, userOptions) {

        var options = $.extend(true, {}, defaults, userOptions);

        var keyMap = getKeyMapForDirection(options.direction);

        var selectableElements = options.selectableElements? options.selectableElements :
              container.find(options.selectableSelector);
          
        // Context stores the currently active item(undefined to start) and list of selectables.
        var that = {
            container: container,
            activeItemIndex: NO_SELECTION,
            selectables: selectableElements,
            focusIsLeavingContainer: false,
            options: options
        };

        that.selectablesUpdated = function(focusedItem) {
          // Remove selectables from the tab order and add focus/blur handlers
            if (typeof(that.options.selectablesTabindex) === "number") {
                that.selectables.fluid("tabindex", that.options.selectablesTabindex);
            }
            that.selectables.unbind("focus." + CONTEXT_KEY);
            that.selectables.unbind("blur." + CONTEXT_KEY);
            that.selectables.bind("focus."+ CONTEXT_KEY, selectableFocusHandler(that));
            that.selectables.bind("blur." + CONTEXT_KEY, selectableBlurHandler(that));
            if (keyMap && that.options.noBubbleListeners) {
                that.selectables.unbind("keydown."+CONTEXT_KEY);
                that.selectables.bind("keydown."+CONTEXT_KEY, arrowKeyHandler(that, keyMap));
            }
            if (focusedItem) {
                selectElement(focusedItem, that);
            }
            else {
                reifyIndex(that);
            }
        };

        that.refresh = function() {
            if (!that.options.selectableSelector) {
                throw("Cannot refresh selectable context which was not initialised by a selector");
            }
            that.selectables = container.find(options.selectableSelector);
            that.selectablesUpdated();
        };
        
        that.selectedElement = function() {
            return that.activeItemIndex < 0? null : that.selectables[that.activeItemIndex];
        };
        
        // Add various handlers to the container.
        if (keyMap && !that.options.noBubbleListeners) {
            container.keydown(arrowKeyHandler(that, keyMap));
        }
        container.keydown(tabKeyHandler(that));
        container.focus(containerFocusHandler(that));
        container.blur(containerBlurHandler(that));
        
        that.selectablesUpdated();

        return that;
    };

    /**
     * Makes all matched elements selectable with the arrow keys.
     * Supply your own handlers object with onSelect: and onUnselect: properties for custom behaviour.
     * Options provide configurability, including direction: and autoSelectFirstItem:
     * Currently supported directions are jQuery.a11y.directions.HORIZONTAL and VERTICAL.
     */
    fluid.selectable = function(target, options) {
        target = $(target);
        var that = makeElementsSelectable(target, fluid.selectable.defaults, options);
        fluid.setScopedData(target, CONTEXT_KEY, that);
        return that;
    };

    /**
     * Selects the specified element.
     */
    fluid.selectable.select = function(target, toSelect) {
        fluid.focus(toSelect);
    };

    /**
     * Selects the next matched element.
     */
    fluid.selectable.selectNext = function(target) {
        target = $(target);
        focusNextElement(fluid.getScopedData(target, CONTEXT_KEY));
    };

    /**
     * Selects the previous matched element.
     */
    fluid.selectable.selectPrevious = function(target) {
        target = $(target);
        focusPreviousElement(fluid.getScopedData(target, CONTEXT_KEY));
    };

    /**
     * Returns the currently selected item wrapped as a jQuery object.
     */
    fluid.selectable.currentSelection = function(target) {
        target = $(target);
        var that = fluid.getScopedData(target, CONTEXT_KEY);
        return $(that.selectedElement());
    };

    fluid.selectable.defaults = {
        direction: fluid.a11y.orientation.VERTICAL,
        selectablesTabindex: -1,
        autoSelectFirstItem: true,
        rememberSelectionState: true,
        selectableSelector: ".selectable",
        selectableElements: null,
        onSelect: null,
        onUnselect: null,
        onLeaveContainer: null
    };

    /********************************************************************
     *  Activation functionality - declaratively associating actions with 
     * a set of keyboard bindings.
     */

    var checkForModifier = function(binding, evt) {
        // If no modifier was specified, just return true.
        if (!binding.modifier) {
            return true;
        }

        var modifierKey = binding.modifier;
        var isCtrlKeyPresent = modifierKey && evt.ctrlKey;
        var isAltKeyPresent = modifierKey && evt.altKey;
        var isShiftKeyPresent = modifierKey && evt.shiftKey;

        return isCtrlKeyPresent || isAltKeyPresent || isShiftKeyPresent;
    };

    /** Constructs a raw "keydown"-facing handler, given a binding entry. This
     *  checks whether the key event genuinely triggers the event and forwards it
     *  to any "activateHandler" registered in the binding. 
     */
    var makeActivationHandler = function(binding) {
        return function(evt) {
            var target = evt.target;
            if (!fluid.enabled(evt.target)) {
                return;
            }
// The following 'if' clause works in the real world, but there's a bug in the jQuery simulation
// that causes keyboard simulation to fail in Safari, causing our tests to fail:
//     http://ui.jquery.com/bugs/ticket/3229
// The replacement 'if' clause works around this bug.
// When this issue is resolved, we should revert to the original clause.
//            if (evt.which === binding.key && binding.activateHandler && checkForModifier(binding, evt)) {
            var code = evt.which? evt.which : evt.keyCode;
            if (code === binding.key && binding.activateHandler && checkForModifier(binding, evt)) {
                var event = $.Event("fluid-activate");
                $(evt.target).trigger(event, [binding.activateHandler]);
                if (event.isDefaultPrevented()) {
                    evt.preventDefault();
                }
            }
        };
    };

    var makeElementsActivatable = function(elements, onActivateHandler, defaultKeys, options) {
        // Create bindings for each default key.
        var bindings = [];
        $(defaultKeys).each(function(index, key) {
            bindings.push({
                modifier: null,
                key: key,
                activateHandler: onActivateHandler
            });
        });

        // Merge with any additional key bindings.
        if (options && options.additionalBindings) {
            bindings = bindings.concat(options.additionalBindings);
        }

        fluid.initEnablement(elements);

        // Add listeners for each key binding.
        for (var i = 0; i < bindings.length; ++ i) {
            var binding = bindings[i];
            elements.keydown(makeActivationHandler(binding));
        }
        elements.bind("fluid-activate", function(evt, handler) {
            handler = handler || onActivateHandler;
            return handler? handler(evt): null;
        });
    };

    /**
     * Makes all matched elements activatable with the Space and Enter keys.
     * Provide your own handler function for custom behaviour.
     * Options allow you to provide a list of additionalActivationKeys.
     */
    fluid.activatable = function(target, fn, options) {
        target = $(target);
        makeElementsActivatable(target, fn, fluid.activatable.defaults.keys, options);
    };

    /**
     * Activates the specified element.
     */
    fluid.activate = function(target) {
        $(target).trigger("fluid-activate");
    };

    // Public Defaults.
    fluid.activatable.defaults = {
        keys: [$.ui.keyCode.ENTER, $.ui.keyCode.SPACE]
    };

  
  })(jQuery, fluid_1_4);
/*
Copyright 2010-2011 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

/** This file contains functions which depend on the presence of a DOM document
 *  and which depend on the contents of Fluid.js **/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    fluid.defaults("fluid.ariaLabeller", {
        labelAttribute: "aria-label",
        liveRegionMarkup: "<div class=\"liveRegion fl-offScreen-hidden\" aria-live=\"polite\"></div>",
        liveRegionId: "fluid-ariaLabeller-liveRegion",
        invokers: {
            generateLiveElement: {funcName: "fluid.ariaLabeller.generateLiveElement", args: ["{ariaLabeller}"]}
        }
    });
 
    fluid.ariaLabeller = function (element, options) {
        var that = fluid.initView("fluid.ariaLabeller", element, options);
        fluid.initDependents(that);

        that.update = function (newOptions) {
            newOptions = newOptions || that.options;
            that.container.attr(that.options.labelAttribute, newOptions.text);
            if (newOptions.dynamicLabel) {
                var live = fluid.jById(that.options.liveRegionId); 
                if (live.length === 0) {
                    live = that.generateLiveElement();
                }
                live.text(newOptions.text);
            }
        };
        
        that.update();
        return that;
    };
    
    fluid.ariaLabeller.generateLiveElement = function (that) {
        var liveEl = $(that.options.liveRegionMarkup);
        liveEl.attr("id", that.options.liveRegionId);
        $("body").append(liveEl);
        return liveEl;
    };
    
    var LABEL_KEY = "aria-labelling";
    
    fluid.getAriaLabeller = function (element) {
        element = $(element);
        var that = fluid.getScopedData(element, LABEL_KEY);
        return that;      
    };
    
    /** Manages an ARIA-mediated label attached to a given DOM element. An
     * aria-labelledby attribute and target node is fabricated in the document
     * if they do not exist already, and a "little component" is returned exposing a method
     * "update" that allows the text to be updated. */
    
    fluid.updateAriaLabel = function (element, text, options) {
        options = $.extend({}, options || {}, {text: text});
        var that = fluid.getAriaLabeller(element);
        if (!that) {
            that = fluid.ariaLabeller(element, options);
            fluid.setScopedData(element, LABEL_KEY, that);
        } else {
            that.update(options);
        }
        return that;
    };
    
    /** Sets an interation on a target control, which morally manages a "blur" for
     * a possibly composite region.
     * A timed blur listener is set on the control, which waits for a short period of
     * time (options.delay, defaults to 150ms) to discover whether the reason for the 
     * blur interaction is that either a focus or click is being serviced on a nominated
     * set of "exclusions" (options.exclusions, a free hash of elements or jQueries). 
     * If no such event is received within the window, options.handler will be called
     * with the argument "control", to service whatever interaction is required of the
     * blur.
     */
    
    fluid.deadMansBlur = function (control, options) {
        var that = fluid.initLittleComponent("fluid.deadMansBlur", options);
        that.blurPending = false;
        that.lastCancel = 0;
        $(control).bind("focusout", function (event) {
            fluid.log("Starting blur timer for element " + fluid.dumpEl(event.target));
            var now = new Date().getTime();
            fluid.log("back delay: " + (now - that.lastCancel));
            if (now - that.lastCancel > that.options.backDelay) {
                that.blurPending = true;
            }
            setTimeout(function () {
                if (that.blurPending) {
                    that.options.handler(control);
                }
            }, that.options.delay);
        });
        that.canceller = function (event) {
            fluid.log("Cancellation through " + event.type + " on " + fluid.dumpEl(event.target)); 
            that.lastCancel = new Date().getTime();
            that.blurPending = false;
        };
        fluid.each(that.options.exclusions, function (exclusion) {
            exclusion = $(exclusion);
            fluid.each(exclusion, function (excludeEl) {
                $(excludeEl).bind("focusin", that.canceller).
                    bind("fluid-focus", that.canceller).
                    click(that.canceller);
            });
        });
        return that;
    };

    fluid.defaults("fluid.deadMansBlur", {
        delay: 150,
        backDelay: 100
    });
    
})(jQuery, fluid_1_4);
/*
Copyright 2007-2010 University of Cambridge
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, elsecatch: true, operator: true, jslintok: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    /** The Fluid "IoC System proper" - resolution of references and 
     * completely automated instantiation of declaratively defined
     * component trees */ 
    
    var inCreationMarker = "__CURRENTLY_IN_CREATION__";
    
    // unsupported, non-API function
    fluid.isFireBreak = function(component) {
        return component.options && component.options["fluid.visitComponents.fireBreak"];
    };
    
    fluid.visitComponentChildren = function(that, visitor, options, up, down) {
        options = options || {};
        for (var name in that) {
            var component = that[name];
            //Every component *should* have an id, but some clients may not yet be compliant
            //if (component && component.typeName && !component.id) {
            //    fluid.fail("No id");
            //}
            if (!component || !component.typeName || (component.id && options.visited && options.visited[component.id])) {continue; }
            if (options.visited) {
                options.visited[component.id] = true;
            }
            if (visitor(component, name, options, up, down)) {
                return true;
            }
            if (!fluid.isFireBreak(component) && !options.flat) {
                fluid.visitComponentChildren(component, visitor, options, up, down + 1);
            }
        }
    };
    
    // thatStack contains an increasing list of MORE SPECIFIC thats.
    var visitComponents = function(thatStack, visitor, options) {
        options = options || {
            visited: {},
            flat: true
        };
        var up = 0;
        for (var i = thatStack.length - 1; i >= 0; --i) {
            var that = thatStack[i];
            if (fluid.isFireBreak(that)) {
                return;
            }
            if (that.typeName) {
                options.visited[that.id] = true;
                if (visitor(that, "", options, 0, 0)) {
                    return;
                }
            }
            if (fluid.visitComponentChildren(that, visitor, options, up, 1)) {
                return;
            }
            ++up;
        }
    };
    
    // An EL segment resolver strategy that will attempt to trigger creation of
    // components that it discovers along the EL path, if they have been defined but not yet
    // constructed. Spring, eat your heart out! Wot no SPR-2048?
    
    function makeGingerStrategy(instantiator, that, thatStack) {
        return function(component, thisSeg) {
            var atval = component[thisSeg];
            if (atval === undefined) {
                var parentPath = instantiator.idToPath[component.id];
                atval = instantiator.pathToComponent[fluid.composePath(parentPath, thisSeg)];
                // if it was not attached to the component, but it is in the instantiator, it MUST be in creation - prepare to fail
                if (atval) {
                    atval[inCreationMarker] = true;
                } 
            }
            if (atval !== undefined) {
                if (atval[inCreationMarker]) {
                    fluid.fail("Component " + fluid.dumpThat(atval) + " at path \"" + thisSeg 
                        + "\" of parent " + fluid.dumpThat(component) + " cannot be used for lookup" 
                        + " since it is still in creation. Please reorganise your dependencies so that they no longer contain circular references");
                }
            }
            else {
                if (fluid.get(component, fluid.path("options", "components", thisSeg, "type"))) {
                    fluid.initDependent(component, thisSeg);
                    atval = component[thisSeg];
                }
            }
            return atval;
        };
    }
    
    fluid.dumpThat = function(that, instantiator) {
        return "{ typeName: \"" + that.typeName + "\" id: " + that.id + "}";
    };
    
    fluid.dumpThatStack = function(thatStack, instantiator) {
        var togo = fluid.transform(thatStack, function(that) {
            var path = instantiator.idToPath[that.id];
            return fluid.dumpThat(that) + (path? (" - path: " + path) : "");
        });
        return togo.join("\n");
    };

    var localRecordExpected = /arguments|options|container/;

    function makeStackFetcher(instantiator, parentThat, localRecord, expandOptions) {
        expandOptions = expandOptions || {};
        var thatStack = instantiator.getFullStack(parentThat);
        var fetchStrategies = [fluid.model.funcResolverStrategy, makeGingerStrategy(instantiator, parentThat, thatStack)]; 
        var fetcher = function(parsed) {
            var context = parsed.context;
            if (localRecord && localRecordExpected.test(context)) {
                var fetched = fluid.get(localRecord[context], parsed.path);
                return (context === "arguments" || expandOptions.direct)? fetched : {
                    marker: context === "options"? fluid.EXPAND : fluid.EXPAND_NOW,
                    value: fetched
                };
            }
            var foundComponent;
            visitComponents(thatStack, function(component, name, options, up, down) {
                if (context === name || context === component.typeName || context === component.nickName) {
                    foundComponent = component;
                    if (down > 1) {
                        fluid.log("***WARNING: value resolution for context " + context + " found at depth " + down + ": this may not be supported in future");   
                    }
                    return true; // YOUR VISIT IS AT AN END!!
                }
                if (fluid.get(component, fluid.path("options", "components", context, "type")) && !component[context]) {
                    foundComponent = fluid.get(component, context, {strategies: fetchStrategies});
                    return true;
                }
            });
            if (!foundComponent && parsed.path !== "") {
                var ref = fluid.renderContextReference(parsed);
                fluid.log("Failed to resolve reference " + ref + ": thatStack contains\n" + fluid.dumpThatStack(thatStack, instantiator));
                fluid.fail("Failed to resolve reference " + ref + " - could not match context with name " 
                    + context + " from component root of type " + thatStack[0].typeName);
            }
            return fluid.get(foundComponent, parsed.path, fetchStrategies);
        };
        return fetcher;
    }
     
    function makeStackResolverOptions(instantiator, parentThat, localRecord, expandOptions) {
        return $.extend({}, fluid.defaults("fluid.resolveEnvironment"), {
            noCopy: true,
            fetcher: makeStackFetcher(instantiator, parentThat, localRecord, expandOptions)
        }); 
    }
    
    // unsupported, non-API function
    fluid.instantiator = function(freeInstantiator) {
        // NB: We may not use the options merging framework itself here, since "withInstantiator" below
        // will blow up, as it tries to resolve the instantiator which we are instantiating *NOW*
        var preThat = {
            options: {
                "fluid.visitComponents.fireBreak": true         
            },
            idToPath: {},
            pathToComponent: {},
            stackCount: 0,
            nickName: "instantiator"
        };
        var that = fluid.typeTag("fluid.instantiator");
        that = $.extend(that, preThat);

        that.stack = function(count) {
            return that.stackCount += count;
        };
        that.getThatStack = function(component) {
            var path = that.idToPath[component.id] || "";
            var parsed = fluid.model.parseEL(path);
            var togo = fluid.transform(parsed, function(value, i) {
                var parentPath = fluid.model.composeSegments.apply(null, parsed.slice(0, i + 1));
                return that.pathToComponent[parentPath];    
            });
            var root = that.pathToComponent[""];
            if (root) {
                togo.unshift(root);
            }
            return togo;
        };
        that.getEnvironmentalStack = function() {
            var togo = [fluid.staticEnvironment];
            if (!freeInstantiator) {
                togo.push(fluid.threadLocal());
            }
            return togo;
        };
        that.getFullStack = function(component) {
            var thatStack = component? that.getThatStack(component) : [];
            return that.getEnvironmentalStack().concat(thatStack);
        };
        function recordComponent(component, path) {
            that.idToPath[component.id] = path;
            if (that.pathToComponent[path]) {
                fluid.fail("Error during instantiation - path " + path + " which has just created component " + fluid.dumpThat(component) 
                    + " has already been used for component " + fluid.dumpThat(that.pathToComponent[path]) + " - this is a circular instantiation or other oversight."
                    + " Please clear the component using instantiator.clearComponent() before reusing the path.");
            }
            that.pathToComponent[path] = component;          
        }
        that.recordRoot = function(component) {
            if (component && component.id && !that.pathToComponent[""]) {
                recordComponent(component, "");
            }  
        };
        that.pushUpcomingInstantiation = function(parent, name) {
            that.expectedParent = parent;
            that.expectedName = name;
        };
        that.recordComponent = function(component) {
            if (that.expectedName) {
                that.recordKnownComponent(that.expectedParent, component, that.expectedName);
                delete that.expectedName;
                delete that.expectedParent;
            }
            else {
                that.recordRoot(component);
            }
        };
        that.clearComponent = function(component, name, child, options, noModTree) {
            options = options || {visited: {}, flat: true};
            child = child || component[name];
            fluid.visitComponentChildren(child, function(gchild, gchildname) {
                that.clearComponent(child, gchildname, null, options, noModTree);
            }, options);
            var path = that.idToPath[child.id];
            delete that.idToPath[child.id];
            delete that.pathToComponent[path];
            if (!noModTree) {
                delete component[name];
            }
        };
        that.recordKnownComponent = function(parent, component, name) {
            var parentPath = that.idToPath[parent.id] || "";
            var path = fluid.model.composePath(parentPath, name);
            recordComponent(component, path);
        };
        return that;
    };
    
    fluid.freeInstantiator = fluid.instantiator(true);
    
    // unsupported, non-API function
    fluid.argMapToDemands = function(argMap) {
        var togo = [];
        fluid.each(argMap, function(value, key) {
            togo[value] = "{" + key + "}";  
        });
        return togo;
    };
    
    // unsupported, non-API function
    fluid.makePassArgsSpec = function(initArgs) {
        return fluid.transform(initArgs, function(arg, index) {
            return "{arguments}." + index;
        });
    };
    
    function mergeToMergeAll(options) {
        if (options && options.mergeOptions) {
            options.mergeAllOptions = ["{options}"].concat(fluid.makeArray(options.mergeOptions));
        }
    }
    
    function upgradeMergeOptions(demandspec) {
        mergeToMergeAll(demandspec);
        if (demandspec.mergeAllOptions) {
            if (demandspec.options) {
                fluid.fail("demandspec " + JSON.stringify(demandspec) 
                    + " is invalid - cannot specify literal options together with mergeOptions or mergeAllOptions"); 
            }
            demandspec.options = {
                mergeAllOptions: demandspec.mergeAllOptions
            };
        }
        if (demandspec.options) {
            delete demandspec.options.mergeOptions;
        }
    }
    
    /** Given a concrete argument list and/or options, determine the final concrete
     * "invocation specification" which is coded by the supplied demandspec in the 
     * environment "thatStack" - the return is a package of concrete global function name
     * and argument list which is suitable to be executed directly by fluid.invokeGlobalFunction.
     */
    // unsupported, non-API function
    fluid.embodyDemands = function(instantiator, parentThat, demandspec, initArgs, options) {
        options = options || {};
        
        upgradeMergeOptions(demandspec);
        options.componentRecord = $.extend(true, {}, options.componentRecord, 
            fluid.censorKeys(demandspec, ["args", "funcName"]));
        
        var demands = $.makeArray(demandspec.args);
        var upDefaults = fluid.defaults(demandspec.funcName); // I can SEE into TIME!!
        var argMap = upDefaults? upDefaults.argumentMap : null;
        var inferMap = false;
        if (!argMap && (upDefaults || (options && options.componentRecord)) && !options.passArgs) {
            inferMap = true;
            // infer that it must be a little component if we have any reason to believe it is a component
            if (demands.length < 2) {
                argMap = fluid.rawDefaults("fluid.littleComponent").argumentMap;
            }
            else {
                argMap = {options: demands.length - 1}; // wild guess in the old style
            }
        }
        options = options || {};
        if (demands.length === 0) {
            if (options.componentRecord && argMap) {
                demands = fluid.argMapToDemands(argMap);
            }
            else if (options.passArgs) {
                demands = fluid.makePassArgsSpec(initArgs);
            }
        }
        var localRecord = $.extend({"arguments": initArgs}, fluid.censorKeys(options.componentRecord, ["type"]));
        fluid.each(argMap, function(index, name) {
            if (initArgs.length > 0) {
                localRecord[name] = localRecord["arguments"][index];
            }
            if (demandspec[name] !== undefined && localRecord[name] === undefined) {
                localRecord[name] = demandspec[name];
            }
        });
        mergeToMergeAll(localRecord.options);
        mergeToMergeAll(argMap && demands[argMap.options]);
        var upstreamLocalRecord = $.extend({}, localRecord);
        if (options.componentRecord.options !== undefined) {
            upstreamLocalRecord.options = options.componentRecord.options;
        }
        var expandOptions = makeStackResolverOptions(instantiator, parentThat, localRecord);
        var args = [];
        if (demands) {
            for (var i = 0; i < demands.length; ++i) {
                var arg = demands[i];
                // Weak detection since we cannot guarantee this material has not been copied
                if (fluid.isMarker(arg) && arg.value === fluid.COMPONENT_OPTIONS.value) {
                    arg = "{options}";
                    // Backwards compatibility for non-users of GRADES - last-ditch chance to correct the inference
                    if (inferMap) {
                        argMap = {options: i};
                    } 
                }
                if (typeof(arg) === "string") {
                    if (arg.charAt(0) === "@") {
                        var argpos = arg.substring(1);
                        arg = "{arguments}." + argpos;
                    }
                }
                if (!argMap || argMap.options !== i) {
                    // defer expansion required if it is non-pseudoarguments demands and this argument *is* the options
                    args[i] = fluid.expander.expandLight(arg, expandOptions);
                }
                else { // It is the component options
                    if (arg && typeof(arg) === "object" && !arg.targetTypeName) {
                        arg.targetTypeName = demandspec.funcName;
                    }
                    args[i] = {marker: fluid.EXPAND, value: arg, localRecord: upstreamLocalRecord};
                }
                if (args[i] && fluid.isMarker(args[i].marker, fluid.EXPAND_NOW)) {
                    args[i] = fluid.expander.expandLight(args[i].value, expandOptions);
                }
            }
        }
        else {
            args = initArgs? initArgs : [];
        }

        var togo = {
            args: args,
            funcName: demandspec.funcName
        };
        return togo;
    };
    
    var aliasTable = {};
    
    fluid.alias = function(demandingName, aliasName) {
        if (aliasName) {
            aliasTable[demandingName] = aliasName;
        }
        else {
            return aliasTable[demandingName];
        }
    };
   
    var dependentStore = {};
    
    function searchDemands(demandingName, contextNames) {
        var exist = dependentStore[demandingName] || [];
outer:  for (var i = 0; i < exist.length; ++i) {
            var rec = exist[i];
            for (var j = 0; j < contextNames.length; ++j) {
                if (rec.contexts[j] !== contextNames[j]) {
                    continue outer;
                }
            }
            return rec.spec; // jslint:ok
        }
    }
    
    fluid.demands = function(demandingName, contextName, spec) {
        var contextNames = $.makeArray(contextName).sort(); 
        if (!spec) {
            return searchDemands(demandingName, contextNames);
        }
        else if (spec.length) {
            spec = {args: spec};
        }
        if (fluid.getCallerInfo) {
            var callerInfo = fluid.getCallerInfo(5);
            if (callerInfo) {
                spec.registeredFrom = callerInfo;
            }
        }
        var exist = dependentStore[demandingName];
        if (!exist) {
            exist = [];
            dependentStore[demandingName] = exist;
        }
        exist.push({contexts: contextNames, spec: spec});
    };

    // unsupported, non-API function
    fluid.compareDemands = function(speca, specb) {
        var p1 = speca.uncess - specb.uncess;
        return p1 === 0? specb.intersect - speca.intersect : p1;
    };
    
    // unsupported, non-API function
    fluid.isDemandLogging = function(demandingNames) {
        return fluid.isLogging() && demandingNames[0] !== "fluid.threadLocal";
    };
    
    // unsupported, non-API function
    fluid.locateAllDemands = function(instantiator, parentThat, demandingNames) {
        var demandLogging = fluid.isDemandLogging(demandingNames);
        if (demandLogging) {
            fluid.log("Resolving demands for function names " + JSON.stringify(demandingNames) + " in context of " +
                (parentThat? "component " + parentThat.typeName : "no component"));
        }
        
        var contextNames = {};
        var visited = [];
        var thatStack = instantiator.getFullStack(parentThat);
        visitComponents(thatStack, function(component, xname, options, up, down) {
            contextNames[component.typeName] = true;
            visited.push(component);
        });
        if (demandLogging) {
            fluid.log("Components in scope for resolution:\n" + fluid.dumpThatStack(visited, instantiator));  
        }
        var matches = [];
        for (var i = 0; i < demandingNames.length; ++i) {
            var rec = dependentStore[demandingNames[i]] || [];
            for (var j = 0; j < rec.length; ++j) {
                var spec = rec[j];
                var record = {spec: spec, intersect: 0, uncess: 0};
                for (var k = 0; k < spec.contexts.length; ++k) {
                    record[contextNames[spec.contexts[k]]? "intersect" : "uncess"] += 2;
                }
                if (spec.contexts.length === 0) { // allow weak priority for contextless matches
                    record.intersect++;
                }
                // TODO: Potentially more subtle algorithm here - also ambiguity reports  
                matches.push(record); 
            }
        }
        matches.sort(fluid.compareDemands);
        return matches;   
    };

    // unsupported, non-API function
    fluid.locateDemands = function(instantiator, parentThat, demandingNames) {
        var matches = fluid.locateAllDemands(instantiator, parentThat, demandingNames);
        var demandspec = matches.length === 0 || matches[0].intersect === 0? null : matches[0].spec.spec;
        if (fluid.isDemandLogging(demandingNames)) {
            fluid.log(demandspec? "Located " + matches.length + " potential match" + (matches.length === 1? "" : "es") + ", selected best match with " + matches[0].intersect 
                + " matched context names: " + JSON.stringify(demandspec) : "No matches found for demands, using direct implementation");
        }  
        return demandspec;
    };
    
    /** Determine the appropriate demand specification held in the fluid.demands environment 
     * relative to "thatStack" for the function name(s) funcNames.
     */
    // unsupported, non-API function
    fluid.determineDemands = function (instantiator, parentThat, funcNames) {
        funcNames = $.makeArray(funcNames);
        var newFuncName = funcNames[0];
        var demandspec = fluid.locateDemands(instantiator, parentThat, funcNames) || {};
        if (demandspec.funcName) {
            newFuncName = demandspec.funcName;
        }
        
        var aliasTo = fluid.alias(newFuncName);
        
        if (aliasTo) {
            newFuncName = aliasTo;
            fluid.log("Following redirect from function name " + newFuncName + " to " + aliasTo);
            var demandspec2 = fluid.locateDemands(instantiator, parentThat, [aliasTo]);
            if (demandspec2) {
                fluid.each(demandspec2, function(value, key) {
                    if (localRecordExpected.test(key)) {
                        fluid.fail("Error in demands block " + JSON.stringify(demandspec2) + " - content with key \"" + key 
                            + "\" is not supported since this demands block was resolved via an alias from \"" + newFuncName + "\"");
                    }  
                });
                if (demandspec2.funcName) {
                    newFuncName = demandspec2.funcName;
                    fluid.log("Followed final inner demands to function name \"" + newFuncName + "\"");
                }
            }
        }
        
        return fluid.merge(null, {funcName: newFuncName, args: fluid.makeArray(demandspec.args)}, fluid.censorKeys(demandspec, ["funcName", "args"]));
    };
    
    // unsupported, non-API function
    fluid.resolveDemands = function(instantiator, parentThat, funcNames, initArgs, options) {
        var demandspec = fluid.determineDemands(instantiator, parentThat, funcNames);
        return fluid.embodyDemands(instantiator, parentThat, demandspec, initArgs, options);
    };
    
    // TODO: make a *slightly* more performant version of fluid.invoke that perhaps caches the demands
    // after the first successful invocation
    fluid.invoke = function(functionName, args, that, environment) {
        args = fluid.makeArray(args);
        return fluid.withInstantiator(that, function(instantiator) {
            var invokeSpec = fluid.resolveDemands(instantiator, that, functionName, args, {passArgs: true});
            return fluid.invokeGlobalFunction(invokeSpec.funcName, invokeSpec.args, environment);
        });
    };
    
    /** Make a function which performs only "static redispatch" of the supplied function name - 
     * that is, taking only account of the contents of the "static environment". Since the static
     * environment is assumed to be constant, the dispatch of the call will be evaluated at the
     * time this call is made, as an optimisation.
     */
    
    fluid.makeFreeInvoker = function(functionName, environment) {
        var demandSpec = fluid.determineDemands(fluid.freeInstantiator, null, functionName);
        return function() {
            var invokeSpec = fluid.embodyDemands(fluid.freeInstantiator, null, demandSpec, arguments, {passArgs: true});
            return fluid.invokeGlobalFunction(invokeSpec.funcName, invokeSpec.args, environment);
        };
    };
    
    fluid.makeInvoker = function(instantiator, that, demandspec, functionName, environment) {
        demandspec = demandspec || fluid.determineDemands(instantiator, that, functionName);
        return function() {
            var invokeSpec = fluid.embodyDemands(instantiator, that, demandspec, arguments, {passArgs: true});
            return fluid.invokeGlobalFunction(invokeSpec.funcName, invokeSpec.args, environment);
        };
    };
    
    // unsupported, non-API function
    fluid.event.dispatchListener = function(instantiator, that, listener, eventName, eventSpec) {
        return function() {
            var demandspec = fluid.determineDemands(instantiator, that, eventName);
            if (demandspec.args.length === 0 && eventSpec.args) {
                demandspec.args = eventSpec.args;
            }
            var resolved = fluid.embodyDemands(instantiator, that, demandspec, arguments, {passArgs: true, componentOptions: eventSpec}); 
            listener.apply(null, resolved.args);
        }; 
    };
    
    // unsupported, non-API function
    fluid.event.resolveEvent = function(that, eventName, eventSpec) {
        return fluid.withInstantiator(that, function(instantiator) {
            if (typeof(eventSpec) === "string") {
                var firer = fluid.expandOptions(eventSpec, that);
                if (!firer) {
                    fluid.fail("Error in fluid.event.resolveEvent - context path " + eventSpec + " could not be looked up to a valid event firer");
                }
                return firer;
            }
            else {
                var event = eventSpec.event;
                var origin;
                if (!event) {
                    fluid.fail("Event specification for event with name " + eventName + " does not include a base event specification");
                }
                if (event.charAt(0) === "{") {
                    origin = fluid.expandOptions(event, that);
                }
                else {
                    origin = that.events[event];
                }
                if (!origin) {
                    fluid.fail("Error in event specification - could not resolve base event reference " + event + " to an event firer");
                }
                var firer = {}; // jslint:ok - already defined
                fluid.each(["fire", "removeListener"], function(method) {
                    firer[method] = function() {origin[method].apply(null, arguments);};
                });
                firer.addListener = function(listener, namespace, predicate, priority) {
                    origin.addListener(fluid.event.dispatchListener(instantiator, that, listener, eventName, eventSpec),
                        namespace, predicate, priority);
                };
                return firer;
            }
        }); 
    };
    
        
    fluid.registerNamespace("fluid.expander");
    
    /** rescue that part of a component's options which should not be subject to
     * options expansion via IoC - this initially consists of "components" and "mergePolicy" 
     * but will be expanded by the set of paths specified as "noexpand" within "mergePolicy" 
     */
    // unsupported, non-API function
    fluid.expander.preserveFromExpansion = function(options) {
        var preserve = {};
        var preserveList = ["mergePolicy", "mergeAllOptions", "components", "invokers", "events", "listeners"];
        fluid.each(options.mergePolicy, function(value, key) {
            if (fluid.mergePolicyIs(value, "noexpand")) {
                preserveList.push(key);
            }
        });
        fluid.each(preserveList, function(path) {
            var pen = fluid.model.getPenultimate(options, path);
            var value = pen.root[pen.last];
            delete pen.root[pen.last];
            fluid.set(preserve, path, value);  
        });
        return {
            restore: function(target) {
                fluid.each(preserveList, function(path) {
                    var preserved = fluid.get(preserve, path);
                    if (preserved !== undefined) {
                        fluid.set(target, path, preserved);
                    }
                });
            }
        };
    };
    
    /** Expand a set of component options with respect to a set of "expanders" (essentially only
     *  deferredCall) -  This substitution is destructive since it is assumed that the options are already "live" as the
     *  result of environmental substitutions. Note that options contained inside "components" will not be expanded
     *  by this call directly to avoid linearly increasing expansion depth if this call is occuring as a result of
     *  "initDependents" */
     // TODO: This needs to be integrated with "embodyDemands" above which makes a call to "resolveEnvironment" directly
     // but with very similarly derived options (makeStackResolverOptions)
    fluid.expandOptions = function(args, that, localRecord, outerExpandOptions) {
        if (!args) {
            return args;
        }
        return fluid.withInstantiator(that, function(instantiator) {
            //fluid.log("expandOptions for " + that.typeName + " executing with instantiator " + instantiator.id);
            var expandOptions = makeStackResolverOptions(instantiator, that, localRecord, outerExpandOptions);
            expandOptions.noCopy = true; // It is still possible a model may be fetched even though it is preserved
            var pres;
            if (!fluid.isArrayable(args) && !fluid.isPrimitive(args)) {
                pres = fluid.expander.preserveFromExpansion(args);
            }
            var expanded = fluid.expander.expandLight(args, expandOptions);
            if (pres) {
                pres.restore(expanded);
            }
            return expanded;
        });
    };
    
    fluid.locateTransformationRecord = function(that) {
        return fluid.withInstantiator(that, function(instantiator) {
            var matches = fluid.locateAllDemands(instantiator, that, ["fluid.transformOptions"]);
            return fluid.find(matches, function(match) {
                return match.uncess === 0 && fluid.contains(match.spec.contexts, that.typeName)? match.spec.spec : undefined;
            });
        });
    };
    
    // unsupported, non-API function
    fluid.expandComponentOptions = function(defaults, userOptions, that) {
        defaults = fluid.expandOptions(fluid.copy(defaults), that);
        var localRecord = {};
        if (userOptions && userOptions.marker === fluid.EXPAND) {
            // TODO: Somewhat perplexing... the local record itself, by any route we could get here, consists of unexpanded
            // material taken from "componentOptions"
            var localOptions = fluid.get(userOptions, "localRecord.options");
            if (localOptions) {
                if (defaults && defaults.mergePolicy) {
                    localOptions.mergePolicy = defaults.mergePolicy;
                }
                localRecord.options = fluid.expandOptions(localOptions, that);
            }
            localRecord["arguments"] = fluid.get(userOptions, "localRecord.arguments");
            var toExpand = userOptions.value;
            userOptions = fluid.expandOptions(toExpand, that, localRecord, {direct: true});
        }
        localRecord.directOptions = userOptions;
        if (!localRecord.options) {
            // Catch the case where there is no demands block and everything is in the subcomponent record - 
            // in this case, embodyDemands will not construct a localRecord and what the user refers to by "options"
            // is really what we properly call "directOptions".
            localRecord.options = userOptions;
        }
        var mergeOptions = (userOptions && userOptions.mergeAllOptions) || ["{directOptions}"];
        var togo = fluid.transform(mergeOptions, function(path) {
            // Avoid use of expandOptions in simple case to avoid infinite recursion when constructing instantiator
            return path === "{directOptions}"? localRecord.directOptions : fluid.expandOptions(path, that, localRecord, {direct: true}); 
        });
        var transRec = fluid.locateTransformationRecord(that);
        if (transRec) {
            togo[0].transformOptions = transRec.options;
        }
        return [defaults].concat(togo);
    };
    
    // The case without the instantiator is from the ginger strategy - this logic is still a little ragged
    fluid.initDependent = function(that, name, userInstantiator, directArgs) {
        if (!that || that[name]) { return; }
        fluid.log("Beginning instantiation of component with name \"" + name + "\" as child of " + fluid.dumpThat(that));
        directArgs = directArgs || [];
        var root = fluid.threadLocal();
        if (userInstantiator) {
            var existing = root["fluid.instantiator"];
            if (existing && existing !== userInstantiator) {
                fluid.fail("Error in initDependent: user instantiator supplied with id " + userInstantiator.id 
                    + " which differs from that for currently active instantiation with id " + existing.id);
            }
            else {
                root["fluid.instantiator"] = userInstantiator;
                // fluid.log("*** initDependent for " + that.typeName + " member " + name + " was supplied USER instantiator with id " + userInstantiator.id + " - STORED");
            }
        }
        
        fluid.withInstantiator(that, function(instantiator) {
            var component = that.options.components[name];
            if (typeof(component) === "string") {
                that[name] = fluid.expandOptions([component], that)[0]; // TODO: expose more sensible semantic for expandOptions 
            }
            else if (component.type) {
                var invokeSpec = fluid.resolveDemands(instantiator, that, [component.type, name], directArgs, {componentRecord: component});
                instantiator.pushUpcomingInstantiation(that, name);
                try {
                    that[inCreationMarker] = true;
                    var instance = fluid.initSubcomponentImpl(that, {type: invokeSpec.funcName}, invokeSpec.args);
                    // The existing instantiator record will be provisional, adjust it to take account of the true return
                    // TODO: Instantiator contents are generally extremely incomplete
                    var path = fluid.composePath(instantiator.idToPath[that.id] || "", name);
                    var existing = instantiator.pathToComponent[path];
                    if (existing && existing !== instance) {
                        instantiator.clearComponent(that, name, existing, null, true);
                    }
                    if (instance && instance.typeName && instance.id && instance !== existing) {
                        instantiator.recordKnownComponent(that, instance, name);
                    }
                    that[name] = instance;
                }
                finally {
                    delete that[inCreationMarker];
                    instantiator.pushUpcomingInstantiation();
                }
            }
            else { 
                that[name] = component;
            }
        });
        fluid.log("Finished instantiation of component with name \"" + name + "\" as child of " + fluid.dumpThat(that));
    };
    
    // NON-API function
    // This function is stateful and MUST NOT be called by client code
    fluid.withInstantiator = function(that, func) {
        var root = fluid.threadLocal();
        var instantiator = root["fluid.instantiator"];
        if (!instantiator) {
            instantiator = root["fluid.instantiator"] = fluid.instantiator();
            //fluid.log("Created new instantiator with id " + instantiator.id + " in order to operate on component " + typeName);
        }
        try {
            if (that) {
                instantiator.recordComponent(that);
            }
            instantiator.stack(1);
            //fluid.log("Instantiator stack +1 to " + instantiator.stackCount + " for " + typeName);
            return func(instantiator);
        }
        finally {
            var count = instantiator.stack(-1);
            //fluid.log("Instantiator stack -1 to " + instantiator.stackCount + " for " + typeName);
            if (count === 0) {
                //fluid.log("Clearing instantiator with id " + instantiator.id + " from threadLocal for end of " + typeName);
                delete root["fluid.instantiator"];
            }
        }              
    };
    
    // unsupported, non-API function
    fluid.bindDeferredComponent = function(that, componentName, component) {
        fluid.withInstantiator(that, function(instantiator) {
            var events = fluid.makeArray(component.createOnEvent);
            fluid.each(events, function(eventName) {
                that.events[eventName].addListener(function() {
                    if (that[componentName]) {
                        instantiator.clearComponent(that, componentName);
                    }
                    fluid.initDependent(that, componentName, instantiator);
                }, null, null, component.priority);
            });
        });
    };
    
    // unsupported, non-API function
    fluid.priorityForComponent = function(component) {
        return component.priority? component.priority : 
            (component.type === "fluid.typeFount" || fluid.hasGrade(fluid.defaults(component.type), "fluid.typeFount"))?
            "first" : undefined;  
    };
    
    fluid.initDependents = function(that) {
        var options = that.options;
        var components = options.components || {};
        var componentSort = {};
        fluid.each(components, function(component, name) {
            if (!component.createOnEvent) {
                var priority = fluid.priorityForComponent(component);
                componentSort[name] = {key: name, priority: fluid.event.mapPriority(priority)};
            }
            else {
                fluid.bindDeferredComponent(that, name, component);
            }
        });
        var componentList = fluid.event.sortListeners(componentSort);
        fluid.withInstantiator(that, function(instantiator) {
            fluid.each(componentList, function(entry) {
                fluid.initDependent(that, entry.key);  
            });
            var invokers = options.invokers || {};
            for (var name in invokers) {
                var invokerec = invokers[name];
                var funcName = typeof(invokerec) === "string"? invokerec : null;
                that[name] = fluid.withInstantiator(that, function(instantiator) {
                    fluid.log("Beginning instantiation of invoker with name \"" + name + "\" as child of " + fluid.dumpThat(that)); 
                    return fluid.makeInvoker(instantiator, that, funcName? null : invokerec, funcName);
                }); // jslint:ok
                fluid.log("Finished instantiation of invoker with name \"" + name + "\" as child of " + fluid.dumpThat(that)); 
            }
        });
    };   
        
    fluid.staticEnvironment = fluid.typeTag("fluid.staticEnvironment");
    
    fluid.staticEnvironment.environmentClass = fluid.typeTag("fluid.browser");
    
    // fluid.environmentalRoot.environmentClass = fluid.typeTag("fluid.rhino");
    
    fluid.demands("fluid.threadLocal", "fluid.browser", {funcName: "fluid.singleThreadLocal"});

    var singleThreadLocal = fluid.typeTag("fluid.dynamicEnvironment");
    
    fluid.singleThreadLocal = function() {
        return singleThreadLocal;
    };

    fluid.threadLocal = function() {
        // quick implementation since this is not very dynamic, a hazard to debugging, and used frequently within IoC itself
        var demands = fluid.locateDemands(fluid.freeInstantiator, null, ["fluid.threadLocal"]);
        return fluid.invokeGlobalFunction(demands.funcName, arguments);
    };

    function applyLocalChange(applier, type, path, value) {
        var change = {
            type: type,
            path: path,
            value: value
        };
        applier.fireChangeRequest(change);
    }

    // unsupported, non-API function
    fluid.withEnvironment = function(envAdd, func, prefix) {
        prefix = prefix || "";
        var root = fluid.threadLocal();
        var applier = fluid.makeChangeApplier(root, {thin: true});
        try {
            for (var key in envAdd) {
                applyLocalChange(applier, "ADD", fluid.model.composePath(prefix, key), envAdd[key]);
            }
            $.extend(root, envAdd);
            return func();
        }
        finally {
            for (var key in envAdd) {
              // TODO: This could be much better through i) refactoring the ChangeApplier so we could naturally use "rollback" semantics 
              // and/or implementing this material using some form of "prototype chain"
                applyLocalChange(applier, "DELETE", fluid.model.composePath(prefix, key));
            }
        }
    };
    
    // unsupported, non-API function  
    fluid.makeEnvironmentFetcher = function(prefix, directModel) {
        return function(parsed) {
            var env = fluid.get(fluid.threadLocal(), prefix);
            return fluid.fetchContextReference(parsed, directModel, env);
        };
    };
    
    // unsupported, non-API function  
    fluid.extractEL = function(string, options) {
        if (options.ELstyle === "ALL") {
            return string;
        }
        else if (options.ELstyle.length === 1) {
            if (string.charAt(0) === options.ELstyle) {
                return string.substring(1);
            }
        }
        else if (options.ELstyle === "${}") {
            var i1 = string.indexOf("${");
            var i2 = string.lastIndexOf("}");
            if (i1 === 0 && i2 !== -1) {
                return string.substring(2, i2);
            }
        }
    };
    
    // unsupported, non-API function
    fluid.extractELWithContext = function(string, options) {
        var EL = fluid.extractEL(string, options);
        if (EL && EL.charAt(0) === "{") {
            return fluid.parseContextReference(EL, 0);
        }
        return EL? {path: EL} : EL;
    };

    fluid.parseContextReference = function(reference, index, delimiter) {
        var endcpos = reference.indexOf("}", index + 1);
        if (endcpos === -1) {
            fluid.fail("Cannot parse context reference \"" + reference + "\": Malformed context reference without }");
        }
        var context = reference.substring(index + 1, endcpos);
        var endpos = delimiter? reference.indexOf(delimiter, endcpos + 1) : reference.length;
        var path = reference.substring(endcpos + 1, endpos);
        if (path.charAt(0) === ".") {
            path = path.substring(1);
        }
        return {context: context, path: path, endpos: endpos};
    };
    
    fluid.renderContextReference = function(parsed) {
        return "{" + parsed.context + "}" + parsed.path;  
    };
    
    fluid.fetchContextReference = function(parsed, directModel, env) {
        var base = parsed.context? env[parsed.context] : directModel;
        if (!base) {
            return base;
        }
        return fluid.get(base, parsed.path);
    };
    
    // unsupported, non-API function
    fluid.resolveContextValue = function(string, options) {
        if (options.bareContextRefs && string.charAt(0) === "{") {
            var parsed = fluid.parseContextReference(string, 0);
            return options.fetcher(parsed);        
        }
        else if (options.ELstyle && options.ELstyle !== "${}") {
            var parsed = fluid.extractELWithContext(string, options); // jslint:ok
            if (parsed) {
                return options.fetcher(parsed);
            }
        }
        while (typeof(string) === "string") {
            var i1 = string.indexOf("${");
            var i2 = string.indexOf("}", i1 + 2);
            if (i1 !== -1 && i2 !== -1) {
                var parsed; // jslint:ok
                if (string.charAt(i1 + 2) === "{") {
                    parsed = fluid.parseContextReference(string, i1 + 2, "}");
                    i2 = parsed.endpos;
                }
                else {
                    parsed = {path: string.substring(i1 + 2, i2)};
                }
                var subs = options.fetcher(parsed);
                var all = (i1 === 0 && i2 === string.length - 1); 
                // TODO: test case for all undefined substitution
                if (subs === undefined || subs === null) {
                    return subs;
                }
                string = all? subs : string.substring(0, i1) + subs + string.substring(i2 + 1);
            }
            else {
                break;
            }
        }
        return string;
    };
    
    function resolveEnvironmentImpl(obj, options) {
        fluid.guardCircularity(options.seenIds, obj, "expansion", 
             " - please ensure options are not circularly connected, or protect from expansion using the \"noexpand\" policy or expander");
        function recurse(arg) {
            return resolveEnvironmentImpl(arg, options);
        }
        if (typeof(obj) === "string" && !options.noValue) {
            return fluid.resolveContextValue(obj, options);
        }
        else if (fluid.isPrimitive(obj) || obj.nodeType !== undefined || obj.jquery) {
            return obj;
        }
        else if (options.filter) {
            return options.filter(obj, recurse, options);
        }
        else {
            return (options.noCopy? fluid.each : fluid.transform)(obj, function(value, key) {
                return resolveEnvironmentImpl(value, options);
            });
        }
    }
    
    fluid.defaults("fluid.resolveEnvironment", {
        ELstyle:     "${}",
        bareContextRefs: true
    });
    
    fluid.resolveEnvironment = function(obj, options) {
        var options = fluid.merge(null, fluid.defaults("fluid.resolveEnvironment"), options);
        options.seenIds = {};
        
        return resolveEnvironmentImpl(obj, options);
    };

    /** "light" expanders, starting with support functions for the "deferredFetcher" expander **/

    fluid.expander.deferredCall = function(target, source, recurse) {
        var expander = source.expander;
        var args = (!expander.args || fluid.isArrayable(expander.args))? expander.args : $.makeArray(expander.args);
        args = recurse(args); 
        return fluid.invokeGlobalFunction(expander.func, args);
    };
    
    fluid.deferredCall = fluid.expander.deferredCall; // put in top namespace for convenience
    
    fluid.deferredInvokeCall = function(target, source, recurse) {
        var expander = source.expander;
        var args = (!expander.args || fluid.isArrayable(expander.args))? expander.args : $.makeArray(expander.args);
        args = recurse(args);  
        return fluid.invoke(expander.func, args);
    };
    
    // The "noexpand" expander which simply unwraps one level of expansion and ceases.
    fluid.expander.noexpand = function(target, source) {
        return $.extend(target, source.expander.tree);
    };
  
    fluid.noexpand = fluid.expander.noexpand; // TODO: check naming and namespacing
  
    // unsupported, non-API function
    fluid.expander.lightFilter = function (obj, recurse, options) {
        var togo;
        if (fluid.isArrayable(obj)) {
            togo = options.noCopy? obj : [];
            fluid.each(obj, function(value, key) {togo[key] = recurse(value);});
        }
        else {
            togo = options.noCopy? obj : {};
            for (var key in obj) {
                var value = obj[key];
                var expander;
                if (key === "expander" && !(options.expandOnly && options.expandOnly[value.type])) {
                    expander = fluid.getGlobalValue(value.type);  
                    if (expander) {
                        return expander.call(null, togo, obj, recurse, options);
                    }
                }
                if (key !== "expander" || !expander) {
                    togo[key] = recurse(value);
                }
            }
        }
        return options.noCopy? obj : togo;
    };
      
    // unsupported, non-API function
    fluid.expander.expandLight = function (source, expandOptions) {
        var options = $.extend({}, expandOptions);
        options.filter = fluid.expander.lightFilter;
        return fluid.resolveEnvironment(source, options);       
    };
          
})(jQuery, fluid_1_4);
/*
Copyright 2007-2010 University of Cambridge
Copyright 2007-2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    /** Framework-global caching state for fluid.fetchResources **/

    var resourceCache = {};
  
    var pendingClass = {};
 
    /** Accepts a hash of structures with free keys, where each entry has either
     * href/url or nodeId set - on completion, callback will be called with the populated
     * structure with fetched resource text in the field "resourceText" for each
     * entry. Each structure may contain "options" holding raw options to be forwarded
     * to jQuery.ajax().
     */
  
    fluid.fetchResources = function(resourceSpecs, callback, options) {
        var that = fluid.initLittleComponent("fluid.fetchResources", options);
        that.resourceSpecs = resourceSpecs;
        that.callback = callback;
        that.operate = function() {
            fluid.fetchResources.fetchResourcesImpl(that);
        };
        fluid.each(resourceSpecs, function(resourceSpec) {
             resourceSpec.recurseFirer = fluid.event.getEventFirer();
             resourceSpec.recurseFirer.addListener(that.operate);
             if (resourceSpec.url && !resourceSpec.href) {
                resourceSpec.href = resourceSpec.url;
             }
        });
        if (that.options.amalgamateClasses) {
            fluid.fetchResources.amalgamateClasses(resourceSpecs, that.options.amalgamateClasses, that.operate);
        }
        that.operate();
        return that;
    };
  
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    // Add "synthetic" elements of *this* resourceSpec list corresponding to any
    // still pending elements matching the PROLEPTICK CLASS SPECIFICATION supplied 
    fluid.fetchResources.amalgamateClasses = function(specs, classes, operator) {
        fluid.each(classes, function(clazz) {
            var pending = pendingClass[clazz];
            fluid.each(pending, function(pendingrec, canon) {
                specs[clazz+"!"+canon] = pendingrec;
                pendingrec.recurseFirer.addListener(operator);
            });
        });
    };
  
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.fetchResources.timeSuccessCallback = function(resourceSpec) {
        if (resourceSpec.timeSuccess && resourceSpec.options && resourceSpec.options.success) {
            var success = resourceSpec.options.success;
            resourceSpec.options.success = function() {
            var startTime = new Date();
            var ret = success.apply(null, arguments);
            fluid.log("External callback for URL " + resourceSpec.href + " completed - callback time: " + 
                    (new Date().getTime() - startTime.getTime()) + "ms");
            return ret;
            };
        }
    };
    
    // TODO: Integrate punch-through from old Engage implementation
    function canonUrl(url) {
        return url;
    }
    
    fluid.fetchResources.clearResourceCache = function(url) {
        if (url) {
            delete resourceCache[canonUrl(url)];
        }
        else {
            fluid.clear(resourceCache);
        }  
    };
  
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.fetchResources.handleCachedRequest = function(resourceSpec, response) {
         var canon = canonUrl(resourceSpec.href);
         var cached = resourceCache[canon];
         if (cached.$$firer$$) {
             fluid.log("Handling request for " + canon + " from cache");
             var fetchClass = resourceSpec.fetchClass;
             if (fetchClass && pendingClass[fetchClass]) {
                 fluid.log("Clearing pendingClass entry for class " + fetchClass);
                 delete pendingClass[fetchClass][canon];
             }
             resourceCache[canon] = response;      
             cached.fire(response);
         }
    };
    
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.fetchResources.completeRequest = function(thisSpec, recurseCall) {
        thisSpec.queued = false;
        thisSpec.completeTime = new Date();
        fluid.log("Request to URL " + thisSpec.href + " completed - total elapsed time: " + 
            (thisSpec.completeTime.getTime() - thisSpec.initTime.getTime()) + "ms");
        thisSpec.recurseFirer.fire();
    };
  
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.fetchResources.makeResourceCallback = function(thisSpec) {
        return {
            success: function(response) {
                thisSpec.resourceText = response;
                thisSpec.resourceKey = thisSpec.href;
                if (thisSpec.forceCache) {
                    fluid.fetchResources.handleCachedRequest(thisSpec, response);
                }
                fluid.fetchResources.completeRequest(thisSpec);
            },
            error: function(response, textStatus, errorThrown) {
                thisSpec.fetchError = {
                    status: response.status,
                    textStatus: response.textStatus,
                    errorThrown: errorThrown
                };
                fluid.fetchResources.completeRequest(thisSpec);
            }
            
        };
    };
    
        
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.fetchResources.issueCachedRequest = function(resourceSpec, options) {
         var canon = canonUrl(resourceSpec.href);
         var cached = resourceCache[canon];
         if (!cached) {
             fluid.log("First request for cached resource with url " + canon);
             cached = fluid.event.getEventFirer();
             cached.$$firer$$ = true;
             resourceCache[canon] = cached;
             var fetchClass = resourceSpec.fetchClass;
             if (fetchClass) {
                 if (!pendingClass[fetchClass]) {
                     pendingClass[fetchClass] = {};
                 }
                 pendingClass[fetchClass][canon] = resourceSpec;
             }
             options.cache = false; // TODO: Getting weird "not modified" issues on Firefox
             $.ajax(options);
         }
         else {
             if (!cached.$$firer$$) {
                 options.success(cached);
             }
             else {
                 fluid.log("Request for cached resource which is in flight: url " + canon);
                 cached.addListener(function(response) {
                     options.success(response);
                 });
             }
         }
    };
    
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    // Compose callbacks in such a way that the 2nd, marked "external" will be applied
    // first if it exists, but in all cases, the first, marked internal, will be 
    // CALLED WITHOUT FAIL
    fluid.fetchResources.composeCallbacks = function(internal, external) {
        return external? function() {
            try {
                external.apply(null, arguments);
            }
            catch (e) {
                fluid.log("Exception applying external fetchResources callback: " + e);
            }
            internal.apply(null, arguments); // call the internal callback without fail
        } : internal;
    };
    
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.fetchResources.composePolicy = function(target, source, key) {
        return fluid.fetchResources.composeCallbacks(target, source);
    };
    
    fluid.defaults("fluid.fetchResources.issueRequest", {
        mergePolicy: {
            success: fluid.fetchResources.composePolicy,
            error: fluid.fetchResources.composePolicy,
            url: "reverse"
        }
    });
    
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.fetchResources.issueRequest = function(resourceSpec, key) {
        var thisCallback = fluid.fetchResources.makeResourceCallback(resourceSpec);
        var options = {  
             url:     resourceSpec.href,
             success: thisCallback.success, 
             error:   thisCallback.error};
        fluid.fetchResources.timeSuccessCallback(resourceSpec);
        fluid.merge(fluid.defaults("fluid.fetchResources.issueRequest").mergePolicy,
                      options, resourceSpec.options);
        resourceSpec.queued = true;
        resourceSpec.initTime = new Date();
        fluid.log("Request with key " + key + " queued for " + resourceSpec.href);

        if (resourceSpec.forceCache) {
            fluid.fetchResources.issueCachedRequest(resourceSpec, options);
        }
        else {
            $.ajax(options);
        }
    };
    
    fluid.fetchResources.fetchResourcesImpl = function(that) {
        var complete = true;
        var allSync = true;
        var resourceSpecs = that.resourceSpecs;
        for (var key in resourceSpecs) {
            var resourceSpec = resourceSpecs[key];
            if (!resourceSpec.options || resourceSpec.options.async) {
                allSync = false;
            }
            if (resourceSpec.href && !resourceSpec.completeTime) {
                 if (!resourceSpec.queued) {
                     fluid.fetchResources.issueRequest(resourceSpec, key);  
                 }
                 if (resourceSpec.queued) {
                     complete = false;
                 }
            }
            else if (resourceSpec.nodeId && !resourceSpec.resourceText) {
                var node = document.getElementById(resourceSpec.nodeId);
                // upgrade this to somehow detect whether node is "armoured" somehow
                // with comment or CDATA wrapping
                resourceSpec.resourceText = fluid.dom.getElementText(node);
                resourceSpec.resourceKey = resourceSpec.nodeId;
            }
        }
        if (complete && that.callback && !that.callbackCalled) {
            that.callbackCalled = true;
            if ($.browser.mozilla && !allSync) {
                // Defer this callback to avoid debugging problems on Firefox
                setTimeout(function() {
                    that.callback(resourceSpecs);
                    }, 1);
            }
            else {
                that.callback(resourceSpecs);
            }
        }
    };
    
    fluid.fetchResources.primeCacheFromResources = function(componentName) {
        var resources = fluid.defaults(componentName).resources;
        var that = {typeName: "fluid.fetchResources.primeCacheFromResources"};
        var expanded = (fluid.expandOptions ? fluid.expandOptions : fluid.identity)(fluid.copy(resources), that);
        fluid.fetchResources(expanded);
    };
    
    /** Utilities invoking requests for expansion **/
    fluid.registerNamespace("fluid.expander");
      
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.expander.makeDefaultFetchOptions = function (successdisposer, failid, options) {
        return $.extend(true, {dataType: "text"}, options, {
            success: function(response, environmentdisposer) {
                var json = JSON.parse(response);
                environmentdisposer(successdisposer(json));
            },
            error: function(response, textStatus) {
                fluid.log("Error fetching " + failid + ": " + textStatus);
            }
        });
    };
  
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.expander.makeFetchExpander = function (options) {
        return { expander: {
            type: "fluid.expander.deferredFetcher",
            href: options.url,
            options: fluid.expander.makeDefaultFetchOptions(options.disposer, options.url, options.options),
            resourceSpecCollector: "{resourceSpecCollector}",
            fetchKey: options.fetchKey
        }};
    };
    
    fluid.expander.deferredFetcher = function(target, source, recurse, expandOptions) {
        var expander = source.expander;
        var spec = fluid.copy(expander);
        // fetch the "global" collector specified in the external environment to receive
        // this resourceSpec
        var collector = fluid.resolveEnvironment(expander.resourceSpecCollector, expandOptions);
        delete spec.type;
        delete spec.resourceSpecCollector;
        delete spec.fetchKey;
        var environmentdisposer = function(disposed) {
            $.extend(target, disposed);
        };
        // replace the callback which is there (taking 2 arguments) with one which
        // directly responds to the request, passing in the result and OUR "disposer" - 
        // which once the user has processed the response (say, parsing JSON and repackaging)
        // finally deposits it in the place of the expander in the tree to which this reference
        // has been stored at the point this expander was evaluated.
        spec.options.success = function(response) {
             expander.options.success(response, environmentdisposer);
        };
        var key = expander.fetchKey || fluid.allocateGuid();
        collector[key] = spec;
        return target;
    };
    
    
})(jQuery, fluid_1_4);
// =========================================================================
//
// tinyxmlsax.js - an XML SAX parser in JavaScript compressed for downloading
//
// version 3.1
//
// =========================================================================
//
// Copyright (C) 2000 - 2002, 2003 Michael Houghton (mike@idle.org), Raymond Irving and David Joham (djoham@yahoo.com)
//
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 2.1 of the License, or (at your option) any later version.

// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.

// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
//
// Visit the XML for <SCRIPT> home page at http://xmljs.sourceforge.net
//

/*
The zlib/libpng License

Copyright (c) 2000 - 2002, 2003 Michael Houghton (mike@idle.org), Raymond Irving and David Joham (djoham@yahoo.com)

This software is provided 'as-is', without any express or implied
warranty. In no event will the authors be held liable for any damages
arising from the use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:

    1. The origin of this software must not be misrepresented; you must not
    claim that you wrote the original software. If you use this software
    in a product, an acknowledgment in the product documentation would be
    appreciated but is not required.

    2. Altered source versions must be plainly marked as such, and must not be
    misrepresented as being the original software.

    3. This notice may not be removed or altered from any source
    distribution.
 */

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    fluid.XMLP = function(strXML) {
        return fluid.XMLP.XMLPImpl(strXML);
    };

        
    // List of closed HTML tags, taken from JQuery 1.2.3
    fluid.XMLP.closedTags = {
        abbr: true, br: true, col: true, img: true, input: true,
        link: true, meta: true, param: true, hr: true, area: true, embed:true
        };

    fluid.XMLP._NONE = 0;
    fluid.XMLP._ELM_B = 1;
    fluid.XMLP._ELM_E = 2;
    fluid.XMLP._ELM_EMP = 3; 
    fluid.XMLP._ATT = 4;
    fluid.XMLP._TEXT = 5;
    fluid.XMLP._ENTITY = 6; 
    fluid.XMLP._PI = 7;
    fluid.XMLP._CDATA = 8;
    fluid.XMLP._COMMENT = 9; 
    fluid.XMLP._DTD = 10;
    fluid.XMLP._ERROR = 11;
     
    fluid.XMLP._CONT_XML = 0; 
    fluid.XMLP._CONT_ALT = 1; 
    fluid.XMLP._ATT_NAME = 0; 
    fluid.XMLP._ATT_VAL = 1;
    
    fluid.XMLP._STATE_PROLOG = 1;
    fluid.XMLP._STATE_DOCUMENT = 2; 
    fluid.XMLP._STATE_MISC = 3;
    
    fluid.XMLP._errs = [];
    fluid.XMLP._errs[fluid.XMLP.ERR_CLOSE_PI = 0 ] = "PI: missing closing sequence"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_CLOSE_DTD = 1 ] = "DTD: missing closing sequence"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_CLOSE_COMMENT = 2 ] = "Comment: missing closing sequence"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_CLOSE_CDATA = 3 ] = "CDATA: missing closing sequence"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_CLOSE_ELM = 4 ] = "Element: missing closing sequence"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_CLOSE_ENTITY = 5 ] = "Entity: missing closing sequence"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_PI_TARGET = 6 ] = "PI: target is required"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_ELM_EMPTY = 7 ] = "Element: cannot be both empty and closing"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_ELM_NAME = 8 ] = "Element: name must immediatly follow \"<\""; 
    fluid.XMLP._errs[fluid.XMLP.ERR_ELM_LT_NAME = 9 ] = "Element: \"<\" not allowed in element names"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_ATT_VALUES = 10] = "Attribute: values are required and must be in quotes"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_ATT_LT_NAME = 11] = "Element: \"<\" not allowed in attribute names"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_ATT_LT_VALUE = 12] = "Attribute: \"<\" not allowed in attribute values"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_ATT_DUP = 13] = "Attribute: duplicate attributes not allowed"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_ENTITY_UNKNOWN = 14] = "Entity: unknown entity"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_INFINITELOOP = 15] = "Infinite loop"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_DOC_STRUCTURE = 16] = "Document: only comments, processing instructions, or whitespace allowed outside of document element"; 
    fluid.XMLP._errs[fluid.XMLP.ERR_ELM_NESTING = 17] = "Element: must be nested correctly"; 
                

    fluid.XMLP._checkStructure = function(that, iEvent) {
        var stack = that.m_stack; 
        if (fluid.XMLP._STATE_PROLOG == that.m_iState) {
            // disabled original check for text node in prologue
            that.m_iState = fluid.XMLP._STATE_DOCUMENT;
            }
    
        if (fluid.XMLP._STATE_DOCUMENT === that.m_iState) {
            if ((fluid.XMLP._ELM_B == iEvent) || (fluid.XMLP._ELM_EMP == iEvent)) { 
                that.m_stack[stack.length] = that.getName();
                }
            if ((fluid.XMLP._ELM_E == iEvent) || (fluid.XMLP._ELM_EMP == iEvent)) {
                if (stack.length === 0) {
                    //return this._setErr(XMLP.ERR_DOC_STRUCTURE);
                    return fluid.XMLP._NONE;
                    }
                var strTop = stack[stack.length - 1];
                that.m_stack.length--;
                if (strTop === null || strTop !== that.getName()) { 
                    return that._setErr(that, fluid.XMLP.ERR_ELM_NESTING);
                    }
                }
    
            // disabled original check for text node in epilogue - "MISC" state is disused
        }
        return iEvent;
    };
    
            
    fluid.XMLP._parseCDATA = function(that, iB) { 
        var iE = that.m_xml.indexOf("]]>", iB); 
        if (iE == -1) { return fluid.XMLP._setErr(that, fluid.XMLP.ERR_CLOSE_CDATA);}
        fluid.XMLP._setContent(that, fluid.XMLP._CONT_XML, iB, iE); 
        that.m_iP = iE + 3; 
        return fluid.XMLP._CDATA;
        };
        
    
    fluid.XMLP._parseComment = function(that, iB) { 
        var iE = that.m_xml.indexOf("-" + "->", iB); 
        if (iE == -1) { 
            return fluid.XMLP._setErr(that, fluid.XMLP.ERR_CLOSE_COMMENT);
            }
        fluid.XMLP._setContent(that, fluid.XMLP._CONT_XML, iB - 4, iE + 3); 
        that.m_iP = iE + 3; 
        return fluid.XMLP._COMMENT;
        };    
    
    fluid.XMLP._parseDTD = function(that, iB) { 
        var iE, strClose, iInt, iLast; 
        iE = that.m_xml.indexOf(">", iB); 
        if (iE == -1) { 
            return fluid.XMLP._setErr(that, fluid.XMLP.ERR_CLOSE_DTD);
            }
        iInt = that.m_xml.indexOf("[", iB); 
        strClose = ((iInt != -1) && (iInt < iE)) ? "]>" : ">"; 
        while (true) { 
            if (iE == iLast) { 
                return fluid.XMLP._setErr(that, fluid.XMLP.ERR_INFINITELOOP);
                }
            iLast = iE; 
            iE = that.m_xml.indexOf(strClose, iB); 
            if(iE == -1) { 
                return fluid.XMLP._setErr(that, fluid.XMLP.ERR_CLOSE_DTD);
                }
            if (that.m_xml.substring(iE - 1, iE + 2) != "]]>") { break;}
            }
        that.m_iP = iE + strClose.length; 
        return fluid.XMLP._DTD;
        };
        
    fluid.XMLP._parsePI = function(that, iB) { 
        var iE, iTB, iTE, iCB, iCE; 
        iE = that.m_xml.indexOf("?>", iB); 
        if (iE == -1) { return fluid.XMLP._setErr(that, fluid.XMLP.ERR_CLOSE_PI);}
        iTB = fluid.SAXStrings.indexOfNonWhitespace(that.m_xml, iB, iE); 
        if (iTB == -1) { return fluid.XMLP._setErr(that, fluid.XMLP.ERR_PI_TARGET);}
        iTE = fluid.SAXStrings.indexOfWhitespace(that.m_xml, iTB, iE); 
        if (iTE == -1) { iTE = iE;}
        iCB = fluid.SAXStrings.indexOfNonWhitespace(that.m_xml, iTE, iE); 
        if (iCB == -1) { iCB = iE;}
        iCE = fluid.SAXStrings.lastIndexOfNonWhitespace(that.m_xml, iCB, iE); 
        if (iCE == -1) { iCE = iE - 1;}
        that.m_name = that.m_xml.substring(iTB, iTE); 
        fluid.XMLP._setContent(that, fluid.XMLP._CONT_XML, iCB, iCE + 1); 
        that.m_iP = iE + 2; 
        return fluid.XMLP._PI;
        };
        
    fluid.XMLP._parseText = function(that, iB) { 
        var iE = that.m_xml.indexOf("<", iB);
        if (iE == -1) { iE = that.m_xml.length;}
        fluid.XMLP._setContent(that, fluid.XMLP._CONT_XML, iB, iE); 
        that.m_iP = iE; 
        return fluid.XMLP._TEXT;
        };
        
    fluid.XMLP._setContent = function(that, iSrc) { 
        var args = arguments; 
        if (fluid.XMLP._CONT_XML == iSrc) { 
            that.m_cAlt = null; 
            that.m_cB = args[2]; 
            that.m_cE = args[3];
            } 
        else { 
            that.m_cAlt = args[2]; 
            that.m_cB = 0; 
            that.m_cE = args[2].length;
            }
            
        that.m_cSrc = iSrc;
        };
        
    fluid.XMLP._setErr = function(that, iErr) { 
        var strErr = fluid.XMLP._errs[iErr]; 
        that.m_cAlt = strErr; 
        that.m_cB = 0; 
        that.m_cE = strErr.length; 
        that.m_cSrc = fluid.XMLP._CONT_ALT; 
        return fluid.XMLP._ERROR;
        };
            
    
    fluid.XMLP._parseElement = function(that, iB) {
        var iE, iDE, iRet; 
        var iType, strN, iLast; 
        iDE = iE = that.m_xml.indexOf(">", iB); 
        if (iE == -1) { 
            return that._setErr(that, fluid.XMLP.ERR_CLOSE_ELM);
            }
        if (that.m_xml.charAt(iB) == "/") { 
            iType = fluid.XMLP._ELM_E; 
            iB++;
            } 
        else { 
            iType = fluid.XMLP._ELM_B;
            }
        if (that.m_xml.charAt(iE - 1) == "/") { 
            if (iType == fluid.XMLP._ELM_E) { 
                return fluid.XMLP._setErr(that, fluid.XMLP.ERR_ELM_EMPTY);
                }
            iType = fluid.XMLP._ELM_EMP; iDE--;
            }
    
        that.nameRegex.lastIndex = iB;
        var nameMatch = that.nameRegex.exec(that.m_xml);
        if (!nameMatch) {
            return fluid.XMLP._setErr(that, fluid.XMLP.ERR_ELM_NAME);
            }
        strN = nameMatch[1].toLowerCase();
        // This branch is specially necessary for broken markup in IE. If we see an li
        // tag apparently directly nested in another, first emit a synthetic close tag
        // for the earlier one without advancing the pointer, and set a flag to ensure
        // doing this just once.
        if ("li" === strN && iType !== fluid.XMLP._ELM_E && that.m_stack.length > 0 && 
            that.m_stack[that.m_stack.length - 1] === "li" && !that.m_emitSynthetic) {
            that.m_name = "li";
            that.m_emitSynthetic = true;
            return fluid.XMLP._ELM_E;
        }
        // We have acquired the tag name, now set about parsing any attribute list
        that.m_attributes = {};
        that.m_cAlt = ""; 
    
        if (that.nameRegex.lastIndex < iDE) {
            that.m_iP = that.nameRegex.lastIndex;
            while (that.m_iP < iDE) {
                that.attrStartRegex.lastIndex = that.m_iP;
                var attrMatch = that.attrStartRegex.exec(that.m_xml);
                if (!attrMatch) {
                    return fluid.XMLP._setErr(that, fluid.XMLP.ERR_ATT_VALUES);
                    }
                var attrname = attrMatch[1].toLowerCase();
                var attrval;
                if (that.m_xml.charCodeAt(that.attrStartRegex.lastIndex) === 61) { // = 
                    var valRegex = that.m_xml.charCodeAt(that.attrStartRegex.lastIndex + 1) === 34? that.attrValRegex : that.attrValIERegex; // "
                    valRegex.lastIndex = that.attrStartRegex.lastIndex + 1;
                    attrMatch = valRegex.exec(that.m_xml);
                    if (!attrMatch) {
                        return fluid.XMLP._setErr(that, fluid.XMLP.ERR_ATT_VALUES);
                        }
                    attrval = attrMatch[1];
                    }
                else { // accommodate insanity on unvalued IE attributes
                    attrval = attrname;
                    valRegex = that.attrStartRegex;
                    }
                if (!that.m_attributes[attrname]) {
                    that.m_attributes[attrname] = attrval;
                    }
                else { 
                    return fluid.XMLP._setErr(that, fluid.XMLP.ERR_ATT_DUP);
                }
                that.m_iP = valRegex.lastIndex;
                    
                }
            }
        if (strN.indexOf("<") != -1) { 
            return fluid.XMLP._setErr(that, fluid.XMLP.ERR_ELM_LT_NAME);
            }
    
        that.m_name = strN; 
        that.m_iP = iE + 1;
        // Check for corrupted "closed tags" from innerHTML
        if (fluid.XMLP.closedTags[strN]) {
            that.closeRegex.lastIndex = iE + 1;
            var closeMatch = that.closeRegex.exec;
            if (closeMatch) {
                var matchclose = that.m_xml.indexOf(strN, closeMatch.lastIndex);
                if (matchclose === closeMatch.lastIndex) {
                    return iType; // bail out, a valid close tag is separated only by whitespace
                }
                else {
                    return fluid.XMLP._ELM_EMP;
                }
            }
        }
        that.m_emitSynthetic = false;
        return iType;
    };
    
    fluid.XMLP._parse = function(that) {
        var iP = that.m_iP;
        var xml = that.m_xml; 
        if (iP === xml.length) { return fluid.XMLP._NONE;}
        var c = xml.charAt(iP);
        if (c === '<') {
            var c2 = xml.charAt(iP + 1);
            if (c2 === '?') {
                return fluid.XMLP._parsePI(that, iP + 2);
                }
            else if (c2 === '!') {
                if (iP === xml.indexOf("<!DOCTYPE", iP)) { 
                    return fluid.XMLP._parseDTD(that, iP + 9);
                    }
                else if (iP === xml.indexOf("<!--", iP)) { 
                    return fluid.XMLP._parseComment(that, iP + 4);
                    }
                else if (iP === xml.indexOf("<![CDATA[", iP)) { 
                    return fluid.XMLP._parseCDATA(that, iP + 9);
                    }
                }
            else {
                return fluid.XMLP._parseElement(that, iP + 1);
                }
            }
        else {
            return fluid.XMLP._parseText(that, iP);
            }
        };
        
    
    fluid.XMLP.XMLPImpl = function(strXML) { 
        var that = {};    
        that.m_xml = strXML; 
        that.m_iP = 0;
        that.m_iState = fluid.XMLP._STATE_PROLOG; 
        that.m_stack = [];
        that.m_attributes = {};
        that.m_emitSynthetic = false; // state used for emitting synthetic tags used to correct broken markup (IE)
        
        that.getColumnNumber = function() { 
            return fluid.SAXStrings.getColumnNumber(that.m_xml, that.m_iP);
        };
        
        that.getContent = function() { 
            return (that.m_cSrc == fluid.XMLP._CONT_XML) ? that.m_xml : that.m_cAlt;
        };
        
        that.getContentBegin = function() { return that.m_cB;};
        that.getContentEnd = function() { return that.m_cE;};
    
        that.getLineNumber = function() { 
            return fluid.SAXStrings.getLineNumber(that.m_xml, that.m_iP);
        };
        
        that.getName = function() { 
            return that.m_name;
        };
        
        that.next = function() { 
            return fluid.XMLP._checkStructure(that, fluid.XMLP._parse(that));
        };
    
        that.nameRegex = /([^\s\/>]+)/g;
        that.attrStartRegex = /\s*([\w:_][\w:_\-\.]*)/gm;
        that.attrValRegex = /\"([^\"]*)\"\s*/gm; // "normal" XHTML attribute values
        that.attrValIERegex = /([^\>\s]+)\s*/gm; // "stupid" unquoted IE attribute values (sometimes)
        that.closeRegex = /\s*<\//g;

        return that;
    };
    
    
    fluid.SAXStrings = {};
    
    fluid.SAXStrings.WHITESPACE = " \t\n\r"; 
    fluid.SAXStrings.QUOTES = "\"'"; 
    fluid.SAXStrings.getColumnNumber = function (strD, iP) { 
        if (!strD) { return -1;}
        iP = iP || strD.length; 
        var arrD = strD.substring(0, iP).split("\n"); 
        arrD.length--; 
        var iLinePos = arrD.join("\n").length; 
        return iP - iLinePos;
        };
        
    fluid.SAXStrings.getLineNumber = function (strD, iP) { 
        if (!strD) { return -1;}
        iP = iP || strD.length; 
        return strD.substring(0, iP).split("\n").length;
        };
        
    fluid.SAXStrings.indexOfNonWhitespace = function (strD, iB, iE) {
        if (!strD) return -1;
        iB = iB || 0; 
        iE = iE || strD.length; 
        
        for (var i = iB; i < iE; ++ i) { 
            var c = strD.charAt(i);
            if (c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r') return i;
            }
        return -1;
        };
        
        
    fluid.SAXStrings.indexOfWhitespace = function (strD, iB, iE) { 
        if (!strD) { return -1;}
            iB = iB || 0; 
            iE = iE || strD.length; 
            for (var i = iB; i < iE; i++) { 
                if (fluid.SAXStrings.WHITESPACE.indexOf(strD.charAt(i)) != -1) { return i;}
            }
        return -1;
        };
        
        
    fluid.SAXStrings.lastIndexOfNonWhitespace = function (strD, iB, iE) { 
            if (!strD) { return -1;}
            iB = iB || 0; iE = iE || strD.length; 
            for (var i = iE - 1; i >= iB; i--) { 
            if (fluid.SAXStrings.WHITESPACE.indexOf(strD.charAt(i)) == -1) { 
                return i;
                }
            }
        return -1;
        };
        
    fluid.SAXStrings.replace = function(strD, iB, iE, strF, strR) { 
        if (!strD) { return "";}
        iB = iB || 0; 
        iE = iE || strD.length; 
        return strD.substring(iB, iE).split(strF).join(strR);
        };
            
})(jQuery, fluid_1_4);
        /*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010-2011 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, undef: true, newcap: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
      
    fluid.parseTemplate = function (template, baseURL, scanStart, cutpoints_in, opts) {
        opts = opts || {};
      
        if (!template) {
            fluid.fail("empty template supplied to fluid.parseTemplate");
        }
      
        var t;
        var parser;
        var tagstack;
        var lumpindex = 0;
        var nestingdepth = 0;
        var justended = false;
        
        var defstart = -1;
        var defend = -1;   
        
        var debugMode = false;
        
        var cutpoints = []; // list of selector, tree, id
        var simpleClassCutpoints = {};
        
        var cutstatus = [];
        
        var XMLLump = function (lumpindex, nestingdepth) {
            return {
                //rsfID: "",
                //text: "",
                //downmap: {},
                //attributemap: {},
                //finallump: {},
                nestingdepth: nestingdepth,
                lumpindex: lumpindex,
                parent: t
            };
        };
        
        function isSimpleClassCutpoint(tree) {
            return tree.length === 1 && tree[0].predList.length === 1 && tree[0].predList[0].clazz;
        }
        
        function init(baseURLin, debugModeIn, cutpointsIn) {
            t.rootlump = XMLLump(0, -1); // jslint:ok - capital letter
            tagstack = [t.rootlump];
            lumpindex = 0;
            nestingdepth = 0;
            justended = false;
            defstart = -1;
            defend = -1;
            baseURL = baseURLin;
            debugMode = debugModeIn;
            if (cutpointsIn) {
                for (var i = 0; i < cutpointsIn.length; ++i) {
                    var tree = fluid.parseSelector(cutpointsIn[i].selector);
                    var clazz = isSimpleClassCutpoint(tree);
                    if (clazz) {
                        simpleClassCutpoints[clazz] = cutpointsIn[i].id;
                    }
                    else {
                        cutstatus.push([]);
                        cutpoints.push($.extend({}, cutpointsIn[i], {tree: tree}));
                    }
                }
            }
        }
        
        function findTopContainer() {
            for (var i = tagstack.length - 1; i >= 0; --i) {
                var lump = tagstack[i];
                if (lump.rsfID !== undefined) {
                    return lump;
                }
            }
            return t.rootlump;
        }
        
        function newLump() {
            var togo = XMLLump(lumpindex, nestingdepth); // jslint:ok - capital letter
            if (debugMode) {
                togo.line = parser.getLineNumber();
                togo.column = parser.getColumnNumber();
            }
            //togo.parent = t;
            t.lumps[lumpindex] = togo;
            ++lumpindex;
            return togo;
        }
        
        function addLump(mmap, ID, lump) {
            var list = mmap[ID];
            if (!list) {
                list = [];
                mmap[ID] = list;
            }
            list[list.length] = lump;
        }
          
        function checkContribute(ID, lump) {
            if (ID.indexOf("scr=contribute-") !== -1) {
                var scr = ID.substring("scr=contribute-".length);
                addLump(t.collectmap, scr, lump);
            }
        }
        
        function debugLump(lump) {
          // TODO expand this to agree with the Firebug "self-selector" idiom
            return "<" + lump.tagname + ">";
        }
        
        function hasCssClass(clazz, totest) {
            if (!totest) {
                return false;
            }
            // algorithm from JQuery
            return (" " + totest + " ").indexOf(" " + clazz + " ") !== -1;
        }
        
        function matchNode(term, headlump, headclazz) {
            if (term.predList) {
                for (var i = 0; i < term.predList.length; ++i) {
                    var pred = term.predList[i];
                    if (pred.id && headlump.attributemap.id !== pred.id) {return false;}
                    if (pred.clazz && !hasCssClass(pred.clazz, headclazz)) {return false;}
                    if (pred.tag && headlump.tagname !== pred.tag) {return false;}
                }
                return true;
            }
        }
        
        function tagStartCut(headlump) {
            var togo;
            var headclazz = headlump.attributemap["class"];
            if (headclazz) {
                var split = headclazz.split(" ");
                for (var i = 0; i < split.length; ++i) {
                    var simpleCut = simpleClassCutpoints[$.trim(split[i])];
                    if (simpleCut) {
                        return simpleCut;
                    }
                }
            }
            for (var i = 0; i < cutpoints.length; ++i) { // jslint:ok - scoping
                var cut = cutpoints[i];
                var cutstat = cutstatus[i];
                var nextterm = cutstat.length; // the next term for this node
                if (nextterm < cut.tree.length) {
                    var term = cut.tree[nextterm];
                    if (nextterm > 0) {
                        if (cut.tree[nextterm - 1].child && 
                                cutstat[nextterm - 1] !== headlump.nestingdepth - 1) {
                            continue; // it is a failure to match if not at correct nesting depth 
                        }
                    }
                    var isMatch = matchNode(term, headlump, headclazz);
                    if (isMatch) {
                        cutstat[cutstat.length] = headlump.nestingdepth;
                        if (cutstat.length === cut.tree.length) {
                            if (togo !== undefined) {
                                fluid.fail("Cutpoint specification error - node " +
                                    debugLump(headlump) +
                                    " has already matched with rsf:id of " + togo);
                            }
                            if (cut.id === undefined || cut.id === null) {
                                fluid.fail("Error in cutpoints list - entry at position " + i + " does not have an id set");
                            }
                            togo = cut.id;
                        }
                    }
                }
            }
            return togo;
        }
          
        function tagEndCut() {
            if (cutpoints) {
                for (var i = 0; i < cutpoints.length; ++i) {
                    var cutstat = cutstatus[i];
                    if (cutstat.length > 0 && cutstat[cutstat.length - 1] === nestingdepth) {
                        cutstat.length--;
                    }
                }
            }
        }
        
        function processTagEnd() {
            tagEndCut();
            var endlump = newLump();
            --nestingdepth;
            endlump.text = "</" + parser.getName() + ">";
            var oldtop = tagstack[tagstack.length - 1];
            oldtop.close_tag = t.lumps[lumpindex - 1];
            tagstack.length--;
            justended = true;
        }
        
        function processTagStart(isempty, text) {
            ++nestingdepth;
            if (justended) {
                justended = false;
                var backlump = newLump();
                backlump.nestingdepth--;
            }
            if (t.firstdocumentindex === -1) {
                t.firstdocumentindex = lumpindex;
            }
            var headlump = newLump();
            var stacktop = tagstack[tagstack.length - 1];
            headlump.uplump = stacktop;
            var tagname = parser.getName();
            headlump.tagname = tagname;
            // NB - attribute names and values are now NOT DECODED!!
            var attrs = headlump.attributemap = parser.m_attributes;
            var ID = attrs[fluid.ID_ATTRIBUTE];
            if (ID === undefined) {
                ID = tagStartCut(headlump);
            }
            for (var attrname in attrs) {
                if (ID === undefined) {
                    if (/href|src|codebase|action/.test(attrname)) {
                        ID = "scr=rewrite-url";
                    }
                    // port of TPI effect of IDRelationRewriter
                    else if (ID === undefined && /for|headers/.test(attrname)) {
                        ID = "scr=null";
                    }
                }
            }
        
            if (ID) {
                // TODO: ensure this logic is correct on RSF Server
                if (ID.charCodeAt(0) === 126) { // "~"
                    ID = ID.substring(1);
                    headlump.elide = true;
                }
                checkContribute(ID, headlump);
                headlump.rsfID = ID;
                var downreg = findTopContainer();
                if (!downreg.downmap) {
                    downreg.downmap = {};
                }
                while (downreg) { // TODO: unusual fix for locating branches in parent contexts (applies to repetitive leaves)
                    if (downreg.downmap) {
                        addLump(downreg.downmap, ID, headlump);
                    }
                    downreg = downreg.uplump;
                }
                addLump(t.globalmap, ID, headlump);
                var colpos = ID.indexOf(":");
                if (colpos !== -1) {
                    var prefix = ID.substring(0, colpos);
                    if (!stacktop.finallump) {
                        stacktop.finallump = {};
                    }
                    stacktop.finallump[prefix] = headlump;
                }
            }
            
            // TODO: accelerate this by grabbing original template text (requires parser
            // adjustment) as well as dealing with empty tags
            headlump.text = "<" + tagname + fluid.dumpAttributes(attrs) + (isempty && !ID? "/>" : ">");
            tagstack[tagstack.length] = headlump;
            if (isempty) {
                if (ID) {
                    processTagEnd();
                }
                else {
                    --nestingdepth;
                    tagstack.length--;
                }
            }
        }
        

        
        function processDefaultTag() {
            if (defstart !== -1) {
                if (t.firstdocumentindex === -1) {
                    t.firstdocumentindex = lumpindex;
                }
                var text = parser.getContent().substr(defstart, defend - defstart);
                justended = false;
                var newlump = newLump();
                newlump.text = text; 
                defstart = -1;
            }
        }
       
       /** ACTUAL BODY of fluid.parseTemplate begins here **/
          
        t = fluid.XMLViewTemplate();
        
        init(baseURL, opts.debugMode, cutpoints_in);
    
        var idpos = template.indexOf(fluid.ID_ATTRIBUTE);
        if (scanStart) {
            var brackpos = template.indexOf('>', idpos);
            parser = fluid.XMLP(template.substring(brackpos + 1));
        }
        else {
            parser = fluid.XMLP(template); 
        }
    
parseloop: while (true) {
            var iEvent = parser.next();
            switch (iEvent) {
            case fluid.XMLP._ELM_B:
                processDefaultTag();
                //var text = parser.getContent().substr(parser.getContentBegin(), parser.getContentEnd() - parser.getContentBegin());
                processTagStart(false, "");
                break;
            case fluid.XMLP._ELM_E:
                processDefaultTag();
                processTagEnd();
                break;
            case fluid.XMLP._ELM_EMP:
                processDefaultTag();
                //var text = parser.getContent().substr(parser.getContentBegin(), parser.getContentEnd() - parser.getContentBegin());    
                processTagStart(true, "");
                break;
            case fluid.XMLP._PI:
            case fluid.XMLP._DTD:
                defstart = -1;
                continue; // not interested in reproducing these
            case fluid.XMLP._TEXT:
            case fluid.XMLP._ENTITY:
            case fluid.XMLP._CDATA:
            case fluid.XMLP._COMMENT:
                if (defstart === -1) {
                    defstart = parser.m_cB;
                }
                defend = parser.m_cE;
                break;
            case fluid.XMLP._ERROR:
                fluid.setLogging(true);
                var message = "Error parsing template: " + parser.m_cAlt + " at line " + parser.getLineNumber(); 
                fluid.log(message);
                fluid.log("Just read: " + parser.m_xml.substring(parser.m_iP - 30, parser.m_iP));
                fluid.log("Still to read: " + parser.m_xml.substring(parser.m_iP, parser.m_iP + 30));
                fluid.fail(message);
                break parseloop;
            case fluid.XMLP._NONE:
                break parseloop;
            }
        }
        processDefaultTag();
        var excess = tagstack.length - 1; 
        if (excess) {
            fluid.fail("Error parsing template - unclosed tag(s) of depth " + (excess) + 
                ": " + fluid.transform(tagstack.splice(1, excess), function (lump) {return debugLump(lump);}).join(", "));
        }
        return t;
    };
    
    fluid.debugLump = function (lump) {
        var togo = lump.text;
        togo += " at ";
        togo += "lump line " + lump.line + " column " + lump.column + " index " + lump.lumpindex;
        togo += lump.parent.href === null? "" : " in file " + lump.parent.href;
        return togo;
    };
    
    // Public definitions begin here
    
    fluid.ID_ATTRIBUTE = "rsf:id";
    
    fluid.getPrefix = function (id) {
        var colpos = id.indexOf(':');
        return colpos === -1? id : id.substring(0, colpos);
    };
    
    fluid.SplitID = function (id) {
        var that = {};
        var colpos = id.indexOf(':');
        if (colpos === -1) {
            that.prefix = id;
        }
        else {
            that.prefix = id.substring(0, colpos);
            that.suffix = id.substring(colpos + 1);
        }
        return that;
    };
    
    fluid.XMLViewTemplate = function () {
        return {
            globalmap: {},
            collectmap: {},
            lumps: [],
            firstdocumentindex: -1
        };
    };
    
      // TODO: find faster encoder
    fluid.XMLEncode = function (text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); 
    };
    
    fluid.dumpAttributes = function (attrcopy) {
        var togo = "";
        for (var attrname in attrcopy) {
            var attrvalue = attrcopy[attrname];
            if (attrvalue !== null && attrvalue !== undefined) {
                togo += " " + attrname + "=\"" + attrvalue + "\"";
            }
        }
        return togo;
    };
    
    fluid.aggregateMMap = function (target, source) {
        for (var key in source) {
            var targhas = target[key];
            if (!targhas) {
                target[key] = [];
            }
            target[key] = target[key].concat(source[key]);
        }
    };
  
    
    
    /** Returns a "template structure", with globalmap in the root, and a list
     * of entries {href, template, cutpoints} for each parsed template.
     */
    fluid.parseTemplates = function (resourceSpec, templateList, opts) {
        var togo = [];
        opts = opts || {};
        togo.globalmap = {};
        for (var i = 0; i < templateList.length; ++i) {
            var resource = resourceSpec[templateList[i]];
            var lastslash = resource.href.lastIndexOf("/");
            var baseURL = lastslash === -1? "" : resource.href.substring(0, lastslash + 1);
              
            var template = fluid.parseTemplate(resource.resourceText, baseURL, 
                opts.scanStart && i === 0, resource.cutpoints, opts);
            if (i === 0) {
                fluid.aggregateMMap(togo.globalmap, template.globalmap);
            }
            template.href = resource.href;
            template.baseURL = baseURL;
            template.resourceKey = resource.resourceKey;
      
            togo[i] = template;
            fluid.aggregateMMap(togo.globalmap, template.rootlump.downmap);
        }
        return togo;
    };
  
    // ******* SELECTOR ENGINE *********  
      
    // selector regexps copied from JQuery
    var chars = "(?:[\\w\u0128-\uFFFF*_-]|\\\\.)";
//    var quickChild = new RegExp("^>\\s*(" + chars + "+)");
//    var quickID = new RegExp("^(" + chars + "+)(#)(" + chars + "+)");
//    var selSeg = new RegExp("^\\s*([#.]?)(" + chars + "*)");
  
    var quickClass = new RegExp("([#.]?)(" + chars + "+)", "g");
    var childSeg = new RegExp("\\s*(>)?\\s*", "g");
//    var whiteSpace = new RegExp("^\\w*$");
  
    fluid.parseSelector = function (selstring) {
        var togo = [];
        selstring = $.trim(selstring);
        //ws-(ss*)[ws/>]
        quickClass.lastIndex = 0;
        var lastIndex = 0;
        while (true) {
            var atNode = []; // a list of predicates at a particular node
            while (true) {
                var segMatch = quickClass.exec(selstring);
                if (!segMatch || segMatch.index !== lastIndex) {
                    break;
                }
                var thisNode = {};
                var text = segMatch[2];
                if (segMatch[1] === "") {
                    thisNode.tag = text;
                }
                else if (segMatch[1] === "#") {
                    thisNode.id = text;
                }
                else if (segMatch[1] === ".") {
                    thisNode.clazz = text;
                }
                atNode[atNode.length] = thisNode;
                lastIndex = quickClass.lastIndex;
            }
            childSeg.lastIndex = lastIndex;
            var fullAtNode = {predList: atNode};
            var childMatch = childSeg.exec(selstring);
            if (!childMatch || childMatch.index !== lastIndex) {
                var remainder = selstring.substring(lastIndex);
                fluid.fail("Error in selector string - can not match child selector expression at " + remainder);
            }
            if (childMatch[1] === ">") {
                fullAtNode.child = true;
            }
            togo[togo.length] = fullAtNode;
            // >= test here to compensate for IE bug http://blog.stevenlevithan.com/archives/exec-bugs
            if (childSeg.lastIndex >= selstring.length) {
                break;
            }
            lastIndex = childSeg.lastIndex;
            quickClass.lastIndex = childSeg.lastIndex; 
        }
        return togo;
    };
      
})(jQuery, fluid_1_4);
/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010-2011 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
  
    function debugPosition(component) {
        return "as child of " + (component.parent.fullID ? "component with full ID " + component.parent.fullID : "root");
    }
     
    fluid.arrayToHash = function (array) {
        var togo = {};
        fluid.each(array, function (el) {
            togo[el] = true;
        });
        return togo;
    };
  
    function computeFullID(component) {
        var togo = "";
        var move = component;
        if (component.children === undefined) { // not a container
            // unusual case on the client-side, since a repetitive leaf may have localID blasted onto it.
            togo = component.ID + (component.localID !== undefined ? component.localID : "");
            move = component.parent;
        }
        
        while (move.parent) {
            var parent = move.parent;
            if (move.fullID !== undefined) {
                togo = move.fullID + togo;
                return togo;
            }
            if (move.noID === undefined) {
                var ID = move.ID;
                if (ID === undefined) {
                    fluid.fail("Error in component tree - component found with no ID " +
                        debugPosition(parent) + ": please check structure");
                }
                var colpos = ID.indexOf(":");
                var prefix = colpos === -1 ? ID : ID.substring(0, colpos);
                togo = prefix + ":" + (move.localID === undefined ? "" : move.localID) + ":" + togo;
            }
            move = parent;
        }
        
        return togo;
    }

    var renderer = {};
  
    renderer.isBoundPrimitive = function (value) {
        return fluid.isPrimitive(value) || value instanceof Array 
            && (value.length === 0 || typeof (value[0]) === "string"); // jslint:ok
    };
  
    var unzipComponent;
  
    function processChild(value, key) {
        if (renderer.isBoundPrimitive(value)) {
            return {componentType: "UIBound", value: value, ID: key};
        } 
        else {
            var unzip = unzipComponent(value);
            if (unzip.ID) {
                return {ID: key, componentType: "UIContainer", children: [unzip]};
            } else {
                unzip.ID = key;
                return unzip;
            } 
        }
    }
  
    function fixChildren(children) {
        if (!(children instanceof Array)) {
            var togo = [];
            for (var key in children) {
                var value = children[key];
                if (value instanceof Array) {
                    for (var i = 0; i < value.length; ++i) {
                        var processed = processChild(value[i], key);
          //            if (processed.componentType === "UIContainer" &&
          //              processed.localID === undefined) {
          //              processed.localID = i;
          //            }
                        togo[togo.length] = processed;
                    }
                } else {
                    togo[togo.length] = processChild(value, key);
                } 
            }
            return togo;
        } else {return children; }
    }
  
    function fixupValue(uibound, model, resolverGetConfig) {
        if (uibound.value === undefined && uibound.valuebinding !== undefined) {
            if (!model) {
                fluid.fail("Cannot perform value fixup for valuebinding " 
                    + uibound.valuebinding + " since no model was supplied to rendering");
            }
            uibound.value = fluid.get(model, uibound.valuebinding, resolverGetConfig);
        }
    }
  
    function upgradeBound(holder, property, model, resolverGetConfig) {
        if (holder[property] !== undefined) {
            if (renderer.isBoundPrimitive(holder[property])) {
                holder[property] = {value: holder[property]};
            }
            else if (holder[property].messagekey) {
                holder[property].componentType = "UIMessage";
            }
        }
        else {
            holder[property] = {value: null};
        }
        fixupValue(holder[property], model, resolverGetConfig);
    }
  
    renderer.duckMap = {children: "UIContainer", 
            value: "UIBound", valuebinding: "UIBound", messagekey: "UIMessage", 
            markup: "UIVerbatim", selection: "UISelect", target: "UILink",
            choiceindex: "UISelectChoice", functionname: "UIInitBlock"};
      
    var boundMap = {
        UISelect:   ["selection", "optionlist", "optionnames"],
        UILink:     ["target", "linktext"],
        UIVerbatim: ["markup"],
        UIMessage:  ["messagekey"]
    };
  
    renderer.boundMap = fluid.transform(boundMap, fluid.arrayToHash);
      
    renderer.inferComponentType = function (component) {
        for (var key in renderer.duckMap) {
            if (component[key] !== undefined) {
                return renderer.duckMap[key];
            }
        }
    };
  
    renderer.applyComponentType = function (component) {
        component.componentType = renderer.inferComponentType(component);
        if (component.componentType === undefined && component.ID !== undefined) {
            component.componentType = "UIBound";
        }
    };
    
    unzipComponent = function (component, model, resolverGetConfig) {
        if (component) {
            renderer.applyComponentType(component);
        }
        if (!component || component.componentType === undefined) {
            var decorators = component.decorators;
            if (decorators) {delete component.decorators;}
            component = {componentType: "UIContainer", children: component};
            component.decorators = decorators;
        }
        var cType = component.componentType;
        if (cType === "UIContainer") {
            component.children = fixChildren(component.children);
        }
        else {
            var map = renderer.boundMap[cType];
            if (map) {
                fluid.each(map, function (value, key) {
                    upgradeBound(component, key, model, resolverGetConfig);
                });
            }
        }
        
        return component;
    };
    
    function fixupTree(tree, model, resolverGetConfig) {
        if (tree.componentType === undefined) {
            tree = unzipComponent(tree, model, resolverGetConfig);
        }
        if (tree.componentType !== "UIContainer" && !tree.parent) {
            tree = {children: [tree]};
        }
        
        if (tree.children) {
            tree.childmap = {};
            for (var i = 0; i < tree.children.length; ++i) {
                var child = tree.children[i];
                if (child.componentType === undefined) {
                    child = unzipComponent(child, model, resolverGetConfig);
                    tree.children[i] = child;
                }
                child.parent = tree;
                if (child.ID === undefined) {
                    fluid.fail("Error in component tree: component found with no ID " + debugPosition(child));
                }
                tree.childmap[child.ID] = child;
                var colpos = child.ID.indexOf(":"); 
                if (colpos === -1) {
                //  tree.childmap[child.ID] = child; // moved out of branch to allow
                // "relative id expressions" to be easily parsed
                }
                else { // jslint:ok - TODO: review the above
                    var prefix = child.ID.substring(0, colpos);
                    var childlist = tree.childmap[prefix]; 
                    if (!childlist) {
                        childlist = [];
                        tree.childmap[prefix] = childlist;
                    }
                    if (child.localID === undefined && childlist.length !== 0) {
                        child.localID = childlist.length;
                    }
                    childlist[childlist.length] = child;
                }
                child.fullID = computeFullID(child);
        
                var componentType = child.componentType;
                if (componentType === "UISelect") {
                    child.selection.fullID = child.fullID + "-selection";
                }
                else if (componentType === "UIInitBlock") {
                    var call = child.functionname + '(';
                    for (var j = 0; j < child.arguments.length; ++j) { // jslint:ok
                        if (child.arguments[j] instanceof fluid.ComponentReference) { // jslint:ok
                            // TODO: support more forms of id reference
                            child.arguments[j] = child.parent.fullID + child.arguments[j].reference; // jslint:ok
                        }
                        call += JSON.stringify(child.arguments[j]); // jslint:ok
                        if (j < child.arguments.length - 1) { // jslint:ok
                            call += ", ";
                        }
                    }
                    child.markup = {value: call + ")\n"};
                    child.componentType = "UIVerbatim";
                }
                else if (componentType === "UIBound") {
                    fixupValue(child, model, resolverGetConfig);
                }
                fixupTree(child, model, resolverGetConfig);
            }
        }
        return tree;
    }
    
    fluid.NULL_STRING = "\u25a9null\u25a9";
  
    var LINK_ATTRIBUTES = {
        a: "href", link: "href", img: "src", frame: "src", script: "src", style: "src", input: "src", embed: "src", // jslint:ok
        form: "action",
        applet: "codebase", object: "codebase" //jslint:ok
    };
    
    renderer.decoratorComponentPrefix = "**-renderer-";
  
    renderer.IDtoComponentName = function(ID, num) {
        return renderer.decoratorComponentPrefix + ID.replace(/\./g, "") + "-" + num;
    };
    
    renderer.invokeFluidDecorator = function(func, args, ID, num, options) {
        var that;
        if (options.instantiator && options.parentComponent) {
            var parent = options.parentComponent;
            var name = renderer.IDtoComponentName(ID, num);
            // TODO: The best we can do here without GRADES is to wildly guess 
            // that it is a view component with options in the 2nd place and container in first place
            fluid.set(parent, fluid.path("options", "components", name), {type: func});
            // This MIGHT really be a variant of fluid.invoke... only we often probably DO want the component
            // itself to be inserted into the that stack. This *ALSO* requires GRADES to resolve. A 
            // "function" is that which has no grade. The gradeless grade.
            that = fluid.initDependent(options.parentComponent, name, options.instantiator, args);
        }
        else {
            that = fluid.invokeGlobalFunction(func, args);
        }
        return that;
    };
  
    fluid.renderer = function (templates, tree, options, fossilsIn) {
      
        options = options || {};
        tree = tree || {};
        var debugMode = options.debugMode;
        if (!options.messageLocator && options.messageSource) {
            options.messageLocator = fluid.resolveMessageSource(options.messageSource);
        }
        options.document = options.document || document;
        
        var directFossils = fossilsIn || {}; // map of submittingname to {EL, submittingname, oldvalue}
      
        var globalmap = {};
        var branchmap = {};
        var rewritemap = {}; // map of rewritekey (for original id in template) to full ID 
        var seenset = {};
        var collected = {};
        var out = "";
        var renderOptions = options;
        var decoratorQueue = [];
        
        var renderedbindings = {}; // map of fullID to true for UISelects which have already had bindings written
        var usedIDs = {};
        
        var that = {};
        
        function getRewriteKey(template, parent, id) {
            return template.resourceKey + parent.fullID + id;
        }
        // returns: lump
        function resolveInScope(searchID, defprefix, scope, child) {
            var deflump;
            var scopelook = scope? scope[searchID] : null;
            if (scopelook) {
                for (var i = 0; i < scopelook.length; ++i) {
                    var scopelump = scopelook[i];
                    if (!deflump && scopelump.rsfID === defprefix) {
                        deflump = scopelump;
                    }
                    if (scopelump.rsfID === searchID) {
                        return scopelump;
                    }
                }
            }
            return deflump;
        }
        // returns: lump
        function resolveCall(sourcescope, child) {
            var searchID = child.jointID? child.jointID : child.ID;
            var split = fluid.SplitID(searchID);
            var defprefix = split.prefix + ':';
            var match = resolveInScope(searchID, defprefix, sourcescope.downmap, child);
            if (match) {return match;}
            if (child.children) {
                match = resolveInScope(searchID, defprefix, globalmap, child);
                if (match) {return match;}
            }
            return null;
        }
        
        function noteCollected(template) {
            if (!seenset[template.href]) {
                fluid.aggregateMMap(collected, template.collectmap);
                seenset[template.href] = true;
            }
        }
        
        var fetchComponent;
        
        function resolveRecurse(basecontainer, parentlump) {
            for (var i = 0; i < basecontainer.children.length; ++i) {
                var branch = basecontainer.children[i];
                if (branch.children) { // it is a branch
                    var resolved = resolveCall(parentlump, branch);
                    if (resolved) {
                        branchmap[branch.fullID] = resolved;
                        var id = resolved.attributemap.id;
                        if (id !== undefined) {
                            rewritemap[getRewriteKey(parentlump.parent, basecontainer, id)] = branch.fullID;
                        }
                        // on server-side this is done separately
                        noteCollected(resolved.parent);
                        resolveRecurse(branch, resolved);
                    }
                }
            }
            // collect any rewritten ids for the purpose of later rewriting
            if (parentlump.downmap) {
                for (var id in parentlump.downmap) { // jslint:ok - scoping
                  //if (id.indexOf(":") === -1) {
                    var lumps = parentlump.downmap[id];
                    for (var i = 0; i < lumps.length; ++i) { // jslint:ok - scoping
                        var lump = lumps[i];
                        var lumpid = lump.attributemap.id;
                        if (lumpid !== undefined && lump.rsfID !== undefined) {
                            var resolved = fetchComponent(basecontainer, lump.rsfID); //jslint:ok - scoping
                            if (resolved !== null) {
                                var resolveID = resolved.fullID;
                                if (resolved.componentType === "UISelect") {
                                    resolveID = resolveID + "-selection";
                                }
                                rewritemap[getRewriteKey(parentlump.parent, basecontainer,
                                    lumpid)] = resolveID;
                            }
                        }
                    }
                //  }
                } 
            }
            
        }
        
        function resolveBranches(globalmapp, basecontainer, parentlump) {
            branchmap = {};
            rewritemap = {};
            seenset = {};
            collected = {};
            globalmap = globalmapp;
            branchmap[basecontainer.fullID] = parentlump;
            resolveRecurse(basecontainer, parentlump);
        }
               
        function dumpTillLump(lumps, start, limit) {
            for (; start < limit; ++start) {
                var text = lumps[start].text;
                if (text) { // guard against "undefined" lumps from "justended"
                    out += lumps[start].text;
                }
            }
        }
      
        function dumpScan(lumps, renderindex, basedepth, closeparent, insideleaf) {
            var start = renderindex;
            while (true) {
                if (renderindex === lumps.length) {
                    break;
                }
                var lump = lumps[renderindex];
                if (lump.nestingdepth < basedepth) {
                    break;
                }
                if (lump.rsfID !== undefined) {
                    if (!insideleaf) {break;}
                    if (insideleaf && lump.nestingdepth > basedepth + (closeparent? 0 : 1)) {
                        fluid.log("Error in component tree - leaf component found to contain further components - at " +
                            lump.toString());
                    }
                    else {break;}
                }
                // target.print(lump.text);
                ++renderindex;
            }
            // ASSUMPTIONS: close tags are ONE LUMP
            if (!closeparent && (renderindex === lumps.length || !lumps[renderindex].rsfID)) {
                --renderindex;
            }
            
            dumpTillLump(lumps, start, renderindex);
            //target.write(buffer, start, limit - start);
            return renderindex;
        }
        
        
        function isPlaceholder(value) {
            // TODO: equivalent of server-side "placeholder" system
            return false;
        }
        
        function isValue(value) {
            return value !== null && value !== undefined && !isPlaceholder(value);
        }
        
        // In RSF Client, this is a "flyweight" "global" object that is reused for every tag, 
        // to avoid generating garbage. In RSF Server, it is an argument to the following rendering
        // methods of type "TagRenderContext".
        
        var trc = {};
        
        /*** TRC METHODS ***/
        
        function openTag() {
            if (!trc.iselide) {
                out += "<" + trc.uselump.tagname;
            }
        }
        
        function closeTag() {
            if (!trc.iselide) {
                out += "</" + trc.uselump.tagname + ">";
            }
        }
      
        function renderUnchanged() {
            // TODO needs work since we don't keep attributes in text
            dumpTillLump(trc.uselump.parent.lumps, trc.uselump.lumpindex + 1,
                trc.close.lumpindex + (trc.iselide ? 0 : 1));
        }

        function isSelfClose() {
            return trc.endopen.lumpindex === trc.close.lumpindex && fluid.XMLP.closedTags[trc.uselump.tagname]; 
        }

        function dumpTemplateBody() {
            if (isSelfClose()) {
                if (!trc.iselide) {
                    out += "/>";
                }
            }
            else {
                if (!trc.iselide) {
                    out += ">";
                }
                dumpTillLump(trc.uselump.parent.lumps, trc.endopen.lumpindex,
                    trc.close.lumpindex + (trc.iselide ? 0 : 1));
            }
        }
        
        function replaceAttributes() {
            if (!trc.iselide) {
                out += fluid.dumpAttributes(trc.attrcopy);
            }
            dumpTemplateBody();
        }
      
        function replaceAttributesOpen() {
            if (trc.iselide) {
                replaceAttributes();
            }
            else {
                out += fluid.dumpAttributes(trc.attrcopy);
                var selfClose = isSelfClose();
                // TODO: the parser does not ever produce empty tags
                out += selfClose ? "/>" : ">";
          
                trc.nextpos = selfClose? trc.close.lumpindex + 1 : trc.endopen.lumpindex;
            }
        }

        function replaceBody(value) {
            out += fluid.dumpAttributes(trc.attrcopy);
            if (!trc.iselide) {
                out += ">";
            }
            out += fluid.XMLEncode(value.toString());
            closeTag();
        }
      
        function rewriteLeaf(value) {
            if (isValue(value)) {
                replaceBody(value);
            }
            else {
                replaceAttributes();
            }
        }
      
        function rewriteLeafOpen(value) {
            if (trc.iselide) {
                rewriteLeaf(trc.value);
            }
            else {
                if (isValue(value)) {
                    replaceBody(value);
                }
                else {
                    replaceAttributesOpen();
                }
            }
        }

        
        /*** END TRC METHODS**/
        
        function rewriteUrl(template, url) {
            if (renderOptions.urlRewriter) {
                var rewritten = renderOptions.urlRewriter(url);
                if (rewritten) {
                    return rewritten;
                }
            }
            if (!renderOptions.rebaseURLs) {
                return url;
            }
            var protpos = url.indexOf(":/");
            if (url.charAt(0) === '/' || protpos !== -1 && protpos < 7) { // jslint:ok
                return url;
            }
            else {
                return renderOptions.baseURL + url;
            }
        }
        
        function dumpHiddenField(/** UIParameter **/ todump) { // jslint:ok
            out += "<input type=\"hidden\" ";
            var isvirtual = todump.virtual;
            var outattrs = {};
            outattrs[isvirtual? "id" : "name"] = todump.name;
            outattrs.value = todump.value;
            out += fluid.dumpAttributes(outattrs);
            out += " />\n";
        }
        
        var outDecoratorsImpl;
        
        function applyAutoBind(torender, finalID) {
            if (!finalID) {
              // if no id is assigned so far, this is a signal that this is a "virtual" component such as
              // a non-HTML UISelect which will not have physical markup.
                return; 
            }
            var tagname = trc.uselump.tagname;
            var applier = renderOptions.applier;
            function applyFunc() {
                fluid.applyChange(fluid.byId(finalID), undefined, applier);
            }
            if (renderOptions.autoBind && /input|select|textarea/.test(tagname) 
                    && !renderedbindings[finalID]) {
                var decorators = [{jQuery: ["change", applyFunc]}];
                // Work around bug 193: http://webbugtrack.blogspot.com/2007/11/bug-193-onchange-does-not-fire-properly.html
                if ($.browser.msie && tagname === "input" 
                        && /radio|checkbox/.test(trc.attrcopy.type)) {
                    decorators.push({jQuery: ["click", applyFunc]});
                }
                if ($.browser.safari && tagname === "input" && trc.attrcopy.type === "radio") {
                    decorators.push({jQuery: ["keyup", applyFunc]});
                }
                outDecoratorsImpl(torender, decorators, trc.attrcopy, finalID); // jslint:ok - forward reference
            }    
        }
        
        function dumpBoundFields(/** UIBound**/ torender, parent) { // jslint:ok - whitespace
            if (torender) {
                var holder = parent? parent : torender;
                if (directFossils && holder.valuebinding) {
                    var fossilKey = holder.submittingname || torender.finalID;
                  // TODO: this will store multiple times for each member of a UISelect
                    directFossils[fossilKey] = {
                        name: fossilKey,
                        EL: holder.valuebinding,
                        oldvalue: holder.value
                    };
                  // But this has to happen multiple times
                    applyAutoBind(torender, torender.finalID);
                }
                if (torender.fossilizedbinding) {
                    dumpHiddenField(torender.fossilizedbinding);
                }
                if (torender.fossilizedshaper) {
                    dumpHiddenField(torender.fossilizedshaper);
                }
            }
        }
        
        function dumpSelectionBindings(uiselect) {
            if (!renderedbindings[uiselect.selection.fullID]) {
                renderedbindings[uiselect.selection.fullID] = true; // set this true early so that selection does not autobind twice
                dumpBoundFields(uiselect.selection);
                dumpBoundFields(uiselect.optionlist);
                dumpBoundFields(uiselect.optionnames);
            }
        }
          
        function isSelectedValue(torender, value) {
            var selection = torender.selection;
            return selection.value && typeof(selection.value) !== "string" && typeof(selection.value.length) === "number" ? 
                $.inArray(value, selection.value, value) !== -1 :
                selection.value === value;
        }
        
        function getRelativeComponent(component, relativeID) {
            component = component.parent;
            while (relativeID.indexOf("..::") === 0) {
                relativeID = relativeID.substring(4);
                component = component.parent;
            }
            return component.childmap[relativeID];
        }
        
        function adjustForID(attrcopy, component, late, forceID) {
            if (!late) {
                delete attrcopy["rsf:id"];
            }
            if (component.finalID !== undefined) {
                attrcopy.id = component.finalID;
            }
            else if (forceID !== undefined) {
                attrcopy.id = forceID;
            }
            else {
                if (attrcopy.id || late) {
                    attrcopy.id = component.fullID;
                }
            }
            
            var count = 1;
            var baseid = attrcopy.id;
            while (renderOptions.document.getElementById(attrcopy.id) || usedIDs[attrcopy.id]) {
                attrcopy.id = baseid + "-" + (count++); 
            }
            component.finalID = attrcopy.id;
            return attrcopy.id;
        }
        
        function assignSubmittingName(attrcopy, component, parent) {
            var submitting = parent || component;
          // if a submittingName is required, we must already go out to the document to 
          // uniquify the id that it will be derived from
            adjustForID(attrcopy, component, true, component.fullID);
            if (submitting.submittingname === undefined && submitting.willinput !== false) {
                submitting.submittingname = submitting.finalID || submitting.fullID;
            }
            return submitting.submittingname;
        }
             
        function explodeDecorators(decorators) {
            var togo = [];
            if (decorators.type) {
                togo[0] = decorators;
            }
            else {
                for (var key in decorators) {
                    if (key === "$") {key = "jQuery";}
                    var value = decorators[key];
                    var decorator = {
                        type: key
                    };
                    if (key === "jQuery") {
                        decorator.func = value[0];
                        decorator.args = value.slice(1);
                    }
                    else if (key === "addClass" || key === "removeClass") {
                        decorator.classes = value;
                    }
                    else if (key === "attrs") {
                        decorator.attributes = value;
                    }
                    else if (key === "identify") {
                        decorator.key = value;
                    }
                    togo[togo.length] = decorator;
                }
            }
            return togo;
        }
        
        outDecoratorsImpl = function(torender, decorators, attrcopy, finalID) {
            renderOptions.idMap = renderOptions.idMap || {};
            for (var i = 0; i < decorators.length; ++i) {
                var decorator = decorators[i];
                var type = decorator.type;
                if (!type) {
                    var explodedDecorators = explodeDecorators(decorator);
                    outDecoratorsImpl(torender, explodedDecorators, attrcopy, finalID);
                    continue;
                }
                if (type === "$") {type = decorator.type = "jQuery";}
                if (type === "jQuery" || type === "event" || type === "fluid") {
                    var id = adjustForID(attrcopy, torender, true, finalID);
                    if (decorator.ids === undefined) {
                        decorator.ids = [];
                        decoratorQueue[decoratorQueue.length] = decorator; 
                    }
                    decorator.ids.push(id);
                }
                // honour these remaining types immediately
                else if (type === "attrs") {
                    fluid.each(decorator.attributes, function(value, key) {
                        if (value === null || value === undefined) {
                            delete attrcopy[key];
                        }
                        else {
                            attrcopy[key] = fluid.XMLEncode(value);
                        }
                    }); // jslint:ok - function within loop
                }
                else if (type === "addClass" || type === "removeClass") {
                    var fakeNode = {
                        nodeType: 1,
                        className: attrcopy["class"] || ""
                    };
                    $(fakeNode)[type](decorator.classes);
                    attrcopy["class"] = fakeNode.className;
                }
                else if (type === "identify") {
                    var id = adjustForID(attrcopy, torender, true, finalID); // jslint:ok - scoping
                    renderOptions.idMap[decorator.key] = id;
                }
                else if (type !== "null") {
                    fluid.log("Unrecognised decorator of type " + type + " found at component of ID " + finalID);
                }
            }
        };
        
        function outDecorators(torender, attrcopy) {
            if (!torender.decorators) {return;}
            if (torender.decorators.length === undefined) {
                torender.decorators = explodeDecorators(torender.decorators);
            }
            outDecoratorsImpl(torender, torender.decorators, attrcopy);
        }
        
        function dumpBranchHead(branch, targetlump) {
            if (targetlump.elide) {
                return;
            }
            var attrcopy = {};
            $.extend(true, attrcopy, targetlump.attributemap);
            adjustForID(attrcopy, branch); // jslint:ok - forward reference
            outDecorators(branch, attrcopy);
            out += "<" + targetlump.tagname + " ";
            out += fluid.dumpAttributes(attrcopy);
            out += ">";
        }
        
        function resolveArgs(args) {
            if (!args) {return args;}
            return fluid.transform(args, function (arg, index) {
                upgradeBound(args, index, renderOptions.model, renderOptions.resolverGetConfig);
                return args[index].value;
            });
        }
            
        function degradeMessage(torender) {
            if (torender.componentType === "UIMessage") {
                // degrade UIMessage to UIBound by resolving the message
                torender.componentType = "UIBound";
                if (!renderOptions.messageLocator) {
                    torender.value = "[No messageLocator is configured in options - please consult documentation on options.messageSource]";
                }
                else {
                    upgradeBound(torender, "messagekey", renderOptions.model, renderOptions.resolverGetConfig);
                    var resArgs = resolveArgs(torender.args);
                    torender.value = renderOptions.messageLocator(torender.messagekey.value, resArgs);
                }
            }
        }  
        
          
        function renderComponent(torender) {
            var attrcopy = trc.attrcopy;
            
            degradeMessage(torender);
            var componentType = torender.componentType;
            var tagname = trc.uselump.tagname;
            
            outDecorators(torender, attrcopy);
            
            function makeFail(torender, end) {
                fluid.fail("Error in component tree - UISelectChoice with id " + torender.fullID + end);
            } 
            
            if (componentType === "UIBound" || componentType === "UISelectChoice") {
                var parent;
                if (torender.choiceindex !== undefined) {
                    if (torender.parentRelativeID !== undefined) {
                        parent = getRelativeComponent(torender, torender.parentRelativeID);
                        if (!parent) {
                            makeFail(torender, " has parentRelativeID of " + torender.parentRelativeID + " which cannot be resolved");
                        }
                    }
                    else {
                        makeFail(torender, " does not have parentRelativeID set");
                    }
                    assignSubmittingName(attrcopy, torender, parent.selection);
                    dumpSelectionBindings(parent);
                }
        
                var submittingname = parent? parent.selection.submittingname : torender.submittingname;
                if (!parent && torender.valuebinding) {
                    // Do this for all bound fields even if non submitting so that finalID is set in order to track fossils (FLUID-3387)
                    submittingname = assignSubmittingName(attrcopy, torender);
                }
                if (tagname === "input" || tagname === "textarea") {
                    if (submittingname !== undefined) {
                        attrcopy.name = submittingname;
                    }
                }
                // this needs to happen early on the client, since it may cause the allocation of the
                // id in the case of a "deferred decorator". However, for server-side bindings, this 
                // will be an inappropriate time, unless we shift the timing of emitting the opening tag.
                dumpBoundFields(torender, parent? parent.selection : null);
          
                if (typeof(torender.value) === 'boolean' || attrcopy.type === "radio" 
                        || attrcopy.type === "checkbox") {
                    var underlyingValue;
                    var directValue = torender.value;
                    
                    if (torender.choiceindex !== undefined) {
                        if (!parent.optionlist.value) {
                            fluid.fail("Error in component tree - selection control with full ID " + parent.fullID + " has no values");
                        }
                        underlyingValue = parent.optionlist.value[torender.choiceindex];
                        directValue = isSelectedValue(parent, underlyingValue);
                    }
                    if (isValue(directValue)) {
                        if (directValue) {
                            attrcopy.checked = "checked";
                        }
                        else {
                            delete attrcopy.checked;
                        }
                    }
                    attrcopy.value = fluid.XMLEncode(underlyingValue? underlyingValue : "true");
                    rewriteLeaf(null);
                }
                else if (torender.value instanceof Array) {
                    // Cannot be rendered directly, must be fake
                    renderUnchanged();
                }
                else { // String value
                    var value = parent? 
                        parent[tagname === "textarea" || tagname === "input" ? "optionlist" : "optionnames"].value[torender.choiceindex] : 
                            torender.value; // jslint:ok - whitespace
                    if (tagname === "textarea") {
                        if (isPlaceholder(value) && torender.willinput) {
                            // FORCE a blank value for input components if nothing from
                            // model, if input was intended.
                            value = "";
                        }
                        rewriteLeaf(value);
                    }
                    else if (tagname === "input") {
                        if (torender.willinput || isValue(value)) {
                            attrcopy.value = fluid.XMLEncode(String(value));
                        }
                        rewriteLeaf(null);
                    }
                    else {
                        delete attrcopy.name;
                        rewriteLeafOpen(value);
                    }
                }
            }
            else if (componentType === "UISelect") {
  
                var ishtmlselect = tagname === "select";
                var ismultiple = false;
          
                if (torender.selection.value instanceof Array) {
                    ismultiple = true;
                    if (ishtmlselect) {
                        attrcopy.multiple = "multiple";
                    }
                }
                // assignSubmittingName is now the definitive trigger point for uniquifying output IDs
                // However, if id is already assigned it is probably through attempt to decorate root select.
                // in this case restore it.
                var oldid = attrcopy.id;
                assignSubmittingName(attrcopy, torender.selection);
                if (oldid !== undefined) {
                    attrcopy.id = oldid;
                }
                
                if (ishtmlselect) {
                    // The HTML submitted value from a <select> actually corresponds
                    // with the selection member, not the top-level component.
                    if (torender.selection.willinput !== false) {
                        attrcopy.name = torender.selection.submittingname;
                    }
                    applyAutoBind(torender, attrcopy.id);
                }
                
                out += fluid.dumpAttributes(attrcopy);
                if (ishtmlselect) {
                    out += ">";
                    var values = torender.optionlist.value;
                    var names = torender.optionnames === null || torender.optionnames === undefined || !torender.optionnames.value? values : torender.optionnames.value;
                    if (!names || !names.length) {
                        fluid.fail("Error in component tree - UISelect component with fullID " 
                            + torender.fullID + " does not have optionnames set");
                    }
                    for (var i = 0; i < names.length; ++i) {
                        out += "<option value=\"";
                        var value = values[i]; //jslint:ok - scoping
                        if (value === null) {
                            value = fluid.NULL_STRING;
                        }
                        out += fluid.XMLEncode(value);
                        if (isSelectedValue(torender, value)) {
                            out += "\" selected=\"selected";
                        }
                        out += "\">";
                        out += fluid.XMLEncode(names[i]);
                        out += "</option>\n";
                    }
                    closeTag();
                }
                else {
                    dumpTemplateBody();
                }
                dumpSelectionBindings(torender);
            }
            else if (componentType === "UILink") {
                var attrname = LINK_ATTRIBUTES[tagname];
                if (attrname) {
                    degradeMessage(torender.target);
                    var target = torender.target.value;
                    if (!isValue(target)) {
                        target = attrcopy[attrname];
                    }
                    target = rewriteUrl(trc.uselump.parent, target);
                    // Note that all real browsers succeed in recovering the URL here even if it is presented in violation of XML
                    // seemingly due to the purest accident, the text &amp; cannot occur in a properly encoded URL :P
                    attrcopy[attrname] = fluid.XMLEncode(target);
                }
                var value; // jslint:ok
                if (torender.linktext) { 
                    degradeMessage(torender.linktext);
                    value = torender.linktext.value; // jslint:ok - scoping
                }
                if (!isValue(value)) {
                    replaceAttributesOpen();
                }
                else {
                    rewriteLeaf(value);
                }
            }
            
            else if (torender.markup !== undefined) { // detect UIVerbatim
                degradeMessage(torender.markup);
                var rendered = torender.markup.value;
                if (rendered === null) {
                  // TODO, doesn't quite work due to attr folding cf Java code
                    out += fluid.dumpAttributes(attrcopy);
                    out += ">";
                    renderUnchanged(); 
                }
                else {
                    if (!trc.iselide) {
                        out += fluid.dumpAttributes(attrcopy);
                        out += ">";
                    }
                    out += rendered;
                    closeTag();
                }
            }
            if (attrcopy.id !== undefined) {
                usedIDs[attrcopy.id] = true;
            }
        }
             
        function rewriteIDRelation(context) {
            var attrname;
            var attrval = trc.attrcopy["for"];
            if (attrval !== undefined) {
                attrname = "for";
            }
            else {
                attrval = trc.attrcopy.headers;
                if (attrval !== undefined) {
                    attrname = "headers";
                }
            }
            if (!attrname) {return;}
            var tagname = trc.uselump.tagname;
            if (attrname === "for" && tagname !== "label") {return;}
            if (attrname === "headers" && tagname !== "td" && tagname !== "th") {return;}
            var rewritten = rewritemap[getRewriteKey(trc.uselump.parent, context, attrval)];
            if (rewritten !== undefined) {
                trc.attrcopy[attrname] = rewritten;
            }
        }
        
        function renderComment(message) {
            out += ("<!-- " + fluid.XMLEncode(message) + "-->");
        }
        
        function renderDebugMessage(message) {
            out += "<span style=\"background-color:#FF466B;color:white;padding:1px;\">";
            out += message;
            out += "</span><br/>";
        }
        
        function reportPath(/*UIComponent*/ branch) { // jslint:ok - whitespace
            var path = branch.fullID;
            return !path ? "component tree root" : "full path " + path;
        }
        
        function renderComponentSystem(context, torendero, lump) {
            var lumpindex = lump.lumpindex;
            var lumps = lump.parent.lumps;
            var nextpos = -1;
            var outerendopen = lumps[lumpindex + 1];
            var outerclose = lump.close_tag;
        
            nextpos = outerclose.lumpindex + 1;
        
            var payloadlist = lump.downmap? lump.downmap["payload-component"] : null;
            var payload = payloadlist? payloadlist[0] : null;
            
            var iselide = lump.rsfID.charCodeAt(0) === 126; // "~"
            
            var endopen = outerendopen;
            var close = outerclose;
            var uselump = lump;
            var attrcopy = {};
            $.extend(true, attrcopy, (payload === null? lump : payload).attributemap);
            
            trc.attrcopy = attrcopy;
            trc.uselump = uselump;
            trc.endopen = endopen;
            trc.close = close;
            trc.nextpos = nextpos;
            trc.iselide = iselide;
            
            rewriteIDRelation(context);
            
            if (torendero === null) {
                if (lump.rsfID.indexOf("scr=") === (iselide? 1 : 0)) {
                    var scrname = lump.rsfID.substring(4 + (iselide? 1 : 0));
                    if (scrname === "ignore") {
                        nextpos = trc.close.lumpindex + 1;
                    }
                    else if (scrname === "rewrite-url") {
                        torendero = {componentType: "UILink", target: {}};
                    }
                    else {
                        openTag();
                        replaceAttributesOpen();
                        nextpos = trc.endopen.lumpindex;
                    }
                }
            }
            if (torendero !== null) {
                // else there IS a component and we are going to render it. First make
                // sure we render any preamble.
          
                if (payload) {
                    trc.endopen = lumps[payload.lumpindex + 1];
                    trc.close = payload.close_tag;
                    trc.uselump = payload;
                    dumpTillLump(lumps, lumpindex, payload.lumpindex);
                    lumpindex = payload.lumpindex;
                }
          
                adjustForID(attrcopy, torendero);
                //decoratormanager.decorate(torendero.decorators, uselump.getTag(), attrcopy);
          
                
                // ALWAYS dump the tag name, this can never be rewritten. (probably?!)
                openTag();
          
                renderComponent(torendero);
                // if there is a payload, dump the postamble.
                if (payload !== null) {
                    // the default case is initialised to tag close
                    if (trc.nextpos === nextpos) {
                        dumpTillLump(lumps, trc.close.lumpindex + 1, outerclose.lumpindex + 1);
                    }
                }
                nextpos = trc.nextpos;
            }
            return nextpos;
        }
        var renderRecurse;
        
        function renderContainer(child, targetlump) {
            var t2 = targetlump.parent;
            var firstchild = t2.lumps[targetlump.lumpindex + 1];
            if (child.children !== undefined) {
                dumpBranchHead(child, targetlump);
            }
            else {
                renderComponentSystem(child.parent, child, targetlump);
            }
            renderRecurse(child, targetlump, firstchild);
        }
        
        fetchComponent = function(basecontainer, id, lump) {
            if (id.indexOf("msg=") === 0) {
                var key = id.substring(4);
                return {componentType: "UIMessage", messagekey: key};
            }
            while (basecontainer) {
                var togo = basecontainer.childmap[id];
                if (togo) {
                    return togo;
                }
                basecontainer = basecontainer.parent;
            }
            return null;
        };
      
        function fetchComponents(basecontainer, id) {
            var togo;
            while (basecontainer) {
                togo = basecontainer.childmap[id];
                if (togo) {
                    break;
                }
                basecontainer = basecontainer.parent;
            }
            return togo;
        }
      
        function findChild(sourcescope, child) {
            var split = fluid.SplitID(child.ID);
            var headlumps = sourcescope.downmap[child.ID];
            if (!headlumps) {
                headlumps = sourcescope.downmap[split.prefix + ":"];
            }
            return headlumps? headlumps[0] : null;
        }
        
        renderRecurse = function(basecontainer, parentlump, baselump) {
            var renderindex = baselump.lumpindex;
            var basedepth = parentlump.nestingdepth;
            var t1 = parentlump.parent;
            var rendered;
            if (debugMode) {
                rendered = {};
            }
            while (true) {
                renderindex = dumpScan(t1.lumps, renderindex, basedepth, !parentlump.elide, false);
                if (renderindex === t1.lumps.length) { 
                    break;
                }
                var lump = t1.lumps[renderindex];      
                var id = lump.rsfID;
                // new stopping rule - we may have been inside an elided tag
                if (lump.nestingdepth < basedepth || id === undefined) {
                    break;
                } 
          
                if (id.charCodeAt(0) === 126) { // "~"
                    id = id.substring(1);
                }
                
                //var ismessagefor = id.indexOf("message-for:") === 0;
                
                if (id.indexOf(':') !== -1) {
                    var prefix = fluid.getPrefix(id);
                    var children = fetchComponents(basecontainer, prefix);
                    
                    var finallump = lump.uplump.finallump[prefix];
                    var closefinal = finallump.close_tag;
                    
                    if (children) {
                        for (var i = 0; i < children.length; ++i) {
                            var child = children[i];
                            if (child.children) { // it is a branch 
                                if (debugMode) {
                                    rendered[child.fullID] = true;
                                }
                                var targetlump = branchmap[child.fullID];
                                if (targetlump) {
                                    if (debugMode) {
                                        renderComment("Branching for " + child.fullID + " from "
                                            + fluid.debugLump(lump) + " to " + fluid.debugLump(targetlump));
                                    }
                                    
                                    renderContainer(child, targetlump);
                                    
                                    if (debugMode) {
                                        renderComment("Branch returned for " + child.fullID
                                            + fluid.debugLump(lump) + " to " + fluid.debugLump(targetlump));
                                    }
                                }
                                else if (debugMode) {
                                    renderDebugMessage(
                                        "No matching template branch found for branch container with full ID "
                                            + child.fullID
                                            + " rendering from parent template branch "
                                            + fluid.debugLump(baselump)); // jslint:ok - line breaking
                                }
                            }
                            else { // repetitive leaf
                                var targetlump = findChild(parentlump, child); // jslint:ok - scoping
                                if (!targetlump) {
                                    if (debugMode) {
                                        renderDebugMessage("Repetitive leaf with full ID " + child.fullID
                                            + " could not be rendered from parent template branch "
                                            + fluid.debugLump(baselump)); // jslint:ok - line breaking
                                    }
                                    continue;
                                }
                                var renderend = renderComponentSystem(basecontainer, child, targetlump);
                                var wasopentag = renderend < t1.lumps.lengtn && t1.lumps[renderend].nestingdepth >= targetlump.nestingdepth;
                                var newbase = child.children? child : basecontainer;
                                if (wasopentag) {
                                    renderRecurse(newbase, targetlump, t1.lumps[renderend]);
                                    renderend = targetlump.close_tag.lumpindex + 1;
                                }
                                if (i !== children.length - 1) {
                                    // TODO - fix this bug in RSF Server!
                                    if (renderend < closefinal.lumpindex) {
                                        dumpScan(t1.lumps, renderend, targetlump.nestingdepth - 1, false, false);
                                    }
                                }
                                else {
                                    dumpScan(t1.lumps, renderend, targetlump.nestingdepth, true, false);
                                }
                            }
                        } // end for each repetitive child
                    }
                    else {
                        if (debugMode) {
                            renderDebugMessage("No branch container with prefix "
                                + prefix + ": found in container "
                                + reportPath(basecontainer)
                                + " rendering at template position " + fluid.debugLump(baselump)
                                + ", skipping");
                        }
                    }
                    
                    renderindex = closefinal.lumpindex + 1;
                    if (debugMode) {
                        renderComment("Stack returned from branch for ID " + id + " to "
                            + fluid.debugLump(baselump) + ": skipping from " + fluid.debugLump(lump)
                            + " to " + fluid.debugLump(closefinal));
                    }
                }
                else {
                    var component;
                    if (id) {
                        component = fetchComponent(basecontainer, id, lump);
                        if (debugMode && component) {
                            rendered[component.fullID] = true;
                        }
                    }
                    if (component && component.children !== undefined) {
                        renderContainer(component);
                        renderindex = lump.close_tag.lumpindex + 1;
                    }
                    else {
                        renderindex = renderComponentSystem(basecontainer, component, lump);
                    }
                }
                if (renderindex === t1.lumps.length) {
                    break;
                }
            }
            if (debugMode) {
                var children = basecontainer.children; // jslint:ok - scoping
                for (var key = 0; key < children.length; ++key) {
                    var child = children[key]; // jslint:ok - scoping
                    if (!rendered[child.fullID]) {
                        renderDebugMessage("Component "
                            + child.componentType + " with full ID "
                            + child.fullID + " could not be found within template "
                            + fluid.debugLump(baselump));
                    }
                }
            }  
            
        };
        
        function renderCollect(collump) {
            dumpTillLump(collump.parent.lumps, collump.lumpindex, collump.close_tag.lumpindex + 1);
        }
        
        // Let us pray
        function renderCollects() {
            for (var key in collected) {
                var collist = collected[key];
                for (var i = 0; i < collist.length; ++i) {
                    renderCollect(collist[i]);
                }
            }
        }
        
        function processDecoratorQueue() {
            for (var i = 0; i < decoratorQueue.length; ++i) {
                var decorator = decoratorQueue[i];
                for (var j = 0; j < decorator.ids.length; ++ j) {
                    var id = decorator.ids[j];
                    var node = fluid.byId(id, renderOptions.document);
                    if (!node) {
                        fluid.fail("Error during rendering - component with id " + id 
                            + " which has a queued decorator was not found in the output markup");
                    }
                    if (decorator.type === "jQuery") {
                        var jnode = $(node);
                        jnode[decorator.func].apply(jnode, $.makeArray(decorator.args));
                    }
                    else if (decorator.type === "fluid") {
                        var args = decorator.args;
                        if (!args) {
                            if (!decorator.container) {
                                decorator.container = $(node);
                            }
                            else {
                                decorator.container.push(node);
                            }
                            args = [node, decorator.options];
                        }
                        var that = renderer.invokeFluidDecorator(decorator.func, args, id, i, options);
                        decorator.that = that;
                    }
                    else if (decorator.type === "event") {
                        node[decorator.event] = decorator.handler; 
                    }
                }
            }
        }
  
        that.renderTemplates = function () {
            tree = fixupTree(tree, options.model, options.resolverGetConfig);
            var template = templates[0];
            resolveBranches(templates.globalmap, tree, template.rootlump);
            renderedbindings = {};
            renderCollects();
            renderRecurse(tree, template.rootlump, template.lumps[template.firstdocumentindex]);
            return out;
        };  
        
        that.processDecoratorQueue = function () {
            processDecoratorQueue();
        };
        return that;
        
    };
    
    jQuery.extend(true, fluid.renderer, renderer);
  
    /*
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.ComponentReference = function (reference) {
        this.reference = reference;
    };
    
    // Explodes a raw "hash" into a list of UIOutput/UIBound entries
    fluid.explode = function (hash, basepath) {
        var togo = [];
        for (var key in hash) {
            var binding = basepath === undefined ? key : basepath + "." + key;
            togo[togo.length] = {ID: key, value: hash[key], valuebinding: binding};
        }
        return togo;
    };
      
    
   /**
    * A common utility function to make a simple view of rows, where each row has a selection control and a label
    * @param {Object} optionlist An array of the values of the options in the select
    * @param {Object} opts An object with this structure: {
            selectID: "",         
            rowID: "",            
            inputID: "",
            labelID: ""
        }
    */ 
    fluid.explodeSelectionToInputs = function (optionlist, opts) {
        return fluid.transform(optionlist, function (option, index) {
            return {
                ID: opts.rowID, 
                children: [
                    {ID: opts.inputID, parentRelativeID: "..::" + opts.selectID, choiceindex: index},
                    {ID: opts.labelID, parentRelativeID: "..::" + opts.selectID, choiceindex: index}]
            };
        });
    };
  
    fluid.resolveMessageSource = function (messageSource) {
        if (messageSource.type === "data") {
            if (messageSource.url === undefined) {
                return fluid.messageLocator(messageSource.messages, messageSource.resolveFunc);
            }
            else {
              // TODO: fetch via AJAX, and convert format if necessary
            }
        } // jslint:ok - empty block
        else if (messageSource.type === "resolver") {
            return messageSource.resolver.resolve;
        }
    };
    
    fluid.renderTemplates = function (templates, tree, options, fossilsIn) {
        var renderer = fluid.renderer(templates, tree, options, fossilsIn);
        var rendered = renderer.renderTemplates();
        return rendered;
    };
    /** A driver to render and bind an already parsed set of templates onto
     * a node. See documentation for fluid.selfRender.
     * @param templates A parsed template set, as returned from fluid.selfRender or 
     * fluid.parseTemplates.
     */
  
    fluid.reRender = function (templates, node, tree, options) {
        options = options || {};
              // Empty the node first, to head off any potential id collisions when rendering
        node = fluid.unwrap(node);
        var lastFocusedElement = fluid.getLastFocusedElement ? fluid.getLastFocusedElement() : null;
        var lastId;
        if (lastFocusedElement && fluid.dom.isContainer(node, lastFocusedElement)) {
            lastId = lastFocusedElement.id;
        }
        if ($.browser.msie) {
            $(node).empty(); //- this operation is very slow.
        }
        else {
            node.innerHTML = "";
        }
        var fossils = options.fossils || {};
        
        var renderer = fluid.renderer(templates, tree, options, fossils);
        var rendered = renderer.renderTemplates();
        if (options.renderRaw) {
            rendered = fluid.XMLEncode(rendered);
            rendered = rendered.replace(/\n/g, "<br/>");
        }
        if (options.model) {
            fluid.bindFossils(node, options.model, fossils);
        }
        if ($.browser.msie) {
            $(node).html(rendered);
        }
        else {
            node.innerHTML = rendered;
        }
        renderer.processDecoratorQueue();
        if (lastId) {
            var element = fluid.byId(lastId);
            if (element) {
                $(element).focus();
            }      
        }
          
        return templates;
    };
  
    function findNodeValue(rootNode) {
        var node = fluid.dom.iterateDom(rootNode, function (node) {
          // NB, in Firefox at least, comment and cdata nodes cannot be distinguished!
            return node.nodeType === 8 || node.nodeType === 4 ? "stop" : null;
            }, true); // jslint:ok
        var value = node.nodeValue;
        if (value.indexOf("[CDATA[") === 0) {
            return value.substring(6, value.length - 2);
        }
        else {
            return value;
        }
    }
  
    fluid.extractTemplate = function (node, armouring) {
        if (!armouring) {
            return node.innerHTML;
        }
        else {
            return findNodeValue(node);
        }
    };
    /** A slightly generalised version of fluid.selfRender that does not assume that the
     * markup used to source the template is within the target node.
     * @param source Either a structure {node: node, armouring: armourstyle} or a string
     * holding a literal template
     * @param target The node to receive the rendered markup
     * @param tree, options, return as for fluid.selfRender
     */
    fluid.render = function (source, target, tree, options) {
        options = options || {};
        var template = source;
        if (typeof(source) === "object") {
            template = fluid.extractTemplate(fluid.unwrap(source.node), source.armouring);
        }
        target = fluid.unwrap(target);
        var resourceSpec = {base: {resourceText: template, 
                            href: ".", resourceKey: ".", cutpoints: options.cutpoints}
                            };
        var templates = fluid.parseTemplates(resourceSpec, ["base"], options);
        return fluid.reRender(templates, target, tree, options);    
    };
    
    /** A simple driver for single node self-templating. Treats the markup for a
     * node as a template, parses it into a template structure, renders it using
     * the supplied component tree and options, then replaces the markup in the 
     * node with the rendered markup, and finally performs any required data
     * binding. The parsed template is returned for use with a further call to
     * reRender.
     * @param node The node both holding the template, and whose markup is to be
     * replaced with the rendered result.
     * @param tree The component tree to be rendered.
     * @param options An options structure to configure the rendering and binding process.
     * @return A templates structure, suitable for a further call to fluid.reRender or
     * fluid.renderTemplates.
     */  
    fluid.selfRender = function (node, tree, options) {
        options = options || {};
        return fluid.render({node: node, armouring: options.armouring}, node, tree, options);
    };

})(jQuery, fluid_1_4);
/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010-2011 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, elsecatch: true, operator: true, jslintok:true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    if (!fluid.renderer) {
        fluid.fail("fluidRenderer.js is a necessary dependency of RendererUtilities");
    }
    
    /** Returns an array of size count, filled with increasing integers, 
     *  starting at 0 or at the index specified by first. 
     */
    
    fluid.iota = function (count, first) {
        first = first || 0;
        var togo = [];
        for (var i = 0; i < count; ++i) {
            togo[togo.length] = first++;
        }
        return togo;
    };
    
    fluid.renderer.visitDecorators = function(that, visitor) {
        fluid.visitComponentChildren(that, function(component, name) {
            if (name.indexOf(fluid.renderer.decoratorComponentPrefix) === 0) {
                visitor(component, name);
            }
        }, {flat: true});  
    };

    fluid.renderer.clearDecorators = function(instantiator, that) {
        fluid.renderer.visitDecorators(that, function(component, name) {
            instantiator.clearComponent(that, name);
        });
    };
    
    fluid.renderer.getDecoratorComponents = function(that) {
        var togo = {};
        fluid.renderer.visitDecorators(that, function(component, name) {
            togo[name] = component;
        });
        return togo;
    };

    // Utilities for coordinating options in renderer components - this code is all pretty
    // dreadful and needs to be organised as a suitable set of defaults and policies
    fluid.renderer.modeliseOptions = function (options, defaults, baseOptions) {
        return $.extend({}, defaults, options, fluid.filterKeys(baseOptions, ["model", "applier"]));
    };
    fluid.renderer.reverseMerge = function (target, source, names) {
        names = fluid.makeArray(names);
        fluid.each(names, function (name) {
            if (target[name] === undefined && source[name] !== undefined) {
                target[name] = source[name];
            }
        });
    };

    /** "Renderer component" infrastructure **/
  // TODO: fix this up with IoC and improved handling of templateSource as well as better 
  // options layout (model appears in both rOpts and eOpts)
    fluid.renderer.createRendererSubcomponent = function (container, selectors, options, baseObject, fossils) {
        options = options || {};
        var source = options.templateSource ? options.templateSource : {node: $(container)};
        var rendererOptions = fluid.renderer.modeliseOptions(options.rendererOptions, null, baseObject);
        rendererOptions.fossils = fossils || {};
        
        var expanderOptions = fluid.renderer.modeliseOptions(options.expanderOptions, {ELstyle: "${}"}, baseObject);
        fluid.renderer.reverseMerge(expanderOptions, options, ["resolverGetConfig", "resolverSetConfig"]);
        var that = {};
        if (!options.noexpand) {
            that.expander = fluid.renderer.makeProtoExpander(expanderOptions);
        }
        
        var templates = null;
        that.render = function (tree) {
            var cutpointFn = options.cutpointGenerator || "fluid.renderer.selectorsToCutpoints";
            rendererOptions.cutpoints = rendererOptions.cutpoints || fluid.invokeGlobalFunction(cutpointFn, [selectors, options]);
            container = typeof(container) === "function" ? container() : $(container);
              
            if (templates) {
                fluid.clear(rendererOptions.fossils);
                fluid.reRender(templates, container, tree, rendererOptions);
            } 
            else {
                if (typeof(source) === "function") { // TODO: make a better attempt than this at asynchrony
                    source = source();  
                }
                templates = fluid.render(source, container, tree, rendererOptions);
            }
        };
        return that;
    };
    
    fluid.defaults("fluid.rendererComponent", {
        gradeNames: ["fluid.viewComponent"],
        initFunction: "fluid.initRendererComponent",
        mergePolicy: {
            protoTree: "noexpand, replace"
        },
        rendererOptions: {
            autoBind: true
        },
        events: {
            prepareModelForRender: null,
            onRenderTree: null,
            afterRender: null,
            produceTree: "unicast"
        }
    });

    fluid.initRendererComponent = function (componentName, container, options) {
        var that = fluid.initView(componentName, container, options, {gradeNames: ["fluid.rendererComponent"]});
        
        fluid.fetchResources(that.options.resources); // TODO: deal with asynchrony
        
        var rendererOptions = fluid.renderer.modeliseOptions(that.options.rendererOptions, null, that);
        if (!that.options.noUpgradeDecorators) {
            fluid.withInstantiator(that, function(currentInst) {
                rendererOptions.instantiator = currentInst;
                rendererOptions.parentComponent = that;
            });
        }
        var messageResolver;
        if (!rendererOptions.messageSource && that.options.strings) {
            messageResolver = fluid.messageResolver({
                messageBase: that.options.strings,
                resolveFunc: that.options.messageResolverFunction,
                parents: fluid.makeArray(that.options.parentBundle)
            });
            rendererOptions.messageSource = {type: "resolver", resolver: messageResolver}; 
        }
        fluid.renderer.reverseMerge(rendererOptions, that.options, ["resolverGetConfig", "resolverSetConfig"]);


        var rendererFnOptions = $.extend({}, that.options.rendererFnOptions, { 
            rendererOptions: rendererOptions,
            repeatingSelectors: that.options.repeatingSelectors,
            selectorsToIgnore: that.options.selectorsToIgnore,
            expanderOptions: {
                envAdd: {styles: that.options.styles}
            }
        });
           
        if (that.options.resources && that.options.resources.template) {
            rendererFnOptions.templateSource = function () { // TODO: don't obliterate, multitemplates, etc.
                return that.options.resources.template.resourceText;
            };
        }
        var produceTree = that.events.produceTree;
        produceTree.addListener( function() {
            return that.options.protoTree;
            }
        );
        
        if (that.options.produceTree) {
            produceTree.addListener(that.options.produceTree);
        }

        fluid.renderer.reverseMerge(rendererFnOptions, that.options, ["resolverGetConfig", "resolverSetConfig"]);
        if (rendererFnOptions.rendererTargetSelector) {
            container = function () {return that.dom.locate(rendererFnOptions.rendererTargetSelector); };
        }
       
        var renderer = {
            fossils: {},
            boundPathForNode: function (node) {
                return fluid.boundPathForNode(node, renderer.fossils);
            }
        };
       
        var rendererSub = fluid.renderer.createRendererSubcomponent(container, that.options.selectors, rendererFnOptions, that, renderer.fossils);
        that.renderer = $.extend(renderer, rendererSub);
        
        if (messageResolver) {
            that.messageResolver = messageResolver;
        }

        that.refreshView = renderer.refreshView = function () {
            if (rendererOptions.instantiator && rendererOptions.parentComponent) {
                fluid.renderer.clearDecorators(rendererOptions.instantiator, rendererOptions.parentComponent);
            }
            that.events.prepareModelForRender.fire(that.model, that.applier, that);
            var tree = produceTree.fire(that);
            if (that.renderer.expander) {
                tree = that.renderer.expander(tree);
            }
            that.events.onRenderTree.fire(that, tree);
            that.renderer.render(tree);
            that.events.afterRender.fire(that);
        };
        
        return that;
    };
    
    var removeSelectors = function (selectors, selectorsToIgnore) {
        fluid.each(fluid.makeArray(selectorsToIgnore), function (selectorToIgnore) {
            delete selectors[selectorToIgnore];
        });
        return selectors;
    };

    var markRepeated = function (selectorKey, repeatingSelectors) {
        if (repeatingSelectors) {
            fluid.each(repeatingSelectors, function (repeatingSelector) {
                if (selectorKey === repeatingSelector) {
                    selectorKey = selectorKey + ":";
                }
            });
        }
        return selectorKey;
    };

    fluid.renderer.selectorsToCutpoints = function (selectors, options) {
        var togo = [];
        options = options || {};
        selectors = fluid.copy(selectors); // Make a copy before potentially destructively changing someone's selectors.
    
        if (options.selectorsToIgnore) {
            selectors = removeSelectors(selectors, options.selectorsToIgnore);
        }
    
        for (var selectorKey in selectors) {
            togo.push({
                id: markRepeated(selectorKey, options.repeatingSelectors),
                selector: selectors[selectorKey]
            });
        }
    
        return togo;
    };
  
    /** END of "Renderer Components" infrastructure **/
    
    fluid.renderer.NO_COMPONENT = {};
  
    /** A special "shallow copy" operation suitable for nondestructively
     * merging trees of components. jQuery.extend in shallow mode will 
     * neglect null valued properties.
     * This function is unsupported: It is not really intended for use by implementors.
     */
    fluid.renderer.mergeComponents = function (target, source) {
        for (var key in source) {
            target[key] = source[key];
        }
        return target;
    };
    
    fluid.registerNamespace("fluid.renderer.selection");
        
    /** Definition of expanders - firstly, "heavy" expanders **/
    
    fluid.renderer.selection.inputs = function (options, container, key, config) {
        fluid.expect("Selection to inputs expander", ["selectID", "inputID", "labelID", "rowID"], options);
        var selection = config.expander(options.tree);
        var rows = fluid.transform(selection.optionlist.value, function (option, index) {
            var togo = {};
            var element =  {parentRelativeID: "..::" + options.selectID, choiceindex: index};
            togo[options.inputID] = element;
            togo[options.labelID] = fluid.copy(element); 
            return togo;
        });
        var togo = {}; // TODO: JICO needs to support "quoted literal key initialisers" :P
        togo[options.selectID] = selection;
        togo[options.rowID] = {children: rows};
        togo = config.expander(togo);
        return togo;
    };
    
    fluid.renderer.repeat = function (options, container, key, config) {
        fluid.expect("Repetition expander", ["controlledBy", "tree"], options);
        var path = fluid.extractContextualPath(options.controlledBy, {ELstyle: "ALL"}, fluid.threadLocal());
        var list = fluid.get(config.model, path, config.resolverGetConfig);
        
        var togo = {};
        if (!list || list.length === 0) {
            return options.ifEmpty ? config.expander(options.ifEmpty) : togo;
        }
        var expanded = [];
        fluid.each(list, function (element, i) {
            var EL = fluid.model.composePath(path, i); 
            var envAdd = {};
            if (options.pathAs) {
                envAdd[options.pathAs] = EL;
            }
            if (options.valueAs) {
                envAdd[options.valueAs] = fluid.get(config.model, EL, config.resolverGetConfig);
            }
            var expandrow = fluid.withEnvironment(envAdd, function () {return config.expander(options.tree); }, "rendererEnvironment");
            if (fluid.isArrayable(expandrow)) {
                if (expandrow.length > 0) {
                    expanded.push({children: expandrow});
                }
            }
            else if (expandrow !== fluid.renderer.NO_COMPONENT) {
                expanded.push(expandrow);
            }
        });
        var repeatID = options.repeatID;
        if (repeatID.indexOf(":") === -1) {
            repeatID = repeatID + ":";
        }
        fluid.each(expanded, function (entry) {entry.ID = repeatID; });
        return expanded;
    };
    
    fluid.renderer.condition = function (options, container, key, config) {
        fluid.expect("Selection to condition expander", ["condition"], options);
        var condition;
        if (options.condition.funcName) {
            var args = config.expandLight(options.condition.args);
            condition = fluid.invoke(options.condition.funcName, args);
        } else if (options.condition.expander) {
            condition = config.expander(options.condition);
        } else {
            condition = config.expandLight(options.condition);
        }
        var tree = (condition ? options.trueTree : options.falseTree);
        if (!tree) {
            tree = fluid.renderer.NO_COMPONENT;
        }
        return config.expander(tree);
    };
    
    
    /* An EL extraction utility suitable for context expressions which occur in 
     * expanding component trees. It assumes that any context expressions refer
     * to EL paths that are to be referred to the "true (direct) model" - since
     * the context during expansion may not agree with the context during rendering.
     * It satisfies the same contract as fluid.extractEL, in that it will either return
     * an EL path, or undefined if the string value supplied cannot be interpreted
     * as an EL path with respect to the supplied options.
     */
    // unsupported, non-API function
    fluid.extractContextualPath = function (string, options, env) {
        var parsed = fluid.extractELWithContext(string, options);
        if (parsed) {
            if (parsed.context) {
                var fetched = env[parsed.context];
                if (typeof(fetched) !== "string") {
                    fluid.fail("Could not look up context path named " + parsed.context + " to string value");
                }
                return fluid.model.composePath(fetched, parsed.path);
            }
            else {
                return parsed.path;
            }
        }
    };

    /** Create a "protoComponent expander" with the supplied set of options.
     * The returned value will be a function which accepts a "protoComponent tree"
     * as argument, and returns a "fully expanded" tree suitable for supplying
     * directly to the renderer.
     * A "protoComponent tree" is similar to the "dehydrated form" accepted by
     * the historical renderer - only
     * i) The input format is unambiguous - this expander will NOT accept hydrated
     * components in the {ID: "myId, myfield: "myvalue"} form - but ONLY in
     * the dehydrated {myID: {myfield: myvalue}} form.
     * ii) This expander has considerably greater power to expand condensed trees.
     * In particular, an "EL style" option can be supplied which will expand bare
     * strings found as values in the tree into UIBound components by a configurable
     * strategy. Supported values for "ELstyle" are a) "ALL" - every string will be
     * interpreted as an EL reference and assigned to the "valuebinding" member of
     * the UIBound, or b) any single character, which if it appears as the first
     * character of the string, will mark it out as an EL reference - otherwise it
     * will be considered a literal value, or c) the value "${}" which will be
     * recognised bracketing any other EL expression.
     */

    fluid.renderer.makeProtoExpander = function (expandOptions) {
      // shallow copy of options - cheaply avoid destroying model, and all others are primitive
        var options = $.extend({
            ELstyle: "${}"
        }, expandOptions); // shallow copy of options
        options.fetcher = fluid.makeEnvironmentFetcher("rendererEnvironment", options.model); 
        var IDescape = options.IDescape || "\\";
        
        function fetchEL(string) {
            var env = fluid.threadLocal().rendererEnvironment;
            return fluid.extractContextualPath(string, options, env);
        }
        
        var expandLight = function (source) {
            return fluid.resolveEnvironment(source, options); 
        };

        var expandBound = function (value, concrete) {
            if (value.messagekey !== undefined) {
                return {
                    componentType: "UIMessage",
                    messagekey: expandBound(value.messagekey),
                    args: expandLight(value.args)
                };
            }
            var proto;
            if (!fluid.isPrimitive(value) && !fluid.isArrayable(value)) {
                proto = $.extend({}, value);
                if (proto.decorators) {
                    proto.decorators = expandLight(proto.decorators);
                }
                value = proto.value;
                delete proto.value;
            } else {
                proto = {};
            }
            var EL = typeof (value) === "string" ? fetchEL(value) : null;
            if (EL) {
                proto.valuebinding = EL;
            } else {
                proto.value = value;
            }
            if (options.model && proto.valuebinding && proto.value === undefined) {
                proto.value = fluid.get(options.model, proto.valuebinding, options.resolverGetConfig);
            }
            if (concrete) {
                proto.componentType = "UIBound";
            }
            return proto;
        };
        
        options.filter = fluid.expander.lightFilter;
        
        var expandCond;
        var expandLeafOrCond;
        
        var expandEntry = function (entry) {
            var comp = [];
            expandCond(entry, comp);
            return {children: comp};
        };
        
        var expandExternal = function (entry) {
            if (entry === fluid.renderer.NO_COMPONENT) {
                return entry;
            }
            var singleTarget;
            var target = [];
            var pusher = function (comp) {
                singleTarget = comp;
            };
            expandLeafOrCond(entry, target, pusher);
            return singleTarget || target;
        };
        
        var expandConfig = {
            model: options.model,
            resolverGetConfig: options.resolverGetConfig,
            resolverSetConfig: options.resolverSetConfig,
            expander: expandExternal,
            expandLight: expandLight
        };
        
        var expandLeaf = function (leaf, componentType) {
            var togo = {componentType: componentType};
            var map = fluid.renderer.boundMap[componentType] || {};
            for (var key in leaf) {
                if (/decorators|args/.test(key)) {
                    togo[key] = expandLight(leaf[key]);
                    continue;
                } else if (map[key]) {
                    togo[key] = expandBound(leaf[key]);
                } else {
                    togo[key] = leaf[key];
                }
            }
            return togo;
        };
        
        // A child entry may be a cond, a leaf, or another "thing with children".
        // Unlike the case with a cond's contents, these must be homogeneous - at least
        // they may either be ALL leaves, or else ALL cond/childed etc. 
        // In all of these cases, the key will be THE PARENT'S KEY
        var expandChildren = function (entry, pusher) {
            var children = entry.children;
            for (var i = 0; i < children.length; ++i) {
                // each child in this list will lead to a WHOLE FORKED set of children.
                var target = [];
                var comp = { children: target};
                var child = children[i];
                var childPusher = function (comp) {
                    target[target.length] = comp;
                }; // jslint:ok - function in loop 
                expandLeafOrCond(child, target, childPusher);
                // Rescue the case of an expanded leaf into single component - TODO: check what sense this makes of the grammar
                if (comp.children.length === 1 && !comp.children[0].ID) {
                    comp = comp.children[0];
                }
                pusher(comp); 
            }
        };
        
        function detectBareBound(entry) {
            return fluid.find(entry, function (value, key) {
                return key === "decorators";
            }) !== false;
        }
        
        // We have reached something which is either a leaf or Cond - either inside
        // a Cond or as an entry in children.
        var expandLeafOrCond = function (entry, target, pusher) { // jslint:ok - forward declaration
            var componentType = fluid.renderer.inferComponentType(entry);
            if (!componentType && (fluid.isPrimitive(entry) || detectBareBound(entry))) {
                componentType = "UIBound";
            }
            if (componentType) {
                pusher(componentType === "UIBound" ? expandBound(entry, true) : expandLeaf(entry, componentType));
            } else {
              // we couldn't recognise it as a leaf, so it must be a cond
              // this may be illegal if we are already in a cond.
                if (!target) {
                    fluid.fail("Illegal cond->cond transition");
                }
                expandCond(entry, target);
            }
        };
        
        // cond entry may be a leaf, "thing with children" or a "direct bound".
        // a Cond can ONLY occur as a direct member of "children". Each "cond" entry may
        // give rise to one or many elements with the SAME key - if "expandSingle" discovers
        // "thing with children" they will all share the same key found in proto. 
        expandCond = function (proto, target) {
            for (var key in proto) {
                var entry = proto[key];
                if (key.charAt(0) === IDescape) {
                    key = key.substring(1);
                }
                if (key === "expander") {
                    var expanders = fluid.makeArray(entry);
                    fluid.each(expanders, function (expander) {
                        var expanded = fluid.invokeGlobalFunction(expander.type, [expander, proto, key, expandConfig]);
                        if (expanded !== fluid.renderer.NO_COMPONENT) {
                            fluid.each(expanded, function (el) {target[target.length] = el; });
                        }
                    }); // jslint:ok - function in loop
                } else if (entry) {
                    var condPusher = function (comp) {
                        comp.ID = key;
                        target[target.length] = comp; 
                    }; // jslint:ok - function in loop

                    if (entry.children) {
                        if (key.indexOf(":") === -1) {
                            key = key + ":";
                        }
                        expandChildren(entry, condPusher);
                    } else if (fluid.renderer.isBoundPrimitive(entry)) {
                        condPusher(expandBound(entry, true));
                    } else {
                        expandLeafOrCond(entry, null, condPusher);
                    }
                }
            }
                
        };
        
        return function(entry) {
            var initEnvironment = $.extend({}, options.envAdd);
            return fluid.withEnvironment({rendererEnvironment: initEnvironment}, function() {
                return expandEntry(entry);
            });
        };
    };
    
})(jQuery, fluid_1_4);
    /*
Copyright 2009 University of Cambridge
Copyright 2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    /*
     *  TODO: 
     *  - get and implement a design for the table of contents 
     *  - make the toc template pluggable
     *  - make sure getting headings using something other then a selector works
     *  - move interesting parts of the template to the defaults ie. link
     */ 
    

    /**
     * Inserts an anchor into the page in front of the element.
     * @param {Object} el
     */    
    var insertAnchor = function (el) {
        var a = $("<a name='" + el.text() + "' />", el[0].ownerDocument);
        el.before(a);
    };
    
    /**
     * Creates a generic tree node
     */
    var createNode = function (id) {
        var node = {
            ID: id,
            children: []
        };
        return node;
    };

    /**
     * Creates the renderer tree that matches the table of contents template
     * @param {jQuery Object} headings - the headings to be put into the table of contents
     */
    var createTree = function (headings, levels) {
        
        // Builds the tree recursively 
        var generateTree = function (nodes, items, level) {
            if (items.length === 0) {
                return;
            }
            
            var item = items[0];
            
            if (level === item.level) {
                nodes[nodes.length - 1].push(item.leaf);
                items.shift();
                return generateTree(nodes, items, level);
            }
            
            if (level < item.level) {
                var prefix = level > -1 ? "level" + (level + 1) + ":" : "";
                var postfix = level === -1 ? "s:" : "s";
                var name = prefix + "level" + (level + 2) + postfix;
                var myNode = createNode(name);
                nodes[nodes.length - 1].push(myNode);
                nodes.push(myNode.children);
                return generateTree(nodes, items, level + 1);
            }
            
            if (level > item.level) {
                nodes.pop();
                return generateTree(nodes, items, level - 1);
            }
        };

        var tree = {
            children: []
        };
        
        // Leaf nodes for the renderer tree from the headings
        var items = fluid.transform(headings, function (heading) {
                var level = $.inArray(heading.tagName, levels);
                var text = $(heading).text();
                return {
                    level: level,
                    leaf: {
                        ID: "level" + (level + 1) + ":item",
                        children: [{
                            ID: "link",
                            linktext: text,
                            target: "#" + text
                        }]
                    }
                };
            });

        generateTree([tree.children], items, -1);
        
        return tree;
    };
    
    var buildTOC = function (container, headings, levels, templateURL, afterRender) {
        // Insert anchors into the page that the table of contents will link to
        headings.each(function (i, el) {
            insertAnchor($(el));
        });
        
        // Data structure needed by fetchResources
        var resources = {
            toc: {
                href: templateURL
            }
        };
        
        // Get the template, create the tree and render the table of contents
        fluid.fetchResources(resources, function () {
            var templates = fluid.parseTemplates(resources, ["toc"], {});
            var node = $("<div></div>", container[0].ownerDocument);
            fluid.reRender(templates, node, createTree(headings, levels), {});
            container.prepend(node);
            afterRender.fire(node);
        });
    };

    fluid.tableOfContents = function (container, options) {
        var that = fluid.initView("fluid.tableOfContents", container, options);

        // TODO: need better name for tocNode. and node, while you're at it. 
        //       also, should the DOM be exposed in this way? Is there a better way to handle this?
        that.events.afterRender.addListener(function (node) {
            that.tocNode = $(node);
        });

        buildTOC(that.container, that.locate("headings"), that.options.levels, that.options.templateUrl, that.events.afterRender);

        // TODO: is it weird to have hide and show on a component? 
        that.hide = function () {
            if (that.tocNode) {
                that.tocNode.hide();
            }
        };
        
        that.show = function () {
            if (that.tocNode) {
                that.tocNode.show();
            }
        };

        return that;
    };
    
    fluid.defaults("fluid.tableOfContents", {  
        selectors: {
            headings: ":header"
        },
        events: {
            afterRender: null
        },
        templateUrl: "../html/TableOfContents.html",
        levels: ["H1", "H2", "H3", "H4", "H5", "H6"]
    });

})(jQuery, fluid_1_4);
/*
    json2.js
    2007-11-06

    Public Domain

    No warranty expressed or implied. Use at your own risk.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing two methods:

        JSON.stringify(value, whitelist)
            value       any JavaScript value, usually an object or array.

            whitelist   an optional that determines how object values are
                        stringified.

            This method produces a JSON text from a JavaScript value.
            There are three possible ways to stringify an object, depending
            on the optional whitelist parameter.

            If an object has a toJSON method, then the toJSON() method will be
            called. The value returned from the toJSON method will be
            stringified.

            Otherwise, if the optional whitelist parameter is an array, then
            the elements of the array will be used to select members of the
            object for stringification.

            Otherwise, if there is no whitelist parameter, then all of the
            members of the object will be stringified.

            Values that do not have JSON representaions, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped, in arrays will be replaced with null. JSON.stringify()
            returns undefined. Dates will be stringified as quoted ISO dates.

            Example:

            var text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'

        JSON.parse(text, filter)
            This method parses a JSON text to produce an object or
            array. It can throw a SyntaxError exception.

            The optional filter parameter is a function that can filter and
            transform the results. It receives each of the keys and values, and
            its return value is used instead of the original value. If it
            returns what it received, then structure is not modified. If it
            returns undefined then the member is deleted.

            Example:

            // Parse the text. If a key contains the string 'date' then
            // convert the value to a date.

            myData = JSON.parse(text, function (key, value) {
                return key.indexOf('date') >= 0 ? new Date(value) : value;
            });

    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    Use your own copy. It is extremely unwise to load third party
    code into your pages.
*/

/*jslint evil: true */
/*extern JSON */

if (!this.JSON) {

    JSON = function () {

        function f(n) {    // Format integers to have at least two digits.
            return n < 10 ? '0' + n : n;
        }

        Date.prototype.toJSON = function () {

// Eventually, this method will be based on the date.toISOString method.

            return this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z';
        };


        var m = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };

        function stringify(value, whitelist) {
            var a,          // The array holding the partial texts.
                i,          // The loop counter.
                k,          // The member key.
                l,          // Length.
                r = /["\\\x00-\x1f\x7f-\x9f]/g,
                v;          // The member value.

            switch (typeof value) {
            case 'string':

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe sequences.

                return r.test(value) ?
                    '"' + value.replace(r, function (a) {
                        var c = m[a];
                        if (c) {
                            return c;
                        }
                        c = a.charCodeAt();
                        return '\\u00' + Math.floor(c / 16).toString(16) +
                                                   (c % 16).toString(16);
                    }) + '"' :
                    '"' + value + '"';

            case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

                return isFinite(value) ? String(value) : 'null';

            case 'boolean':
            case 'null':
                return String(value);

            case 'object':

// Due to a specification blunder in ECMAScript,
// typeof null is 'object', so watch out for that case.

                if (!value) {
                    return 'null';
                }

// If the object has a toJSON method, call it, and stringify the result.

                if (typeof value.toJSON === 'function') {
                    return stringify(value.toJSON());
                }
                a = [];
                if (typeof value.length === 'number' &&
                        !(value.propertyIsEnumerable('length'))) {

// The object is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                    l = value.length;
                    for (i = 0; i < l; i += 1) {
                        a.push(stringify(value[i], whitelist) || 'null');
                    }

// Join all of the elements together and wrap them in brackets.

                    return '[' + a.join(',') + ']';
                }
                if (whitelist) {

// If a whitelist (array of keys) is provided, use it to select the components
// of the object.

                    l = whitelist.length;
                    for (i = 0; i < l; i += 1) {
                        k = whitelist[i];
                        if (typeof k === 'string') {
                            v = stringify(value[k], whitelist);
                            if (v) {
                                a.push(stringify(k) + ':' + v);
                            }
                        }
                    }
                } else {

// Otherwise, iterate through all of the keys in the object.

                    for (k in value) {
                        if (typeof k === 'string') {
                            v = stringify(value[k], whitelist);
                            if (v) {
                                a.push(stringify(k) + ':' + v);
                            }
                        }
                    }
                }

// Join all of the member texts together and wrap them in braces.

                return '{' + a.join(',') + '}';
            }
        }

        return {
            stringify: stringify,
            parse: function (text, filter) {
                var j;

                function walk(k, v) {
                    var i, n;
                    if (v && typeof v === 'object') {
                        for (i in v) {
                            if (Object.prototype.hasOwnProperty.apply(v, [i])) {
                                n = walk(i, v[i]);
                                if (n !== undefined) {
                                    v[i] = n;
                                }
                            }
                        }
                    }
                    return filter(k, v);
                }


// Parsing happens in three stages. In the first stage, we run the text against
// regular expressions that look for non-JSON patterns. We are especially
// concerned with '()' and 'new' because they can cause invocation, and '='
// because it can cause mutation. But just to be safe, we want to reject all
// unexpected forms.

// We split the first stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace all backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

                if (/^[\],:{}\s]*$/.test(text.replace(/\\./g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(:?[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the second stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                    j = eval('(' + text + ')');

// In the optional third stage, we recursively walk the new structure, passing
// each name/value pair to a filter function for possible transformation.

                    return typeof filter === 'function' ? walk('', j) : j;
                }

// If the text is not JSON parseable, then a SyntaxError is thrown.

                throw new SyntaxError('parseJSON');
            }
        };
    }();
}
/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    /****************
     * UI Enhancer  *
     ****************/

    /**
     * Searches within the container for things that match the selector and then replaces the classes 
     * that are matched by the regular expression with the new value. 
     * 
     * @param {Object} container
     * @param {Object} selector
     * @param {Object} regExp
     * @param {Object} newVal
     */
    var replaceClass = function (container, selector, regExp, newVal) {
        newVal = newVal || "";
        $(selector, container).andSelf().each(function (i) {
            var attr = ($.browser.msie === false) ? 'class' : 'className'; // TODO: does this need to happen inside the loop?
            if (this.getAttribute(attr)) {
                // The regular expression was required for speed
                this.setAttribute(attr, this.getAttribute(attr).replace(regExp, newVal));
            }
        });
        
    };
    
    /**
     * Adds the class related to the setting to the element
     * @param {jQuery} element
     * @param {String} settingName
     * @param {String} value
     * @param {Object} classnameMap
     */
    var addClassForSetting = function (element, settingName, value, classnameMap) {
        var settingValues = classnameMap[settingName] || {}; 
        var className = settingValues[value];
        if (className) {
            element.addClass(className);
        }
    };

    /**
     * Returns true if the value is true or the string "true", false otherwise
     * @param {Object} val
     */
    var isTrue = function (val) {
        return val && (val === true || val === "true");
    };
    
    /**
     * Shows the table of contents when tocSetting is "On". Hides the table of contents otherwise.
     * @param {Object} that
     * @param {Object} tocSetting
     */
    var setToc = function (that, tocSetting) {
        if (isTrue(tocSetting)) {
            if (that.tableOfContents) {
                that.tableOfContents.show();
            } else {
                that.tableOfContents = fluid.initSubcomponent(that, "tableOfContents", 
                        [that.container, fluid.COMPONENT_OPTIONS]);
            }
        } else {
            if (that.tableOfContents) {
                that.tableOfContents.hide();
            }
        }        
    };
    
    /**
     * Sets the line spacing on the container.  
     * @param {Object} container
     * @param {Object} spacing
     */
    var setLineSpacing = function (container, spacing) {
        spacing = spacing && spacing > 0 ? spacing : 1; 
        container.css("line-height", spacing + "em");
    };

    /**
     * Sets the font size on the container. Removes all fss classes that decrease font size. 
     * @param {Object} container
     * @param {Object} size
     */
    var setMinSize = function (container, size) {
        // TODO: fss font size class prefix is hardcoded here
        if (size && size > 0) {
            container.css("font-size", size + "pt");
            replaceClass(container, "[class*=fl-font-size-]", /\bfl-font-size-[0-9]{1,2}\s+/g, 'fl-font-size-100');
        } else {
            container.css("font-size", ""); // empty is same effect as not being set
        }
    };

    /**
     * Styles the container based on the settings passed in
     * 
     * @param {Object} container
     * @param {Object} settings
     * @param {Object} classnameMap
     */
    var addStyles = function (container, settings, classnameMap) {
        addClassForSetting(container, "textFont", settings.textFont, classnameMap);
        addClassForSetting(container, "textSpacing", settings.textSpacing, classnameMap);
        addClassForSetting(container, "theme", settings.theme, classnameMap);
        addClassForSetting(container, "layout", settings.layout, classnameMap);
    };
    
    /**
     * Adds or removes the classname to/from the elements based upon the setting.
     * @param {Object} elements
     * @param {Object} setting
     * @param {Object} classname
     */
    var styleElements = function (elements, setting, classname) {
        if (setting) {
            elements.addClass(classname);
        } else {
            elements.removeClass(classname);
        }        
    };
    
    /**
     * Style links in the container according to the settings
     * @param {Object} container
     * @param {Object} settings
     * @param {Object} classnameMap
     */
    var styleLinks = function (container, settings, classnameMap) {
        var links = $("a", container);
        // TODO: collect up the classnames and add or remove them all at once. 
        styleElements(links, settings.linksUnderline, classnameMap.linksUnderline);
        styleElements(links, settings.linksBold, classnameMap.linksBold);
        styleElements(links, settings.linksLarger, classnameMap.linksLarger);
    };

    /**
     * Style inputs in the container according to the settings
     * @param {Object} container
     * @param {Object} settings
     * @param {Object} classnameMap
     */
    var styleInputs = function (container, settings, classnameMap) {
        styleElements($("input", container), settings.inputsLarger, classnameMap.inputsLarger);
    };
     
    /**
     * Initialize the model first looking at options.savedSettings, then in the settingsStore and finally in the options.defaultSiteSettings
     * @param {Object} that
     */
    var initModel = function (that) {
        // First check for settings in the options
        if (that.options.savedSettings) {
            that.model = that.options.savedSettings;
            return;
        }
  
        // Use the settingsStore or the defaultSiteSettings if there are no settings
        that.model = that.settingsStore.fetch() || fluid.copy(that.defaultSiteSettings);        
    };

    /**
     * Clears FSS classes from within the container that may clash with the current settings.
     * These are the classes from the classnameMap for settings where we work on the container rather
     * then on individual elements.
     * @param {Object} that
     * @return {String} the classnames that were removed separated by spaces
     */
    var clearClashingClasses = function (container, classnameMap) {
        var settingsWhichMayClash = ["textFont", "textSpacing", "theme", "layout"];  // + no background images
        var classesToRemove =  "fl-noBackgroundImages";
        var selector = ".fl-noBackgroundImages";
        
        for (var i = 0; i < settingsWhichMayClash.length; i++) {
            var settingValues = classnameMap[settingsWhichMayClash[i]];
            for (var val in settingValues) {
                var classname = settingValues[val];
                if (classname) {
                    classesToRemove = classesToRemove + " " + classname;
                    selector = selector + ",." + classname;
                }
            }
        }
        
        $(selector, container).removeClass(classesToRemove);
        return classesToRemove;
    };
    
    var setupUIEnhancer = function (that) {
        that.settingsStore = fluid.initSubcomponent(that, "settingsStore", [fluid.COMPONENT_OPTIONS]); 
        initModel(that);
        that.refreshView();        
    };
      
    /**
     * Component that works in conjunction with FSS to transform the interface based on settings. 
     * @param {Object} doc
     * @param {Object} options
     */
    fluid.uiEnhancer = function (doc, options) {
        doc = doc || document;
        var that = fluid.initView("fluid.uiEnhancer", doc, options);
        $(doc).data("uiEnhancer", that);
        that.container = $("body", doc);
        that.defaultSiteSettings = that.options.defaultSiteSettings;
        
        var clashingClassnames;
        
        /**
         * Transforms the interface based on the settings in that.model
         */
        that.refreshView = function () {
            that.container.removeClass(clashingClassnames);
            addStyles(that.container, that.model, that.options.classnameMap);
            styleElements(that.container, !isTrue(that.model.backgroundImages), that.options.classnameMap.noBackgroundImages);
            setMinSize(that.container, that.model.textSize);
            setLineSpacing(that.container, that.model.lineSpacing);
            setToc(that, that.model.toc);
            styleLinks(that.container, that.model, that.options.classnameMap);
            styleInputs(that.container, that.model, that.options.classnameMap);
        };
        
        /**
         * Stores the new settings, refreshes the view to reflect the new settings and fires modelChanged.
         * @param {Object} newModel
         * @param {Object} source
         */
        that.updateModel = function (newModel, source) {
            that.events.modelChanged.fire(newModel, that.model, source);
            fluid.clear(that.model);
            fluid.model.copyModel(that.model, newModel);
            that.settingsStore.save(that.model);
            that.refreshView();
        };

        clashingClassnames = clearClashingClasses(that.container, that.options.classnameMap);
        setupUIEnhancer(that);
        return that;
    };

    fluid.defaults("fluid.uiEnhancer", {
        tableOfContents: {
            type: "fluid.tableOfContents",
            options: {
                templateUrl: "../../tableOfContents/html/TableOfContents.html"
            }
        },
        
        settingsStore: {
            type: "fluid.uiEnhancer.cookieStore"
        },
        
        events: {
            modelChanged: null
        },
        
        classnameMap: {
            "textFont": {
                "serif": "fl-font-serif",
                "sansSerif": "fl-font-sans",
                "arial": "fl-font-arial",
                "verdana": "fl-font-verdana",
                "monospace": "fl-font-monospace",
                "courier": "fl-font-courier",
                "times": "fl-font-times"
            },
            "textSpacing": {
                "default": "",
                "wide0": "fl-font-spacing-0",
                "wide1": "fl-font-spacing-1",
                "wide2": "fl-font-spacing-2",
                "wide3": "fl-font-spacing-3",
                "wide4": "fl-font-spacing-4",
                "wide5": "fl-font-spacing-5",
                "wide6": "fl-font-spacing-6"
            },
            "theme": {
                "mist": "fl-theme-mist",
                "rust": "fl-theme-rust",
                "highContrast": "fl-theme-hc",
                "highContrastInverted": "fl-theme-hci",
                "lowContrast": "fl-theme-slate",
                "mediumContrast": "fl-theme-coal",
                "default": ""
            },
            "layout": {
                "simple": "fl-layout-linear",
                "default": ""
            },
            "noBackgroundImages": "fl-noBackgroundImages",
            "linksUnderline": "fl-text-underline", 
            "linksBold": "fl-text-bold", 
            "linksLarger": "fl-text-larger", 
            "inputsLarger": "fl-text-larger"
        },
        defaultSiteSettings: {
            textFont: "",                 // key from classname map
            textSpacing: "",              // key from classname map
            theme: "default",             // key from classname map
            layout: "default",            // key from classname map
            textSize: "",                 // in points
            lineSpacing: "",              // in ems
            backgroundImages: true,       // boolean
            toc: false,                   // boolean
            linksUnderline: false,        // boolean
            linksBold: false,             // boolean
            linksLarger: false,           // boolean
            inputsLarger: false           // boolean
        }
    });
    
    /****************
     * Cookie Store *
     ****************/
     
    /**
     * SettingsStore Subcomponent that uses a cookie for persistence.
     * @param {Object} options
     */
    fluid.uiEnhancer.cookieStore = function (options) {
        var that = fluid.initLittleComponent("fluid.uiEnhancer.cookieStore", options);
        
        /**
         * Retrieve and return the value of the cookie
         */
        that.fetch = function () {
            var cookie = document.cookie;
            var cookiePrefix = that.options.cookieName + "=";
            var retObj, startIndex, endIndex;
            
            if (cookie.length > 0) {
                startIndex = cookie.indexOf(cookiePrefix);
                if (startIndex > -1) { 
                    startIndex = startIndex + cookiePrefix.length; 
                    endIndex = cookie.indexOf(";", startIndex);
                    if (endIndex < startIndex) {
                        endIndex = cookie.length;
                    }
                    retObj = JSON.parse(decodeURIComponent(cookie.substring(startIndex, endIndex)));
                } 
            }
            
            return retObj;
        };

        /**
         * Saves the settings into a cookie
         * @param {Object} settings
         */
        that.save = function (settings) {
            document.cookie = that.options.cookieName + "=" +  encodeURIComponent(JSON.stringify(settings));
        };
    
        return that;
    };
    
    fluid.defaults("fluid.uiEnhancer.cookieStore", {
        cookieName: "fluid-ui-settings"
    });

    /**************
     * Temp Store *
     **************/

    /**
     * SettingsStore Subcomponent that doesn't do persistence.
     * @param {Object} options
     */
    fluid.uiEnhancer.tempStore = function (options) {
        var that = {};
        that.model = null;
         
        that.fetch = function () {
            return that.model;
        };

        that.save = function (settings) {
            that.model = settings;
        };
    
        return that;
    };

})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};


/******************
 * Textfield Slider *
 ******************/

(function ($, fluid) {
    
    // This will be removed once the jQuery UI slider has built in ARIA 
    var initSliderAria = function (thumb, opts) {
        var ariaDefaults = {
            role: 'slider',
            "aria-valuenow": opts.value,
            "aria-valuemin": opts.min, 
            "aria-valuemax": opts.max    
        };
        thumb.attr(ariaDefaults);        
    };
    
    var initSlider = function (that) {
        var sliderOptions = that.options.sliderOptions;
        sliderOptions.value = that.model;
        sliderOptions.min = that.min;
        sliderOptions.max = that.max;
        
        var slider = that.locate("slider").slider(sliderOptions);
        initSliderAria(that.locate("thumb"), sliderOptions); 

        return slider;           
    };
    
    var bindSliderHandlers = function (that, textfield, slider) {
        slider.bind("slide", function (e, ui) {
            textfield.val(ui.value);
            that.updateModel(ui.value, slider);
        });       
    };
    
    var initTextfield = function (that, slider) {
        var textfield = that.locate("textfield");
        textfield.val(that.model);
        return textfield;
    };
    
    var bindTextfieldHandlers = function (that, textfield, slider) {
        textfield.change(function () {
            if (that.isValid(this.value)) {
                if (!that.isInRange(this.value)) {
                    this.value = (this.value < that.min) ? that.min : that.max;
                }
                slider.slider("value", this.value);
                that.updateModel(this.value, this);
            } else {
                // handle invalid entry
                this.value = that.model;
            }
        });
        
        textfield.keypress(function (evt) {
            if (evt.keyCode !== $.ui.keyCode.ENTER) {
                return true;
            } else {
                $(evt.target).change();
                $(fluid.findForm(evt.target)).submit();
                return false;
            }
        });
        
    };
    
    var initTextfieldSlider = function (that) {
        var slider = initSlider(that);
        var textfield = initTextfield(that, slider);        

        bindSliderHandlers(that, textfield, slider);
        bindTextfieldHandlers(that, textfield, slider);
    };
    
    /**
     * A component that relates a textfield and a jQuery UI slider
     * @param {Object} container
     * @param {Object} options
     */
    fluid.textfieldSlider = function (container, options) {
        var that = fluid.initView("fluid.textfieldSlider", container, options);
        that.model = that.options.value || that.locate("textfield").val();
        that.min = that.options.min;
        that.max = that.options.max;
                
        /**
         * Tests if a value is within the min and max of the textfield slider
         * @param {Object} value
         */
        that.isInRange = function (value) {
            return (value >= that.min && value <= that.max);
        };

        /**
         * Tests if a value is a valid number.
         * @param {Object} value
         */
        that.isValid = function (value) {
            return !(isNaN(parseInt(value, 10)) || isNaN(value));
        };
        
        /**
         * Updates the model if it is in range. Fires model changed
         * @param {Object} model
         * @param {Object} source
         */
        that.updateModel = function (model, source) {
            if (that.isInRange(model)) {
                that.events.modelChanged.fire(model, that.model, source);
                that.model = model;
                that.locate("thumb").attr("aria-valuenow", that.model);                
            }
        };

        initTextfieldSlider(that);
        
        return that;
    };

    fluid.defaults("fluid.textfieldSlider", {
        selectors: {
            textfield: ".flc-textfieldSlider-field",
            slider: ".flc-textfieldSlider-slider", 
            thumb: ".ui-slider-handle"
        },
        events: {
            modelChanged: null
        },
        sliderOptions: {
            orientation: "horizontal"
        }, 
        min: 0,
        max: 100,
        value: null       
    });
    
})(jQuery, fluid_1_4);


/**************
 * UI Options *
 **************/

(function ($, fluid) {

//    TODO
//    - move the general renderer tree generation functions to the renderer
//    - add the min font size textfieldSlider to the renderer tree
//    - pull the strings out of the template and put them into the component?
//    - should the accordian be part of the component by default?

    var createSelectNode = function (id, selection, list, names) {
        return {
            ID: id,
            selection: {
                valuebinding: selection
            },
            optionlist: {
                valuebinding: list
            },
            optionnames: {
                valuebinding: names
            }
        };
    };
        
    var createSimpleBindingNode = function (id, binding) {
        return {
            ID: id,
            valuebinding: binding
        };
    };
    
    var generateTree = function (that, rendererModel) {
        var children = [];
        children.push(createSelectNode("text-font", "selections.textFont", "labelMap.textFont.values", "labelMap.textFont.names"));
        children.push(createSelectNode("text-spacing", "selections.textSpacing", "labelMap.textSpacing.values", "labelMap.textSpacing.names"));
        children.push(createSelectNode("theme", "selections.theme", "labelMap.theme.values", "labelMap.theme.names"));

        var bgiExplodeOpts = {
            selectID: "background-images",
            rowID: "background-images-row:",
            inputID: "background-images-choice",
            labelID: "background-images-label"
        };        
        children.push(createSelectNode("background-images", "selections.backgroundImages", "labelMap.backgroundImages.values", "labelMap.backgroundImages.names"));
        children = children.concat(fluid.explodeSelectionToInputs(that.options.controlValues.backgroundImages, bgiExplodeOpts));
        
        var layoutExplodeOpts = {
            selectID: "layout",
            rowID: "layout-row:",
            inputID: "layout-choice",
            labelID: "layout-label"
        };        
        children.push(createSelectNode("layout", "selections.layout", "labelMap.layout.values", "labelMap.layout.names"));
        children = children.concat(fluid.explodeSelectionToInputs(that.options.controlValues.layout, layoutExplodeOpts));

        var tocExplodeOpts = {
            selectID: "toc",
            rowID: "toc-row:",
            inputID: "toc-choice",
            labelID: "toc-label"
        };        
        children.push(createSelectNode("toc", "selections.toc", "labelMap.toc.values", "labelMap.toc.names"));
        children = children.concat(fluid.explodeSelectionToInputs(that.options.controlValues.layout, tocExplodeOpts));

        children.push(createSimpleBindingNode("links-underline", "selections.linksUnderline"));
        children.push(createSimpleBindingNode("links-bold", "selections.linksBold"));
        children.push(createSimpleBindingNode("links-larger", "selections.linksLarger"));
        children.push(createSimpleBindingNode("inputs-larger", "selections.inputsLarger"));
        
        return {
            children: children
        };
    };
    
    var bindHandlers = function (that) {
        var saveButton = that.locate("save");
        saveButton.click(that.save);
        that.locate("reset").click(that.reset);
        that.locate("cancel").click(that.cancel);
        var form = fluid.findForm(saveButton);
        $(form).submit(function () {
            that.save();
        });
    };
        
    var createLabelMap = function (options) {
        var labelMap = {};
        
        for (var item in options.controlValues) {
            labelMap[item] = {
                names: options.strings[item],
                values: options.controlValues[item]
            };
        }
        
        return labelMap;
    };

    var createRenderOptions = function (that) {
        // Turn the boolean select values into strings so they can be properly bound and rendered
        that.model.toc = String(that.model.toc);
        that.model.backgroundImages = String(that.model.backgroundImages);
        
        var aggregateModel = fluid.assembleModel({
            selections: {
                model: that.model,
                applier: that.applier
            },
            labelMap: {model: createLabelMap(that.options)}
        });
        
        return {
            model: aggregateModel.model,
            applier: aggregateModel.applier,
            autoBind: true
        };
    };
    
    var initSliders = function (that) {
        var createOptions = function (settingName) {
            return {
                listeners: {
                    modelChanged: function (value) {
                        that.applier.requestChange(settingName, value);
                    }
                },
                value: that.model[settingName]
            };    
        };
        
        var options = createOptions("textSize");
        fluid.merge(null, options, that.options.textMinSize.options);
        fluid.initSubcomponents(that, "textMinSize", [that.options.selectors.textMinSizeCtrl, options]);

        options = createOptions("lineSpacing");
        fluid.merge(null, options, that.options.lineSpacing.options);
        fluid.initSubcomponents(that, "lineSpacing", [that.options.selectors.lineSpacingCtrl, options]);
        
    };
        
    var mergeSiteDefaults = function (options, siteDefaults) {
        for (var settingName in options.controlValues) {
            var setting = String(siteDefaults[settingName]);
            var settingValues = options.controlValues[settingName];
            
            if (setting) {
                var index = $.inArray(setting, settingValues);
                if (index === -1) {
                    var defaultIndex = $.inArray("default", settingValues);
                    if (defaultIndex === -1) {
                        settingValues.push(setting);
                    } else {
                        settingValues[defaultIndex] = setting;
                    }
                }
            }
        }
    };
    
    var firstRender = function (that) {
        var rendererOptions = createRenderOptions(that);
        var tree = generateTree(that, rendererOptions.model);
        var source = {node: that.locate("controls")};
        
        that.templates = fluid.render(source, that.locate("controls"), tree, rendererOptions);
        that.events.afterRender.fire();
        that.events.onReady.fire();
    };
    
    var setupUIOptions = function (that) {
        fluid.initDependents(that);
        that.applier.modelChanged.addListener("*",
            function (newModel, oldModel, changeRequest) {
                that.events.modelChanged.fire(newModel, oldModel, changeRequest.source);
            }
        );
            
        mergeSiteDefaults(that.options, that.uiEnhancer.defaultSiteSettings);
        
        // TODO: This stuff should already be in the renderer tree
        that.events.afterRender.addListener(function () {
            initSliders(that);
            bindHandlers(that);
        });
        
        if (!that.options.templateUrl) {
            firstRender(that);
        } else {
            // Fetch UI Options' template and parse it on arrival.
            fluid.fetchResources({
                uiOptions: {
                    href: that.options.templateUrl
                }
            }, function (spec) {
                that.container.append(spec.uiOptions.resourceText);
                firstRender(that);
            });
        }
    };
    
    /**
     * A component that works in conjunction with the UI Enhancer component and the Fluid Skinning System (FSS) 
     * to allow users to set personal user interface preferences. The UI Options component provides a user 
     * interface for setting and saving personal preferences, and the UI Enhancer component carries out the 
     * work of applying those preferences to the user interface.
     * 
     * @param {Object} container
     * @param {Object} options
     */
    fluid.uiOptions = function (container, options) {
        var that = fluid.initView("fluid.uiOptions", container, options);
        that.uiEnhancer = $(document).data("uiEnhancer");
        that.model = fluid.copy(that.uiEnhancer.model);
        that.applier = fluid.makeChangeApplier(that.model);

        // TODO: we shouldn't need the savedModel and should use the uiEnhancer.model instead
        var savedModel = that.uiEnhancer.model;
 
        /**
         * Saves the current model and fires onSave
         */ 
        that.save = function () {
            that.events.onSave.fire(that.model);
            savedModel = fluid.copy(that.model); 
            that.uiEnhancer.updateModel(savedModel);
        };

        /**
         * Resets the selections to the integrator's defaults and fires onReset
         */
        that.reset = function () {
            that.events.onReset.fire();
            that.updateModel(fluid.copy(that.uiEnhancer.defaultSiteSettings), that);
            that.refreshView();
        };
        
        /**
         * Resets the selections to the last saved selections and fires onCancel
         */
        that.cancel = function () {
            that.events.onCancel.fire();
            that.updateModel(fluid.copy(savedModel), that);
            that.refreshView();            
        };
        
        /**
         * Rerenders the UI and fires afterRender
         */
        that.refreshView = function () {
            var rendererOptions = createRenderOptions(that);
            fluid.reRender(that.templates, that.locate("controls"), generateTree(that, rendererOptions.model), rendererOptions);
            that.events.afterRender.fire();
        };
        
        /**
         * Updates the model and fires modelChanged
         * 
         * @param {Object} newModel
         * @param {Object} source
         */
        that.updateModel = function (newModel, source) {
            that.events.modelChanged.fire(newModel, that.model, source);
            fluid.clear(that.model);
            fluid.model.copyModel(that.model, newModel);
        };
        
        setupUIOptions(that);

        return that;   
    };

    fluid.defaults("fluid.uiOptions", {
        gradeNames: ["fluid.viewComponent"], 
        components: {
            preview: {
                type: "fluid.uiOptions.preview",
                createOnEvent: "onReady"
            }
        },
        textMinSize: {
            type: "fluid.textfieldSlider",
            options: {
                min: 6,
                max: 30
            }
        },
        lineSpacing: {
            type: "fluid.textfieldSlider",
            options: {
                min: 1,
                max: 10
            }
        },
        selectors: {
            controls: ".flc-uiOptions-controls",
            textMinSizeCtrl: ".flc-uiOptions-min-text-size",
            lineSpacingCtrl: ".flc-uiOptions-line-spacing",
            cancel: ".flc-uiOptions-cancel",
            reset: ".flc-uiOptions-reset",
            save: ".flc-uiOptions-save",
            previewFrame : ".flc-uiOptions-preview-frame"
        },
        events: {
            onReady: null,
            afterRender: null,
            modelChanged: null,
            onSave: null,
            onCancel: null,
            onReset: null
        },
        strings: {
            textFont: ["Serif", "Sans-Serif", "Arial", "Verdana", "Courier", "Times"],
            textSpacing: ["Regular", "Wide", "Wider", "Widest"],
            theme: ["Low Contrast", "Medium Contrast", "Medium Contrast Grey Scale", "High Contrast", "High Contrast Inverted"],
            backgroundImages: ["Yes", "No"],
            layout: ["Yes", "No"],
            toc: ["Yes", "No"]
        },
        controlValues: { 
            textFont: ["serif", "sansSerif", "arial", "verdana", "courier", "times"],
            textSpacing: ["default", "wide1", "wide2", "wide3"],
            theme: ["lowContrast", "default", "mediumContrast", "highContrast", "highContrastInverted"],
            backgroundImages: ["true", "false"],
            layout: ["simple", "default"],
            toc: ["true", "false"]
        },
        templateUrl: "UIOptions.html"
    });

    /**********************
     * UI Options Preview *
     **********************/

    var setupPreview = function (that) {
        fluid.initDependents(that);
        // TODO: Break out iFrame assumptions from Preview.
        that.container.attr("src", that.options.templateUrl);        

        that.container.load(function () {
            that.previewFrameContents = that.container.contents();
            that.events.onReady.fire();
        });
        
    };
    
    fluid.uiOptions.preview = function (container, options) {
        var that = fluid.initView("fluid.uiOptions.preview", container, options);
        
        that.updateModel = function (model) {
            /**
             * Setimeout is temp fix for http://issues.fluidproject.org/browse/FLUID-2248
             */
            setTimeout(function () {
                if (that.enhancer) {
                    that.enhancer.updateModel(model);
                }
            }, 0);
        };
        
        setupPreview(that);
        return that;
    };
    
    fluid.defaults("fluid.uiOptions.preview", {
        gradeNames: ["fluid.viewComponent"], 
        components: {
            enhancer: {
                type: "fluid.uiEnhancer",
                createOnEvent: "onReady",
                options: {
                    savedSettings: "{uiOptions}.model",
                    tableOfContents: "{uiOptions}.uiEnhancer.options.tableOfContents", // TODO: Tidy this up when the page's UI Enhancer is IoC-visible.
                    settingsStore: {
                        type: "fluid.uiEnhancer.tempStore"
                    }
                }
            },
            eventBinder: {
                type: "fluid.uiOptions.preview.eventBinder",
                createOnEvent: "onReady"
            }
        },
        
        events: {
            onReady: null
        },
        
        templateUrl: "UIOptionsPreview.html"
    });
    
    fluid.demands("fluid.uiOptions.preview", "fluid.uiOptions", {
        args: [
            "{uiOptions}.dom.previewFrame",
            "{options}"
        ]
    });
    
    fluid.demands("fluid.uiEnhancer", "fluid.uiOptions.preview", {
        funcName: "fluid.uiEnhancer",
        args: [
            "{preview}.previewFrameContents",
            "{options}"
        ]
    });
    
    /***
     * Event binder binds events between UI Options and the Preview
     */
    fluid.defaults("fluid.uiOptions.preview.eventBinder", {
        gradeNames: ["fluid.eventedComponent", "autoInit"]
    });
    
    fluid.demands("fluid.uiOptions.preview.eventBinder", ["fluid.uiOptions.preview", "fluid.uiOptions"], {
        options: {
            listeners: {
                "{uiOptions}.events.modelChanged": "{preview}.updateModel"
            }
        }
    });
})(jQuery, fluid_1_4);
/**
 * jQuery.ScrollTo
 * Copyright (c) 2007-2009 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * Date: 5/25/2009
 *
 * @projectDescription Easy element scrolling using jQuery.
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 * Works with jQuery +1.2.6. Tested on FF 2/3, IE 6/7/8, Opera 9.5/6, Safari 3, Chrome 1 on WinXP.
 *
 * @author Ariel Flesler
 * @version 1.4.2
 *
 * @id jQuery.scrollTo
 * @id jQuery.fn.scrollTo
 * @param {String, Number, DOMElement, jQuery, Object} target Where to scroll the matched elements.
 *	  The different options for target are:
 *		- A number position (will be applied to all axes).
 *		- A string position ('44', '100px', '+=90', etc ) will be applied to all axes
 *		- A jQuery/DOM element ( logically, child of the element to scroll )
 *		- A string selector, that will be relative to the element to scroll ( 'li:eq(2)', etc )
 *		- A hash { top:x, left:y }, x and y can be any kind of number/string like above.
*		- A percentage of the container's dimension/s, for example: 50% to go to the middle.
 *		- The string 'max' for go-to-end. 
 * @param {Number} duration The OVERALL length of the animation, this argument can be the settings object instead.
 * @param {Object,Function} settings Optional set of settings or the onAfter callback.
 *	 @option {String} axis Which axis must be scrolled, use 'x', 'y', 'xy' or 'yx'.
 *	 @option {Number} duration The OVERALL length of the animation.
 *	 @option {String} easing The easing method for the animation.
 *	 @option {Boolean} margin If true, the margin of the target element will be deducted from the final position.
 *	 @option {Object, Number} offset Add/deduct from the end position. One number for both axes or { top:x, left:y }.
 *	 @option {Object, Number} over Add/deduct the height/width multiplied by 'over', can be { top:x, left:y } when using both axes.
 *	 @option {Boolean} queue If true, and both axis are given, the 2nd axis will only be animated after the first one ends.
 *	 @option {Function} onAfter Function to be called after the scrolling ends. 
 *	 @option {Function} onAfterFirst If queuing is activated, this function will be called after the first scrolling ends.
 * @return {jQuery} Returns the same jQuery object, for chaining.
 *
 * @desc Scroll to a fixed position
 * @example $('div').scrollTo( 340 );
 *
 * @desc Scroll relatively to the actual position
 * @example $('div').scrollTo( '+=340px', { axis:'y' } );
 *
 * @dec Scroll using a selector (relative to the scrolled element)
 * @example $('div').scrollTo( 'p.paragraph:eq(2)', 500, { easing:'swing', queue:true, axis:'xy' } );
 *
 * @ Scroll to a DOM element (same for jQuery object)
 * @example var second_child = document.getElementById('container').firstChild.nextSibling;
 *			$('#container').scrollTo( second_child, { duration:500, axis:'x', onAfter:function(){
 *				alert('scrolled!!');																   
 *			}});
 *
 * @desc Scroll on both axes, to different values
 * @example $('div').scrollTo( { top: 300, left:'+=200' }, { axis:'xy', offset:-20 } );
 */
;(function( $ ){
	
	var $scrollTo = $.scrollTo = function( target, duration, settings ){
		$(window).scrollTo( target, duration, settings );
	};

	$scrollTo.defaults = {
		axis:'xy',
		duration: parseFloat($.fn.jquery) >= 1.3 ? 0 : 1
	};

	// Returns the element that needs to be animated to scroll the window.
	// Kept for backwards compatibility (specially for localScroll & serialScroll)
	$scrollTo.window = function( scope ){
		return $(window)._scrollable();
	};

	// Hack, hack, hack :)
	// Returns the real elements to scroll (supports window/iframes, documents and regular nodes)
	$.fn._scrollable = function(){
		return this.map(function(){
			var elem = this,
				isWin = !elem.nodeName || $.inArray( elem.nodeName.toLowerCase(), ['iframe','#document','html','body'] ) != -1;

				if( !isWin )
					return elem;

			var doc = (elem.contentWindow || elem).document || elem.ownerDocument || elem;
			
			return $.browser.safari || doc.compatMode == 'BackCompat' ?
				doc.body : 
				doc.documentElement;
		});
	};

	$.fn.scrollTo = function( target, duration, settings ){
		if( typeof duration == 'object' ){
			settings = duration;
			duration = 0;
		}
		if( typeof settings == 'function' )
			settings = { onAfter:settings };
			
		if( target == 'max' )
			target = 9e9;
			
		settings = $.extend( {}, $scrollTo.defaults, settings );
		// Speed is still recognized for backwards compatibility
		duration = duration || settings.speed || settings.duration;
		// Make sure the settings are given right
		settings.queue = settings.queue && settings.axis.length > 1;
		
		if( settings.queue )
			// Let's keep the overall duration
			duration /= 2;
		settings.offset = both( settings.offset );
		settings.over = both( settings.over );

		return this._scrollable().each(function(){
			var elem = this,
				$elem = $(elem),
				targ = target, toff, attr = {},
				win = $elem.is('html,body');

			switch( typeof targ ){
				// A number will pass the regex
				case 'number':
				case 'string':
					if( /^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(targ) ){
						targ = both( targ );
						// We are done
						break;
					}
					// Relative selector, no break!
					targ = $(targ,this);
				case 'object':
					// DOMElement / jQuery
					if( targ.is || targ.style )
						// Get the real position of the target 
						toff = (targ = $(targ)).offset();
			}
			$.each( settings.axis.split(''), function( i, axis ){
				var Pos	= axis == 'x' ? 'Left' : 'Top',
					pos = Pos.toLowerCase(),
					key = 'scroll' + Pos,
					old = elem[key],
					max = $scrollTo.max(elem, axis);

				if( toff ){// jQuery / DOMElement
					attr[key] = toff[pos] + ( win ? 0 : old - $elem.offset()[pos] );

					// If it's a dom element, reduce the margin
					if( settings.margin ){
						attr[key] -= parseInt(targ.css('margin'+Pos)) || 0;
						attr[key] -= parseInt(targ.css('border'+Pos+'Width')) || 0;
					}
					
					attr[key] += settings.offset[pos] || 0;
					
					if( settings.over[pos] )
						// Scroll to a fraction of its width/height
						attr[key] += targ[axis=='x'?'width':'height']() * settings.over[pos];
				}else{ 
					var val = targ[pos];
					// Handle percentage values
					attr[key] = val.slice && val.slice(-1) == '%' ? 
						parseFloat(val) / 100 * max
						: val;
				}

				// Number or 'number'
				if( /^\d+$/.test(attr[key]) )
					// Check the limits
					attr[key] = attr[key] <= 0 ? 0 : Math.min( attr[key], max );

				// Queueing axes
				if( !i && settings.queue ){
					// Don't waste time animating, if there's no need.
					if( old != attr[key] )
						// Intermediate animation
						animate( settings.onAfterFirst );
					// Don't animate this axis again in the next iteration.
					delete attr[key];
				}
			});

			animate( settings.onAfter );			

			function animate( callback ){
				$elem.animate( attr, duration, settings.easing, callback && function(){
					callback.call(this, target, settings);
				});
			};

		}).end();
	};
	
	// Max scrolling position, works on quirks mode
	// It only fails (not too badly) on IE, quirks mode.
	$scrollTo.max = function( elem, axis ){
		var Dim = axis == 'x' ? 'Width' : 'Height',
			scroll = 'scroll'+Dim;
		
		if( !$(elem).is('html,body') )
			return elem[scroll] - $(elem)[Dim.toLowerCase()]();
		
		var size = 'client' + Dim,
			html = elem.ownerDocument.documentElement,
			body = elem.ownerDocument.body;

		return Math.max( html[scroll], body[scroll] ) 
			 - Math.min( html[size]  , body[size]   );
			
	};

	function both( val ){
		return typeof val == 'object' ? val : { top:val, left:val };
	};

})( jQuery );/*!	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/

var swfobject = function() {
	
	var UNDEF = "undefined",
		OBJECT = "object",
		SHOCKWAVE_FLASH = "Shockwave Flash",
		SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
		FLASH_MIME_TYPE = "application/x-shockwave-flash",
		EXPRESS_INSTALL_ID = "SWFObjectExprInst",
		ON_READY_STATE_CHANGE = "onreadystatechange",
		
		win = window,
		doc = document,
		nav = navigator,
		
		plugin = false,
		domLoadFnArr = [main],
		regObjArr = [],
		objIdArr = [],
		listenersArr = [],
		storedAltContent,
		storedAltContentId,
		storedCallbackFn,
		storedCallbackObj,
		isDomLoaded = false,
		isExpressInstallActive = false,
		dynamicStylesheet,
		dynamicStylesheetMedia,
		autoHideShow = true,
	
	/* Centralized function for browser feature detection
		- User agent string detection is only used when no good alternative is possible
		- Is executed directly for optimal performance
	*/	
	ua = function() {
		var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF,
			u = nav.userAgent.toLowerCase(),
			p = nav.platform.toLowerCase(),
			windows = p ? /win/.test(p) : /win/.test(u),
			mac = p ? /mac/.test(p) : /mac/.test(u),
			webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
			ie = !+"\v1", // feature detection based on Andrea Giammarchi's solution: http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
			playerVersion = [0,0,0],
			d = null;
		if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
			d = nav.plugins[SHOCKWAVE_FLASH].description;
			if (d && !(typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
				plugin = true;
				ie = false; // cascaded feature detection for Internet Explorer
				d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
				playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
				playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
				playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
			}
		}
		else if (typeof win.ActiveXObject != UNDEF) {
			try {
				var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
				if (a) { // a will return null when ActiveX is disabled
					d = a.GetVariable("$version");
					if (d) {
						ie = true; // cascaded feature detection for Internet Explorer
						d = d.split(" ")[1].split(",");
						playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
			}
			catch(e) {}
		}
		return { w3:w3cdom, pv:playerVersion, wk:webkit, ie:ie, win:windows, mac:mac };
	}(),
	
	/* Cross-browser onDomLoad
		- Will fire an event as soon as the DOM of a web page is loaded
		- Internet Explorer workaround based on Diego Perini's solution: http://javascript.nwbox.com/IEContentLoaded/
		- Regular onload serves as fallback
	*/ 
	onDomLoad = function() {
		if (!ua.w3) { return; }
		if ((typeof doc.readyState != UNDEF && doc.readyState == "complete") || (typeof doc.readyState == UNDEF && (doc.getElementsByTagName("body")[0] || doc.body))) { // function is fired after onload, e.g. when script is inserted dynamically 
			callDomLoadFunctions();
		}
		if (!isDomLoaded) {
			if (typeof doc.addEventListener != UNDEF) {
				doc.addEventListener("DOMContentLoaded", callDomLoadFunctions, false);
			}		
			if (ua.ie && ua.win) {
				doc.attachEvent(ON_READY_STATE_CHANGE, function() {
					if (doc.readyState == "complete") {
						doc.detachEvent(ON_READY_STATE_CHANGE, arguments.callee);
						callDomLoadFunctions();
					}
				});
				if (win == top) { // if not inside an iframe
					(function(){
						if (isDomLoaded) { return; }
						try {
							doc.documentElement.doScroll("left");
						}
						catch(e) {
							setTimeout(arguments.callee, 0);
							return;
						}
						callDomLoadFunctions();
					})();
				}
			}
			if (ua.wk) {
				(function(){
					if (isDomLoaded) { return; }
					if (!/loaded|complete/.test(doc.readyState)) {
						setTimeout(arguments.callee, 0);
						return;
					}
					callDomLoadFunctions();
				})();
			}
			addLoadEvent(callDomLoadFunctions);
		}
	}();
	
	function callDomLoadFunctions() {
		if (isDomLoaded) { return; }
		try { // test if we can really add/remove elements to/from the DOM; we don't want to fire it too early
			var t = doc.getElementsByTagName("body")[0].appendChild(createElement("span"));
			t.parentNode.removeChild(t);
		}
		catch (e) { return; }
		isDomLoaded = true;
		var dl = domLoadFnArr.length;
		for (var i = 0; i < dl; i++) {
			domLoadFnArr[i]();
		}
	}
	
	function addDomLoadEvent(fn) {
		if (isDomLoaded) {
			fn();
		}
		else { 
			domLoadFnArr[domLoadFnArr.length] = fn; // Array.push() is only available in IE5.5+
		}
	}
	
	/* Cross-browser onload
		- Based on James Edwards' solution: http://brothercake.com/site/resources/scripts/onload/
		- Will fire an event as soon as a web page including all of its assets are loaded 
	 */
	function addLoadEvent(fn) {
		if (typeof win.addEventListener != UNDEF) {
			win.addEventListener("load", fn, false);
		}
		else if (typeof doc.addEventListener != UNDEF) {
			doc.addEventListener("load", fn, false);
		}
		else if (typeof win.attachEvent != UNDEF) {
			addListener(win, "onload", fn);
		}
		else if (typeof win.onload == "function") {
			var fnOld = win.onload;
			win.onload = function() {
				fnOld();
				fn();
			};
		}
		else {
			win.onload = fn;
		}
	}
	
	/* Main function
		- Will preferably execute onDomLoad, otherwise onload (as a fallback)
	*/
	function main() { 
		if (plugin) {
			testPlayerVersion();
		}
		else {
			matchVersions();
		}
	}
	
	/* Detect the Flash Player version for non-Internet Explorer browsers
		- Detecting the plug-in version via the object element is more precise than using the plugins collection item's description:
		  a. Both release and build numbers can be detected
		  b. Avoid wrong descriptions by corrupt installers provided by Adobe
		  c. Avoid wrong descriptions by multiple Flash Player entries in the plugin Array, caused by incorrect browser imports
		- Disadvantage of this method is that it depends on the availability of the DOM, while the plugins collection is immediately available
	*/
	function testPlayerVersion() {
		var b = doc.getElementsByTagName("body")[0];
		var o = createElement(OBJECT);
		o.setAttribute("type", FLASH_MIME_TYPE);
		var t = b.appendChild(o);
		if (t) {
			var counter = 0;
			(function(){
				if (typeof t.GetVariable != UNDEF) {
					var d = t.GetVariable("$version");
					if (d) {
						d = d.split(" ")[1].split(",");
						ua.pv = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
				else if (counter < 10) {
					counter++;
					setTimeout(arguments.callee, 10);
					return;
				}
				b.removeChild(o);
				t = null;
				matchVersions();
			})();
		}
		else {
			matchVersions();
		}
	}
	
	/* Perform Flash Player and SWF version matching; static publishing only
	*/
	function matchVersions() {
		var rl = regObjArr.length;
		if (rl > 0) {
			for (var i = 0; i < rl; i++) { // for each registered object element
				var id = regObjArr[i].id;
				var cb = regObjArr[i].callbackFn;
				var cbObj = {success:false, id:id};
				if (ua.pv[0] > 0) {
					var obj = getElementById(id);
					if (obj) {
						if (hasPlayerVersion(regObjArr[i].swfVersion) && !(ua.wk && ua.wk < 312)) { // Flash Player version >= published SWF version: Houston, we have a match!
							setVisibility(id, true);
							if (cb) {
								cbObj.success = true;
								cbObj.ref = getObjectById(id);
								cb(cbObj);
							}
						}
						else if (regObjArr[i].expressInstall && canExpressInstall()) { // show the Adobe Express Install dialog if set by the web page author and if supported
							var att = {};
							att.data = regObjArr[i].expressInstall;
							att.width = obj.getAttribute("width") || "0";
							att.height = obj.getAttribute("height") || "0";
							if (obj.getAttribute("class")) { att.styleclass = obj.getAttribute("class"); }
							if (obj.getAttribute("align")) { att.align = obj.getAttribute("align"); }
							// parse HTML object param element's name-value pairs
							var par = {};
							var p = obj.getElementsByTagName("param");
							var pl = p.length;
							for (var j = 0; j < pl; j++) {
								if (p[j].getAttribute("name").toLowerCase() != "movie") {
									par[p[j].getAttribute("name")] = p[j].getAttribute("value");
								}
							}
							showExpressInstall(att, par, id, cb);
						}
						else { // Flash Player and SWF version mismatch or an older Webkit engine that ignores the HTML object element's nested param elements: display alternative content instead of SWF
							displayAltContent(obj);
							if (cb) { cb(cbObj); }
						}
					}
				}
				else {	// if no Flash Player is installed or the fp version cannot be detected we let the HTML object element do its job (either show a SWF or alternative content)
					setVisibility(id, true);
					if (cb) {
						var o = getObjectById(id); // test whether there is an HTML object element or not
						if (o && typeof o.SetVariable != UNDEF) { 
							cbObj.success = true;
							cbObj.ref = o;
						}
						cb(cbObj);
					}
				}
			}
		}
	}
	
	function getObjectById(objectIdStr) {
		var r = null;
		var o = getElementById(objectIdStr);
		if (o && o.nodeName == "OBJECT") {
			if (typeof o.SetVariable != UNDEF) {
				r = o;
			}
			else {
				var n = o.getElementsByTagName(OBJECT)[0];
				if (n) {
					r = n;
				}
			}
		}
		return r;
	}
	
	/* Requirements for Adobe Express Install
		- only one instance can be active at a time
		- fp 6.0.65 or higher
		- Win/Mac OS only
		- no Webkit engines older than version 312
	*/
	function canExpressInstall() {
		return !isExpressInstallActive && hasPlayerVersion("6.0.65") && (ua.win || ua.mac) && !(ua.wk && ua.wk < 312);
	}
	
	/* Show the Adobe Express Install dialog
		- Reference: http://www.adobe.com/cfusion/knowledgebase/index.cfm?id=6a253b75
	*/
	function showExpressInstall(att, par, replaceElemIdStr, callbackFn) {
		isExpressInstallActive = true;
		storedCallbackFn = callbackFn || null;
		storedCallbackObj = {success:false, id:replaceElemIdStr};
		var obj = getElementById(replaceElemIdStr);
		if (obj) {
			if (obj.nodeName == "OBJECT") { // static publishing
				storedAltContent = abstractAltContent(obj);
				storedAltContentId = null;
			}
			else { // dynamic publishing
				storedAltContent = obj;
				storedAltContentId = replaceElemIdStr;
			}
			att.id = EXPRESS_INSTALL_ID;
			if (typeof att.width == UNDEF || (!/%$/.test(att.width) && parseInt(att.width, 10) < 310)) { att.width = "310"; }
			if (typeof att.height == UNDEF || (!/%$/.test(att.height) && parseInt(att.height, 10) < 137)) { att.height = "137"; }
			doc.title = doc.title.slice(0, 47) + " - Flash Player Installation";
			var pt = ua.ie && ua.win ? "ActiveX" : "PlugIn",
				fv = "MMredirectURL=" + win.location.toString().replace(/&/g,"%26") + "&MMplayerType=" + pt + "&MMdoctitle=" + doc.title;
			if (typeof par.flashvars != UNDEF) {
				par.flashvars += "&" + fv;
			}
			else {
				par.flashvars = fv;
			}
			// IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
			// because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
			if (ua.ie && ua.win && obj.readyState != 4) {
				var newObj = createElement("div");
				replaceElemIdStr += "SWFObjectNew";
				newObj.setAttribute("id", replaceElemIdStr);
				obj.parentNode.insertBefore(newObj, obj); // insert placeholder div that will be replaced by the object element that loads expressinstall.swf
				obj.style.display = "none";
				(function(){
					if (obj.readyState == 4) {
						obj.parentNode.removeChild(obj);
					}
					else {
						setTimeout(arguments.callee, 10);
					}
				})();
			}
			createSWF(att, par, replaceElemIdStr);
		}
	}
	
	/* Functions to abstract and display alternative content
	*/
	function displayAltContent(obj) {
		if (ua.ie && ua.win && obj.readyState != 4) {
			// IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
			// because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
			var el = createElement("div");
			obj.parentNode.insertBefore(el, obj); // insert placeholder div that will be replaced by the alternative content
			el.parentNode.replaceChild(abstractAltContent(obj), el);
			obj.style.display = "none";
			(function(){
				if (obj.readyState == 4) {
					obj.parentNode.removeChild(obj);
				}
				else {
					setTimeout(arguments.callee, 10);
				}
			})();
		}
		else {
			obj.parentNode.replaceChild(abstractAltContent(obj), obj);
		}
	} 

	function abstractAltContent(obj) {
		var ac = createElement("div");
		if (ua.win && ua.ie) {
			ac.innerHTML = obj.innerHTML;
		}
		else {
			var nestedObj = obj.getElementsByTagName(OBJECT)[0];
			if (nestedObj) {
				var c = nestedObj.childNodes;
				if (c) {
					var cl = c.length;
					for (var i = 0; i < cl; i++) {
						if (!(c[i].nodeType == 1 && c[i].nodeName == "PARAM") && !(c[i].nodeType == 8)) {
							ac.appendChild(c[i].cloneNode(true));
						}
					}
				}
			}
		}
		return ac;
	}
	
	/* Cross-browser dynamic SWF creation
	*/
	function createSWF(attObj, parObj, id) {
		var r, el = getElementById(id);
		if (ua.wk && ua.wk < 312) { return r; }
		if (el) {
			if (typeof attObj.id == UNDEF) { // if no 'id' is defined for the object element, it will inherit the 'id' from the alternative content
				attObj.id = id;
			}
			if (ua.ie && ua.win) { // Internet Explorer + the HTML object element + W3C DOM methods do not combine: fall back to outerHTML
				var att = "";
				for (var i in attObj) {
					if (attObj[i] != Object.prototype[i]) { // filter out prototype additions from other potential libraries
						if (i.toLowerCase() == "data") {
							parObj.movie = attObj[i];
						}
						else if (i.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							att += ' class="' + attObj[i] + '"';
						}
						else if (i.toLowerCase() != "classid") {
							att += ' ' + i + '="' + attObj[i] + '"';
						}
					}
				}
				var par = "";
				for (var j in parObj) {
					if (parObj[j] != Object.prototype[j]) { // filter out prototype additions from other potential libraries
						par += '<param name="' + j + '" value="' + parObj[j] + '" />';
					}
				}
				el.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + att + '>' + par + '</object>';
				objIdArr[objIdArr.length] = attObj.id; // stored to fix object 'leaks' on unload (dynamic publishing only)
				r = getElementById(attObj.id);	
			}
			else { // well-behaving browsers
				var o = createElement(OBJECT);
				o.setAttribute("type", FLASH_MIME_TYPE);
				for (var m in attObj) {
					if (attObj[m] != Object.prototype[m]) { // filter out prototype additions from other potential libraries
						if (m.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							o.setAttribute("class", attObj[m]);
						}
						else if (m.toLowerCase() != "classid") { // filter out IE specific attribute
							o.setAttribute(m, attObj[m]);
						}
					}
				}
				for (var n in parObj) {
					if (parObj[n] != Object.prototype[n] && n.toLowerCase() != "movie") { // filter out prototype additions from other potential libraries and IE specific param element
						createObjParam(o, n, parObj[n]);
					}
				}
				el.parentNode.replaceChild(o, el);
				r = o;
			}
		}
		return r;
	}
	
	function createObjParam(el, pName, pValue) {
		var p = createElement("param");
		p.setAttribute("name", pName);	
		p.setAttribute("value", pValue);
		el.appendChild(p);
	}
	
	/* Cross-browser SWF removal
		- Especially needed to safely and completely remove a SWF in Internet Explorer
	*/
	function removeSWF(id) {
		var obj = getElementById(id);
		if (obj && obj.nodeName == "OBJECT") {
			if (ua.ie && ua.win) {
				obj.style.display = "none";
				(function(){
					if (obj.readyState == 4) {
						removeObjectInIE(id);
					}
					else {
						setTimeout(arguments.callee, 10);
					}
				})();
			}
			else {
				obj.parentNode.removeChild(obj);
			}
		}
	}
	
	function removeObjectInIE(id) {
		var obj = getElementById(id);
		if (obj) {
			for (var i in obj) {
				if (typeof obj[i] == "function") {
					obj[i] = null;
				}
			}
			obj.parentNode.removeChild(obj);
		}
	}
	
	/* Functions to optimize JavaScript compression
	*/
	function getElementById(id) {
		var el = null;
		try {
			el = doc.getElementById(id);
		}
		catch (e) {}
		return el;
	}
	
	function createElement(el) {
		return doc.createElement(el);
	}
	
	/* Updated attachEvent function for Internet Explorer
		- Stores attachEvent information in an Array, so on unload the detachEvent functions can be called to avoid memory leaks
	*/	
	function addListener(target, eventType, fn) {
		target.attachEvent(eventType, fn);
		listenersArr[listenersArr.length] = [target, eventType, fn];
	}
	
	/* Flash Player and SWF content version matching
	*/
	function hasPlayerVersion(rv) {
		var pv = ua.pv, v = rv.split(".");
		v[0] = parseInt(v[0], 10);
		v[1] = parseInt(v[1], 10) || 0; // supports short notation, e.g. "9" instead of "9.0.0"
		v[2] = parseInt(v[2], 10) || 0;
		return (pv[0] > v[0] || (pv[0] == v[0] && pv[1] > v[1]) || (pv[0] == v[0] && pv[1] == v[1] && pv[2] >= v[2])) ? true : false;
	}
	
	/* Cross-browser dynamic CSS creation
		- Based on Bobby van der Sluis' solution: http://www.bobbyvandersluis.com/articles/dynamicCSS.php
	*/	
	function createCSS(sel, decl, media, newStyle) {
		if (ua.ie && ua.mac) { return; }
		var h = doc.getElementsByTagName("head")[0];
		if (!h) { return; } // to also support badly authored HTML pages that lack a head element
		var m = (media && typeof media == "string") ? media : "screen";
		if (newStyle) {
			dynamicStylesheet = null;
			dynamicStylesheetMedia = null;
		}
		if (!dynamicStylesheet || dynamicStylesheetMedia != m) { 
			// create dynamic stylesheet + get a global reference to it
			var s = createElement("style");
			s.setAttribute("type", "text/css");
			s.setAttribute("media", m);
			dynamicStylesheet = h.appendChild(s);
			if (ua.ie && ua.win && typeof doc.styleSheets != UNDEF && doc.styleSheets.length > 0) {
				dynamicStylesheet = doc.styleSheets[doc.styleSheets.length - 1];
			}
			dynamicStylesheetMedia = m;
		}
		// add style rule
		if (ua.ie && ua.win) {
			if (dynamicStylesheet && typeof dynamicStylesheet.addRule == OBJECT) {
				dynamicStylesheet.addRule(sel, decl);
			}
		}
		else {
			if (dynamicStylesheet && typeof doc.createTextNode != UNDEF) {
				dynamicStylesheet.appendChild(doc.createTextNode(sel + " {" + decl + "}"));
			}
		}
	}
	
	function setVisibility(id, isVisible) {
		if (!autoHideShow) { return; }
		var v = isVisible ? "visible" : "hidden";
		if (isDomLoaded && getElementById(id)) {
			getElementById(id).style.visibility = v;
		}
		else {
			createCSS("#" + id, "visibility:" + v);
		}
	}

	/* Filter to avoid XSS attacks
	*/
	function urlEncodeIfNecessary(s) {
		var regex = /[\\\"<>\.;]/;
		var hasBadChars = regex.exec(s) != null;
		return hasBadChars && typeof encodeURIComponent != UNDEF ? encodeURIComponent(s) : s;
	}
	
	/* Release memory to avoid memory leaks caused by closures, fix hanging audio/video threads and force open sockets/NetConnections to disconnect (Internet Explorer only)
	*/
	var cleanup = function() {
		if (ua.ie && ua.win) {
			window.attachEvent("onunload", function() {
				// remove listeners to avoid memory leaks
				var ll = listenersArr.length;
				for (var i = 0; i < ll; i++) {
					listenersArr[i][0].detachEvent(listenersArr[i][1], listenersArr[i][2]);
				}
				// cleanup dynamically embedded objects to fix audio/video threads and force open sockets and NetConnections to disconnect
				var il = objIdArr.length;
				for (var j = 0; j < il; j++) {
					removeSWF(objIdArr[j]);
				}
				// cleanup library's main closures to avoid memory leaks
				for (var k in ua) {
					ua[k] = null;
				}
				ua = null;
				for (var l in swfobject) {
					swfobject[l] = null;
				}
				swfobject = null;
			});
		}
	}();
	
	return {
		/* Public API
			- Reference: http://code.google.com/p/swfobject/wiki/documentation
		*/ 
		registerObject: function(objectIdStr, swfVersionStr, xiSwfUrlStr, callbackFn) {
			if (ua.w3 && objectIdStr && swfVersionStr) {
				var regObj = {};
				regObj.id = objectIdStr;
				regObj.swfVersion = swfVersionStr;
				regObj.expressInstall = xiSwfUrlStr;
				regObj.callbackFn = callbackFn;
				regObjArr[regObjArr.length] = regObj;
				setVisibility(objectIdStr, false);
			}
			else if (callbackFn) {
				callbackFn({success:false, id:objectIdStr});
			}
		},
		
		getObjectById: function(objectIdStr) {
			if (ua.w3) {
				return getObjectById(objectIdStr);
			}
		},
		
		embedSWF: function(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj, callbackFn) {
			var callbackObj = {success:false, id:replaceElemIdStr};
			if (ua.w3 && !(ua.wk && ua.wk < 312) && swfUrlStr && replaceElemIdStr && widthStr && heightStr && swfVersionStr) {
				setVisibility(replaceElemIdStr, false);
				addDomLoadEvent(function() {
					widthStr += ""; // auto-convert to string
					heightStr += "";
					var att = {};
					if (attObj && typeof attObj === OBJECT) {
						for (var i in attObj) { // copy object to avoid the use of references, because web authors often reuse attObj for multiple SWFs
							att[i] = attObj[i];
						}
					}
					att.data = swfUrlStr;
					att.width = widthStr;
					att.height = heightStr;
					var par = {}; 
					if (parObj && typeof parObj === OBJECT) {
						for (var j in parObj) { // copy object to avoid the use of references, because web authors often reuse parObj for multiple SWFs
							par[j] = parObj[j];
						}
					}
					if (flashvarsObj && typeof flashvarsObj === OBJECT) {
						for (var k in flashvarsObj) { // copy object to avoid the use of references, because web authors often reuse flashvarsObj for multiple SWFs
							if (typeof par.flashvars != UNDEF) {
								par.flashvars += "&" + k + "=" + flashvarsObj[k];
							}
							else {
								par.flashvars = k + "=" + flashvarsObj[k];
							}
						}
					}
					if (hasPlayerVersion(swfVersionStr)) { // create SWF
						var obj = createSWF(att, par, replaceElemIdStr);
						if (att.id == replaceElemIdStr) {
							setVisibility(replaceElemIdStr, true);
						}
						callbackObj.success = true;
						callbackObj.ref = obj;
					}
					else if (xiSwfUrlStr && canExpressInstall()) { // show Adobe Express Install
						att.data = xiSwfUrlStr;
						showExpressInstall(att, par, replaceElemIdStr, callbackFn);
						return;
					}
					else { // show alternative content
						setVisibility(replaceElemIdStr, true);
					}
					if (callbackFn) { callbackFn(callbackObj); }
				});
			}
			else if (callbackFn) { callbackFn(callbackObj);	}
		},
		
		switchOffAutoHideShow: function() {
			autoHideShow = false;
		},
		
		ua: ua,
		
		getFlashPlayerVersion: function() {
			return { major:ua.pv[0], minor:ua.pv[1], release:ua.pv[2] };
		},
		
		hasFlashPlayerVersion: hasPlayerVersion,
		
		createSWF: function(attObj, parObj, replaceElemIdStr) {
			if (ua.w3) {
				return createSWF(attObj, parObj, replaceElemIdStr);
			}
			else {
				return undefined;
			}
		},
		
		showExpressInstall: function(att, par, replaceElemIdStr, callbackFn) {
			if (ua.w3 && canExpressInstall()) {
				showExpressInstall(att, par, replaceElemIdStr, callbackFn);
			}
		},
		
		removeSWF: function(objElemIdStr) {
			if (ua.w3) {
				removeSWF(objElemIdStr);
			}
		},
		
		createCSS: function(selStr, declStr, mediaStr, newStyleBoolean) {
			if (ua.w3) {
				createCSS(selStr, declStr, mediaStr, newStyleBoolean);
			}
		},
		
		addDomLoadEvent: addDomLoadEvent,
		
		addLoadEvent: addLoadEvent,
		
		getQueryParamValue: function(param) {
			var q = doc.location.search || doc.location.hash;
			if (q) {
				if (/\?/.test(q)) { q = q.split("?")[1]; } // strip question mark
				if (param == null) {
					return urlEncodeIfNecessary(q);
				}
				var pairs = q.split("&");
				for (var i = 0; i < pairs.length; i++) {
					if (pairs[i].substring(0, pairs[i].indexOf("=")) == param) {
						return urlEncodeIfNecessary(pairs[i].substring((pairs[i].indexOf("=") + 1)));
					}
				}
			}
			return "";
		},
		
		// For internal usage only
		expressInstallCallback: function() {
			if (isExpressInstallActive) {
				var obj = getElementById(EXPRESS_INSTALL_ID);
				if (obj && storedAltContent) {
					obj.parentNode.replaceChild(storedAltContent, obj);
					if (storedAltContentId) {
						setVisibility(storedAltContentId, true);
						if (ua.ie && ua.win) { storedAltContent.style.display = "block"; }
					}
					if (storedCallbackFn) { storedCallbackFn(storedCallbackObj); }
				}
				isExpressInstallActive = false;
			} 
		}
	};
}();
/**
 * SWFUpload: http://www.swfupload.org, http://swfupload.googlecode.com
 *
 * mmSWFUpload 1.0: Flash upload dialog - http://profandesign.se/swfupload/,  http://www.vinterwebb.se/
 *
 * SWFUpload is (c) 2006-2007 Lars Huring, Olov Nilz�n and Mammon Media and is released under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * SWFUpload 2 is (c) 2007-2008 Jake Roberts and is released under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */


/* ******************* */
/* Constructor & Init  */
/* ******************* */
var SWFUpload;

if (SWFUpload == undefined) {
	SWFUpload = function (settings) {
		this.initSWFUpload(settings);
	};
}

SWFUpload.prototype.initSWFUpload = function (settings) {
	try {
		this.customSettings = {};	// A container where developers can place their own settings associated with this instance.
		this.settings = settings;
		this.eventQueue = [];
		this.movieName = "SWFUpload_" + SWFUpload.movieCount++;
		this.movieElement = null;


		// Setup global control tracking
		SWFUpload.instances[this.movieName] = this;

		// Load the settings.  Load the Flash movie.
		this.initSettings();
		this.loadFlash();
		this.displayDebugInfo();
	} catch (ex) {
		delete SWFUpload.instances[this.movieName];
		throw ex;
	}
};

/* *************** */
/* Static Members  */
/* *************** */
SWFUpload.instances = {};
SWFUpload.movieCount = 0;
SWFUpload.version = "2.2.0 2009-03-25";
SWFUpload.QUEUE_ERROR = {
	QUEUE_LIMIT_EXCEEDED	  		: -100,
	FILE_EXCEEDS_SIZE_LIMIT  		: -110,
	ZERO_BYTE_FILE			  		: -120,
	INVALID_FILETYPE		  		: -130
};
SWFUpload.UPLOAD_ERROR = {
	HTTP_ERROR				  		: -200,
	MISSING_UPLOAD_URL	      		: -210,
	IO_ERROR				  		: -220,
	SECURITY_ERROR			  		: -230,
	UPLOAD_LIMIT_EXCEEDED	  		: -240,
	UPLOAD_FAILED			  		: -250,
	SPECIFIED_FILE_ID_NOT_FOUND		: -260,
	FILE_VALIDATION_FAILED	  		: -270,
	FILE_CANCELLED			  		: -280,
	UPLOAD_STOPPED					: -290
};
SWFUpload.FILE_STATUS = {
	QUEUED		 : -1,
	IN_PROGRESS	 : -2,
	ERROR		 : -3,
	COMPLETE	 : -4,
	CANCELLED	 : -5
};
SWFUpload.BUTTON_ACTION = {
	SELECT_FILE  : -100,
	SELECT_FILES : -110,
	START_UPLOAD : -120
};
SWFUpload.CURSOR = {
	ARROW : -1,
	HAND : -2
};
SWFUpload.WINDOW_MODE = {
	WINDOW : "window",
	TRANSPARENT : "transparent",
	OPAQUE : "opaque"
};

// Private: takes a URL, determines if it is relative and converts to an absolute URL
// using the current site. Only processes the URL if it can, otherwise returns the URL untouched
SWFUpload.completeURL = function(url) {
	if (typeof(url) !== "string" || url.match(/^https?:\/\//i) || url.match(/^\//)) {
		return url;
	}
	
	var currentURL = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "");
	
	var indexSlash = window.location.pathname.lastIndexOf("/");
	if (indexSlash <= 0) {
		path = "/";
	} else {
		path = window.location.pathname.substr(0, indexSlash) + "/";
	}
	
	return /*currentURL +*/ path + url;
	
};


/* ******************** */
/* Instance Members  */
/* ******************** */

// Private: initSettings ensures that all the
// settings are set, getting a default value if one was not assigned.
SWFUpload.prototype.initSettings = function () {
	this.ensureDefault = function (settingName, defaultValue) {
		this.settings[settingName] = (this.settings[settingName] == undefined) ? defaultValue : this.settings[settingName];
	};
	
	// Upload backend settings
	this.ensureDefault("upload_url", "");
	this.ensureDefault("preserve_relative_urls", false);
	this.ensureDefault("file_post_name", "Filedata");
	this.ensureDefault("post_params", {});
	this.ensureDefault("use_query_string", false);
	this.ensureDefault("requeue_on_error", false);
	this.ensureDefault("http_success", []);
	this.ensureDefault("assume_success_timeout", 0);
	
	// File Settings
	this.ensureDefault("file_types", "*.*");
	this.ensureDefault("file_types_description", "All Files");
	this.ensureDefault("file_size_limit", 0);	// Default zero means "unlimited"
	this.ensureDefault("file_upload_limit", 0);
	this.ensureDefault("file_queue_limit", 0);

	// Flash Settings
	this.ensureDefault("flash_url", "swfupload.swf");
	this.ensureDefault("prevent_swf_caching", true);
	
	// Button Settings
	this.ensureDefault("button_image_url", "");
	this.ensureDefault("button_width", 1);
	this.ensureDefault("button_height", 1);
	this.ensureDefault("button_text", "");
	this.ensureDefault("button_text_style", "color: #000000; font-size: 16pt;");
	this.ensureDefault("button_text_top_padding", 0);
	this.ensureDefault("button_text_left_padding", 0);
	this.ensureDefault("button_action", SWFUpload.BUTTON_ACTION.SELECT_FILES);
	this.ensureDefault("button_disabled", false);
	this.ensureDefault("button_placeholder_id", "");
	this.ensureDefault("button_placeholder", null);
	this.ensureDefault("button_cursor", SWFUpload.CURSOR.ARROW);
	this.ensureDefault("button_window_mode", SWFUpload.WINDOW_MODE.WINDOW);
	
	// Debug Settings
	this.ensureDefault("debug", false);
	this.settings.debug_enabled = this.settings.debug;	// Here to maintain v2 API
	
	// Event Handlers
	this.settings.return_upload_start_handler = this.returnUploadStart;
	this.ensureDefault("swfupload_loaded_handler", null);
	this.ensureDefault("file_dialog_start_handler", null);
	this.ensureDefault("file_queued_handler", null);
	this.ensureDefault("file_queue_error_handler", null);
	this.ensureDefault("file_dialog_complete_handler", null);
	
	this.ensureDefault("upload_start_handler", null);
	this.ensureDefault("upload_progress_handler", null);
	this.ensureDefault("upload_error_handler", null);
	this.ensureDefault("upload_success_handler", null);
	this.ensureDefault("upload_complete_handler", null);
	
	this.ensureDefault("debug_handler", this.debugMessage);

	this.ensureDefault("custom_settings", {});

	// Other settings
	this.customSettings = this.settings.custom_settings;
	
	// Update the flash url if needed
	if (!!this.settings.prevent_swf_caching) {
		this.settings.flash_url = this.settings.flash_url + (this.settings.flash_url.indexOf("?") < 0 ? "?" : "&") + "preventswfcaching=" + new Date().getTime();
	}
	
	if (!this.settings.preserve_relative_urls) {
		//this.settings.flash_url = SWFUpload.completeURL(this.settings.flash_url);	// Don't need to do this one since flash doesn't look at it
		this.settings.upload_url = SWFUpload.completeURL(this.settings.upload_url);
		this.settings.button_image_url = SWFUpload.completeURL(this.settings.button_image_url);
	}
	
	delete this.ensureDefault;
};

// Private: loadFlash replaces the button_placeholder element with the flash movie.
SWFUpload.prototype.loadFlash = function () {
	var targetElement, tempParent;

	// Make sure an element with the ID we are going to use doesn't already exist
	if (document.getElementById(this.movieName) !== null) {
		throw "ID " + this.movieName + " is already in use. The Flash Object could not be added";
	}

	// Get the element where we will be placing the flash movie
	targetElement = document.getElementById(this.settings.button_placeholder_id) || this.settings.button_placeholder;

	if (targetElement == undefined) {
		throw "Could not find the placeholder element: " + this.settings.button_placeholder_id;
	}

	// Append the container and load the flash
	tempParent = document.createElement("div");
	tempParent.innerHTML = this.getFlashHTML();	// Using innerHTML is non-standard but the only sensible way to dynamically add Flash in IE (and maybe other browsers)
	targetElement.parentNode.replaceChild(tempParent.firstChild, targetElement);

	// Fix IE Flash/Form bug
	if (window[this.movieName] == undefined) {
		window[this.movieName] = this.getMovieElement();
	}
	
};

// Private: getFlashHTML generates the object tag needed to embed the flash in to the document
SWFUpload.prototype.getFlashHTML = function () {
	// Flash Satay object syntax: http://www.alistapart.com/articles/flashsatay
	return ['<object id="', this.movieName, '" type="application/x-shockwave-flash" data="', this.settings.flash_url, '" width="', this.settings.button_width, '" height="', this.settings.button_height, '" class="swfupload">',
				'<param name="wmode" value="', this.settings.button_window_mode, '" />',
				'<param name="movie" value="', this.settings.flash_url, '" />',
				'<param name="quality" value="high" />',
				'<param name="menu" value="false" />',
				'<param name="allowScriptAccess" value="always" />',
				'<param name="flashvars" value="' + this.getFlashVars() + '" />',
				'</object>'].join("");
};

// Private: getFlashVars builds the parameter string that will be passed
// to flash in the flashvars param.
SWFUpload.prototype.getFlashVars = function () {
	// Build a string from the post param object
	var paramString = this.buildParamString();
	var httpSuccessString = this.settings.http_success.join(",");
	
	// Build the parameter string
	return ["movieName=", encodeURIComponent(this.movieName),
			"&amp;uploadURL=", encodeURIComponent(this.settings.upload_url),
			"&amp;useQueryString=", encodeURIComponent(this.settings.use_query_string),
			"&amp;requeueOnError=", encodeURIComponent(this.settings.requeue_on_error),
			"&amp;httpSuccess=", encodeURIComponent(httpSuccessString),
			"&amp;assumeSuccessTimeout=", encodeURIComponent(this.settings.assume_success_timeout),
			"&amp;params=", encodeURIComponent(paramString),
			"&amp;filePostName=", encodeURIComponent(this.settings.file_post_name),
			"&amp;fileTypes=", encodeURIComponent(this.settings.file_types),
			"&amp;fileTypesDescription=", encodeURIComponent(this.settings.file_types_description),
			"&amp;fileSizeLimit=", encodeURIComponent(this.settings.file_size_limit),
			"&amp;fileUploadLimit=", encodeURIComponent(this.settings.file_upload_limit),
			"&amp;fileQueueLimit=", encodeURIComponent(this.settings.file_queue_limit),
			"&amp;debugEnabled=", encodeURIComponent(this.settings.debug_enabled),
			"&amp;buttonImageURL=", encodeURIComponent(this.settings.button_image_url),
			"&amp;buttonWidth=", encodeURIComponent(this.settings.button_width),
			"&amp;buttonHeight=", encodeURIComponent(this.settings.button_height),
			"&amp;buttonText=", encodeURIComponent(this.settings.button_text),
			"&amp;buttonTextTopPadding=", encodeURIComponent(this.settings.button_text_top_padding),
			"&amp;buttonTextLeftPadding=", encodeURIComponent(this.settings.button_text_left_padding),
			"&amp;buttonTextStyle=", encodeURIComponent(this.settings.button_text_style),
			"&amp;buttonAction=", encodeURIComponent(this.settings.button_action),
			"&amp;buttonDisabled=", encodeURIComponent(this.settings.button_disabled),
			"&amp;buttonCursor=", encodeURIComponent(this.settings.button_cursor)
		].join("");
};

// Public: getMovieElement retrieves the DOM reference to the Flash element added by SWFUpload
// The element is cached after the first lookup
SWFUpload.prototype.getMovieElement = function () {
	if (this.movieElement == undefined) {
		this.movieElement = document.getElementById(this.movieName);
	}

	if (this.movieElement === null) {
		throw "Could not find Flash element";
	}
	
	return this.movieElement;
};

// Private: buildParamString takes the name/value pairs in the post_params setting object
// and joins them up in to a string formatted "name=value&amp;name=value"
SWFUpload.prototype.buildParamString = function () {
	var postParams = this.settings.post_params; 
	var paramStringPairs = [];

	if (typeof(postParams) === "object") {
		for (var name in postParams) {
			if (postParams.hasOwnProperty(name)) {
				paramStringPairs.push(encodeURIComponent(name.toString()) + "=" + encodeURIComponent(postParams[name].toString()));
			}
		}
	}

	return paramStringPairs.join("&amp;");
};

// Public: Used to remove a SWFUpload instance from the page. This method strives to remove
// all references to the SWF, and other objects so memory is properly freed.
// Returns true if everything was destroyed. Returns a false if a failure occurs leaving SWFUpload in an inconsistant state.
// Credits: Major improvements provided by steffen
SWFUpload.prototype.destroy = function () {
	try {
		// Make sure Flash is done before we try to remove it
		this.cancelUpload(null, false);
		

		// Remove the SWFUpload DOM nodes
		var movieElement = null;
		movieElement = this.getMovieElement();
		
		if (movieElement && typeof(movieElement.CallFunction) === "unknown") { // We only want to do this in IE
			// Loop through all the movie's properties and remove all function references (DOM/JS IE 6/7 memory leak workaround)
			for (var i in movieElement) {
				try {
					if (typeof(movieElement[i]) === "function") {
						movieElement[i] = null;
					}
				} catch (ex1) {}
			}

			// Remove the Movie Element from the page
			try {
				movieElement.parentNode.removeChild(movieElement);
			} catch (ex) {}
		}
		
		// Remove IE form fix reference
		window[this.movieName] = null;

		// Destroy other references
		SWFUpload.instances[this.movieName] = null;
		delete SWFUpload.instances[this.movieName];

		this.movieElement = null;
		this.settings = null;
		this.customSettings = null;
		this.eventQueue = null;
		this.movieName = null;
		
		
		return true;
	} catch (ex2) {
		return false;
	}
};


// Public: displayDebugInfo prints out settings and configuration
// information about this SWFUpload instance.
// This function (and any references to it) can be deleted when placing
// SWFUpload in production.
SWFUpload.prototype.displayDebugInfo = function () {
	this.debug(
		[
			"---SWFUpload Instance Info---\n",
			"Version: ", SWFUpload.version, "\n",
			"Movie Name: ", this.movieName, "\n",
			"Settings:\n",
			"\t", "upload_url:               ", this.settings.upload_url, "\n",
			"\t", "flash_url:                ", this.settings.flash_url, "\n",
			"\t", "use_query_string:         ", this.settings.use_query_string.toString(), "\n",
			"\t", "requeue_on_error:         ", this.settings.requeue_on_error.toString(), "\n",
			"\t", "http_success:             ", this.settings.http_success.join(", "), "\n",
			"\t", "assume_success_timeout:   ", this.settings.assume_success_timeout, "\n",
			"\t", "file_post_name:           ", this.settings.file_post_name, "\n",
			"\t", "post_params:              ", this.settings.post_params.toString(), "\n",
			"\t", "file_types:               ", this.settings.file_types, "\n",
			"\t", "file_types_description:   ", this.settings.file_types_description, "\n",
			"\t", "file_size_limit:          ", this.settings.file_size_limit, "\n",
			"\t", "file_upload_limit:        ", this.settings.file_upload_limit, "\n",
			"\t", "file_queue_limit:         ", this.settings.file_queue_limit, "\n",
			"\t", "debug:                    ", this.settings.debug.toString(), "\n",

			"\t", "prevent_swf_caching:      ", this.settings.prevent_swf_caching.toString(), "\n",

			"\t", "button_placeholder_id:    ", this.settings.button_placeholder_id.toString(), "\n",
			"\t", "button_placeholder:       ", (this.settings.button_placeholder ? "Set" : "Not Set"), "\n",
			"\t", "button_image_url:         ", this.settings.button_image_url.toString(), "\n",
			"\t", "button_width:             ", this.settings.button_width.toString(), "\n",
			"\t", "button_height:            ", this.settings.button_height.toString(), "\n",
			"\t", "button_text:              ", this.settings.button_text.toString(), "\n",
			"\t", "button_text_style:        ", this.settings.button_text_style.toString(), "\n",
			"\t", "button_text_top_padding:  ", this.settings.button_text_top_padding.toString(), "\n",
			"\t", "button_text_left_padding: ", this.settings.button_text_left_padding.toString(), "\n",
			"\t", "button_action:            ", this.settings.button_action.toString(), "\n",
			"\t", "button_disabled:          ", this.settings.button_disabled.toString(), "\n",

			"\t", "custom_settings:          ", this.settings.custom_settings.toString(), "\n",
			"Event Handlers:\n",
			"\t", "swfupload_loaded_handler assigned:  ", (typeof this.settings.swfupload_loaded_handler === "function").toString(), "\n",
			"\t", "file_dialog_start_handler assigned: ", (typeof this.settings.file_dialog_start_handler === "function").toString(), "\n",
			"\t", "file_queued_handler assigned:       ", (typeof this.settings.file_queued_handler === "function").toString(), "\n",
			"\t", "file_queue_error_handler assigned:  ", (typeof this.settings.file_queue_error_handler === "function").toString(), "\n",
			"\t", "upload_start_handler assigned:      ", (typeof this.settings.upload_start_handler === "function").toString(), "\n",
			"\t", "upload_progress_handler assigned:   ", (typeof this.settings.upload_progress_handler === "function").toString(), "\n",
			"\t", "upload_error_handler assigned:      ", (typeof this.settings.upload_error_handler === "function").toString(), "\n",
			"\t", "upload_success_handler assigned:    ", (typeof this.settings.upload_success_handler === "function").toString(), "\n",
			"\t", "upload_complete_handler assigned:   ", (typeof this.settings.upload_complete_handler === "function").toString(), "\n",
			"\t", "debug_handler assigned:             ", (typeof this.settings.debug_handler === "function").toString(), "\n"
		].join("")
	);
};

/* Note: addSetting and getSetting are no longer used by SWFUpload but are included
	the maintain v2 API compatibility
*/
// Public: (Deprecated) addSetting adds a setting value. If the value given is undefined or null then the default_value is used.
SWFUpload.prototype.addSetting = function (name, value, default_value) {
    if (value == undefined) {
        return (this.settings[name] = default_value);
    } else {
        return (this.settings[name] = value);
	}
};

// Public: (Deprecated) getSetting gets a setting. Returns an empty string if the setting was not found.
SWFUpload.prototype.getSetting = function (name) {
    if (this.settings[name] != undefined) {
        return this.settings[name];
	}

    return "";
};



// Private: callFlash handles function calls made to the Flash element.
// Calls are made with a setTimeout for some functions to work around
// bugs in the ExternalInterface library.
SWFUpload.prototype.callFlash = function (functionName, argumentArray) {
	argumentArray = argumentArray || [];
	
	var movieElement = this.getMovieElement();
	var returnValue, returnString;

	// Flash's method if calling ExternalInterface methods (code adapted from MooTools).
	try {
		returnString = movieElement.CallFunction('<invoke name="' + functionName + '" returntype="javascript">' + __flash__argumentsToXML(argumentArray, 0) + '</invoke>');
		returnValue = eval(returnString);
	} catch (ex) {
		throw "Call to " + functionName + " failed";
	}
	
	// Unescape file post param values
	if (returnValue != undefined && typeof returnValue.post === "object") {
		returnValue = this.unescapeFilePostParams(returnValue);
	}

	return returnValue;
};

/* *****************************
	-- Flash control methods --
	Your UI should use these
	to operate SWFUpload
   ***************************** */

// WARNING: this function does not work in Flash Player 10
// Public: selectFile causes a File Selection Dialog window to appear.  This
// dialog only allows 1 file to be selected.
SWFUpload.prototype.selectFile = function () {
	this.callFlash("SelectFile");
};

// WARNING: this function does not work in Flash Player 10
// Public: selectFiles causes a File Selection Dialog window to appear/ This
// dialog allows the user to select any number of files
// Flash Bug Warning: Flash limits the number of selectable files based on the combined length of the file names.
// If the selection name length is too long the dialog will fail in an unpredictable manner.  There is no work-around
// for this bug.
SWFUpload.prototype.selectFiles = function () {
	this.callFlash("SelectFiles");
};


// Public: startUpload starts uploading the first file in the queue unless
// the optional parameter 'fileID' specifies the ID 
SWFUpload.prototype.startUpload = function (fileID) {
	this.callFlash("StartUpload", [fileID]);
};

// Public: cancelUpload cancels any queued file.  The fileID parameter may be the file ID or index.
// If you do not specify a fileID the current uploading file or first file in the queue is cancelled.
// If you do not want the uploadError event to trigger you can specify false for the triggerErrorEvent parameter.
SWFUpload.prototype.cancelUpload = function (fileID, triggerErrorEvent) {
	if (triggerErrorEvent !== false) {
		triggerErrorEvent = true;
	}
	this.callFlash("CancelUpload", [fileID, triggerErrorEvent]);
};

// Public: stopUpload stops the current upload and requeues the file at the beginning of the queue.
// If nothing is currently uploading then nothing happens.
SWFUpload.prototype.stopUpload = function () {
	this.callFlash("StopUpload");
};

/* ************************
 * Settings methods
 *   These methods change the SWFUpload settings.
 *   SWFUpload settings should not be changed directly on the settings object
 *   since many of the settings need to be passed to Flash in order to take
 *   effect.
 * *********************** */

// Public: getStats gets the file statistics object.
SWFUpload.prototype.getStats = function () {
	return this.callFlash("GetStats");
};

// Public: setStats changes the SWFUpload statistics.  You shouldn't need to 
// change the statistics but you can.  Changing the statistics does not
// affect SWFUpload accept for the successful_uploads count which is used
// by the upload_limit setting to determine how many files the user may upload.
SWFUpload.prototype.setStats = function (statsObject) {
	this.callFlash("SetStats", [statsObject]);
};

// Public: getFile retrieves a File object by ID or Index.  If the file is
// not found then 'null' is returned.
SWFUpload.prototype.getFile = function (fileID) {
	if (typeof(fileID) === "number") {
		return this.callFlash("GetFileByIndex", [fileID]);
	} else {
		return this.callFlash("GetFile", [fileID]);
	}
};

// Public: addFileParam sets a name/value pair that will be posted with the
// file specified by the Files ID.  If the name already exists then the
// exiting value will be overwritten.
SWFUpload.prototype.addFileParam = function (fileID, name, value) {
	return this.callFlash("AddFileParam", [fileID, name, value]);
};

// Public: removeFileParam removes a previously set (by addFileParam) name/value
// pair from the specified file.
SWFUpload.prototype.removeFileParam = function (fileID, name) {
	this.callFlash("RemoveFileParam", [fileID, name]);
};

// Public: setUploadUrl changes the upload_url setting.
SWFUpload.prototype.setUploadURL = function (url) {
	this.settings.upload_url = url.toString();
	this.callFlash("SetUploadURL", [url]);
};

// Public: setPostParams changes the post_params setting
SWFUpload.prototype.setPostParams = function (paramsObject) {
	this.settings.post_params = paramsObject;
	this.callFlash("SetPostParams", [paramsObject]);
};

// Public: addPostParam adds post name/value pair.  Each name can have only one value.
SWFUpload.prototype.addPostParam = function (name, value) {
	this.settings.post_params[name] = value;
	this.callFlash("SetPostParams", [this.settings.post_params]);
};

// Public: removePostParam deletes post name/value pair.
SWFUpload.prototype.removePostParam = function (name) {
	delete this.settings.post_params[name];
	this.callFlash("SetPostParams", [this.settings.post_params]);
};

// Public: setFileTypes changes the file_types setting and the file_types_description setting
SWFUpload.prototype.setFileTypes = function (types, description) {
	this.settings.file_types = types;
	this.settings.file_types_description = description;
	this.callFlash("SetFileTypes", [types, description]);
};

// Public: setFileSizeLimit changes the file_size_limit setting
SWFUpload.prototype.setFileSizeLimit = function (fileSizeLimit) {
	this.settings.file_size_limit = fileSizeLimit;
	this.callFlash("SetFileSizeLimit", [fileSizeLimit]);
};

// Public: setFileUploadLimit changes the file_upload_limit setting
SWFUpload.prototype.setFileUploadLimit = function (fileUploadLimit) {
	this.settings.file_upload_limit = fileUploadLimit;
	this.callFlash("SetFileUploadLimit", [fileUploadLimit]);
};

// Public: setFileQueueLimit changes the file_queue_limit setting
SWFUpload.prototype.setFileQueueLimit = function (fileQueueLimit) {
	this.settings.file_queue_limit = fileQueueLimit;
	this.callFlash("SetFileQueueLimit", [fileQueueLimit]);
};

// Public: setFilePostName changes the file_post_name setting
SWFUpload.prototype.setFilePostName = function (filePostName) {
	this.settings.file_post_name = filePostName;
	this.callFlash("SetFilePostName", [filePostName]);
};

// Public: setUseQueryString changes the use_query_string setting
SWFUpload.prototype.setUseQueryString = function (useQueryString) {
	this.settings.use_query_string = useQueryString;
	this.callFlash("SetUseQueryString", [useQueryString]);
};

// Public: setRequeueOnError changes the requeue_on_error setting
SWFUpload.prototype.setRequeueOnError = function (requeueOnError) {
	this.settings.requeue_on_error = requeueOnError;
	this.callFlash("SetRequeueOnError", [requeueOnError]);
};

// Public: setHTTPSuccess changes the http_success setting
SWFUpload.prototype.setHTTPSuccess = function (http_status_codes) {
	if (typeof http_status_codes === "string") {
		http_status_codes = http_status_codes.replace(" ", "").split(",");
	}
	
	this.settings.http_success = http_status_codes;
	this.callFlash("SetHTTPSuccess", [http_status_codes]);
};

// Public: setHTTPSuccess changes the http_success setting
SWFUpload.prototype.setAssumeSuccessTimeout = function (timeout_seconds) {
	this.settings.assume_success_timeout = timeout_seconds;
	this.callFlash("SetAssumeSuccessTimeout", [timeout_seconds]);
};

// Public: setDebugEnabled changes the debug_enabled setting
SWFUpload.prototype.setDebugEnabled = function (debugEnabled) {
	this.settings.debug_enabled = debugEnabled;
	this.callFlash("SetDebugEnabled", [debugEnabled]);
};

// Public: setButtonImageURL loads a button image sprite
SWFUpload.prototype.setButtonImageURL = function (buttonImageURL) {
	if (buttonImageURL == undefined) {
		buttonImageURL = "";
	}
	
	this.settings.button_image_url = buttonImageURL;
	this.callFlash("SetButtonImageURL", [buttonImageURL]);
};

// Public: setButtonDimensions resizes the Flash Movie and button
SWFUpload.prototype.setButtonDimensions = function (width, height) {
	this.settings.button_width = width;
	this.settings.button_height = height;
	
	var movie = this.getMovieElement();
	if (movie != undefined) {
		movie.style.width = width + "px";
		movie.style.height = height + "px";
	}
	
	this.callFlash("SetButtonDimensions", [width, height]);
};
// Public: setButtonText Changes the text overlaid on the button
SWFUpload.prototype.setButtonText = function (html) {
	this.settings.button_text = html;
	this.callFlash("SetButtonText", [html]);
};
// Public: setButtonTextPadding changes the top and left padding of the text overlay
SWFUpload.prototype.setButtonTextPadding = function (left, top) {
	this.settings.button_text_top_padding = top;
	this.settings.button_text_left_padding = left;
	this.callFlash("SetButtonTextPadding", [left, top]);
};

// Public: setButtonTextStyle changes the CSS used to style the HTML/Text overlaid on the button
SWFUpload.prototype.setButtonTextStyle = function (css) {
	this.settings.button_text_style = css;
	this.callFlash("SetButtonTextStyle", [css]);
};
// Public: setButtonDisabled disables/enables the button
SWFUpload.prototype.setButtonDisabled = function (isDisabled) {
	this.settings.button_disabled = isDisabled;
	this.callFlash("SetButtonDisabled", [isDisabled]);
};
// Public: setButtonAction sets the action that occurs when the button is clicked
SWFUpload.prototype.setButtonAction = function (buttonAction) {
	this.settings.button_action = buttonAction;
	this.callFlash("SetButtonAction", [buttonAction]);
};

// Public: setButtonCursor changes the mouse cursor displayed when hovering over the button
SWFUpload.prototype.setButtonCursor = function (cursor) {
	this.settings.button_cursor = cursor;
	this.callFlash("SetButtonCursor", [cursor]);
};

/* *******************************
	Flash Event Interfaces
	These functions are used by Flash to trigger the various
	events.
	
	All these functions a Private.
	
	Because the ExternalInterface library is buggy the event calls
	are added to a queue and the queue then executed by a setTimeout.
	This ensures that events are executed in a determinate order and that
	the ExternalInterface bugs are avoided.
******************************* */

SWFUpload.prototype.queueEvent = function (handlerName, argumentArray) {
	// Warning: Don't call this.debug inside here or you'll create an infinite loop
	
	if (argumentArray == undefined) {
		argumentArray = [];
	} else if (!(argumentArray instanceof Array)) {
		argumentArray = [argumentArray];
	}
	
	var self = this;
	if (typeof this.settings[handlerName] === "function") {
		// Queue the event
		this.eventQueue.push(function () {
			this.settings[handlerName].apply(this, argumentArray);
		});
		
		// Execute the next queued event
		setTimeout(function () {
			self.executeNextEvent();
		}, 0);
		
	} else if (this.settings[handlerName] !== null) {
		throw "Event handler " + handlerName + " is unknown or is not a function";
	}
};

// Private: Causes the next event in the queue to be executed.  Since events are queued using a setTimeout
// we must queue them in order to garentee that they are executed in order.
SWFUpload.prototype.executeNextEvent = function () {
	// Warning: Don't call this.debug inside here or you'll create an infinite loop

	var  f = this.eventQueue ? this.eventQueue.shift() : null;
	if (typeof(f) === "function") {
		f.apply(this);
	}
};

// Private: unescapeFileParams is part of a workaround for a flash bug where objects passed through ExternalInterface cannot have
// properties that contain characters that are not valid for JavaScript identifiers. To work around this
// the Flash Component escapes the parameter names and we must unescape again before passing them along.
SWFUpload.prototype.unescapeFilePostParams = function (file) {
	var reg = /[$]([0-9a-f]{4})/i;
	var unescapedPost = {};
	var uk;

	if (file != undefined) {
		for (var k in file.post) {
			if (file.post.hasOwnProperty(k)) {
				uk = k;
				var match;
				while ((match = reg.exec(uk)) !== null) {
					uk = uk.replace(match[0], String.fromCharCode(parseInt("0x" + match[1], 16)));
				}
				unescapedPost[uk] = file.post[k];
			}
		}

		file.post = unescapedPost;
	}

	return file;
};

// Private: Called by Flash to see if JS can call in to Flash (test if External Interface is working)
SWFUpload.prototype.testExternalInterface = function () {
	try {
		return this.callFlash("TestExternalInterface");
	} catch (ex) {
		return false;
	}
};

// Private: This event is called by Flash when it has finished loading. Don't modify this.
// Use the swfupload_loaded_handler event setting to execute custom code when SWFUpload has loaded.
SWFUpload.prototype.flashReady = function () {
	// Check that the movie element is loaded correctly with its ExternalInterface methods defined
	var movieElement = this.getMovieElement();

	if (!movieElement) {
		this.debug("Flash called back ready but the flash movie can't be found.");
		return;
	}

	this.cleanUp(movieElement);
	
	this.queueEvent("swfupload_loaded_handler");
};

// Private: removes Flash added fuctions to the DOM node to prevent memory leaks in IE.
// This function is called by Flash each time the ExternalInterface functions are created.
SWFUpload.prototype.cleanUp = function (movieElement) {
	// Pro-actively unhook all the Flash functions
	try {
		if (this.movieElement && typeof(movieElement.CallFunction) === "unknown") { // We only want to do this in IE
			this.debug("Removing Flash functions hooks (this should only run in IE and should prevent memory leaks)");
			for (var key in movieElement) {
				try {
					if (typeof(movieElement[key]) === "function") {
						movieElement[key] = null;
					}
				} catch (ex) {
				}
			}
		}
	} catch (ex1) {
	
	}

	// Fix Flashes own cleanup code so if the SWFMovie was removed from the page
	// it doesn't display errors.
	window["__flash__removeCallback"] = function (instance, name) {
		try {
			if (instance) {
				instance[name] = null;
			}
		} catch (flashEx) {
		
		}
	};

};


/* This is a chance to do something before the browse window opens */
SWFUpload.prototype.fileDialogStart = function () {
	this.queueEvent("file_dialog_start_handler");
};


/* Called when a file is successfully added to the queue. */
SWFUpload.prototype.fileQueued = function (file) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("file_queued_handler", file);
};


/* Handle errors that occur when an attempt to queue a file fails. */
SWFUpload.prototype.fileQueueError = function (file, errorCode, message) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("file_queue_error_handler", [file, errorCode, message]);
};

/* Called after the file dialog has closed and the selected files have been queued.
	You could call startUpload here if you want the queued files to begin uploading immediately. */
SWFUpload.prototype.fileDialogComplete = function (numFilesSelected, numFilesQueued, numFilesInQueue) {
	this.queueEvent("file_dialog_complete_handler", [numFilesSelected, numFilesQueued, numFilesInQueue]);
};

SWFUpload.prototype.uploadStart = function (file) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("return_upload_start_handler", file);
};

SWFUpload.prototype.returnUploadStart = function (file) {
	var returnValue;
	if (typeof this.settings.upload_start_handler === "function") {
		file = this.unescapeFilePostParams(file);
		returnValue = this.settings.upload_start_handler.call(this, file);
	} else if (this.settings.upload_start_handler != undefined) {
		throw "upload_start_handler must be a function";
	}

	// Convert undefined to true so if nothing is returned from the upload_start_handler it is
	// interpretted as 'true'.
	if (returnValue === undefined) {
		returnValue = true;
	}
	
	returnValue = !!returnValue;
	
	this.callFlash("ReturnUploadStart", [returnValue]);
};



SWFUpload.prototype.uploadProgress = function (file, bytesComplete, bytesTotal) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("upload_progress_handler", [file, bytesComplete, bytesTotal]);
};

SWFUpload.prototype.uploadError = function (file, errorCode, message) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("upload_error_handler", [file, errorCode, message]);
};

SWFUpload.prototype.uploadSuccess = function (file, serverData, responseReceived) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("upload_success_handler", [file, serverData, responseReceived]);
};

SWFUpload.prototype.uploadComplete = function (file) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("upload_complete_handler", file);
};

/* Called by SWFUpload JavaScript and Flash functions when debug is enabled. By default it writes messages to the
   internal debug console.  You can override this event and have messages written where you want. */
SWFUpload.prototype.debug = function (message) {
	this.queueEvent("debug_handler", message);
};


/* **********************************
	Debug Console
	The debug console is a self contained, in page location
	for debug message to be sent.  The Debug Console adds
	itself to the body if necessary.

	The console is automatically scrolled as messages appear.
	
	If you are using your own debug handler or when you deploy to production and
	have debug disabled you can remove these functions to reduce the file size
	and complexity.
********************************** */
   
// Private: debugMessage is the default debug_handler.  If you want to print debug messages
// call the debug() function.  When overriding the function your own function should
// check to see if the debug setting is true before outputting debug information.
SWFUpload.prototype.debugMessage = function (message) {
	if (this.settings.debug) {
		var exceptionMessage, exceptionValues = [];

		// Check for an exception object and print it nicely
		if (typeof message === "object" && typeof message.name === "string" && typeof message.message === "string") {
			for (var key in message) {
				if (message.hasOwnProperty(key)) {
					exceptionValues.push(key + ": " + message[key]);
				}
			}
			exceptionMessage = exceptionValues.join("\n") || "";
			exceptionValues = exceptionMessage.split("\n");
			exceptionMessage = "EXCEPTION: " + exceptionValues.join("\nEXCEPTION: ");
			SWFUpload.Console.writeLine(exceptionMessage);
		} else {
			SWFUpload.Console.writeLine(message);
		}
	}
};

SWFUpload.Console = {};
SWFUpload.Console.writeLine = function (message) {
	var console, documentForm;

	try {
		console = document.getElementById("SWFUpload_Console");

		if (!console) {
			documentForm = document.createElement("form");
			document.getElementsByTagName("body")[0].appendChild(documentForm);

			console = document.createElement("textarea");
			console.id = "SWFUpload_Console";
			console.style.fontFamily = "monospace";
			console.setAttribute("wrap", "off");
			console.wrap = "off";
			console.style.overflow = "auto";
			console.style.width = "700px";
			console.style.height = "350px";
			console.style.margin = "5px";
			documentForm.appendChild(console);
		}

		console.value += message + "\n";

		console.scrollTop = console.scrollHeight - console.clientHeight;
	} catch (ex) {
		alert("Exception: " + ex.name + " Message: " + ex.message);
	}
};
/*
Copyright 2008-2009 University of Toronto
Copyright 2008-2009 University of California, Berkeley
Copyright 2010-2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {    
    
    var animateDisplay = function (elm, animation, defaultAnimation) {
        animation = (animation) ? animation : defaultAnimation;
        elm.animate(animation.params, animation.duration, animation.callback);
    };
    
    var animateProgress = function (elm, width, speed) {
        // de-queue any left over animations
        elm.queue("fx", []); 
        
        elm.animate({ 
            width: width,
            queue: false
        }, 
        speed);
    };
    
    var showProgress = function (that, animation) {
        if (animation === false) {
            that.displayElement.show();
        } else {
            animateDisplay(that.displayElement, animation, that.options.showAnimation);
        }
    };
    
    var hideProgress = function (that, delay, animation) {
        
        delay = (delay === null || isNaN(delay)) ? that.options.delay : delay;
        
        if (delay) {
            // use a setTimeout to delay the hide for n millies, note use of recursion
            var timeOut = setTimeout(function () {
                hideProgress(that, 0, animation);
            }, delay);
        } else {
            if (animation === false) {
                that.displayElement.hide();
            } else {
                animateDisplay(that.displayElement, animation, that.options.hideAnimation);
            }
        }   
    };
    
    var updateWidth = function (that, newWidth, dontAnimate) {
        dontAnimate  = dontAnimate || false;
        var currWidth = that.indicator.width();
        var direction = that.options.animate;
        if ((newWidth > currWidth) && (direction === "both" || direction === "forward") && !dontAnimate) {
            animateProgress(that.indicator, newWidth, that.options.speed);
        } else if ((newWidth < currWidth) && (direction === "both" || direction === "backward") && !dontAnimate) {
            animateProgress(that.indicator, newWidth, that.options.speed);
        } else {
            that.indicator.width(newWidth);
        }
    };
         
    var percentToPixels = function (that, percent) {
        // progress does not support percents over 100, also all numbers are rounded to integers
        return Math.round((Math.min(percent, 100) * that.progressBar.innerWidth()) / 100);
    };
    
    var refreshRelativeWidth = function (that)  {
        var pixels = Math.max(percentToPixels(that, parseFloat(that.storedPercent)), that.options.minWidth);
        updateWidth(that, pixels, true);
    };
        
    var initARIA = function (ariaElement, ariaBusyText) {
        ariaElement.attr("role", "progressbar");
        ariaElement.attr("aria-valuemin", "0");
        ariaElement.attr("aria-valuemax", "100");
        ariaElement.attr("aria-valuenow", "0");
        //Empty value for ariaBusyText will default to aria-valuenow.
        if (ariaBusyText) {
            ariaElement.attr("aria-valuetext", "");
        }
        ariaElement.attr("aria-busy", "false");
    };
    
    var updateARIA = function (that, percent) {
        var str = that.options.strings;
        var busy = percent < 100 && percent > 0;
        that.ariaElement.attr("aria-busy", busy);
        that.ariaElement.attr("aria-valuenow", percent);   
        //Empty value for ariaBusyText will default to aria-valuenow.
        if (str.ariaBusyText) {
            if (busy) {
                var busyString = fluid.stringTemplate(str.ariaBusyText, {percentComplete : percent});           
                that.ariaElement.attr("aria-valuetext", busyString);
            } else if (percent === 100) {
                // FLUID-2936: JAWS doesn't currently read the "Progress is complete" message to the user, even though we set it here.
                that.ariaElement.attr("aria-valuetext", str.ariaDoneText);
            }
        }
    };
        
    var updateText = function (label, value) {
        label.html(value);
    };
    
    var repositionIndicator = function (that) {
        that.indicator.css("top", that.progressBar.position().top)
            .css("left", 0)
            .height(that.progressBar.height());
        refreshRelativeWidth(that);
    };
        
    var updateProgress = function (that, percent, labelText, animationForShow) {
        
        // show progress before updating, jQuery will handle the case if the object is already displayed
        showProgress(that, animationForShow);
            
        // do not update if the value of percent is falsey
        if (percent !== null) {
            that.storedPercent = percent;
        
            var pixels = Math.max(percentToPixels(that, parseFloat(percent)), that.options.minWidth);   
            updateWidth(that, pixels);
        }
        
        if (labelText !== null) {
            updateText(that.label, labelText);
        }
        
        // update ARIA
        if (that.ariaElement) {
            updateARIA(that, percent);
        }
    };
        
    var setupProgress = function (that) {
        that.displayElement = that.locate("displayElement");

        // hide file progress in case it is showing
        if (that.options.initiallyHidden) {
            that.displayElement.hide();
        }

        that.progressBar = that.locate("progressBar");
        that.label = that.locate("label");
        that.indicator = that.locate("indicator");
        that.ariaElement = that.locate("ariaElement");
        
        that.indicator.width(that.options.minWidth);

        that.storedPercent = 0;
                
        // initialize ARIA
        if (that.ariaElement) {
            initARIA(that.ariaElement, that.options.strings.ariaBusyText);
        }
        
        // afterProgressHidden:  
        // Registering listener with the callback provided by the user and reinitializing
        // the event trigger function. 
        // Note: callback depricated as of 1.5, use afterProgressHidden event
        if (that.options.hideAnimation.callback) {
            that.events.afterProgressHidden.addListener(that.options.hideAnimation.callback);           
        }
        
        // triggers the afterProgressHidden event    
        // Note: callback depricated as of 1.5, use afterProgressHidden event
        that.options.hideAnimation.callback = that.events.afterProgressHidden.fire;

        
        // onProgressBegin:
        // Registering listener with the callback provided by the user and reinitializing
        // the event trigger function.  
        // Note: callback depricated as of 1.5, use onProgressBegin event
        if (that.options.showAnimation.callback) {
            that.events.onProgressBegin.addListener(that.options.showAnimation.callback);                      
        } 
            
        // triggers the onProgressBegin event
        // Note: callback depricated as of 1.5, use onProgressBegin event
        that.options.showAnimation.callback = that.events.onProgressBegin.fire;
    };
           
    /**
    * Instantiates a new Progress component.
    * 
    * @param {jQuery|Selector|Element} container the DOM element in which the Uploader lives
    * @param {Object} options configuration options for the component.
    */
    fluid.progress = function (container, options) {
        var that = fluid.initView("fluid.progress", container, options);
        setupProgress(that);
        
        /**
         * Shows the progress bar if is currently hidden.
         * 
         * @param {Object} animation a custom animation used when showing the progress bar
         */
        that.show = function (animation) {
            showProgress(that, animation);
        };
        
        /**
         * Hides the progress bar if it is visible.
         * 
         * @param {Number} delay the amount of time to wait before hiding
         * @param {Object} animation a custom animation used when hiding the progress bar
         */
        that.hide = function (delay, animation) {
            hideProgress(that, delay, animation);
        };
        
        /**
         * Updates the state of the progress bar.
         * This will automatically show the progress bar if it is currently hidden.
         * Percentage is specified as a decimal value, but will be automatically converted if needed.
         * 
         * 
         * @param {Number|String} percentage the current percentage, specified as a "float-ish" value 
         * @param {String} labelValue the value to set for the label; this can be an HTML string
         * @param {Object} animationForShow the animation to use when showing the progress bar if it is hidden
         */
        that.update = function (percentage, labelValue, animationForShow) {
            updateProgress(that, percentage, labelValue, animationForShow);
        };
        
        that.refreshView = function () {
            repositionIndicator(that);
        };
                        
        return that;  
    };
      
    fluid.defaults("fluid.progress", {
        gradeNames: "fluid.viewComponent",
        selectors: {
            displayElement: ".flc-progress", // required, the element that gets displayed when progress is displayed, could be the indicator or bar or some larger outer wrapper as in an overlay effect
            progressBar: ".flc-progress-bar", //required
            indicator: ".flc-progress-indicator", //required
            label: ".flc-progress-label", //optional
            ariaElement: ".flc-progress-bar" // usually required, except in cases where there are more than one progressor for the same data such as a total and a sub-total
        },
        
        strings: {
            //Empty value for ariaBusyText will default to aria-valuenow.
            ariaBusyText: "Progress is %percentComplete percent complete",
            ariaDoneText: "Progress is complete."
        },
        
        // progress display and hide animations, use the jQuery animation primatives, set to false to use no animation
        // animations must be symetrical (if you hide with width, you'd better show with width) or you get odd effects
        // see jQuery docs about animations to customize
        showAnimation: {
            params: {
                opacity: "show"
            }, 
            duration: "slow",
            //callback has been deprecated and will be removed as of 1.5, instead use onProgressBegin event 
            callback: null 
        }, // equivalent of $().fadeIn("slow")
        
        hideAnimation: {
            params: {
                opacity: "hide"
            }, 
            duration: "slow", 
            //callback has been deprecated and will be removed as of 1.5, instead use afterProgressHidden event 
            callback: null
        }, // equivalent of $().fadeOut("slow")
        
        events: {            
            onProgressBegin: null,
            afterProgressHidden: null            
        },

        minWidth: 5, // 0 length indicators can look broken if there is a long pause between updates
        delay: 0, // the amount to delay the fade out of the progress
        speed: 200, // default speed for animations, pretty fast
        animate: "forward", // suppport "forward", "backward", and "both", any other value is no animation either way
        initiallyHidden: true, // supports progress indicators which may always be present
        updatePosition: false
    });
    
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Toronto
Copyright 2010-2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global window, fluid_1_4:true, jQuery, swfobject*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    fluid.registerNamespace("fluid.browser");
    
    fluid.browser.binaryXHR = function () {
        var canSendBinary = window.FormData || 
            (window.XMLHttpRequest && 
                window.XMLHttpRequest.prototype &&
                window.XMLHttpRequest.prototype.sendAsBinary);
        return canSendBinary ? fluid.typeTag("fluid.browser.supportsBinaryXHR") : undefined;
    };
    
    fluid.browser.formData  = function () {
        return window.FormData ? fluid.typeTag("fluid.browser.supportsFormData") : undefined;
    };
    
    fluid.browser.flash = function () {
        var hasModernFlash = (typeof(swfobject) !== "undefined") && (swfobject.getFlashPlayerVersion().major > 8);
        return hasModernFlash ? fluid.typeTag("fluid.browser.supportsFlash") : undefined;
    };
    
    fluid.progressiveChecker = function (options) {
        var that = fluid.initLittleComponent("fluid.progressiveChecker", options);
        return fluid.typeTag(fluid.find(that.options.checks, function(check) {
            if (check.feature) {
                return check.contextName;
            }}, that.options.defaultContextName
        ));
    };
    
    fluid.defaults("fluid.progressiveChecker", {
        gradeNames: "fluid.typeFount",
        checks: [], // [{"feature": "{IoC Expression}", "contextName": "context.name"}]
        defaultContextName: undefined
    });
    
    fluid.progressiveCheckerForComponent = function (options) {
        var that = fluid.initLittleComponent("fluid.progressiveCheckerForComponent", options);
        var defaults = fluid.defaults(that.options.componentName);
        return fluid.progressiveChecker(fluid.expandOptions(defaults.progressiveCheckerOptions, that));  
    };

    fluid.defaults("fluid.progressiveCheckerForComponent", {
        gradeNames: "fluid.typeFount"
    });
    
    /**********************************************************
     * This code runs immediately upon inclusion of this file *
     **********************************************************/
    
    // Use JavaScript to hide any markup that is specifically in place for cases when JavaScript is off.
    // Note: the use of fl-ProgEnhance-basic is deprecated, and replaced by fl-progEnhance-basic.
    // It is included here for backward compatibility only.
    $("head").append("<style type='text/css'>.fl-progEnhance-basic, .fl-ProgEnhance-basic { display: none; } .fl-progEnhance-enhanced, .fl-ProgEnhance-enhanced { display: block; }</style>");
    
    // Browser feature detection--adds corresponding type tags to the static environment,
    // which can be used to define appropriate demands blocks for components using the IoC system.
    var features = {
        supportsBinaryXHR: fluid.browser.binaryXHR(),
        supportsFormData: fluid.browser.formData(),
        supportsFlash: fluid.browser.flash()
    };
    fluid.merge(null, fluid.staticEnvironment, features);
    
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Toronto
Copyright 2008-2009 University of California, Berkeley
Copyright 2010-2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global window, fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

/************
 * Uploader *
 ************/

(function ($, fluid) {
    
    fluid.setLogging(true);
    
    var fileOrFiles = function (that, numFiles) {
        return (numFiles === 1) ? that.options.strings.progress.singleFile : 
            that.options.strings.progress.pluralFiles;
    };
    
    var enableElement = function (that, elm) {
        elm.removeAttr("disabled");
        elm.removeClass(that.options.styles.dim);
    };
    
    var disableElement = function (that, elm) {
        elm.attr("disabled", "disabled");
        elm.addClass(that.options.styles.dim);
    };
    
    var showElement = function (that, elm) {
        elm.removeClass(that.options.styles.hidden);
    };
     
    var hideElement = function (that, elm) {
        elm.addClass(that.options.styles.hidden);
    };
    
    var setTotalProgressStyle = function (that, didError) {
        didError = didError || false;
        var indicator = that.totalProgress.indicator;
        indicator.toggleClass(that.options.styles.totalProgress, !didError);
        indicator.toggleClass(that.options.styles.totalProgressError, didError);
    };
    
    var setStateEmpty = function (that) {
        disableElement(that, that.locate("uploadButton"));
        
        // If the queue is totally empty, treat it specially.
        if (that.queue.files.length === 0) { 
            that.locate("browseButtonText").text(that.options.strings.buttons.browse);
            that.locate("browseButton").removeClass(that.options.styles.browseButton);
            showElement(that, that.locate("instructions"));
        }
    };
    
    var setStateDone = function (that) {
        disableElement(that, that.locate("uploadButton"));
        enableElement(that, that.locate("browseButton"));
        that.strategy.local.enableBrowseButton();
        hideElement(that, that.locate("pauseButton"));
        showElement(that, that.locate("uploadButton"));
    };

    var setStateLoaded = function (that) {
        that.locate("browseButtonText").text(that.options.strings.buttons.addMore);
        that.locate("browseButton").addClass(that.options.styles.browseButton);
        hideElement(that, that.locate("pauseButton"));
        showElement(that, that.locate("uploadButton"));
        enableElement(that, that.locate("uploadButton"));
        enableElement(that, that.locate("browseButton"));
        that.strategy.local.enableBrowseButton();
        hideElement(that, that.locate("instructions"));
        that.totalProgress.hide();
    };
    
    var setStateUploading = function (that) {
        that.totalProgress.hide(false, false);
        setTotalProgressStyle(that);
        hideElement(that, that.locate("uploadButton"));
        disableElement(that, that.locate("browseButton"));
        that.strategy.local.disableBrowseButton();
        enableElement(that, that.locate("pauseButton"));
        showElement(that, that.locate("pauseButton"));
        that.locate(that.options.focusWithEvent.afterUploadStart).focus();
    };    
    
    var renderUploadTotalMessage = function (that) {
        // Render template for the total file status message.
        var numReadyFiles = that.queue.getReadyFiles().length;
        var bytesReadyFiles = that.queue.sizeOfReadyFiles();
        var fileLabelStr = fileOrFiles(that, numReadyFiles);
                                                   
        var totalStateStr = fluid.stringTemplate(that.options.strings.progress.toUploadLabel, {
            fileCount: numReadyFiles, 
            fileLabel: fileLabelStr, 
            totalBytes: fluid.uploader.formatFileSize(bytesReadyFiles)
        });
        that.locate("totalFileStatusText").html(totalStateStr);
    };
        
    var updateTotalProgress = function (that) {
        var batch = that.queue.currentBatch;
        var totalPercent = fluid.uploader.derivePercent(batch.totalBytesUploaded, batch.totalBytes);
        var numFilesInBatch = batch.files.length;
        var fileLabelStr = fileOrFiles(that, numFilesInBatch);
        
        var totalProgressStr = fluid.stringTemplate(that.options.strings.progress.totalProgressLabel, {
            curFileN: batch.fileIdx, 
            totalFilesN: numFilesInBatch, 
            fileLabel: fileLabelStr,
            currBytes: fluid.uploader.formatFileSize(batch.totalBytesUploaded), 
            totalBytes: fluid.uploader.formatFileSize(batch.totalBytes)
        });  
        that.totalProgress.update(totalPercent, totalProgressStr);
    };
    
    var updateTotalAtCompletion = function (that) {
        var numErroredFiles = that.queue.getErroredFiles().length;
        var numTotalFiles = that.queue.files.length;
        var fileLabelStr = fileOrFiles(that, numTotalFiles);
        
        var errorStr = "";
        
        // if there are errors then change the total progress bar
        // and set up the errorStr so that we can use it in the totalProgressStr
        if (numErroredFiles > 0) {
            var errorLabelString = (numErroredFiles === 1) ? that.options.strings.progress.singleError : 
                                                             that.options.strings.progress.pluralErrors;
            setTotalProgressStyle(that, true);
            errorStr = fluid.stringTemplate(that.options.strings.progress.numberOfErrors, {
                errorsN: numErroredFiles,
                errorLabel: errorLabelString
            });
        }
        
        var totalProgressStr = fluid.stringTemplate(that.options.strings.progress.completedLabel, {
            curFileN: that.queue.getUploadedFiles().length, 
            totalFilesN: numTotalFiles,
            errorString: errorStr,
            fileLabel: fileLabelStr,
            totalCurrBytes: fluid.uploader.formatFileSize(that.queue.sizeOfUploadedFiles())
        });
        
        that.totalProgress.update(100, totalProgressStr);
    };

    /*
     * Summarizes the status of all the files in the file queue.  
     */
    var updateQueueSummaryText = function (that) {
        var fileQueueTable = that.locate("fileQueue");
        
        if (that.queue.files.length === 0) {
            fileQueueTable.attr("summary", that.options.strings.queue.emptyQueue);
        } else {
            var queueSummary = fluid.stringTemplate(that.options.strings.queue.queueSummary, {
                totalUploaded: that.queue.getUploadedFiles().length, 
                totalInUploadQueue: that.queue.files.length - that.queue.getUploadedFiles().length
            });        
            
            fileQueueTable.attr("summary", queueSummary);
        }
    };
    
    var bindDOMEvents = function (that) {
        that.locate("uploadButton").click(function () {
            that.start();
        });

        that.locate("pauseButton").click(function () {
            that.stop();
        });
    };

    var updateStateAfterFileDialog = function (that) {
        if (that.queue.getReadyFiles().length > 0) {
            setStateLoaded(that);
            renderUploadTotalMessage(that);
            that.locate(that.options.focusWithEvent.afterFileDialog).focus();
            updateQueueSummaryText(that);
        }
    };
    
    var updateStateAfterFileRemoval = function (that) {
        if (that.queue.getReadyFiles().length === 0) {
            setStateEmpty(that);
        }
        renderUploadTotalMessage(that);
        updateQueueSummaryText(that);
    };
    
    var updateStateAfterCompletion = function (that) {
        if (that.queue.getReadyFiles().length === 0) {
            setStateDone(that);
        } else {
            setStateLoaded(that);
        }
        updateTotalAtCompletion(that);
        updateQueueSummaryText(that);
    }; 
    
    var bindEvents = function (that) {       
        that.events.afterFileDialog.addListener(function () {
            updateStateAfterFileDialog(that);
        });
        
        that.events.afterFileQueued.addListener(function (file) {
            that.queue.addFile(file); 
        });
        
        that.events.onFileRemoved.addListener(function (file) {
            that.removeFile(file);
        });
        
        that.events.afterFileRemoved.addListener(function () {
            updateStateAfterFileRemoval(that);
        });
        
        that.events.onUploadStart.addListener(function () {
            setStateUploading(that);
        });
        
        that.events.onUploadStop.addListener(function () {
            that.locate(that.options.focusWithEvent.onUploadStop).focus();
        });
        
        that.events.onFileStart.addListener(function (file) {
            file.filestatus = fluid.uploader.fileStatusConstants.IN_PROGRESS;
            that.queue.startFile();
        });
        
        that.events.onFileProgress.addListener(function (file, currentBytes, totalBytes) {
            that.queue.updateBatchStatus(currentBytes);
            updateTotalProgress(that); 
        });
        
        that.events.onFileComplete.addListener(function (file) {
            that.queue.finishFile(file);
            that.events.afterFileComplete.fire(file); 
            
            if (that.queue.shouldUploadNextFile()) {
                that.strategy.remote.uploadNextFile();
            } else {
                that.events.afterUploadComplete.fire(that.queue.currentBatch.files);
                that.queue.clearCurrentBatch();
            }
        });
        
        that.events.onFileSuccess.addListener(function (file) {
            file.filestatus = fluid.uploader.fileStatusConstants.COMPLETE;
            if (that.queue.currentBatch.bytesUploadedForFile === 0) {
                that.queue.currentBatch.totalBytesUploaded += file.size;
            }
            
            updateTotalProgress(that); 
        });
        
        that.events.onFileError.addListener(function (file, error) {
            if (error === fluid.uploader.errorConstants.UPLOAD_STOPPED) {
                file.filestatus = fluid.uploader.fileStatusConstants.CANCELLED;
                return;
            } else {
                file.filestatus = fluid.uploader.fileStatusConstants.ERROR;
                if (that.queue.isUploading) {
                    that.queue.currentBatch.totalBytesUploaded += file.size;
                    that.queue.currentBatch.numFilesErrored++;
                }
            }
        });

        that.events.afterUploadComplete.addListener(function () {
            that.queue.isUploading = false;
            updateStateAfterCompletion(that);
        });
    };
    
    var setupUploader = function (that) {
        that.demo = fluid.typeTag(that.options.demo? "fluid.uploader.demo" : "fluid.uploader.live");
        
        fluid.initDependents(that);                 

        // Upload button should not be enabled until there are files to upload
        disableElement(that, that.locate("uploadButton"));
        bindDOMEvents(that);
        bindEvents(that);
        
        updateQueueSummaryText(that);
        that.statusUpdater();
        
        // Uploader uses application-style keyboard conventions, so give it a suitable role.
        that.container.attr("role", "application");
    };
    
    /**
     * Instantiates a new Uploader component.
     * 
     * @param {Object} container the DOM element in which the Uploader lives
     * @param {Object} options configuration options for the component.
     */
    fluid.uploader = function (container, uploaderOptions) {
      // Do not try to expand uploaderOptions here or else our subcomponents will end up
      // nested inside uploaderImpl
        var that = fluid.initView("fluid.uploader", container);
        that.uploaderOptions = uploaderOptions;
        fluid.initDependents(that);
        return that.uploaderImpl;
    };
    
    fluid.uploaderImpl = function () {
        fluid.fail("Error creating uploader component - please make sure that a progressiveCheckerForComponent for \"fluid.uploader\" is registered either in the "
          + "static environment or else is visible in the current component tree");
    };
    
    fluid.defaults("fluid.uploader", {
        gradeNames: ["fluid.viewComponent"],
        components: {
            uploaderContext: {
                type: "fluid.progressiveCheckerForComponent",
                options: {componentName: "fluid.uploader"}
            },
            uploaderImpl: {
                type: "fluid.uploaderImpl",
                container: "{uploader}.container",
                options: "{uploader}.uploaderOptions"
            }
        },
        progressiveCheckerOptions: {
            checks: [
                {
                    feature: "{fluid.browser.supportsBinaryXHR}",
                    contextName: "fluid.uploader.html5"
                },
                {
                    feature: "{fluid.browser.supportsFlash}",
                    contextName: "fluid.uploader.swfUpload"
                }
            ],
            defaultContextName: "fluid.uploader.singleFile"
        }
    });
    
    // Ensure that for all uploaders created via IoC, we bypass the wrapper and directly create the concrete uploader
    fluid.alias("fluid.uploader", "fluid.uploaderImpl");
    
    // This method has been deprecated as of Infusion 1.3. Use fluid.uploader() instead, 
    // which now includes built-in support for progressive enhancement.
    fluid.progressiveEnhanceableUploader = function (container, enhanceable, options) {
        return fluid.uploader(container, options);
    };

    /**
     * Multiple file Uploader implementation. Use fluid.uploader() for IoC-resolved, progressively
     * enhanceable Uploader, or call this directly if you don't want support for old-style single uploads
     *
     * @param {jQueryable} container the component's container
     * @param {Object} options configuration options
     */
    fluid.uploader.multiFileUploader = function (container, options) {
        var that = fluid.initView("fluid.uploader.multiFileUploader", container, options);
        that.queue = fluid.uploader.fileQueue();
        
        /**
         * Opens the native OS browse file dialog.
         */
        that.browse = function () {
            if (!that.queue.isUploading) {
                that.strategy.local.browse();
            }
        };
        
        /**
         * Removes the specified file from the upload queue.
         * 
         * @param {File} file the file to remove
         */
        that.removeFile = function (file) {
            that.queue.removeFile(file);
            that.strategy.local.removeFile(file);
            that.events.afterFileRemoved.fire(file);
        };
        
        /**
         * Starts uploading all queued files to the server.
         */
        that.start = function () {
            that.queue.start();
            that.events.onUploadStart.fire(that.queue.currentBatch.files); 
            that.strategy.remote.uploadNextFile();
        };
        
        /**
         * Cancels an in-progress upload.
         */
        that.stop = function () {
            that.events.onUploadStop.fire();
            that.strategy.remote.stop();
        };
        
        setupUploader(that);
        return that;  
    };
    
    fluid.defaults("fluid.uploader.multiFileUploader", {
        gradeNames: "fluid.viewComponent",
        components: {
            strategy: {
                type: "fluid.uploader.progressiveStrategy"
            },
            
            fileQueueView: {
                type: "fluid.uploader.fileQueueView",
                options: {
                    model: "{multiFileUploader}.queue.files",
                    uploaderContainer: "{multiFileUploader}.container"
                }
            },
            
            totalProgress: {
                type: "fluid.uploader.totalProgressBar",
                options: {
                    selectors: {
                        progressBar: ".flc-uploader-queue-footer",
                        displayElement: ".flc-uploader-total-progress", 
                        label: ".flc-uploader-total-progress-text",
                        indicator: ".flc-uploader-total-progress",
                        ariaElement: ".flc-uploader-total-progress"
                    }
                }
            }
        },
        
        invokers: {
            statusUpdater: "fluid.uploader.ariaLiveRegionUpdater"
        },
        
        queueSettings: {
            uploadURL: "",
            postParams: {},
            fileSizeLimit: "20480",
            fileTypes: "*",
            fileTypesDescription: null,
            fileUploadLimit: 0,
            fileQueueLimit: 0
        },

        demo: false,
        
        selectors: {
            fileQueue: ".flc-uploader-queue",
            browseButton: ".flc-uploader-button-browse",
            browseButtonText: ".flc-uploader-button-browse-text",
            uploadButton: ".flc-uploader-button-upload",
            pauseButton: ".flc-uploader-button-pause",
            totalFileStatusText: ".flc-uploader-total-progress-text",
            instructions: ".flc-uploader-browse-instructions",
            statusRegion: ".flc-uploader-status-region"
        },

        // Specifies a selector name to move keyboard focus to when a particular event fires.
        // Event listeners must already be implemented to use these options.
        focusWithEvent: {
            afterFileDialog: "uploadButton",
            afterUploadStart: "pauseButton",
            onUploadStop: "uploadButton"
        },
        
        styles: {
            disabled: "fl-uploader-disabled",
            hidden: "fl-uploader-hidden",
            dim: "fl-uploader-dim",
            totalProgress: "fl-uploader-total-progress-okay",
            totalProgressError: "fl-uploader-total-progress-errored",
            browseButton: "fl-uploader-browseMore"
        },
        
        events: {
            afterReady: null,
            onFileDialog: null,
            afterFileQueued: null,
            onFileRemoved: null,
            afterFileRemoved: null,
            onQueueError: null,
            afterFileDialog: null,
            onUploadStart: null,
            onUploadStop: null,
            onFileStart: null,
            onFileProgress: null,
            onFileError: null,
            onFileSuccess: null,
            onFileComplete: null,
            afterFileComplete: null,
            afterUploadComplete: null
        },

        strings: {
            progress: {
                toUploadLabel: "To upload: %fileCount %fileLabel (%totalBytes)", 
                totalProgressLabel: "Uploading: %curFileN of %totalFilesN %fileLabel (%currBytes of %totalBytes)", 
                completedLabel: "Uploaded: %curFileN of %totalFilesN %fileLabel (%totalCurrBytes)%errorString",
                numberOfErrors: ", %errorsN %errorLabel",
                singleFile: "file",
                pluralFiles: "files",
                singleError: "error",
                pluralErrors: "errors"
            },
            buttons: {
                browse: "Browse Files",
                addMore: "Add More",
                stopUpload: "Stop Upload",
                cancelRemaning: "Cancel remaining Uploads",
                resumeUpload: "Resume Upload"
            },
            queue: {
                emptyQueue: "File list: No files waiting to be uploaded.",
                queueSummary: "File list:  %totalUploaded files uploaded, %totalInUploadQueue file waiting to be uploaded." 
            }
        },
        
        mergePolicy: {
            "fileQueueView.options.model": "preserve"
        }
    });
    
    fluid.demands("fluid.uploader.totalProgressBar", "fluid.uploader.multiFileUploader", {
        funcName: "fluid.progress",
        container: "{multiFileUploader}.container"
    });
    
    /** Demands blocks for binding to fileQueueView **/
            
    fluid.demands("fluid.uploader.fileQueueView", "fluid.uploader.multiFileUploader", {
        container: "{multiFileUploader}.dom.fileQueue",
        options: {
            events: {
                onFileRemoved: "{multiFileUploader}.events.onFileRemoved"
            }
        }
    });
        
    fluid.demands("fluid.uploader.fileQueueView.eventBinder", [
        "fluid.uploader.multiFileUploader",
        "fluid.uploader.fileQueueView"
    ], {
        options: {
            listeners: {
                "{multiFileUploader}.events.afterFileQueued": "{fileQueueView}.addFile",
                "{multiFileUploader}.events.onUploadStart": "{fileQueueView}.prepareForUpload",
                "{multiFileUploader}.events.onFileStart": "{fileQueueView}.showFileProgress",
                "{multiFileUploader}.events.onFileProgress": "{fileQueueView}.updateFileProgress",
                "{multiFileUploader}.events.onFileSuccess": "{fileQueueView}.markFileComplete",
                "{multiFileUploader}.events.onFileError": "{fileQueueView}.showErrorForFile",
                "{multiFileUploader}.events.afterFileComplete": "{fileQueueView}.hideFileProgress",
                "{multiFileUploader}.events.afterUploadComplete": "{fileQueueView}.refreshAfterUpload"
            }
        }
    });
        
   /**
    * Pretty prints a file's size, converting from bytes to kilobytes or megabytes.
    * 
    * @param {Number} bytes the files size, specified as in number bytes.
    */
    fluid.uploader.formatFileSize = function (bytes) {
        if (typeof (bytes) === "number") {
            if (bytes === 0) {
                return "0.0 KB";
            } else if (bytes > 0) {
                if (bytes < 1048576) {
                    return (Math.ceil(bytes / 1024 * 10) / 10).toFixed(1) + " KB";
                } else {
                    return (Math.ceil(bytes / 1048576 * 10) / 10).toFixed(1) + " MB";
                }
            }
        }
        return "";
    };

    fluid.uploader.derivePercent = function (num, total) {
        return Math.round((num * 100) / total);
    };
     
    // TODO: Refactor this to be a general ARIA utility
    fluid.uploader.ariaLiveRegionUpdater = function (statusRegion, totalFileStatusText, events) {
        statusRegion.attr("role", "log");     
        statusRegion.attr("aria-live", "assertive");
        statusRegion.attr("aria-relevant", "text");
        statusRegion.attr("aria-atomic", "true");

        var regionUpdater = function () {
            statusRegion.text(totalFileStatusText.text());
        };

        events.afterFileDialog.addListener(regionUpdater);
        events.afterFileRemoved.addListener(regionUpdater);
        events.afterUploadComplete.addListener(regionUpdater);
    };
    
    fluid.demands("fluid.uploader.ariaLiveRegionUpdater", "fluid.uploader.multiFileUploader", {
        funcName: "fluid.uploader.ariaLiveRegionUpdater",
        args: [
            "{multiFileUploader}.dom.statusRegion",
            "{multiFileUploader}.dom.totalFileStatusText",
            "{multiFileUploader}.events"
        ]
    });

    
    /**************************************************
     * Error constants for the Uploader               *
     * TODO: These are SWFUpload-specific error codes *
     **************************************************/
     
    fluid.uploader.errorConstants = {
        HTTP_ERROR: -200,
        MISSING_UPLOAD_URL: -210,
        IO_ERROR: -220,
        SECURITY_ERROR: -230,
        UPLOAD_LIMIT_EXCEEDED: -240,
        UPLOAD_FAILED: -250,
        SPECIFIED_FILE_ID_NOT_FOUND: -260,
        FILE_VALIDATION_FAILED: -270,
        FILE_CANCELLED: -280,
        UPLOAD_STOPPED: -290
    };
    
    fluid.uploader.fileStatusConstants = {
        QUEUED: -1,
        IN_PROGRESS: -2,
        ERROR: -3,
        COMPLETE: -4,
        CANCELLED: -5
    };


    var toggleVisibility = function (toShow, toHide) {
        // For FLUID-2789: hide() doesn't work in Opera
        if (window.opera) { 
            toShow.show().removeClass("hideUploaderForOpera");
            toHide.show().addClass("hideUploaderForOpera");
        } else {
            toShow.show();
            toHide.hide();
        }
    };

    /**
     * Single file Uploader implementation. Use fluid.uploader() for IoC-resolved, progressively
     * enhanceable Uploader, or call this directly if you only want a standard single file uploader.
     * But why would you want that?
     *
     * @param {jQueryable} container the component's container
     * @param {Object} options configuration options
     */
    fluid.uploader.singleFileUploader = function (container, options) {
        var that = fluid.initView("fluid.uploader.singleFileUploader", container, options);
        // TODO: direct DOM fascism that will fail with multiple uploaders on a single page.
        toggleVisibility($(that.options.selectors.basicUpload), that.container);
        return that;
    };

    fluid.defaults("fluid.uploader.singleFileUploader", {
        gradeNames: "fluid.viewComponent",
        selectors: {
            basicUpload: ".fl-progEnhance-basic"
        }
    });

    fluid.demands("fluid.uploaderImpl", "fluid.uploader.singleFile", {
        funcName: "fluid.uploader.singleFileUploader"
    });
    
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Toronto
Copyright 2008-2009 University of California, Berkeley
Copyright 2010-2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery, SWFUpload*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    fluid.uploader = fluid.uploader || {};
    
    var filterFiles = function (files, filterFn) {
        var filteredFiles = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (filterFn(file) === true) {
                filteredFiles.push(file);
            }
        }
        
        return filteredFiles;
    };
     
    fluid.uploader.fileQueue = function () {
        var that = {};
        that.files = [];
        that.isUploading = false;
        
        /********************
         * Queue Operations *
         ********************/
         
        that.start = function () {
            that.setupCurrentBatch();
            that.isUploading = true;
            that.shouldStop = false;
        };
        
        that.startFile = function () {
            that.currentBatch.fileIdx++;
            that.currentBatch.bytesUploadedForFile = 0;
            that.currentBatch.previousBytesUploadedForFile = 0; 
        };
                
        that.finishFile = function (file) {
            that.currentBatch.numFilesCompleted++;
        };
        
        that.shouldUploadNextFile = function () {
            return !that.shouldStop && 
                that.isUploading && 
                that.currentBatch.numFilesCompleted < that.currentBatch.files.length;
        };
        
        /*****************************
         * File manipulation methods *
         *****************************/
         
        that.addFile = function (file) {
            that.files.push(file);    
        };
        
        that.removeFile = function (file) {
            var idx = $.inArray(file, that.files);
            that.files.splice(idx, 1);        
        };
        
        /**********************
         * Queue Info Methods *
         **********************/
         
        that.totalBytes = function () {
            return fluid.uploader.fileQueue.sizeOfFiles(that.files);
        };

        that.getReadyFiles = function () {
            return filterFiles(that.files, function (file) {
                return (file.filestatus === fluid.uploader.fileStatusConstants.QUEUED || file.filestatus === fluid.uploader.fileStatusConstants.CANCELLED);
            });        
        };
        
        that.getErroredFiles = function () {
            return filterFiles(that.files, function (file) {
                return (file.filestatus === fluid.uploader.fileStatusConstants.ERROR);
            });        
        };
        
        that.sizeOfReadyFiles = function () {
            return fluid.uploader.fileQueue.sizeOfFiles(that.getReadyFiles());
        };
        
        that.getUploadedFiles = function () {
            return filterFiles(that.files, function (file) {
                return (file.filestatus === fluid.uploader.fileStatusConstants.COMPLETE);
            });        
        };

        that.sizeOfUploadedFiles = function () {
            return fluid.uploader.fileQueue.sizeOfFiles(that.getUploadedFiles());
        };

        /*****************
         * Batch Methods *
         *****************/
         
        that.setupCurrentBatch = function () {
            that.clearCurrentBatch();
            that.updateCurrentBatch();
        };
        
        that.clearCurrentBatch = function () {
            that.currentBatch = {
                fileIdx: 0,
                files: [],
                totalBytes: 0,
                numFilesCompleted: 0,
                numFilesErrored: 0,
                bytesUploadedForFile: 0,
                previousBytesUploadedForFile: 0,
                totalBytesUploaded: 0
            };
        };
        
        that.updateCurrentBatch = function () {
            var readyFiles = that.getReadyFiles();
            that.currentBatch.files = readyFiles;
            that.currentBatch.totalBytes = fluid.uploader.fileQueue.sizeOfFiles(readyFiles);
        };
        
        that.updateBatchStatus = function (currentBytes) {
            var byteIncrement = currentBytes - that.currentBatch.previousBytesUploadedForFile;
            that.currentBatch.totalBytesUploaded += byteIncrement;
            that.currentBatch.bytesUploadedForFile += byteIncrement;
            that.currentBatch.previousBytesUploadedForFile = currentBytes;
        };
                
        return that;
    };
    
    fluid.uploader.fileQueue.sizeOfFiles = function (files) {
        var totalBytes = 0;
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            totalBytes += file.size;
        }        
        return totalBytes;
    };
          
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Toronto
Copyright 2008-2009 University of California, Berkeley
Copyright 2008-2009 University of Cambridge
Copyright 2010-2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

/*******************
 * File Queue View *
 *******************/

(function ($, fluid) {
    
    // Real data binding would be nice to replace these two pairs.
    var rowForFile = function (that, file) {
        return that.locate("fileQueue").find("#" + file.id);
    };
    
    var errorRowForFile = function (that, file) {
        return $("#" + file.id + "_error", that.container);
    };
    
    var fileForRow = function (that, row) {
        var files = that.model;
        var i;
        for (i = 0; i < files.length; i++) {
            var file = files[i];
            if (file.id.toString() === row.attr("id")) {
                return file;
            }
        }
        return null;
    };
    
    var progressorForFile = function (that, file) {
        var progressId = file.id + "_progress";
        return that.fileProgressors[progressId];
    };
    
    var startFileProgress = function (that, file) {
        var fileRowElm = rowForFile(that, file);
        that.scroller.scrollTo(fileRowElm);
               
        // update the progressor and make sure that it's in position
        var fileProgressor = progressorForFile(that, file);
        fileProgressor.refreshView();
        fileProgressor.show();
    };
        
    var updateFileProgress = function (that, file, fileBytesComplete, fileTotalBytes) {
        var filePercent = fluid.uploader.derivePercent(fileBytesComplete, fileTotalBytes);
        var filePercentStr = filePercent + "%";    
        progressorForFile(that, file).update(filePercent, filePercentStr);
    };
    
    var hideFileProgress = function (that, file) {
        var fileRowElm = rowForFile(that, file);
        progressorForFile(that, file).hide();
        if (file.filestatus === fluid.uploader.fileStatusConstants.COMPLETE) {
            that.locate("fileIconBtn", fileRowElm).removeClass(that.options.styles.dim);
        } 
    };
    
    var removeFileProgress = function (that, file) {
        var fileProgressor = progressorForFile(that, file);
        if (!fileProgressor) {
            return;
        }
        var rowProgressor = fileProgressor.displayElement;
        rowProgressor.remove();
    };
 
    var animateRowRemoval = function (that, row) {
        row.fadeOut("fast", function () {
            row.remove();  
            that.refreshView();
        });
    };
    
    var removeFileErrorRow = function (that, file) {
        if (file.filestatus === fluid.uploader.fileStatusConstants.ERROR) {
            animateRowRemoval(that, errorRowForFile(that, file));
        }
    };
   
    var removeFileAndRow = function (that, file, row) {
        // Clean up the stuff associated with a file row.
        removeFileProgress(that, file);
        removeFileErrorRow(that, file);
        
        // Remove the file itself.
        that.events.onFileRemoved.fire(file);
        animateRowRemoval(that, row);
    };
    
    var removeFileForRow = function (that, row) {
        var file = fileForRow(that, row);
        if (!file || file.filestatus === fluid.uploader.fileStatusConstants.COMPLETE) {
            return;
        }
        removeFileAndRow(that, file, row);
    };
    
    var removeRowForFile = function (that, file) {
        var row = rowForFile(that, file);
        removeFileAndRow(that, file, row);
    };
    
    var bindHover = function (row, styles) {
        var over = function () {
            if (row.hasClass(styles.ready) && !row.hasClass(styles.uploading)) {
                row.addClass(styles.hover);
            }
        };
        
        var out = function () {
            if (row.hasClass(styles.ready) && !row.hasClass(styles.uploading)) {
                row.removeClass(styles.hover);
            }   
        };
        row.hover(over, out);
    };
    
    var bindDeleteKey = function (that, row) {
        var deleteHandler = function () {
            removeFileForRow(that, row);
        };
       
        fluid.activatable(row, null, {
            additionalBindings: [{
                key: $.ui.keyCode.DELETE, 
                activateHandler: deleteHandler
            }]
        });
    };
    
    var bindRowHandlers = function (that, row) {
        if ($.browser.msie && $.browser.version < 7) {
            bindHover(row, that.options.styles);
        }
        
        that.locate("fileIconBtn", row).click(function () {
            removeFileForRow(that, row);
        });
        
        bindDeleteKey(that, row);
    };
    
    var renderRowFromTemplate = function (that, file) {
        var row = that.rowTemplate.clone(),
            fileName = file.name,
            fileSize = fluid.uploader.formatFileSize(file.size);
        
        row.removeClass(that.options.styles.hiddenTemplate);
        that.locate("fileName", row).text(fileName);
        that.locate("fileSize", row).text(fileSize);
        that.locate("fileIconBtn", row).addClass(that.options.styles.remove);
        row.attr("id", file.id);
        row.addClass(that.options.styles.ready);
        bindRowHandlers(that, row);
        fluid.updateAriaLabel(row, fileName + " " + fileSize);
        return row;    
    };
    
    var createProgressorFromTemplate = function (that, row) {
        // create a new progress bar for the row and position it
        var rowProgressor = that.rowProgressorTemplate.clone();
        var rowId = row.attr("id");
        var progressId = rowId + "_progress";
        rowProgressor.attr("id", progressId);
        rowProgressor.css("top", row.position().top);
        rowProgressor.height(row.height()).width(5);
        that.container.after(rowProgressor);
       
        that.fileProgressors[progressId] = fluid.progress(that.options.uploaderContainer, {
            selectors: {
                progressBar: "#" + rowId,
                displayElement: "#" + progressId,
                label: "#" + progressId + " .fl-uploader-file-progress-text",
                indicator: "#" + progressId
            }
        });
    };
    
    var addFile = function (that, file) {
        var row = renderRowFromTemplate(that, file);
        /* FLUID-2720 - do not hide the row under IE8 */
        if (!($.browser.msie && ($.browser.version >= 8))) {
            row.hide();
        }
        that.container.append(row);
        row.attr("title", that.options.strings.status.remove);
        row.fadeIn("slow");
        createProgressorFromTemplate(that, row);
        that.refreshView();
        that.scroller.scrollTo("100%");
    };
    
    // Toggle keyboard row handlers on and off depending on the uploader state
    var enableRows = function (rows, state) {
        var i;
        for (i = 0; i < rows.length; i++) {
            fluid.enabled(rows[i], state);  
        }               
    };
    
    var prepareForUpload = function (that) {
        var rowButtons = that.locate("fileIconBtn", that.locate("fileRows"));
        rowButtons.attr("disabled", "disabled");
        rowButtons.addClass(that.options.styles.dim);
        enableRows(that.locate("fileRows"), false);
    };

    var refreshAfterUpload = function (that) {
        var rowButtons = that.locate("fileIconBtn", that.locate("fileRows"));
        rowButtons.removeAttr("disabled");
        rowButtons.removeClass(that.options.styles.dim);
        enableRows(that.locate("fileRows"), true);        
    };
        
    var changeRowState = function (that, row, newState) {
        row.removeClass(that.options.styles.ready).removeClass(that.options.styles.error).addClass(newState);
    };
    
    var markRowAsComplete = function (that, file) {
        // update styles and keyboard bindings for the file row
        var row = rowForFile(that, file);
        changeRowState(that, row, that.options.styles.uploaded);
        row.attr("title", that.options.strings.status.success);
        fluid.enabled(row, false);
        
        // update the click event and the styling for the file delete button
        var removeRowBtn = that.locate("fileIconBtn", row);
        removeRowBtn.unbind("click");
        removeRowBtn.removeClass(that.options.styles.remove);
        removeRowBtn.attr("title", that.options.strings.status.success); 
    };
    
    var renderErrorInfoRowFromTemplate = function (that, fileRow, error) {
        // Render the row by cloning the template and binding its id to the file.
        var errorRow = that.errorInfoRowTemplate.clone();
        errorRow.attr("id", fileRow.attr("id") + "_error");
        
        // Look up the error message and render it.
        var errorType = fluid.keyForValue(fluid.uploader.errorConstants, error);
        var errorMsg = that.options.strings.errors[errorType];
        that.locate("errorText", errorRow).text(errorMsg);
        fileRow.after(errorRow);
        that.scroller.scrollTo(errorRow);
    };
    
    var showErrorForFile = function (that, file, error) {
        hideFileProgress(that, file);
        if (file.filestatus === fluid.uploader.fileStatusConstants.ERROR) {
            var fileRowElm = rowForFile(that, file);
            changeRowState(that, fileRowElm, that.options.styles.error);
            renderErrorInfoRowFromTemplate(that, fileRowElm, error);
        }
    };
    
    var addKeyboardNavigation = function (that) {
        fluid.tabbable(that.container);
        that.selectableContext = fluid.selectable(that.container, {
            selectableSelector: that.options.selectors.fileRows,
            onSelect: function (itemToSelect) {
                $(itemToSelect).addClass(that.options.styles.selected);
            },
            onUnselect: function (selectedItem) {
                $(selectedItem).removeClass(that.options.styles.selected);
            }
        });
    };
    
    var prepareTemplateElements = function (that) {
        // Grab our template elements out of the DOM.  
        that.rowTemplate = that.locate("rowTemplate").remove();
        that.errorInfoRowTemplate = that.locate("errorInfoRowTemplate").remove();
        that.errorInfoRowTemplate.removeClass(that.options.styles.hiddenTemplate);
        that.rowProgressorTemplate = that.locate("rowProgressorTemplate", that.options.uploaderContainer).remove();
    };
    
    fluid.registerNamespace("fluid.uploader.fileQueueView");
    
    
    fluid.uploader.fileQueueView.finalInit = function (that) {
        prepareTemplateElements(that);         
        addKeyboardNavigation(that);
    };
    
    /**
     * Creates a new File Queue view.
     * 
     * @param {jQuery|selector} container the file queue's container DOM element
     * @param {fileQueue} queue a file queue model instance
     * @param {Object} options configuration options for the view
     */
    fluid.uploader.fileQueueView.preInit = function (that) {
        that.fileProgressors = {};

        that.addFile = function (file) {
            addFile(that, file);
        };
        
        that.removeFile = function (file) {
            removeRowForFile(that, file);
        };
        
        that.prepareForUpload = function () {
            prepareForUpload(that);
        };
        
        that.refreshAfterUpload = function () {
            refreshAfterUpload(that);
        };

        that.showFileProgress = function (file) {
            startFileProgress(that, file);
        };
        
        that.updateFileProgress = function (file, fileBytesComplete, fileTotalBytes) {
            updateFileProgress(that, file, fileBytesComplete, fileTotalBytes); 
        };
        
        that.markFileComplete = function (file) {
            progressorForFile(that, file).update(100, "100%");
            markRowAsComplete(that, file);
        };
        
        that.showErrorForFile = function (file, error) {
            showErrorForFile(that, file, error);
        };
        
        that.hideFileProgress = function (file) {
            hideFileProgress(that, file);
        };
        
        that.refreshView = function () {
            that.selectableContext.refresh();
            that.scroller.refreshView();
        };
    };
    
    fluid.defaults("fluid.uploader.fileQueueView", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        preInitFunction:   "fluid.uploader.fileQueueView.preInit",
        finalInitFunction: "fluid.uploader.fileQueueView.finalInit",
        
        components: {
            scroller: {
                type: "fluid.scrollableTable"
            },
            
            eventBinder: {
                type: "fluid.uploader.fileQueueView.eventBinder"
            }
        },
        
        selectors: {
            fileRows: ".flc-uploader-file",
            fileName: ".flc-uploader-file-name",
            fileSize: ".flc-uploader-file-size",
            fileIconBtn: ".flc-uploader-file-action",      
            errorText: ".flc-uploader-file-error",
            
            rowTemplate: ".flc-uploader-file-tmplt",
            errorInfoRowTemplate: ".flc-uploader-file-error-tmplt",
            rowProgressorTemplate: ".flc-uploader-file-progressor-tmplt"
        },
        
        styles: {
            hover: "fl-uploader-file-hover",
            selected: "fl-uploader-file-focus",
            ready: "fl-uploader-file-state-ready",
            uploading: "fl-uploader-file-state-uploading",
            uploaded: "fl-uploader-file-state-uploaded",
            error: "fl-uploader-file-state-error",
            remove: "fl-uploader-file-action-remove",
            dim: "fl-uploader-dim",
            hiddenTemplate: "fl-uploader-hidden-templates"
        },
        
        strings: {
            progress: {
                toUploadLabel: "To upload: %fileCount %fileLabel (%totalBytes)", 
                singleFile: "file",
                pluralFiles: "files"
            },
            status: {
                success: "File Uploaded",
                error: "File Upload Error",
                remove: "Press Delete key to remove file"
            }, 
            errors: {
                HTTP_ERROR: "File upload error: a network error occured or the file was rejected (reason unknown).",
                IO_ERROR: "File upload error: a network error occured.",
                UPLOAD_LIMIT_EXCEEDED: "File upload error: you have uploaded as many files as you are allowed during this session",
                UPLOAD_FAILED: "File upload error: the upload failed for an unknown reason.",
                QUEUE_LIMIT_EXCEEDED: "You have as many files in the queue as can be added at one time. Removing files from the queue may allow you to add different files.",
                FILE_EXCEEDS_SIZE_LIMIT: "One or more of the files that you attempted to add to the queue exceeded the limit of %fileSizeLimit.",
                ZERO_BYTE_FILE: "One or more of the files that you attempted to add contained no data.",
                INVALID_FILETYPE: "One or more files were not added to the queue because they were of the wrong type."
            }
        },
        events: {
            onFileRemoved: null
        },
        
        mergePolicy: {
            model: "preserve"
        }
    });
    
    /**
     * EventBinder declaratively binds FileQueueView's methods as listeners to Uploader events using IoC.
     */
    fluid.defaults("fluid.uploader.fileQueueView.eventBinder", {
        gradeNames: ["fluid.eventedComponent", "autoInit"]
    });
    
    fluid.demands("fluid.uploader.fileQueueView.eventBinder", [], {} 
    );
    /**************
     * Scrollable *
     **************/
     
    /**
     * Simple component cover for the jQuery scrollTo plugin. Provides roughly equivalent
     * functionality to Uploader's old Scroller plugin.
     *
     * @param {jQueryable} element the element to make scrollable
     * @param {Object} options for the component
     * @return the scrollable component
     */
    fluid.scrollable = function (element, options) {
        var that = fluid.initView("fluid.scrollable", element, options);
        that.scrollable = that.options.makeScrollableFn(that.container, that.options);
        that.maxHeight = that.scrollable.css("max-height");

        /**
         * Programmatically scrolls this scrollable element to the region specified.
         * This method is directly compatible with the underlying jQuery.scrollTo plugin.
         */
        that.scrollTo = function () {
            that.scrollable.scrollTo.apply(that.scrollable, arguments);
        };

        /* 
         * Updates the view of the scrollable region. This should be called when the content of the scrollable region is changed. 
         */
        that.refreshView = function () {
            if ($.browser.msie && $.browser.version === "6.0") {    
                that.scrollable.css("height", "");

                // Set height, if max-height is reached, to allow scrolling in IE6.
                if (that.scrollable.height() >= parseInt(that.maxHeight, 10)) {
                    that.scrollable.css("height", that.maxHeight);           
                }
            }
        };          

        that.refreshView();

        return that;
    };

    fluid.scrollable.makeSimple = function (element, options) {
        return fluid.container(element);
    };

    fluid.scrollable.makeTable =  function (table, options) {
        table.wrap(options.wrapperMarkup);
        return table.closest(".fl-scrollable-scroller");
    };

    fluid.defaults("fluid.scrollable", {
        makeScrollableFn: fluid.scrollable.makeSimple
    });

    /** 
     * Wraps a table in order to make it scrollable with the jQuery.scrollTo plugin.
     * Container divs are injected to allow cross-browser support. 
     *
     * @param {jQueryable} table the table to make scrollable
     * @param {Object} options configuration options
     * @return the scrollable component
     */
    fluid.scrollableTable = function (table, options) {
        options = $.extend({}, fluid.defaults("fluid.scrollableTable"), options);
        return fluid.scrollable(table, options);
    };

    fluid.defaults("fluid.scrollableTable", {
        gradeNames: "fluid.viewComponent",
        makeScrollableFn: fluid.scrollable.makeTable,
        wrapperMarkup: "<div class='fl-scrollable-scroller'><div class='fl-scrollable-inner'></div></div>"
    });    
    
    fluid.demands("fluid.scrollableTable", "fluid.uploader.fileQueueView", {
        funcName: "fluid.scrollableTable",
        args: [
            "{fileQueueView}.container"
        ]
    });
   
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Toronto
Copyright 2008-2009 University of California, Berkeley
Copyright 2010-2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery, swfobject, SWFUpload */

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    fluid.uploader = fluid.uploader || {};
    
    fluid.demands("fluid.uploaderImpl", "fluid.uploader.swfUpload", {
        funcName: "fluid.uploader.multiFileUploader"
    });
    
    /**********************
     * uploader.swfUpload *
     **********************/
    
    fluid.uploader.swfUploadStrategy = function (options) {
        var that = fluid.initLittleComponent("fluid.uploader.swfUploadStrategy", options);
        fluid.initDependents(that);
        return that;
    };
    
    fluid.defaults("fluid.uploader.swfUploadStrategy", {
        components: {
            engine: {
                type: "fluid.uploader.swfUploadStrategy.engine",
                options: {
                    queueSettings: "{multiFileUploader}.options.queueSettings",
                    flashMovieSettings: "{swfUploadStrategy}.options.flashMovieSettings"
                }
            },
            
            local: {
                type: "fluid.uploader.local"
            },
            
            remote: {
                type: "fluid.uploader.remote"
            }
        },
        
        // TODO: Rename this to "flashSettings" and remove the "flash" prefix from each option
        flashMovieSettings: {
            flashURL: "../../../lib/swfupload/flash/swfupload.swf",
            flashButtonPeerId: "",
            flashButtonAlwaysVisible: false,
            flashButtonTransparentEvenInIE: true,
            flashButtonImageURL: "../images/browse.png", // Used only when the Flash movie is visible.
            flashButtonCursorEffect: SWFUpload.CURSOR.HAND,
            debug: false
        },

        styles: {
            browseButtonOverlay: "fl-uploader-browse-overlay",
            flash9Container: "fl-uploader-flash9-container",
            uploaderWrapperFlash10: "fl-uploader-flash10-wrapper"
        }
    });
    
    fluid.demands("fluid.uploader.progressiveStrategy", "fluid.uploader.swfUpload", {
        funcName: "fluid.uploader.swfUploadStrategy"
    });
    
    
    fluid.uploader.swfUploadStrategy.remote = function (swfUpload, queue, options) {
        var that = fluid.initLittleComponent("fluid.uploader.swfUploadStrategy.remote", options);
        that.swfUpload = swfUpload;
        that.queue = queue;
        
        that.uploadNextFile = function () {
            that.swfUpload.startUpload();
        };
        
        that.stop = function () {
            // FLUID-822: Instead of actually stopping SWFUpload right away, we wait until the current file 
            // is finished and then don't bother to upload any new ones. This is due an issue where SWFUpload
            // appears to hang while Uploading a file that was previously stopped. I have a lingering suspicion
            // that this may actually be a bug in our Image Gallery demo, rather than in SWFUpload itself.
            that.queue.shouldStop = true;
        };
        return that;
    };
    
    fluid.demands("fluid.uploader.remote", "fluid.uploader.swfUploadStrategy", {
        funcName: "fluid.uploader.swfUploadStrategy.remote",
        args: [
            "{engine}.swfUpload",
            "{multiFileUploader}.queue",
            "{options}"
        ]
    });

    
    fluid.uploader.swfUploadStrategy.local = function (swfUpload, options) {
        var that = fluid.initLittleComponent("fluid.uploader.swfUploadStrategy.local", options);
        that.swfUpload = swfUpload;
        
        that.browse = function () {
            if (that.options.file_queue_limit === 1) {
                that.swfUpload.selectFile();
            } else {
                that.swfUpload.selectFiles();
            }    
        };
        
        that.removeFile = function (file) {
            that.swfUpload.cancelUpload(file.id);
        };
        
        that.enableBrowseButton = function () {
            that.swfUpload.setButtonDisabled(false);
        };
        
        that.disableBrowseButton = function () {
            that.swfUpload.setButtonDisabled(true);
        };
        
        return that;
    };
    
    fluid.demands("fluid.uploader.local", "fluid.uploader.swfUploadStrategy", {
        funcName: "fluid.uploader.swfUploadStrategy.local",
        args: [
            "{engine}.swfUpload",
            "{options}"
        ]
    });
    
    fluid.uploader.swfUploadStrategy.engine = function (options) {
        var that = fluid.initLittleComponent("fluid.uploader.swfUploadStrategy.engine", options);
        
        // Get the Flash version from swfobject and setup a new context so that the appropriate
        // Flash 9/10 strategies are selected.
        var flashVersion = swfobject.getFlashPlayerVersion().major;
        that.flashVersionContext = fluid.typeTag("fluid.uploader.flash." + flashVersion);
        
        // Merge Uploader's generic queue options with our Flash-specific options.
        that.config = $.extend({}, that.options.queueSettings, that.options.flashMovieSettings);
        
        // Configure the SWFUpload subsystem.
        fluid.initDependents(that);
        that.flashContainer = that.setupDOM();
        that.swfUploadConfig = that.setupConfig();
        that.swfUpload = new SWFUpload(that.swfUploadConfig);
        that.bindEvents();
        
        return that;
    };
    
    fluid.defaults("fluid.uploader.swfUploadStrategy.engine", {
        invokers: {
            setupDOM: "fluid.uploader.swfUploadStrategy.setupDOM",
            setupConfig: "fluid.uploader.swfUploadStrategy.setupConfig",
            bindEvents: "fluid.uploader.swfUploadStrategy.eventBinder"
        }
    });
    
    fluid.demands("fluid.uploader.swfUploadStrategy.engine", "fluid.uploader.swfUploadStrategy", {
        funcName: "fluid.uploader.swfUploadStrategy.engine",
        args: [
            fluid.COMPONENT_OPTIONS
        ]
    });
    
    
    /**********************
     * swfUpload.setupDOM *
     **********************/
    
    fluid.uploader.swfUploadStrategy.flash10SetupDOM = function (uploaderContainer, browseButton, styles) {
        // Wrap the whole uploader first.
        uploaderContainer.wrap("<div class='" + styles.uploaderWrapperFlash10 + "'></div>");

        // Then create a container and placeholder for the Flash movie as a sibling to the uploader.
        var flashContainer = $("<div><span></span></div>");
        flashContainer.addClass(styles.browseButtonOverlay);
        uploaderContainer.after(flashContainer);
        
        browseButton.attr("tabindex", -1);        
        return flashContainer;   
    };
    
    fluid.demands("fluid.uploader.swfUploadStrategy.setupDOM", [
        "fluid.uploader.swfUploadStrategy.engine",
        "fluid.uploader.flash.10"
    ], {
        funcName: "fluid.uploader.swfUploadStrategy.flash10SetupDOM",
        args: [
            "{multiFileUploader}.container",
            "{multiFileUploader}.dom.browseButton",
            "{swfUploadStrategy}.options.styles"
        ]
    });
     
     
    /*********************************
     * swfUpload.setupConfig *
     *********************************/
      
    // Maps SWFUpload's setting names to our component's setting names.
    var swfUploadOptionsMap = {
        uploadURL: "upload_url",
        flashURL: "flash_url",
        postParams: "post_params",
        fileSizeLimit: "file_size_limit",
        fileTypes: "file_types",
        fileUploadLimit: "file_upload_limit",
        fileQueueLimit: "file_queue_limit",
        flashButtonPeerId: "button_placeholder_id",
        flashButtonImageURL: "button_image_url",
        flashButtonHeight: "button_height",
        flashButtonWidth: "button_width",
        flashButtonWindowMode: "button_window_mode",
        flashButtonCursorEffect: "button_cursor",
        debug: "debug"
    };

    // Maps SWFUpload's callback names to our component's callback names.
    var swfUploadEventMap = {
        afterReady: "swfupload_loaded_handler",
        onFileDialog: "file_dialog_start_handler",
        afterFileQueued: "file_queued_handler",
        onQueueError: "file_queue_error_handler",
        afterFileDialog: "file_dialog_complete_handler",
        onFileStart: "upload_start_handler",
        onFileProgress: "upload_progress_handler",
        onFileComplete: "upload_complete_handler",
        onFileError: "upload_error_handler",
        onFileSuccess: "upload_success_handler"
    };
    
    var mapNames = function (nameMap, source, target) {
        var result = target || {};
        for (var key in source) {
            var mappedKey = nameMap[key];
            if (mappedKey) {
                result[mappedKey] = source[key];
            }
        }
        
        return result;
    };
    
    // For each event type, hand the fire function to SWFUpload so it can fire the event at the right time for us.
    // TODO: Refactor out duplication with mapNames()--should be able to use Engage's mapping tool
    var mapSWFUploadEvents = function (nameMap, events, target) {
        var result = target || {};
        for (var eventType in events) {
            var fireFn = events[eventType].fire;
            var mappedName = nameMap[eventType];
            if (mappedName) {
                result[mappedName] = fireFn;
            }   
        }
        return result;
    };
    
    fluid.uploader.swfUploadStrategy.convertConfigForSWFUpload = function (flashContainer, config, events) {
        config.flashButtonPeerId = fluid.allocateSimpleId(flashContainer.children().eq(0));
        // Map the event and settings names to SWFUpload's expectations.
        var convertedConfig = mapNames(swfUploadOptionsMap, config);
        return mapSWFUploadEvents(swfUploadEventMap, events, convertedConfig);
    };
    
    fluid.uploader.swfUploadStrategy.flash10SetupConfig = function (config, events, flashContainer, browseButton) {
        var isTransparent = config.flashButtonAlwaysVisible ? false : (!$.browser.msie || config.flashButtonTransparentEvenInIE);
        config.flashButtonImageURL = isTransparent ? undefined : config.flashButtonImageURL;
        config.flashButtonHeight = config.flashButtonHeight || browseButton.outerHeight();
        config.flashButtonWidth = config.flashButtonWidth || browseButton.outerWidth();
        config.flashButtonWindowMode = isTransparent ? SWFUpload.WINDOW_MODE.TRANSPARENT : SWFUpload.WINDOW_MODE.OPAQUE;
        return fluid.uploader.swfUploadStrategy.convertConfigForSWFUpload(flashContainer, config, events);
    };
    
    fluid.demands("fluid.uploader.swfUploadStrategy.setupConfig", [
        "fluid.uploader.swfUploadStrategy.engine",
        "fluid.uploader.flash.10"
    ], {
        funcName: "fluid.uploader.swfUploadStrategy.flash10SetupConfig",
        args: [
            "{engine}.config",
            "{multiFileUploader}.events",
            "{engine}.flashContainer",
            "{multiFileUploader}.dom.browseButton"
        ]
    });

     
    /*********************************
     * swfUpload.eventBinder *
     *********************************/
     
    var unbindSWFUploadSelectFiles = function () {
        // There's a bug in SWFUpload 2.2.0b3 that causes the entire browser to crash 
        // if selectFile() or selectFiles() is invoked. Remove them so no one will accidently crash their browser.
        var emptyFunction = function () {};
        SWFUpload.prototype.selectFile = emptyFunction;
        SWFUpload.prototype.selectFiles = emptyFunction;
    };
    
    fluid.uploader.swfUploadStrategy.bindFileEventListeners = function (model, events) {
        // Manually update our public model to keep it in sync with SWFUpload's insane,
        // always-changing references to its internal model.        
        var manualModelUpdater = function (file) {
            fluid.find(model, function (potentialMatch) {
                if (potentialMatch.id === file.id) {
                    potentialMatch.filestatus = file.filestatus;
                    return true;
                }
            });
        };
        
        events.onFileStart.addListener(manualModelUpdater);
        events.onFileProgress.addListener(manualModelUpdater);
        events.onFileError.addListener(manualModelUpdater);
        events.onFileSuccess.addListener(manualModelUpdater);
    };
    
    fluid.uploader.swfUploadStrategy.flash10EventBinder = function (model, events) {
        unbindSWFUploadSelectFiles();      
              
        fluid.uploader.swfUploadStrategy.bindFileEventListeners(model, events);
    };
    
    fluid.demands("fluid.uploader.swfUploadStrategy.eventBinder", [
        "fluid.uploader.swfUploadStrategy.engine",
        "fluid.uploader.flash.10"
    ], {
        funcName: "fluid.uploader.swfUploadStrategy.flash10EventBinder",
        args: [
            "{multiFileUploader}.queue.files",
            "{multiFileUploader}.events"
        ]
    });
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Toronto
Copyright 2010 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    fluid.registerNamespace("fluid.uploader.swfUploadStrategy");
    
    /**********************************************************************************
     * The functions in this file, which provide support for Flash 9 in the Uploader, *
     * have been deprecated as of Infusion 1.3.                                       * 
     **********************************************************************************/
    
    fluid.uploader.swfUploadStrategy.flash9SetupDOM = function (styles) {
        var container = $("<div><span></span></div>");
        container.addClass(styles.flash9Container);
        $("body").append(container);
        return container;       
    };

    fluid.demands("fluid.uploader.swfUploadStrategy.setupDOM", [
        "fluid.uploader.swfUploadStrategy.engine",
        "fluid.uploader.flash.9"
    ], {
        funcName: "fluid.uploader.swfUploadStrategy.flash9SetupDOM",
        args: [
            "{swfUploadStrategy}.options.styles"
        ]
    });

    fluid.uploader.swfUploadStrategy.flash9SetupConfig = function (flashContainer, config, events) {
        return fluid.uploader.swfUploadStrategy.convertConfigForSWFUpload(flashContainer, config, events);
    };

    fluid.demands("fluid.uploader.swfUploadStrategy.setupConfig", [
        "fluid.uploader.swfUploadStrategy.engine",
        "fluid.uploader.flash.9"
    ], {
        funcName: "fluid.uploader.swfUploadStrategy.flash9SetupConfig",
        args: [
            "{engine}.flashContainer",
            "{engine}.config",
            "{multiFileUploader}.events"
        ]
    });

    fluid.uploader.swfUploadStrategy.flash9EventBinder = function (model, events, local, browseButton) {
        browseButton.click(function (e) {        
            local.browse();
            e.preventDefault();
        });
        fluid.uploader.swfUploadStrategy.bindFileEventListeners(model, events);
    };

    fluid.demands("fluid.uploader.swfUploadStrategy.eventBinder", [
        "fluid.uploader.swfUploadStrategy.engine",
        "fluid.uploader.flash.9"
    ], {
        funcName: "fluid.uploader.swfUploadStrategy.flash9EventBinder",
        args: [
            "{multiFileUploader}.queue.files",
            "{multiFileUploader}.events",
            "{local}",
            "{multiFileUploader}.dom.browseButton"
        ]
    });

})(jQuery, fluid_1_4);
/*
Copyright 2010-2011 OCAD University 

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global FormData, fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    fluid.demands("fluid.uploaderImpl", "fluid.uploader.html5", {
        funcName: "fluid.uploader.multiFileUploader"
    });
    
    fluid.demands("fluid.uploader.progressiveStrategy", "fluid.uploader.html5", {
        funcName: "fluid.uploader.html5Strategy"
    });
    
    fluid.defaults("fluid.uploader.html5Strategy", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        components: {
            local: {
                type: "fluid.uploader.local",
                options: {
                    queueSettings: "{multiFileUploader}.options.queueSettings",
                    events: {
                        onFileDialog: "{multiFileUploader}.events.onFileDialog",
                        afterFileDialog: "{multiFileUploader}.events.afterFileDialog",
                        afterFileQueued: "{multiFileUploader}.events.afterFileQueued",
                        onQueueError: "{multiFileUploader}.events.onQueueError"
                    }
                }
            },
            
            remote: {
                type: "fluid.uploader.remote",
                options: {
                    queueSettings: "{multiFileUploader}.options.queueSettings",
                    events: {
                        afterReady: "{multiFileUploader}.events.afterReady",
                        onFileStart: "{multiFileUploader}.events.onFileStart",
                        onFileProgress: "{multiFileUploader}.events.onFileProgress",
                        onFileSuccess: "{multiFileUploader}.events.onFileSuccess",
                        onFileError: "{multiFileUploader}.events.onFileError",
                        onFileComplete: "{multiFileUploader}.events.onFileComplete"
                    }
                }
            }
        },
        
        // Used for browsers that rely on File.getAsBinary(), such as Firefox 3.6,
        // which load the entire file to be loaded into memory.
        // Set this option to a sane limit (100MB) so your users won't experience crashes or slowdowns (FLUID-3937).
        legacyBrowserFileLimit: 100000
    });
    
    
    // TODO: The following two or three functions probably ultimately belong on a that responsible for
    // coordinating with the XHR. A fileConnection object or something similar.
    
    fluid.uploader.html5Strategy.fileSuccessHandler = function (file, events, xhr) {
        events.onFileSuccess.fire(file, xhr.responseText, xhr);
        events.onFileComplete.fire(file);
    };
    
    fluid.uploader.html5Strategy.fileErrorHandler = function (file, events, xhr) {
        events.onFileError.fire(file, 
                                fluid.uploader.errorConstants.UPLOAD_FAILED,
                                xhr.status,
                                xhr);
        events.onFileComplete.fire(file);
    };
    
    fluid.uploader.html5Strategy.fileStopHandler = function (file, events, xhr) {
        events.onFileError.fire(file, 
                                fluid.uploader.errorConstants.UPLOAD_STOPPED,
                                xhr.status,
                                xhr);
        events.onFileComplete.fire(file);
    };
    
    fluid.uploader.html5Strategy.progressTracker = function () {
        var that = {
            previousBytesLoaded: 0
        };
        
        that.getChunkSize = function (bytesLoaded) {
            var chunkSize = bytesLoaded - that.previousBytesLoaded;
            that.previousBytesLoaded = bytesLoaded;
            return chunkSize;
        };
        
        return that;
    };
    
    fluid.uploader.html5Strategy.createFileUploadXHR = function () {
        var xhr = new XMLHttpRequest();
        return xhr;
    };
    
    fluid.uploader.html5Strategy.monitorFileUploadXHR = function (file, events, xhr) {
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                var status = xhr.status;
                // TODO: See a pattern here? Fix it.
                if (status === 200) {
                    fluid.uploader.html5Strategy.fileSuccessHandler(file, events, xhr);
                } else if (status === 0) {
                    fluid.uploader.html5Strategy.fileStopHandler(file, events, xhr);
                } else {
                    fluid.uploader.html5Strategy.fileErrorHandler(file, events, xhr);
                }
            }
        };

        var progressTracker = fluid.uploader.html5Strategy.progressTracker();
        xhr.upload.onprogress = function (pe) {
            events.onFileProgress.fire(file, progressTracker.getChunkSize(pe.loaded), pe.total);
        };
        
        return xhr;
    };
    
    // Set additional POST parameters for xhr  
    var setPostParams =  function (formData, postParams) {
        $.each(postParams,  function (key, value) {
            formData.append(key, value);
        });
    };
    
    fluid.uploader.html5Strategy.remote = function (queue, options) {
        var that = fluid.initLittleComponent("fluid.uploader.html5Strategy.remote", options);
        that.queue = queue;
        that.queueSettings = that.options.queueSettings;
        
        // Upload files in the current batch without exceeding the fileUploadLimit
        that.uploadNextFile = function () {
            var batch = that.queue.currentBatch;
            var file = batch.files[batch.fileIdx];                        
            that.uploadFile(file);
        };
        
        that.uploadFile = function (file) {
            that.events.onFileStart.fire(file);
            var xhr = that.createXHR();
            that.currentXHR = fluid.uploader.html5Strategy.monitorFileUploadXHR(file, that.events, xhr);
            that.doUpload(file, that.queueSettings, that.currentXHR);            
        };

        that.stop = function () {
            that.queue.isUploading = false;
            that.currentXHR.abort();         
        };
        
        fluid.initDependents(that);
        that.events.afterReady.fire();
        return that;
    };
    
    fluid.defaults("fluid.uploader.html5Strategy.remote", {
        gradeNames: ["fluid.eventedComponent"],
        argumentMap: {
            options: 1  
        },                
        invokers: {
            doUpload: "fluid.uploader.html5Strategy.doUpload",
            createXHR: "fluid.uploader.html5Strategy.createFileUploadXHR"
        }
    });
    
    fluid.demands("fluid.uploader.remote", ["fluid.uploader.html5Strategy", "fluid.uploader.live"], {
        funcName: "fluid.uploader.html5Strategy.remote",
        args: [
            "{multiFileUploader}.queue", 
            fluid.COMPONENT_OPTIONS
        ]
    });
    
    var CRLF = "\r\n";
    
    /** 
     * Firefox 4  implementation.  FF4 has implemented a FormData function which
     * conveniently provides easy construct of set key/value pairs representing 
     * form fields and their values.  The FormData is then easily sent using the 
     * XMLHttpRequest send() method.  
     */
    fluid.uploader.html5Strategy.doFormDataUpload = function (file, queueSettings, xhr) {
        var formData = new FormData();
        formData.append("file", file);
        
        setPostParams(formData, queueSettings.postParams);
        
        // set post params here.
        xhr.open("POST", queueSettings.uploadURL, true);
        xhr.send(formData);
    };
    
    fluid.uploader.html5Strategy.generateMultipartBoundary = function () {
        var boundary = "---------------------------";
        boundary += Math.floor(Math.random() * 32768);
        boundary += Math.floor(Math.random() * 32768);
        boundary += Math.floor(Math.random() * 32768);
        return boundary;
    };
    
    fluid.uploader.html5Strategy.generateMultiPartContent = function (boundary, file) {
        var multipart = "";
        multipart += "--" + boundary + CRLF;
        multipart += "Content-Disposition: form-data;" +
            " name=\"fileData\";" + 
            " filename=\"" + file.name + 
            "\"" + CRLF;
        multipart += "Content-Type: " + file.type + CRLF + CRLF;
        multipart += file.getAsBinary(); // Concatting binary data to JS String; yes, FF will handle it.
        multipart += CRLF + "--" + boundary + "--" + CRLF;
        return multipart;
    };
    
    /*
     * Create the multipart/form-data content by hand to send the file
     */
    fluid.uploader.html5Strategy.doManualMultipartUpload = function (file, queueSettings, xhr) {
        var boundary =  fluid.uploader.html5Strategy.generateMultipartBoundary();
        var multipart = fluid.uploader.html5Strategy.generateMultiPartContent(boundary, file);
        
        xhr.open("POST", queueSettings.uploadURL, true);
        xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
        xhr.sendAsBinary(multipart);
    };
    
    // Default configuration for older browsers that don't support FormData
    fluid.demands("fluid.uploader.html5Strategy.doUpload", "fluid.uploader.html5Strategy.remote", {
        funcName: "fluid.uploader.html5Strategy.doManualMultipartUpload",
        args: ["@0", "@1", "@2"]
    });
    
    fluid.demands("fluid.uploader.html5Strategy.createFileUploadXHR", "fluid.uploader.html5Strategy.remote", {
        funcName: "fluid.uploader.html5Strategy.createFileUploadXHR"
    });    
    
    // Configuration for FF4, Chrome, and Safari 4+, all of which support FormData correctly.
    fluid.demands("fluid.uploader.html5Strategy.doUpload", [
        "fluid.uploader.html5Strategy.remote", 
        "fluid.browser.supportsFormData"
    ], {
        funcName: "fluid.uploader.html5Strategy.doFormDataUpload",
        args: ["@0", "@1", "@2"]
    });
    
    fluid.uploader.html5Strategy.local = function (queue, legacyBrowserFileLimit, options) {
        var that = fluid.initLittleComponent("fluid.uploader.html5Strategy.local", options);
        that.queue = queue;
        that.queueSettings = that.options.queueSettings;

        // Add files to the file queue without exceeding the fileUploadLimit and the fileSizeLimit
        // NOTE:  fileSizeLimit set to bytes for HTML5 Uploader (KB for SWF Uploader).  
        that.addFiles = function (files) {
            // TODO: These look like they should be part of a real model.
            var sizeLimit = (legacyBrowserFileLimit || that.queueSettings.fileSizeLimit) * 1024;
            var fileLimit = that.queueSettings.fileUploadLimit;
            var uploaded = that.queue.getUploadedFiles().length;
            var queued = that.queue.getReadyFiles().length;
            var remainingUploadLimit = fileLimit - uploaded - queued;
            
            // TODO:  Provide feedback to the user if the file size is too large and isn't added to the file queue
            var numFilesAdded = 0;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.size < sizeLimit && (!fileLimit || remainingUploadLimit > 0)) {
                    file.id = "file-" + fluid.allocateGuid();
                    file.filestatus = fluid.uploader.fileStatusConstants.QUEUED;
                    that.events.afterFileQueued.fire(file);
                    remainingUploadLimit--;
                    numFilesAdded++;
                } else {
                    file.filestatus = fluid.uploader.fileStatusConstants.ERROR;
                    that.events.onQueueError.fire(file, fluid.uploader.errorConstants.UPLOAD_LIMIT_EXCEEDED);
                }
            }            
            that.events.afterFileDialog.fire(numFilesAdded);
        };
        
        that.removeFile = function (file) {
        };
        
        that.enableBrowseButton = function () {
            that.browseButtonView.enable();
        };
        
        that.disableBrowseButton = function () {
            that.browseButtonView.disable();
        };
        
        fluid.initDependents(that);
        return that;
    };
    
    fluid.defaults("fluid.uploader.html5Strategy.local", {
        argumentMap: {
            options: 2  
        },
        gradeNames: ["fluid.eventedComponent"],
        
        components: {
            browseButtonView: {
                type: "fluid.uploader.html5Strategy.browseButtonView",
                options: {
                    queueSettings: "{multiFileUploader}.options.queueSettings",
                    selectors: {
                        browseButton: "{multiFileUploader}.selectors.browseButton"
                    },
                    listeners: {
                        onFilesQueued: "{local}.addFiles"
                    }
                }
            }
        }
    });
    
    fluid.demands("fluid.uploader.local", "fluid.uploader.html5Strategy", {
        funcName: "fluid.uploader.html5Strategy.local",
        args: [
            "{multiFileUploader}.queue",
            "{html5Strategy}.options.legacyBrowserFileLimit",
            "{options}"
        ]
    });
    
    fluid.demands("fluid.uploader.local", [
        "fluid.uploader.html5Strategy",
        "fluid.browser.supportsFormData"
    ], {
        funcName: "fluid.uploader.html5Strategy.local",
        args: [
            "{multiFileUploader}.queue",
            undefined,
            "{options}"
        ]
    });
    
    
    /********************
     * browseButtonView *
     ********************/
    
    var bindEventsToFileInput = function (that, fileInput) {
        fileInput.click(function () {
            that.events.onBrowse.fire();
        });
        
        fileInput.change(function () {
            var files = fileInput[0].files;
            that.events.onFilesQueued.fire(files);
            that.renderFreshMultiFileInput();
        });
        
        fileInput.focus(function () {
            that.browseButton.addClass("focus");
        });
        
        fileInput.blur(function () {
            that.browseButton.removeClass("focus");
        });
    };
    
    var renderMultiFileInput = function (that) {
        var multiFileInput = $(that.options.multiFileInputMarkup);
        bindEventsToFileInput(that, multiFileInput);
        return multiFileInput;
    };
    
    var setupBrowseButtonView = function (that) {
        var multiFileInput = renderMultiFileInput(that);        
        that.browseButton.append(multiFileInput);
        that.browseButton.attr("tabindex", -1);
    };
    
    fluid.uploader.html5Strategy.browseButtonView = function (container, options) {
        var that = fluid.initView("fluid.uploader.html5Strategy.browseButtonView", container, options);
        that.browseButton = that.locate("browseButton");
        
        that.renderFreshMultiFileInput = function () {
            var previousInput = that.locate("fileInputs").last();
            previousInput.hide();
            previousInput.attr("tabindex", -1);
            var newInput = renderMultiFileInput(that);
            previousInput.after(newInput);
        };
        
        that.enable = function () {
            that.locate("fileInputs").removeAttr("disabled");
        };
        
        that.disable = function () {
            that.locate("fileInputs").attr("disabled", "disabled");
        };
        
        setupBrowseButtonView(that);
        return that;
    };
    
    fluid.defaults("fluid.uploader.html5Strategy.browseButtonView", {
        gradeNames: "fluid.viewComponent",
        multiFileInputMarkup: "<input type='file' multiple='' class='flc-uploader-html5-input' />",
        
        queueSettings: {},
        
        selectors: {
            browseButton: ".flc-uploader-button-browse",
            fileInputs: ".flc-uploader-html5-input"
        },
        
        events: {
            onBrowse: null,
            onFilesQueued: null
        }        
    });

    fluid.demands("fluid.uploader.html5Strategy.browseButtonView", "fluid.uploader.html5Strategy.local", {
        container: "{multiFileUploader}.container",
        mergeOptions: {
            events: {
                onBrowse: "{local}.events.onFileDialog"
            }
        }
    });

})(jQuery, fluid_1_4);
/*
Copyright 2009 University of Toronto
Copyright 2009 University of California, Berkeley
Copyright 2010-2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    fluid.uploader = fluid.uploader || {};
    
    var startUploading; // Define early due to subtle circular dependency.
    
    var updateProgress = function (file, events, demoState, isUploading) {
        if (!isUploading) {
            return;
        }
        
        var chunk = Math.min(demoState.chunkSize, file.size);
        demoState.bytesUploaded = Math.min(demoState.bytesUploaded + chunk, file.size);
        events.onFileProgress.fire(file, demoState.bytesUploaded, file.size);
    };
    
    var finishAndContinueOrCleanup = function (that, file) {
        that.queue.finishFile(file);
        that.events.afterFileComplete.fire(file);
        
        if (that.queue.shouldUploadNextFile()) {
            startUploading(that);
        } else {
            that.events.afterUploadComplete.fire(that.queue.currentBatch.files);
            if (file.status !== fluid.uploader.fileStatusConstants.CANCELLED) {
                that.queue.clearCurrentBatch(); // Only clear the current batch if we're actually done the batch.
            }
        }
    };
    
    var finishUploading = function (that) {
        if (!that.queue.isUploading) {
            return;
        }
        
        var file = that.demoState.currentFile;
        that.events.onFileSuccess.fire(file);
        that.demoState.fileIdx++;
        finishAndContinueOrCleanup(that, file);
    };
    
    var simulateUpload = function (that) {
        if (!that.queue.isUploading) {
            return;
        }
        
        var file = that.demoState.currentFile;
        if (that.demoState.bytesUploaded < file.size) {
            fluid.invokeAfterRandomDelay(function () {
                updateProgress(file, that.events, that.demoState, that.queue.isUploading);
                simulateUpload(that);
            });
        } else {
            finishUploading(that);
        } 
    };
    
    startUploading = function (that) {
        // Reset our upload stats for each new file.
        that.demoState.currentFile = that.queue.files[that.demoState.fileIdx];
        that.demoState.chunksForCurrentFile = Math.ceil(that.demoState.currentFile / that.demoState.chunkSize);
        that.demoState.bytesUploaded = 0;
        that.queue.isUploading = true;
        
        that.events.onFileStart.fire(that.demoState.currentFile);
        simulateUpload(that);
    };

    var stopDemo = function (that) {
        var file = that.demoState.currentFile;
        file.filestatus = fluid.uploader.fileStatusConstants.CANCELLED;
        
        // In SWFUpload's world, pausing is a combinination of an UPLOAD_STOPPED error and a complete.
        that.events.onFileError.fire(file, 
                                     fluid.uploader.errorConstants.UPLOAD_STOPPED, 
                                     "The demo upload was paused by the user.");
        finishAndContinueOrCleanup(that, file);
        that.events.onUploadStop.fire();
    };
    
    var setupDemo = function (that) {
        if (that.simulateDelay === undefined || that.simulateDelay === null) {
            that.simulateDelay = true;
        }
          
        // Initialize state for our upload simulation.
        that.demoState = {
            fileIdx: 0,
            chunkSize: 200000
        };
        
        return that;
    };
       
    /**
     * The demo remote pretends to upload files to the server, firing all the appropriate events
     * but without sending anything over the network or requiring a server to be running.
     * 
     * @param {FileQueue} queue the Uploader's file queue instance
     * @param {Object} the Uploader's bundle of event firers
     * @param {Object} configuration options
     */
    fluid.uploader.demoRemote = function (queue, options) {
        var that = fluid.initLittleComponent("fluid.uploader.demoRemote", options);
        that.queue = queue;
        
        that.uploadNextFile = function () {
            startUploading(that);   
        };
        
        that.stop = function () {
            stopDemo(that);
        };
        
        setupDemo(that);
        return that;
    };
    
    /**
     * Invokes a function after a random delay by using setTimeout.
     * If the simulateDelay option is false, the function is invoked immediately.
     * This is an odd function, but a potential candidate for central inclusion.
     * 
     * @param {Function} fn the function to invoke
     */
    fluid.invokeAfterRandomDelay = function (fn) {
        var delay = Math.floor(Math.random() * 1000 + 100);
        setTimeout(fn, delay);
    };
    
    fluid.defaults("fluid.uploader.demoRemote", {
        gradeNames: ["fluid.eventedComponent"],
        argumentMap: {
            options: 1  
        },
        events: {
            onFileProgress: "{multiFileUploader}.events.onFileProgress",
            afterFileComplete: "{multiFileUploader}.events.afterFileComplete",
            afterUploadComplete: "{multiFileUploader}.events.afterUploadComplete",
            onFileSuccess: "{multiFileUploader}.events.onFileSuccess",
            onFileStart: "{multiFileUploader}.events.onFileStart",
            onFileError: "{multiFileUploader}.events.onFileError",
            onUploadStop: "{multiFileUploader}.events.onUploadStop"
        }
    });
    
    fluid.demands("fluid.uploader.remote", ["fluid.uploader.multiFileUploader", "fluid.uploader.demo"], {
        funcName: "fluid.uploader.demoRemote",
        args: [
            "{multiFileUploader}.queue",
            "{multiFileUploader}.events",
            fluid.COMPONENT_OPTIONS
        ]
    });
    
})(jQuery, fluid_1_4);
/*
 * jQuery UI Tooltip @VERSION
 *
 * Copyright 2010, AUTHORS.txt
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Tooltip
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.position.js
 */
(function($) {

var increments = 0;

$.widget("ui.tooltip", {
	options: {
		items: "[title]",
		content: function() {
			return $(this).attr("title");
		},
		position: {
			my: "left center",
			at: "right center",
			offset: "15 0"
		}
	},
	_create: function() {
		var self = this;
		this.tooltip = $("<div></div>")
			.attr("id", "ui-tooltip-" + increments++)
			.attr("role", "tooltip")
			.attr("aria-hidden", "true")
			.addClass("ui-tooltip ui-widget ui-corner-all ui-widget-content")
			.appendTo(document.body)
			.hide();
		this.tooltipContent = $("<div></div>")
			.addClass("ui-tooltip-content")
			.appendTo(this.tooltip);
		this.opacity = this.tooltip.css("opacity");
		this.element
			.bind("focus.tooltip mouseover.tooltip", function(event) {
				self.open( event );
			})
			.bind("blur.tooltip mouseout.tooltip", function(event) {
				self.close( event );
			});
	},
	
	enable: function() {
		this.options.disabled = false;
	},
	
	disable: function() {
		this.options.disabled = true;
	},
	
	destroy: function() {
		this.tooltip.remove();
		$.Widget.prototype.destroy.apply(this, arguments);
	},
	
	widget: function() {
		return this.element.pushStack(this.tooltip.get());
	},
	
	open: function(event) {
		var target = $(event && event.target || this.element).closest(this.options.items);
		// already visible? possible when both focus and mouseover events occur
		if (this.current && this.current[0] == target[0])
			return;
		var self = this;
		this.current = target;
		this.currentTitle = target.attr("title");
		var content = this.options.content.call(target[0], function(response) {
			// IE may instantly serve a cached response, need to give it a chance to finish with _show before that
			setTimeout(function() {
				// ignore async responses that come in after the tooltip is already hidden
				if (self.current == target)
					self._show(event, target, response);
			}, 13);
		});
		if (content) {
			self._show(event, target, content);
		}
	},
	
	_show: function(event, target, content) {
		if (!content)
			return;
		
		target.attr("title", "");
		
		if (this.options.disabled)
			return;
			
		this.tooltipContent.html(content);
		this.tooltip.css({
			top: 0,
			left: 0
		}).show().position( $.extend({
			of: target
		}, this.options.position )).hide();
		
		this.tooltip.attr("aria-hidden", "false");
		target.attr("aria-describedby", this.tooltip.attr("id"));

		this.tooltip.stop(false, true).fadeIn();

		this._trigger( "open", event );
	},
	
	close: function(event) {
		if (!this.current)
			return;
		
		var current = this.current.attr("title", this.currentTitle);
		this.current = null;
		
		if (this.options.disabled)
			return;
		
		current.removeAttr("aria-describedby");
		this.tooltip.attr("aria-hidden", "true");
		
		this.tooltip.stop(false, true).fadeOut();
		
		this._trigger( "close", event );
	}
	
});

})(jQuery);/*
Copyright 2010 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    var createContentFunc = function (content) {
        return typeof content === "function" ? content : function () {
            return content;
        };
    };

    var setup = function (that) {
        that.container.tooltip({
            content: createContentFunc(that.options.content),
            position: that.options.position,
            items: that.options.items,
            open: function (event) {
                var tt = $(event.target).tooltip("widget");
                tt.stop(false, true);
                tt.hide();
                if (that.options.delay) {
                    tt.delay(that.options.delay).fadeIn("default", that.events.afterOpen.fire());
                } else {
                    tt.show();
                    that.events.afterOpen.fire();
                }
            },
            close: function (event) {
                var tt = $(event.target).tooltip("widget");
                tt.stop(false, true);
                tt.hide();
                tt.clearQueue();
                that.events.afterClose.fire();
            } 
        });
        
        that.elm = that.container.tooltip("widget");
        
        that.elm.addClass(that.options.styles.tooltip);
    };

    fluid.tooltip = function (container, options) {
        var that = fluid.initView("fluid.tooltip", container, options);
        
        /**
         * Updates the contents displayed in the tooltip
         * 
         * @param {Object} content, the content to be displayed in the tooltip
         */
        that.updateContent = function (content) {
            that.container.tooltip("option", "content", createContentFunc(content));
        };
        
        /**
         * Destroys the underlying jquery ui tooltip
         */
        that.destroy = function () {
            that.container.tooltip("destroy");
        };
        
        /**
         * Manually displays the tooltip
         */
        that.open = function () {
            that.container.tooltip("open");
        };
        
        /**
         * Manually hides the tooltip
         */
        that.close = function () {
            that.container.tooltip("close");
        };
        
        setup(that);
        
        return that;
    };
    
    fluid.defaults("fluid.tooltip", {
        styles: {
            tooltip: ""
        },
        
        events: {
            afterOpen: null,
            afterClose: null  
        },
        
        content: "",
        
        position: {
            my: "left top",
            at: "left bottom",
            offset: "0 5"
        },
        
        items: "*",
        
        delay: 300
    });

})(jQuery, fluid_1_4);
/* Copyright (c) 2006 Brandon Aaron (http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) 
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * $LastChangedDate$
 * $Rev$
 *
 * Version 2.1
 */

(function($){

/**
 * The bgiframe is chainable and applies the iframe hack to get 
 * around zIndex issues in IE6. It will only apply itself in IE 
 * and adds a class to the iframe called 'bgiframe'. The iframe
 * is appeneded as the first child of the matched element(s) 
 * with a tabIndex and zIndex of -1.
 * 
 * By default the plugin will take borders, sized with pixel units,
 * into account. If a different unit is used for the border's width,
 * then you will need to use the top and left settings as explained below.
 *
 * NOTICE: This plugin has been reported to cause perfromance problems
 * when used on elements that change properties (like width, height and
 * opacity) a lot in IE6. Most of these problems have been caused by 
 * the expressions used to calculate the elements width, height and 
 * borders. Some have reported it is due to the opacity filter. All 
 * these settings can be changed if needed as explained below.
 *
 * @example $('div').bgiframe();
 * @before <div><p>Paragraph</p></div>
 * @result <div><iframe class="bgiframe".../><p>Paragraph</p></div>
 *
 * @param Map settings Optional settings to configure the iframe.
 * @option String|Number top The iframe must be offset to the top
 * 		by the width of the top border. This should be a negative 
 *      number representing the border-top-width. If a number is 
 * 		is used here, pixels will be assumed. Otherwise, be sure
 *		to specify a unit. An expression could also be used. 
 * 		By default the value is "auto" which will use an expression 
 * 		to get the border-top-width if it is in pixels.
 * @option String|Number left The iframe must be offset to the left
 * 		by the width of the left border. This should be a negative 
 *      number representing the border-left-width. If a number is 
 * 		is used here, pixels will be assumed. Otherwise, be sure
 *		to specify a unit. An expression could also be used. 
 * 		By default the value is "auto" which will use an expression 
 * 		to get the border-left-width if it is in pixels.
 * @option String|Number width This is the width of the iframe. If
 *		a number is used here, pixels will be assume. Otherwise, be sure
 * 		to specify a unit. An experssion could also be used.
 *		By default the value is "auto" which will use an experssion
 * 		to get the offsetWidth.
 * @option String|Number height This is the height of the iframe. If
 *		a number is used here, pixels will be assume. Otherwise, be sure
 * 		to specify a unit. An experssion could also be used.
 *		By default the value is "auto" which will use an experssion
 * 		to get the offsetHeight.
 * @option Boolean opacity This is a boolean representing whether or not
 * 		to use opacity. If set to true, the opacity of 0 is applied. If
 *		set to false, the opacity filter is not applied. Default: true.
 * @option String src This setting is provided so that one could change 
 *		the src of the iframe to whatever they need.
 *		Default: "javascript:false;"
 *
 * @name bgiframe
 * @type jQuery
 * @cat Plugins/bgiframe
 * @author Brandon Aaron (brandon.aaron@gmail.com || http://brandonaaron.net)
 */
$.fn.bgIframe = $.fn.bgiframe = function(s) {
	// This is only for IE6
	if ( $.browser.msie && parseInt($.browser.version) <= 6 ) {
		s = $.extend({
			top     : 'auto', // auto == .currentStyle.borderTopWidth
			left    : 'auto', // auto == .currentStyle.borderLeftWidth
			width   : 'auto', // auto == offsetWidth
			height  : 'auto', // auto == offsetHeight
			opacity : true,
			src     : 'javascript:false;'
		}, s || {});
		var prop = function(n){return n&&n.constructor==Number?n+'px':n;},
		    html = '<iframe class="bgiframe"frameborder="0"tabindex="-1"src="'+s.src+'"'+
		               'style="display:block;position:absolute;z-index:-1;'+
			               (s.opacity !== false?'filter:Alpha(Opacity=\'0\');':'')+
					       'top:'+(s.top=='auto'?'expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+\'px\')':prop(s.top))+';'+
					       'left:'+(s.left=='auto'?'expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+\'px\')':prop(s.left))+';'+
					       'width:'+(s.width=='auto'?'expression(this.parentNode.offsetWidth+\'px\')':prop(s.width))+';'+
					       'height:'+(s.height=='auto'?'expression(this.parentNode.offsetHeight+\'px\')':prop(s.height))+';'+
					'"/>';
		return this.each(function() {
			if ( $('> iframe.bgiframe', this).length == 0 )
				this.insertBefore( document.createElement(html), this.firstChild );
		});
	}
	return this;
};

// Add browser.version if it doesn't exist
if (!$.browser.version)
	$.browser.version = navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)[1];

})(jQuery);/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2010 University of Toronto
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
  // The three states of the undo component
    var STATE_INITIAL = "state_initial", 
        STATE_CHANGED = "state_changed",
        STATE_REVERTED = "state_reverted";
  
    function defaultRenderer(that, targetContainer) {
        var str = that.options.strings;
        var markup = "<span class='flc-undo'>" + 
            "<a href='#' class='flc-undo-undoControl'>" + str.undo + "</a>" + 
            "<a href='#' class='flc-undo-redoControl'>" + str.redo + "</a>" + 
            "</span>";
        var markupNode = $(markup).attr({
            "role": "region",  
            "aria-live": "polite", 
            "aria-relevant": "all"
        });
        targetContainer.append(markupNode);
        return markupNode;
    }
    
    function refreshView(that) {
        if (that.state === STATE_INITIAL) {
            that.locate("undoContainer").hide();
            that.locate("redoContainer").hide();
        }
        else if (that.state === STATE_CHANGED) {
            that.locate("undoContainer").show();
            that.locate("redoContainer").hide();
        }
        else if (that.state === STATE_REVERTED) {
            that.locate("undoContainer").hide();
            that.locate("redoContainer").show();          
        }
    }
   
    
    var bindHandlers = function (that) { 
        that.locate("undoControl").click( 
            function () {
                if (that.state !== STATE_REVERTED) {
                    fluid.model.copyModel(that.extremalModel, that.component.model);
                    that.component.updateModel(that.initialModel, that);
                    that.state = STATE_REVERTED;
                    refreshView(that);
                    that.locate("redoControl").focus();
                }
                return false;
            }
        );
        that.locate("redoControl").click( 
            function () {
                if (that.state !== STATE_CHANGED) {
                    that.component.updateModel(that.extremalModel, that);
                    that.state = STATE_CHANGED;
                    refreshView(that);
                    that.locate("undoControl").focus();
                }
                return false;
            }
        );
        return {
            modelChanged: function (newModel, oldModel, source) {
                if (source !== that) {
                    that.state = STATE_CHANGED;
                
                    fluid.model.copyModel(that.initialModel, oldModel);
                
                    refreshView(that);
                }
            }
        };
    };
    
    /**
     * Decorates a target component with the function of "undoability"
     * 
     * @param {Object} component a "model-bearing" standard Fluid component to receive the "undo" functionality
     * @param {Object} options a collection of options settings
     */
    fluid.undoDecorator = function (component, userOptions) {
        var that = fluid.initLittleComponent("undo", userOptions);
        that.container = that.options.renderer(that, component.container);
        fluid.initDomBinder(that);
        fluid.tabindex(that.locate("undoControl"), 0);
        fluid.tabindex(that.locate("redoControl"), 0);
        
        that.component = component;
        that.initialModel = {};
        that.extremalModel = {};
        fluid.model.copyModel(that.initialModel, component.model);
        fluid.model.copyModel(that.extremalModel, component.model);
        
        that.state = STATE_INITIAL;
        refreshView(that);
        var listeners = bindHandlers(that);
        
        that.returnedOptions = {
            listeners: listeners
        };
        return that;
    };
  
    fluid.defaults("undo", {  
        selectors: {
            undoContainer: ".flc-undo-undoControl",
            undoControl: ".flc-undo-undoControl",
            redoContainer: ".flc-undo-redoControl",
            redoControl: ".flc-undo-redoControl"
        },
        
        strings: {
            undo: "undo edit",
            redo: "redo edit"
        },
                    
        renderer: defaultRenderer
    });
        
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2010 University of Toronto
Copyright 2008-2009 University of California, Berkeley
Copyright 2010 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    function sendKey(control, event, virtualCode, charCode) {
        var kE = document.createEvent("KeyEvents");
        kE.initKeyEvent(event, 1, 1, null, 0, 0, 0, 0, virtualCode, charCode);
        control.dispatchEvent(kE);
    }
    
    /** Set the caret position to the end of a text field's value, also taking care
     * to scroll the field so that this position is visible.
     * @param {DOM node} control The control to be scrolled (input, or possibly textarea)
     * @param value The current value of the control
     */
    fluid.setCaretToEnd = function (control, value) {
        var pos = value ? value.length : 0;

        try {
            control.focus();
        // see http://www.quirksmode.org/dom/range_intro.html - in Opera, must detect setSelectionRange first, 
        // since its support for Microsoft TextRange is buggy
            if (control.setSelectionRange) {

                control.setSelectionRange(pos, pos);
                if ($.browser.mozilla && pos > 0) {
                  // ludicrous fix for Firefox failure to scroll to selection position, inspired by
                  // http://bytes.com/forum/thread496726.html
                    sendKey(control, "keypress", 92, 92); // type in a junk character
                    sendKey(control, "keydown", 8, 0); // delete key must be dispatched exactly like this
                    sendKey(control, "keypress", 8, 0);
                }
            }

            else if (control.createTextRange) {
                var range = control.createTextRange();
                range.move("character", pos);
                range.select();
            }
        }
        catch (e) {} 
    };

    var switchToViewMode = function (that) {
        that.editContainer.hide();
        that.displayModeRenderer.show();
    };
    
    var cancel = function (that) {
        if (that.isEditing()) {
            // Roll the edit field back to its old value and close it up.
            // This setTimeout is necessary on Firefox, since any attempt to modify the 
            // input control value during the stack processing the ESCAPE key will be ignored.
            setTimeout(function () {
                that.editView.value(that.model.value);
            }, 1);
            switchToViewMode(that);
            that.events.afterFinishEdit.fire(that.model.value, that.model.value, 
                that.editField[0], that.viewEl[0]);
        }
    };
    
    var finish = function (that) {
        var newValue = that.editView.value();
        var oldValue = that.model.value;

        var viewNode = that.viewEl[0];
        var editNode = that.editField[0];
        var ret = that.events.onFinishEdit.fire(newValue, oldValue, editNode, viewNode);
        if (ret === false) {
            return;
        }
        
        that.updateModelValue(newValue);
        that.events.afterFinishEdit.fire(newValue, oldValue, editNode, viewNode);
        
        switchToViewMode(that);
    };
    
    /** 
     * Do not allow the textEditButton to regain focus upon completion unless
     * the keypress is enter or esc.
     */  
    var bindEditFinish = function (that) {
        if (that.options.submitOnEnter === undefined) {
            that.options.submitOnEnter = "textarea" !== fluid.unwrap(that.editField).nodeName.toLowerCase();
        }
        function keyCode(evt) {
            // Fix for handling arrow key presses. See FLUID-760.
            return evt.keyCode ? evt.keyCode : (evt.which ? evt.which : 0);          
        }
        var escHandler = function (evt) {
            var code = keyCode(evt);
            if (code === $.ui.keyCode.ESCAPE) {
                that.textEditButton.focus(0);
                cancel(that);
                return false;
            }
        };
        var finishHandler = function (evt) {
            var code = keyCode(evt);
            
            if (code !== $.ui.keyCode.ENTER) {
                that.textEditButton.blur();
                return true;
            }
            else {
                finish(that);
                that.textEditButton.focus(0);
            }
            
            return false;
        };
        if (that.options.submitOnEnter) {
            that.editContainer.keypress(finishHandler);
        }
        that.editContainer.keydown(escHandler);
    };

    var bindBlurHandler = function (that) {
        if (that.options.blurHandlerBinder) {
            that.options.blurHandlerBinder(that);
        }
        else {
            var blurHandler = function (evt) {
                if (that.isEditing()) {
                    finish(that);
                }
                return false;
            };
            that.editField.blur(blurHandler);
        }
    };

    var initializeEditView = function (that, initial) {
        if (!that.editInitialized) { 
            fluid.inlineEdit.renderEditContainer(that, !that.options.lazyEditView || !initial);
            
            if (!that.options.lazyEditView || !initial) {
                that.editView = fluid.initSubcomponent(that, "editView", that.editField);
                
                $.extend(true, that.editView, fluid.initSubcomponent(that, "editAccessor", that.editField));
        
                bindEditFinish(that);
                bindBlurHandler(that);
                that.editView.refreshView(that);
                that.editInitialized = true;
            }
        }
    };
    
    var edit = function (that) {
        initializeEditView(that, false);
      
        var viewEl = that.viewEl;
        var displayText = that.displayView.value();
        that.updateModelValue(that.model.value === "" ? "" : displayText);
        if (that.options.applyEditPadding) {
            that.editField.width(Math.max(viewEl.width() + that.options.paddings.edit, that.options.paddings.minimumEdit));
        }

        that.displayModeRenderer.hide();
        that.editContainer.show();                  

        // Work around for FLUID-726
        // Without 'setTimeout' the finish handler gets called with the event and the edit field is inactivated.       
        setTimeout(function () {
            fluid.setCaretToEnd(that.editField[0], that.editView.value());
            if (that.options.selectOnEdit) {
                that.editField[0].select();
            }
        }, 0);
        that.events.afterBeginEdit.fire();
    };

    var clearEmptyViewStyles = function (textEl, styles, originalViewPadding) {
        textEl.removeClass(styles.defaultViewStyle);
        textEl.css('padding-right', originalViewPadding);
        textEl.removeClass(styles.emptyDefaultViewText);
    };
    
    var showDefaultViewText = function (that) {
        that.displayView.value(that.options.defaultViewText);
        that.viewEl.css('padding-right', that.existingPadding);
        that.viewEl.addClass(that.options.styles.defaultViewStyle);
    };

    var showNothing = function (that) {
        that.displayView.value("");
        
        // workaround for FLUID-938:
        // IE can not style an empty inline element, so force element to be display: inline-block
        if ($.browser.msie) {
            if (that.viewEl.css('display') === 'inline') {
                that.viewEl.css('display', "inline-block");
            }
        }
    };

    var showEditedText = function (that) {
        that.displayView.value(that.model.value);
        clearEmptyViewStyles(that.viewEl, that.options.styles, that.existingPadding);
    };
    
    var refreshView = function (that, source) {
        that.displayView.refreshView(that, source);
        if (that.editView) {
            that.editView.refreshView(that, source);
        }
    };
    
    var initModel = function (that, value) {
        that.model.value = value;
        that.refreshView();
    };
    
    var updateModelValue = function (that, newValue, source) {
        var comparator = that.options.modelComparator;
        var unchanged = comparator ? comparator(that.model.value, newValue) : 
            that.model.value === newValue;
        if (!unchanged) {
            var oldModel = $.extend(true, {}, that.model);
            that.model.value = newValue;
            that.events.modelChanged.fire(that.model, oldModel, source);
            that.refreshView(source);
        }
    };
        
    var makeIsEditing = function (that) {
        var isEditing = false;

        that.events.onBeginEdit.addListener(function () {
            isEditing = true;
        });
        that.events.afterFinishEdit.addListener(function () {
            isEditing = false; 
        });
        return function () {
            return isEditing;
        };
    };
    
    var makeEditHandler = function (that) {
        return function () {
            var prevent = that.events.onBeginEdit.fire();
            if (prevent === false) {
                return false;
            }
            edit(that);
            
            return true;
        }; 
    };    
    
    // Initialize the tooltip once the document is ready.
    // For more details, see http://issues.fluidproject.org/browse/FLUID-1030
    var initTooltips = function (that) {
        var tooltipOptions = {
            content: that.options.tooltipText,
            position: {
                my: "left top",
                at: "left bottom",
                offset: "0 5"
            },
            target: "*",
            delay: that.options.tooltipDelay,
            styles: {
                tooltip: that.options.styles.tooltip
            }     
        };
        
        fluid.tooltip(that.viewEl, tooltipOptions);
        
        if (that.textEditButton) {
            fluid.tooltip(that.textEditButton, tooltipOptions);
        }
    };
    
    var calculateInitialPadding = function (viewEl) {
        var padding = viewEl.css("padding-right");
        return padding ? parseFloat(padding) : 0;
    };
    
    var setupInlineEdit = function (componentContainer, that) {
        // Hide the edit container to start
        if (that.editContainer) {
            that.editContainer.hide();
        }
        
        // Add tooltip handler if required and available
        if (that.tooltipEnabled()) {
            initTooltips(that);
        }
        
        // Setup any registered decorators for the component.
        that.decorators = fluid.initSubcomponents(that, "componentDecorators", 
            [that, fluid.COMPONENT_OPTIONS]);
    };
    
    /**
     * Creates a whole list of inline editors.
     */
    var setupInlineEdits = function (editables, options) {
        var editors = [];
        editables.each(function (idx, editable) {
            editors.push(fluid.inlineEdit($(editable), options));
        });
        
        return editors;
    };
    
    /**
     * Instantiates a new Inline Edit component
     * 
     * @param {Object} componentContainer a selector, jquery, or a dom element representing the component's container
     * @param {Object} options a collection of options settings
     */
    fluid.inlineEdit = function (componentContainer, userOptions) {   
        var that = fluid.initView("inlineEdit", componentContainer, userOptions);
        
        that.viewEl = fluid.inlineEdit.setupDisplayText(that);
        
        that.displayView = fluid.initSubcomponent(that, "displayView", that.viewEl);
        $.extend(true, that.displayView, fluid.initSubcomponent(that, "displayAccessor", that.viewEl));

        /**
         * The current value of the inline editable text. The "model" in MVC terms.
         */
        that.model = {value: ""};
       
        /**
         * Switches to edit mode.
         */
        that.edit = makeEditHandler(that);
        
        /**
         * Determines if the component is currently in edit mode.
         * 
         * @return true if edit mode shown, false if view mode is shown
         */
        that.isEditing = makeIsEditing(that);
        
        /**
         * Finishes editing, switching back to view mode.
         */
        that.finish = function () {
            finish(that);
        };

        /**
         * Cancels the in-progress edit and switches back to view mode.
         */
        that.cancel = function () {
            cancel(that);
        };

        /**
         * Determines if the tooltip feature is enabled.
         * 
         * @return true if the tooltip feature is turned on, false if not
         */
        that.tooltipEnabled = function () {
            return that.options.useTooltip && $.fn.tooltip;
        };
        
        /**
         * Updates the state of the inline editor in the DOM, based on changes that may have
         * happened to the model.
         * 
         * @param {Object} source
         */
        that.refreshView = function (source) {
            refreshView(that, source);
        };
        
        /**
         * Pushes external changes to the model into the inline editor, refreshing its
         * rendering in the DOM. The modelChanged event will fire.
         * 
         * @param {String} newValue The bare value of the model, that is, the string being edited
         * @param {Object} source An optional "source" (perhaps a DOM element) which triggered this event
         */
        that.updateModelValue = function (newValue, source) {
            updateModelValue(that, newValue, source);
        };
        
        /**
         * Pushes external changes to the model into the inline editor, refreshing its
         * rendering in the DOM. The modelChanged event will fire.
         * 
         * @param {Object} newValue The full value of the new model, that is, a model object which contains the editable value as the element named "value"
         * @param {Object} source An optional "source" (perhaps a DOM element) which triggered this event
         */
        that.updateModel = function (newModel, source) {
            updateModelValue(that, newModel.value, source);
        };
        
        that.existingPadding = calculateInitialPadding(that.viewEl);
        
        initModel(that, that.displayView.value());
        
        that.displayModeRenderer = that.options.displayModeRenderer(that);  
        initializeEditView(that, true);
        setupInlineEdit(componentContainer, that);
        
        return that;
    };
    
    /**
     * Set up and style the edit field.  If an edit field is not provided,
     * default markup is created for the edit field 
     * 
     * @param {string} editStyle The default styling for the edit field
     * @param {Object} editField The edit field markup provided by the integrator
     * 
     * @return eField The styled edit field   
     */
    fluid.inlineEdit.setupEditField = function (editStyle, editField) {
        var eField = $(editField);
        eField = eField.length ? eField : $("<input type='text' class='flc-inlineEdit-edit'/>");
        eField.addClass(editStyle);
        return eField;
    };

    /**
     * Set up the edit container and append the edit field to the container.  If an edit container
     * is not provided, default markup is created.
     * 
     * @param {Object} displayContainer The display mode container 
     * @param {Object} editField The edit field that is to be appended to the edit container 
     * @param {Object} editContainer The edit container markup provided by the integrator   
     * 
     * @return eContainer The edit container containing the edit field   
     */
    fluid.inlineEdit.setupEditContainer = function (displayContainer, editField, editContainer) {
        var eContainer = $(editContainer);
        eContainer = eContainer.length ? eContainer : $("<span></span>");
        displayContainer.after(eContainer);
        eContainer.append(editField);
        
        return eContainer;
    };
    
    /**
     * Default renderer for the edit mode view.
     * 
     * @return {Object} container The edit container containing the edit field
     *                  field The styled edit field  
     */
    fluid.inlineEdit.defaultEditModeRenderer = function (that) {
        var editField = fluid.inlineEdit.setupEditField(that.options.styles.edit, that.editField);
        var editContainer = fluid.inlineEdit.setupEditContainer(that.displayModeRenderer, editField, that.editContainer);
        var editModeInstruction = fluid.inlineEdit.setupEditModeInstruction(that.options.styles.editModeInstruction, that.options.strings.editModeInstruction);
        
        var id = fluid.allocateSimpleId(editModeInstruction);
        editField.attr("aria-describedby", id);

        fluid.inlineEdit.positionEditModeInstruction(editModeInstruction, editContainer, editField);
              
        // Package up the container and field for the component.
        return {
            container: editContainer,
            field: editField 
        };
    };
    
    /**
     * Configures the edit container and view, and uses the component's editModeRenderer to render
     * the edit container.
     *  
     * @param {boolean} lazyEditView If true, will delay rendering of the edit container;
     *                                            Default is false 
     */
    fluid.inlineEdit.renderEditContainer = function (that, lazyEditView) {
        that.editContainer = that.locate("editContainer");
        that.editField = that.locate("edit");
        if (that.editContainer.length !== 1) {
            if (that.editContainer.length > 1) {
                fluid.fail("InlineEdit did not find a unique container for selector " + that.options.selectors.editContainer +
                   ": " + fluid.dumpEl(that.editContainer));
            }
        }
        
        if (!lazyEditView) {
            return; 
        } // do not invoke the renderer, unless this is the "final" effective time
        
        var editElms = that.options.editModeRenderer(that);
        if (editElms) {
            that.editContainer = editElms.container;
            that.editField = editElms.field;
        }
    };

    /**
     * Set up the edit mode instruction with aria in edit mode
     * 
     * @param {String} editModeInstructionStyle The default styling for the instruction
     * @param {String} editModeInstructionText The default instruction text
     * 
     * @return {jQuery} The displayed instruction in edit mode
     */
    fluid.inlineEdit.setupEditModeInstruction = function (editModeInstructionStyle, editModeInstructionText) {
        var editModeInstruction = $("<p></p>");
        editModeInstruction.addClass(editModeInstructionStyle);
        editModeInstruction.text(editModeInstructionText);

        return editModeInstruction;
    };

    /**
     * Positions the edit mode instruction directly beneath the edit container
     * 
     * @param {Object} editModeInstruction The displayed instruction in edit mode
     * @param {Object} editContainer The edit container in edit mode
     * @param {Object} editField The edit field in edit mode
     */    
    fluid.inlineEdit.positionEditModeInstruction = function (editModeInstruction, editContainer, editField) {
        editContainer.append(editModeInstruction);
        
        editField.focus(function () {
            editModeInstruction.show();

            var editFieldPosition = editField.offset();
            editModeInstruction.css({left: editFieldPosition.left});
            editModeInstruction.css({top: editFieldPosition.top + editField.height() + 5});
        });
    };  
    
    /**
     * Set up and style the display mode container for the viewEl and the textEditButton 
     * 
     * @param {Object} styles The default styling for the display mode container
     * @param {Object} displayModeWrapper The markup used to generate the display mode container
     * 
     * @return {jQuery} The styled display mode container
     */
    fluid.inlineEdit.setupDisplayModeContainer = function (styles, displayModeWrapper) {
        var displayModeContainer = $(displayModeWrapper);  
        displayModeContainer = displayModeContainer.length ? displayModeContainer : $("<span></span>");  
        displayModeContainer.addClass(styles.displayView);
        
        return displayModeContainer;
    };
    
    /**
     * Retrieve the display text from the DOM.  
     * 
     * @return {jQuery} The display text
     */
    fluid.inlineEdit.setupDisplayText = function (that) {
        var viewEl = that.locate("text");

        /*
         *  Remove the display from the tab order to prevent users to think they
         *  are able to access the inline edit field, but they cannot since the 
         *  keyboard event binding is only on the button.
         */
        viewEl.attr("tabindex", "-1");
        viewEl.addClass(that.options.styles.text);
        
        return viewEl;
    };
    
    /**
     * Set up the textEditButton.  Append a background image with appropriate
     * descriptive text to the button.
     * 
     * @return {jQuery} The accessible button located after the display text
     */
    fluid.inlineEdit.setupTextEditButton = function (that) {
        var opts = that.options;
        var textEditButton = that.locate("textEditButton");
        
        if  (textEditButton.length === 0) {
            var markup = $("<a href='#_' class='flc-inlineEdit-textEditButton'></a>");
            markup.addClass(opts.styles.textEditButton);
            markup.text(opts.tooltipText);            
            
            /**
             * Set text for the button and listen
             * for modelChanged to keep it updated
             */ 
            fluid.inlineEdit.updateTextEditButton(markup, that.model.value || opts.defaultViewText, opts.strings.textEditButton);
            that.events.modelChanged.addListener(function () {
                fluid.inlineEdit.updateTextEditButton(markup, that.model.value || opts.defaultViewText, opts.strings.textEditButton);
            });        
            
            that.locate("text").after(markup);
            
            // Refresh the textEditButton with the newly appended options
            textEditButton = that.locate("textEditButton");
        } 
        return textEditButton;
    };    

    /**
     * Update the textEditButton text with the current value of the field.
     * 
     * @param {Object} textEditButton the textEditButton
     * @param {String} model The current value of the inline editable text
     * @param {Object} strings Text option for the textEditButton
     */
    fluid.inlineEdit.updateTextEditButton = function (textEditButton, value, stringTemplate) {
        var buttonText = fluid.stringTemplate(stringTemplate, {
            text: value
        });
        textEditButton.text(buttonText);
    };
    
    /**
     * Bind mouse hover event handler to the display mode container.  
     * 
     * @param {Object} displayModeRenderer The display mode container
     * @param {String} invitationStyle The default styling for the display mode container on mouse hover
     */
    fluid.inlineEdit.bindHoverHandlers = function (displayModeRenderer, invitationStyle) {
        var over = function (evt) {
            displayModeRenderer.addClass(invitationStyle);
        };     
        var out = function (evt) {
            displayModeRenderer.removeClass(invitationStyle);
        };
        displayModeRenderer.hover(over, out);
    };    
    
    /**
     * Bind keyboard focus and blur event handlers to an element
     * 
     * @param {Object} element The element to which the event handlers are bound
     * @param {Object} displayModeRenderer The display mode container
     * @param {Ojbect} styles The default styling for the display mode container on mouse hover
     */    
    fluid.inlineEdit.bindHighlightHandler = function (element, displayModeRenderer, styles) {
        element = $(element);
        
        var focusOn = function () {
            displayModeRenderer.addClass(styles.focus);
            displayModeRenderer.addClass(styles.invitation);
        };
        var focusOff = function () {
            displayModeRenderer.removeClass(styles.focus);
            displayModeRenderer.removeClass(styles.invitation);
        };
        
        element.focus(focusOn);
        element.blur(focusOff);
    };        
    
    /**
     * Bind mouse click handler to an element
     * 
     * @param {Object} element The element to which the event handler is bound
     * @param {Object} edit Function to invoke the edit mode
     * 
     * @return {boolean} Returns false if entering edit mode
     */
    fluid.inlineEdit.bindMouseHandlers = function (element, edit) {
        element = $(element);
        
        var triggerGuard = fluid.inlineEdit.makeEditTriggerGuard(element, edit);
        element.click(function (e) {
            triggerGuard(e);
            return false;
        });
    };

    /**
     * Bind keyboard press handler to an element
     * 
     * @param {Object} element The element to which the event handler is bound
     * @param {Object} edit Function to invoke the edit mode
     * 
     * @return {boolean} Returns false if entering edit mode
     */    
    fluid.inlineEdit.bindKeyboardHandlers = function (element, edit) {
        element = $(element);
        element.attr("role", "button");
        
        var guard = fluid.inlineEdit.makeEditTriggerGuard(element, edit);
        fluid.activatable(element, function (event) {
            return guard(event);
        });
    };
    
    /**
     * Creates an event handler that will trigger the edit mode if caused by something other
     * than standard HTML controls. The event handler will return false if entering edit mode.
     * 
     * @param {Object} element The element to trigger the edit mode
     * @param {Object} edit Function to invoke the edit mode
     * 
     * @return {function} The event handler function
     */    
    fluid.inlineEdit.makeEditTriggerGuard = function (element, edit) {
        var selector = fluid.unwrap(element);
        return function (event) {
            // FLUID-2017 - avoid triggering edit mode when operating standard HTML controls. Ultimately this
            // might need to be extensible, in more complex authouring scenarios.
            var outer = fluid.findAncestor(event.target, function (elem) {
                if (/input|select|textarea|button|a/i.test(elem.nodeName) || elem === selector) {
                    return true; 
                }
            });
            if (outer === selector) {
                edit();
                return false;
            }
        };
    };
    
    /**
     * Render the display mode view.  
     * 
     * @return {jQuery} The display container containing the display text and 
     *                             textEditbutton for display mode view
     */
    fluid.inlineEdit.defaultDisplayModeRenderer = function (that) {
        var styles = that.options.styles;
        
        var displayModeWrapper = fluid.inlineEdit.setupDisplayModeContainer(styles);
        var displayModeRenderer = that.viewEl.wrap(displayModeWrapper).parent();
        
        that.textEditButton = fluid.inlineEdit.setupTextEditButton(that);
        displayModeRenderer.append(that.textEditButton);
        
        // Add event handlers.
        fluid.inlineEdit.bindHoverHandlers(displayModeRenderer, styles.invitation);
        fluid.inlineEdit.bindMouseHandlers(that.viewEl, that.edit);
        fluid.inlineEdit.bindMouseHandlers(that.textEditButton, that.edit);
        fluid.inlineEdit.bindKeyboardHandlers(that.textEditButton, that.edit);
        fluid.inlineEdit.bindHighlightHandler(that.viewEl, displayModeRenderer, styles);
        fluid.inlineEdit.bindHighlightHandler(that.textEditButton, displayModeRenderer, styles);
        
        return displayModeRenderer;
    };    
    
    fluid.inlineEdit.standardAccessor = function (element) {
        var nodeName = element.nodeName.toLowerCase();
        var func = "input" === nodeName || "textarea" === nodeName ? "val" : "text";
        return {
            value: function (newValue) {
                return $(element)[func](newValue);
            }
        };
    };
    
    fluid.inlineEdit.standardDisplayView = function (viewEl) {
        var that = {
            refreshView: function (componentThat, source) {
                if (componentThat.model.value) {
                    showEditedText(componentThat);
                } else if (componentThat.options.defaultViewText) {
                    showDefaultViewText(componentThat);
                } else {
                    showNothing(componentThat);
                }
                // If necessary, pad the view element enough that it will be evident to the user.
                if ($.trim(componentThat.viewEl.text()).length === 0) {
                    componentThat.viewEl.addClass(componentThat.options.styles.emptyDefaultViewText);
                    
                    if (componentThat.existingPadding < componentThat.options.paddings.minimumView) {
                        componentThat.viewEl.css('padding-right', componentThat.options.paddings.minimumView);
                    }
                }
            }
        };
        return that;
    };
    
    fluid.inlineEdit.standardEditView = function (editField) {
        var that = {
            refreshView: function (componentThat, source) {
                if (!source || componentThat.editField && componentThat.editField.index(source) === -1) {
                    componentThat.editView.value(componentThat.model.value);
                }
            }
        };
        $.extend(true, that, fluid.inlineEdit.standardAccessor(editField));
        return that;
    };
    
    /**
     * Instantiates a list of InlineEdit components.
     * 
     * @param {Object} componentContainer the element containing the inline editors
     * @param {Object} options configuration options for the components
     */
    fluid.inlineEdits = function (componentContainer, options) {
        options = options || {};
        var selectors = $.extend({}, fluid.defaults("inlineEdits").selectors, options.selectors);
        
        // Bind to the DOM.
        var container = fluid.container(componentContainer);
        var editables = $(selectors.editables, container);
        
        return setupInlineEdits(editables, options);
    };
    
    fluid.defaults("inlineEdit", {  
        selectors: {
            text: ".flc-inlineEdit-text",
            editContainer: ".flc-inlineEdit-editContainer",
            edit: ".flc-inlineEdit-edit",
            textEditButton: ".flc-inlineEdit-textEditButton"
        },
        
        styles: {
            text: "fl-inlineEdit-text",
            edit: "fl-inlineEdit-edit",
            invitation: "fl-inlineEdit-invitation",
            defaultViewStyle: "fl-inlineEdit-emptyText-invitation",
            emptyDefaultViewText: "fl-inlineEdit-emptyDefaultViewText",
            focus: "fl-inlineEdit-focus",
            tooltip: "fl-inlineEdit-tooltip",
            editModeInstruction: "fl-inlineEdit-editModeInstruction",
            displayView: "fl-inlineEdit-simple-editableText fl-inlineEdit-textContainer",
            textEditButton: "fl-offScreen-hidden"
        },
        
        events: {
            modelChanged: null,
            onBeginEdit: "preventable",
            afterBeginEdit: null,
            onFinishEdit: "preventable",
            afterFinishEdit: null,
            afterInitEdit: null
        },

        strings: {
            textEditButton: "Edit text %text",
            editModeInstruction: "Escape to cancel, Enter or Tab when finished"
        },
        
        paddings: {
            edit: 10,
            minimumEdit: 80,
            minimumView: 60
        },
        
        applyEditPadding: true,
        
        blurHandlerBinder: null,
        
        // set this to true or false to cause unconditional submission, otherwise it will
        // be inferred from the edit element tag type.
        submitOnEnter: undefined,
        
        modelComparator: null,
        
        displayAccessor: {
            type: "fluid.inlineEdit.standardAccessor"
        },
        
        displayView: {
            type: "fluid.inlineEdit.standardDisplayView"
        },
        
        editAccessor: {
            type: "fluid.inlineEdit.standardAccessor"
        },
        
        editView: {
            type: "fluid.inlineEdit.standardEditView"
        },
        
        displayModeRenderer: fluid.inlineEdit.defaultDisplayModeRenderer,
            
        editModeRenderer: fluid.inlineEdit.defaultEditModeRenderer,
        
        lazyEditView: false,
        
        // this is here for backwards API compatibility, but should be in the strings block
        defaultViewText: "Click here to edit",

        /** View Mode Tooltip Settings **/
        useTooltip: true,
        
        // this is here for backwards API compatibility, but should be in the strings block
        tooltipText: "Select or press Enter to edit",
        
        tooltipDelay: 1000,

        selectOnEdit: false        
    });
    
    fluid.defaults("inlineEdits", {
        selectors: {
            editables: ".flc-inlineEditable"
        }
    });
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2010 University of Toronto
Copyright 2010 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid, fluid_1_4:true, CKEDITOR, jQuery, FCKeditor, FCKeditorAPI, FCKeditor_OnComplete, tinyMCE*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    /*************************************
     * Shared Rich Text Editor functions *
     *************************************/
     
    fluid.inlineEdit.makeViewAccessor = function (editorGetFn, setValueFn, getValueFn) {
        return function (editField) {
            return {
                value: function (newValue) {
                    var editor = editorGetFn(editField);
                    if (!editor) {
                        if (newValue) {
                            $(editField).val(newValue);
                        }
                        return "";
                    }
                    if (newValue) {
                        setValueFn(editField, editor, newValue);
                    }
                    else {
                        return getValueFn(editor);
                    }
                }
            };
        };
    };
    
    fluid.inlineEdit.richTextViewAccessor = function (element) {
        return {
            value: function (newValue) {
                return $(element).html(newValue);
            }
        };
    };        
    
    var configureInlineEdit = function (configurationName, container, options) {
        var defaults = fluid.defaults(configurationName); 
        var assembleOptions = fluid.merge(defaults ? defaults.mergePolicy: null, {}, defaults, options);
        return fluid.inlineEdit(container, assembleOptions);
    };

    fluid.inlineEdit.normalizeHTML = function (value) {
        var togo = $.trim(value.replace(/\s+/g, " "));
        togo = togo.replace(/\s+<\//g, "</");
        togo = togo.replace(/\<(\S+)[^\>\s]*\>/g, function (match) {
            return match.toLowerCase();
        });
        return togo;
    };
    
    fluid.inlineEdit.htmlComparator = function (el1, el2) {
        return fluid.inlineEdit.normalizeHTML(el1) ===
           fluid.inlineEdit.normalizeHTML(el2);
    };
    
    fluid.inlineEdit.bindRichTextHighlightHandler = function (element, displayModeRenderer, invitationStyle) {
        element = $(element);
        
        var focusOn = function () {
            displayModeRenderer.addClass(invitationStyle);
        };
        var focusOff = function () {
            displayModeRenderer.removeClass(invitationStyle);
        };
        
        element.focus(focusOn);
        element.blur(focusOff);
    };        
    
    fluid.inlineEdit.setupRichTextEditButton = function (that) {
        var opts = that.options;
        var textEditButton = that.locate("textEditButton");
        
        if  (textEditButton.length === 0) {
            var markup = $("<a href='#_' class='flc-inlineEdit-textEditButton'></a>");
            markup.text(opts.strings.textEditButton);
            
            that.locate("text").after(markup);
            
            // Refresh the textEditButton with the newly appended options
            textEditButton = that.locate("textEditButton");
        } 
        return textEditButton;
    };    
    
    /**
     * Wrap the display text and the textEditButton with the display mode container  
     * for better style control.
     */
    fluid.inlineEdit.richTextDisplayModeRenderer = function (that) {
        var styles = that.options.styles;
        
        var displayModeWrapper = fluid.inlineEdit.setupDisplayModeContainer(styles);
        var displayModeRenderer = that.viewEl.wrap(displayModeWrapper).parent();
        
        that.textEditButton = fluid.inlineEdit.setupRichTextEditButton(that);
        displayModeRenderer.append(that.textEditButton);
        displayModeRenderer.addClass(styles.focus);
        
        // Add event handlers.
        fluid.inlineEdit.bindHoverHandlers(displayModeRenderer, styles.invitation);
        fluid.inlineEdit.bindMouseHandlers(that.textEditButton, that.edit);
        fluid.inlineEdit.bindKeyboardHandlers(that.textEditButton, that.edit);
        fluid.inlineEdit.bindRichTextHighlightHandler(that.viewEl, displayModeRenderer, styles.invitation);
        fluid.inlineEdit.bindRichTextHighlightHandler(that.textEditButton, displayModeRenderer, styles.invitation);
        
        return displayModeRenderer;
    };        

   
    /************************
     * Tiny MCE Integration *
     ************************/
    
    /**
     * Instantiate a rich-text InlineEdit component that uses an instance of TinyMCE.
     * 
     * @param {Object} componentContainer the element containing the inline editors
     * @param {Object} options configuration options for the components
     */
    fluid.inlineEdit.tinyMCE = function (container, options) {
        var inlineEditor = configureInlineEdit("fluid.inlineEdit.tinyMCE", container, options);
        tinyMCE.init(inlineEditor.options.tinyMCE);
        return inlineEditor;
    };
        
    fluid.inlineEdit.tinyMCE.getEditor = function (editField) {
        return tinyMCE.get(editField.id);
    };
    
    fluid.inlineEdit.tinyMCE.setValue = function (editField, editor, value) {
        // without this, there is an intermittent race condition if the editor has been created on this event.
        $(editField).val(value); 
        editor.setContent(value, {format : 'raw'});
    };
    
    fluid.inlineEdit.tinyMCE.getValue = function (editor) {
        return editor.getContent();
    };
    
    var flTinyMCE = fluid.inlineEdit.tinyMCE; // Shorter alias for awfully long fully-qualified names.
    flTinyMCE.viewAccessor = fluid.inlineEdit.makeViewAccessor(flTinyMCE.getEditor, 
                                                               flTinyMCE.setValue,
                                                               flTinyMCE.getValue);
   
    fluid.inlineEdit.tinyMCE.blurHandlerBinder = function (that) {
        function focusEditor(editor) {
            setTimeout(function () {
                tinyMCE.execCommand('mceFocus', false, that.editField[0].id);
                if ($.browser.mozilla && $.browser.version.substring(0, 3) === "1.8") {
                    // Have not yet found any way to make this work on FF2.x - best to do nothing,
                    // for FLUID-2206
                    //var body = editor.getBody();
                    //fluid.setCaretToEnd(body.firstChild, "");
                    return;
                }
                editor.selection.select(editor.getBody(), 1);
                editor.selection.collapse(0);
            }, 10);
        }
        
        that.events.afterInitEdit.addListener(function (editor) {
            focusEditor(editor);
            var editorBody = editor.getBody();

            // NB - this section has no effect - on most browsers no focus events
            // are delivered to the actual body
            fluid.deadMansBlur(that.editField, 
                {exclusions: {body: $(editorBody)}, 
                    handler: function () {
                        that.cancel();
                    }
                });
        });
            
        that.events.afterBeginEdit.addListener(function () {
            var editor = tinyMCE.get(that.editField[0].id);
            if (editor) {
                focusEditor(editor);
            } 
        });
    };
   
    fluid.inlineEdit.tinyMCE.editModeRenderer = function (that) {
        var options = that.options.tinyMCE;
        options.elements = fluid.allocateSimpleId(that.editField);
        var oldinit = options.init_instance_callback;
        
        options.init_instance_callback = function (instance) {
            that.events.afterInitEdit.fire(instance);
            if (oldinit) {
                oldinit();
            }
        };
        
        tinyMCE.init(options);
    };
    
    fluid.defaults("fluid.inlineEdit.tinyMCE", {
        tinyMCE : {
            mode: "exact", 
            theme: "simple"
        },
        useTooltip: true,
        selectors: {
            edit: "textarea" 
        },
        styles: {
            invitation: "fl-inlineEdit-richText-invitation",
            displayView: "fl-inlineEdit-textContainer",
            text: ""
                
        },
        strings: {
            textEditButton: "Edit"
        },
        displayAccessor: {
            type: "fluid.inlineEdit.richTextViewAccessor"
        },
        editAccessor: {
            type: "fluid.inlineEdit.tinyMCE.viewAccessor"
        },
        lazyEditView: true,
        defaultViewText: "Click Edit",
        modelComparator: fluid.inlineEdit.htmlComparator,
        blurHandlerBinder: fluid.inlineEdit.tinyMCE.blurHandlerBinder,
        displayModeRenderer: fluid.inlineEdit.richTextDisplayModeRenderer,
        editModeRenderer: fluid.inlineEdit.tinyMCE.editModeRenderer
    });
    
    
    /*****************************
     * FCKEditor 2.x Integration *
     *****************************/
         
    /**
     * Instantiate a rich-text InlineEdit component that uses an instance of FCKeditor.
     * Support for FCKEditor 2.x is now deprecated. We recommend the use of the simpler and more
     * accessible CKEditor 3 instead.
     * 
     * @param {Object} componentContainer the element containing the inline editors
     * @param {Object} options configuration options for the components
     */
    fluid.inlineEdit.FCKEditor = function (container, options) {
        return configureInlineEdit("fluid.inlineEdit.FCKEditor", container, options);
    };
    
    fluid.inlineEdit.FCKEditor.getEditor = function (editField) {
        var editor = typeof(FCKeditorAPI) === "undefined" ? null: FCKeditorAPI.GetInstance(editField.id);
        return editor;
    };
    
    fluid.inlineEdit.FCKEditor.complete = fluid.event.getEventFirer();
    
    fluid.inlineEdit.FCKEditor.complete.addListener(function (editor) {
        var editField = editor.LinkedField;
        var that = $.data(editField, "fluid.inlineEdit.FCKEditor");
        if (that && that.events) {
            that.events.afterInitEdit.fire(editor);
        }
    });
    
    fluid.inlineEdit.FCKEditor.blurHandlerBinder = function (that) {
        function focusEditor(editor) {
            editor.Focus(); 
        }
        
        that.events.afterInitEdit.addListener(
            function (editor) {
                focusEditor(editor);
            }
        );
        that.events.afterBeginEdit.addListener(function () {
            var editor = fluid.inlineEdit.FCKEditor.getEditor(that.editField[0]);
            if (editor) {
                focusEditor(editor);
            } 
        });

    };
    
    fluid.inlineEdit.FCKEditor.editModeRenderer = function (that) {
        var id = fluid.allocateSimpleId(that.editField);
        $.data(fluid.unwrap(that.editField), "fluid.inlineEdit.FCKEditor", that);
        var oFCKeditor = new FCKeditor(id);
        // The Config object and the FCKEditor object itself expose different configuration sets,
        // which possess a member "BasePath" with different meanings. Solve FLUID-2452, FLUID-2438
        // by auto-inferring the inner path for Config (method from http://drupal.org/node/344230 )
        var opcopy = fluid.copy(that.options.FCKEditor);
        opcopy.BasePath = opcopy.BasePath + "editor/";
        $.extend(true, oFCKeditor.Config, opcopy);
        // somehow, some properties like Width and Height are set on the object itself

        $.extend(true, oFCKeditor, that.options.FCKEditor);
        oFCKeditor.Config.fluidInstance = that;
        oFCKeditor.ReplaceTextarea();
    };

    fluid.inlineEdit.FCKEditor.setValue = function (editField, editor, value) {
        editor.SetHTML(value);
    };
    
    fluid.inlineEdit.FCKEditor.getValue = function (editor) {
        return editor.GetHTML();
    };
    
    var flFCKEditor = fluid.inlineEdit.FCKEditor;
    
    flFCKEditor.viewAccessor = fluid.inlineEdit.makeViewAccessor(flFCKEditor.getEditor,
                                                                 flFCKEditor.setValue,
                                                                 flFCKEditor.getValue);
    
    fluid.defaults("fluid.inlineEdit.FCKEditor", {
        selectors: {
            edit: "textarea" 
        },
        styles: {
            invitation: "fl-inlineEdit-richText-invitation",
            displayView: "fl-inlineEdit-textContainer",
            text: ""
        },
        strings: {
            textEditButton: "Edit"
        },        
        displayAccessor: {
            type: "fluid.inlineEdit.richTextViewAccessor"
        },
        editAccessor: {
            type: "fluid.inlineEdit.FCKEditor.viewAccessor"
        },
        lazyEditView: true,
        defaultViewText: "Click Edit",
        modelComparator: fluid.inlineEdit.htmlComparator,
        blurHandlerBinder: fluid.inlineEdit.FCKEditor.blurHandlerBinder,
        displayModeRenderer: fluid.inlineEdit.richTextDisplayModeRenderer,
        editModeRenderer: fluid.inlineEdit.FCKEditor.editModeRenderer,
        FCKEditor: {
            BasePath: "fckeditor/"    
        }
    });
    
    
    /****************************
     * CKEditor 3.x Integration *
     ****************************/
    
    fluid.inlineEdit.CKEditor = function (container, options) {
        return configureInlineEdit("fluid.inlineEdit.CKEditor", container, options);
    };
    
    fluid.inlineEdit.CKEditor.getEditor = function (editField) {
        return CKEDITOR.instances[editField.id];
    };
    
    fluid.inlineEdit.CKEditor.setValue = function (editField, editor, value) {
        editor.setData(value);
    };
    
    fluid.inlineEdit.CKEditor.getValue = function (editor) {
        return editor.getData();
    };
    
    var flCKEditor = fluid.inlineEdit.CKEditor;
    flCKEditor.viewAccessor = fluid.inlineEdit.makeViewAccessor(flCKEditor.getEditor,
                                                                flCKEditor.setValue,
                                                                flCKEditor.getValue);
                             
    fluid.inlineEdit.CKEditor.focus = function (editor) {
        setTimeout(function () {
            // CKEditor won't focus itself except in a timeout.
            editor.focus();
        }, 0);
    };
    
    // Special hacked HTML normalisation for CKEditor which spuriously inserts whitespace
    // just after the first opening tag
    fluid.inlineEdit.CKEditor.normalizeHTML = function (value) {
        var togo = fluid.inlineEdit.normalizeHTML(value);
        var angpos = togo.indexOf(">");
        if (angpos !== -1 && angpos < togo.length - 1) {
            if (togo.charAt(angpos + 1) !== " ") {
                togo = togo.substring(0, angpos + 1) + " " + togo.substring(angpos + 1);
            }
        }
        return togo;
    };
    
    fluid.inlineEdit.CKEditor.htmlComparator = function (el1, el2) {
        return fluid.inlineEdit.CKEditor.normalizeHTML(el1) ===
           fluid.inlineEdit.CKEditor.normalizeHTML(el2);
    };
                                    
    fluid.inlineEdit.CKEditor.blurHandlerBinder = function (that) {
        that.events.afterInitEdit.addListener(fluid.inlineEdit.CKEditor.focus);
        that.events.afterBeginEdit.addListener(function () {
            var editor = fluid.inlineEdit.CKEditor.getEditor(that.editField[0]);
            if (editor) {
                fluid.inlineEdit.CKEditor.focus(editor);
            }
        });
    };
    
    fluid.inlineEdit.CKEditor.editModeRenderer = function (that) {
        var id = fluid.allocateSimpleId(that.editField);
        $.data(fluid.unwrap(that.editField), "fluid.inlineEdit.CKEditor", that);
        var editor = CKEDITOR.replace(id, that.options.CKEditor);
        editor.on("instanceReady", function (e) {
            fluid.inlineEdit.CKEditor.focus(e.editor);
            that.events.afterInitEdit.fire(e.editor);
        });
    };                                                     
    
    fluid.defaults("fluid.inlineEdit.CKEditor", {
        selectors: {
            edit: "textarea" 
        },
        styles: {
            invitation: "fl-inlineEdit-richText-invitation",
            displayView: "fl-inlineEdit-textContainer",
            text: ""
        },
        strings: {
            textEditButton: "Edit"
        },        
        displayAccessor: {
            type: "fluid.inlineEdit.richTextViewAccessor"
        },
        editAccessor: {
            type: "fluid.inlineEdit.CKEditor.viewAccessor"
        },
        lazyEditView: true,
        defaultViewText: "Click Edit",
        modelComparator: fluid.inlineEdit.CKEditor.htmlComparator,
        blurHandlerBinder: fluid.inlineEdit.CKEditor.blurHandlerBinder,
        displayModeRenderer: fluid.inlineEdit.richTextDisplayModeRenderer,
        editModeRenderer: fluid.inlineEdit.CKEditor.editModeRenderer,
        CKEditor: {
            // CKEditor-specific configuration goes here.
        }
    });
 
    
    /************************
     * Dropdown Integration *
     ************************/    
    /**
     * Instantiate a drop-down InlineEdit component
     * 
     * @param {Object} container
     * @param {Object} options
     */
    fluid.inlineEdit.dropdown = function (container, options) {
        return configureInlineEdit("fluid.inlineEdit.dropdown", container, options);
    };

    fluid.inlineEdit.dropdown.editModeRenderer = function (that) {
        var id = fluid.allocateSimpleId(that.editField);
        that.editField.selectbox({
            finishHandler: function () {
                that.finish();
            }
        });
        return {
            container: that.editContainer,
            field: $("input.selectbox", that.editContainer) 
        };
    };
   
    fluid.inlineEdit.dropdown.blurHandlerBinder = function (that) {
        fluid.deadMansBlur(that.editField, {
            exclusions: {selectBox: $("div.selectbox-wrapper", that.editContainer)},
            handler: function () {
                that.cancel();
            }
        });
    };
    
    fluid.defaults("fluid.inlineEdit.dropdown", {
        applyEditPadding: false,
        blurHandlerBinder: fluid.inlineEdit.dropdown.blurHandlerBinder,
        editModeRenderer: fluid.inlineEdit.dropdown.editModeRenderer
    });
})(jQuery, fluid_1_4);


// This must be written outside any scope as a result of the FCKEditor event model.
// Do not overwrite this function, if you wish to add your own listener to FCK completion,
// register it with the standard fluid event firer at fluid.inlineEdit.FCKEditor.complete
function FCKeditor_OnComplete(editorInstance) {
    fluid.inlineEdit.FCKEditor.complete.fire(editorInstance);
}
/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2010 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    /** 
     * Returns the absolute position of a supplied DOM node in pixels.
     * Implementation taken from quirksmode http://www.quirksmode.org/js/findpos.html
     */
    fluid.dom.computeAbsolutePosition = function (element) {
        var curleft = 0, curtop = 0;
        if (element.offsetParent) {
            do {
                curleft += element.offsetLeft;
                curtop += element.offsetTop;
                element = element.offsetParent;
            } while (element);
            return [curleft, curtop];
        }
    };
    
    /** 
     * Cleanse the children of a DOM node by removing all <script> tags.
     * This is necessary to prevent the possibility that these blocks are
     * reevaluated if the node were reattached to the document. 
     */
    fluid.dom.cleanseScripts = function (element) {
        var cleansed = $.data(element, fluid.dom.cleanseScripts.MARKER);
        if (!cleansed) {
            fluid.dom.iterateDom(element, function (node) {
                return node.tagName.toLowerCase() === "script"? "delete" : null;
            });
            $.data(element, fluid.dom.cleanseScripts.MARKER, true);
        }
    };  
    fluid.dom.cleanseScripts.MARKER = "fluid-scripts-cleansed";

    /**
     * Inserts newChild as the next sibling of refChild.
     * @param {Object} newChild
     * @param {Object} refChild
     */
    fluid.dom.insertAfter = function (newChild, refChild) {
        var nextSib = refChild.nextSibling;
        if (!nextSib) {
            refChild.parentNode.appendChild(newChild);
        }
        else {
            refChild.parentNode.insertBefore(newChild, nextSib);
        }
    };
    
    // The following two functions taken from http://developer.mozilla.org/En/Whitespace_in_the_DOM
    /**
     * Determine whether a node's text content is entirely whitespace.
     *
     * @param node  A node implementing the |CharacterData| interface (i.e.,
     *              a |Text|, |Comment|, or |CDATASection| node
     * @return     True if all of the text content of |nod| is whitespace,
     *             otherwise false.
     */
    fluid.dom.isWhitespaceNode = function (node) {
       // Use ECMA-262 Edition 3 String and RegExp features
        return !(/[^\t\n\r ]/.test(node.data));
    };
    
    /**
     * Determine if a node should be ignored by the iterator functions.
     *
     * @param nod  An object implementing the DOM1 |Node| interface.
     * @return     true if the node is:
     *                1) A |Text| node that is all whitespace
     *                2) A |Comment| node
     *             and otherwise false.
     */
    fluid.dom.isIgnorableNode = function (node) {
        return (node.nodeType === 8) || // A comment node
         ((node.nodeType === 3) && fluid.dom.isWhitespaceNode(node)); // a text node, all ws
    };

})(jQuery, fluid_1_4);
/*
Copyright 2008-2010 University of Cambridge
Copyright 2008-2010 University of Toronto
Copyright 2010 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global window, fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    fluid.orientation = {
        HORIZONTAL: 4,
        VERTICAL: 1
    };
    
    fluid.rectSides = {
        // agree with fluid.orientation
        4: ["left", "right"],
        1: ["top", "bottom"],
        // agree with fluid.direction
        8: "top",
        12: "bottom",
        2: "left",
        3: "right"
    };
    
    /**
     * This is the position, relative to a given drop target, that a dragged item should be dropped.
     */
    fluid.position = {
        BEFORE: -1,
        AFTER: 1,
        INSIDE: 2,
        REPLACE: 3
    };
    
    /**
     * For incrementing/decrementing a count or index, or moving in a rectilinear direction.
     */
    fluid.direction = {
        NEXT: 1,
        PREVIOUS: -1,
        UP: 8,
        DOWN: 12,
        LEFT: 2,
        RIGHT: 3
    };
    
    fluid.directionSign = function (direction) {
        return direction === fluid.direction.UP || direction === fluid.direction.LEFT ? 
             fluid.direction.PREVIOUS : fluid.direction.NEXT;
    };
    
    fluid.directionAxis = function (direction) {
        return direction === fluid.direction.LEFT || direction === fluid.direction.RIGHT ?
            0 : 1; 
    };
    
    fluid.directionOrientation = function (direction) {
        return fluid.directionAxis(direction) ? fluid.orientation.VERTICAL : fluid.orientation.HORIZONTAL;
    };
    
    fluid.keycodeDirection = {
        up: fluid.direction.UP,
        down: fluid.direction.DOWN,
        left: fluid.direction.LEFT,
        right: fluid.direction.RIGHT
    };
    
    // moves a single node in the DOM to a new position relative to another
    fluid.moveDom = function (source, target, position) {
        source = fluid.unwrap(source);
        target = fluid.unwrap(target);
        
        var scan;
        // fluid.log("moveDom source " + fluid.dumpEl(source) + " target " + fluid.dumpEl(target) + " position " + position);     
        if (position === fluid.position.INSIDE) {
            target.appendChild(source);
        }
        else if (position === fluid.position.BEFORE) {
            for (scan = target.previousSibling; ; scan = scan.previousSibling) {
                if (!scan || !fluid.dom.isIgnorableNode(scan)) {
                    if (scan !== source) {
                        fluid.dom.cleanseScripts(source);
                        target.parentNode.insertBefore(source, target);    
                    }
                    break;
                }
            }
        }
        else if (position === fluid.position.AFTER) {
            for (scan = target.nextSibling; ; scan = scan.nextSibling) {
                if (!scan || !fluid.dom.isIgnorableNode(scan)) {
                    if (scan !== source) {
                        fluid.dom.cleanseScripts(source);
                        fluid.dom.insertAfter(source, target);
                    }
                    break;
                }
            }
        }
        else {
            fluid.fail("Unrecognised position supplied to fluid.moveDom: " + position);
        }
    };
    
    // unsupported, NON-API function
    fluid.normalisePosition = function (position, samespan, targeti, sourcei) {
        // convert a REPLACE into a primitive BEFORE/AFTER
        if (position === fluid.position.REPLACE) {
            position = samespan && targeti >= sourcei ? fluid.position.AFTER: fluid.position.BEFORE;
        }
        return position;
    };
    
    fluid.permuteDom = function (element, target, position, sourceelements, targetelements) {
        element = fluid.unwrap(element);
        target = fluid.unwrap(target);
        var sourcei = $.inArray(element, sourceelements);
        if (sourcei === -1) {
            fluid.fail("Error in permuteDom: source element " + fluid.dumpEl(element) + 
                " not found in source list " + fluid.dumpEl(sourceelements));
        }
        var targeti = $.inArray(target, targetelements);
        if (targeti === -1) {
            fluid.fail("Error in permuteDom: target element " + fluid.dumpEl(target) + 
                " not found in source list " + fluid.dumpEl(targetelements));
        }
        var samespan = sourceelements === targetelements;
        position = fluid.normalisePosition(position, samespan, targeti, sourcei);

        //fluid.log("permuteDom sourcei " + sourcei + " targeti " + targeti);
        // cache the old neighbourhood of the element for the final move
        var oldn = {};
        oldn[fluid.position.AFTER] = element.nextSibling;
        oldn[fluid.position.BEFORE] = element.previousSibling;
        fluid.moveDom(sourceelements[sourcei], targetelements[targeti], position);
        
        // perform the leftward-moving, AFTER shift
        var frontlimit = samespan ? targeti - 1: sourceelements.length - 2;
        var i;
        if (position === fluid.position.BEFORE && samespan) { 
            // we cannot do skip processing if the element was "fused against the grain" 
            frontlimit--;
        }
        if (!samespan || targeti > sourcei) {
            for (i = frontlimit; i > sourcei; -- i) {
                fluid.moveDom(sourceelements[i + 1], sourceelements[i], fluid.position.AFTER);
            }
            if (sourcei + 1 < sourceelements.length) {
                fluid.moveDom(sourceelements[sourcei + 1], oldn[fluid.position.AFTER], fluid.position.BEFORE);
            }
        }
        // perform the rightward-moving, BEFORE shift
        var backlimit = samespan ? sourcei - 1: targetelements.length - 1;
        if (position === fluid.position.AFTER) { 
            // we cannot do skip processing if the element was "fused against the grain" 
            targeti++;
        }
        if (!samespan || targeti < sourcei) {
            for (i = targeti; i < backlimit; ++ i) {
                fluid.moveDom(targetelements[i], targetelements[i + 1], fluid.position.BEFORE);
            }
            if (backlimit >= 0 && backlimit < targetelements.length - 1) {
                fluid.moveDom(targetelements[backlimit], oldn[fluid.position.BEFORE], fluid.position.AFTER);
            }                
        }

    };
  
    var curCss = function (a, name) {
        return window.getComputedStyle ? window.getComputedStyle(a, null).getPropertyValue(name) : 
          a.currentStyle[name];
    };
    
    var isAttached = function (node) {
        while (node && node.nodeName) {
            if (node.nodeName === "BODY") {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    };
    
    var generalHidden = function (a) {
        return "hidden" === a.type || curCss(a, "display") === "none" || curCss(a, "visibility") === "hidden" || !isAttached(a);
    };
    

    var computeGeometry = function (element, orientation, disposition) {
        var elem = {};
        elem.element = element;
        elem.orientation = orientation;
        if (disposition === fluid.position.INSIDE) {
            elem.position = disposition;
        }
        if (generalHidden(element)) {
            elem.clazz = "hidden";
        }
        var pos = fluid.dom.computeAbsolutePosition(element) || [0, 0];
        var width = element.offsetWidth;
        var height = element.offsetHeight;
        elem.rect = {left: pos[0], top: pos[1]};
        elem.rect.right = pos[0] + width;
        elem.rect.bottom = pos[1] + height;
        return elem;
    };
    
    // A "suitable large" value for the sentinel blocks at the ends of spans
    var SENTINEL_DIMENSION = 10000;

    function dumprect(rect) {
        return "Rect top: " + rect.top +
                 " left: " + rect.left + 
               " bottom: " + rect.bottom +
                " right: " + rect.right;
    }

    function dumpelem(cacheelem) {
        if (!cacheelem || !cacheelem.rect) {
            return "null";
        } else {
            return dumprect(cacheelem.rect) + " position: " +
            cacheelem.position +
            " for " +
            fluid.dumpEl(cacheelem.element);
        }
    }
    
   
    // unsupported, NON-API function
    fluid.dropManager = function () { 
        var targets = [];
        var cache = {};
        var that = {};        
        
        var lastClosest;              
        var lastGeometry;
        var displacementX, displacementY;
        
        that.updateGeometry = function (geometricInfo) {
            lastGeometry = geometricInfo;
            targets = [];
            cache = {};
            var mapper = geometricInfo.elementMapper;
            for (var i = 0; i < geometricInfo.extents.length; ++ i) {
                var thisInfo = geometricInfo.extents[i];
                var orientation = thisInfo.orientation;
                var sides = fluid.rectSides[orientation];
                
                var processElement = function (element, sentB, sentF, disposition, j) {
                    var cacheelem = computeGeometry(element, orientation, disposition);
                    cacheelem.owner = thisInfo;
                    if (cacheelem.clazz !== "hidden" && mapper) {
                        cacheelem.clazz = mapper(element);
                    }
                    cache[fluid.dropManager.cacheKey(element)] = cacheelem;
                    var backClass = fluid.dropManager.getRelativeClass(thisInfo.elements, j, fluid.position.BEFORE, cacheelem.clazz, mapper); 
                    var frontClass = fluid.dropManager.getRelativeClass(thisInfo.elements, j, fluid.position.AFTER, cacheelem.clazz, mapper); 
                    if (disposition === fluid.position.INSIDE) {
                        targets[targets.length] = cacheelem;
                    }
                    else {
                        fluid.dropManager.splitElement(targets, sides, cacheelem, disposition, backClass, frontClass);
                    }
                    // deal with sentinel blocks by creating near-copies of the end elements
                    if (sentB && geometricInfo.sentinelize) {
                        fluid.dropManager.sentinelizeElement(targets, sides, cacheelem, 1, disposition, backClass);
                    }
                    if (sentF && geometricInfo.sentinelize) {
                        fluid.dropManager.sentinelizeElement(targets, sides, cacheelem, 0, disposition, frontClass);
                    }
                    //fluid.log(dumpelem(cacheelem));
                    return cacheelem;
                };
                
                var allHidden = true;
                for (var j = 0; j < thisInfo.elements.length; ++ j) {
                    var element = thisInfo.elements[j];
                    var cacheelem = processElement(element, j === 0, j === thisInfo.elements.length - 1, 
                            fluid.position.INTERLEAVED, j);
                    if (cacheelem.clazz !== "hidden") {
                        allHidden = false;
                    }
                }
                if (allHidden && thisInfo.parentElement) {
                    processElement(thisInfo.parentElement, true, true, 
                            fluid.position.INSIDE);
                }
            }   
        };
        
        that.startDrag = function (event, handlePos, handleWidth, handleHeight) {
            var handleMidX = handlePos[0] + handleWidth / 2;
            var handleMidY = handlePos[1] + handleHeight / 2;
            var dX = handleMidX - event.pageX;
            var dY = handleMidY - event.pageY;
            that.updateGeometry(lastGeometry);
            lastClosest = null;
            displacementX = dX;
            displacementY = dY;
            $("body").bind("mousemove.fluid-dropManager", that.mouseMove);
        };
        
        that.lastPosition = function () {
            return lastClosest;
        };
        
        that.endDrag = function () {
            $("body").unbind("mousemove.fluid-dropManager");
        };
        
        that.mouseMove = function (evt) {
            var x = evt.pageX + displacementX;
            var y = evt.pageY + displacementY;
            //fluid.log("Mouse x " + x + " y " + y );
            
            var closestTarget = that.closestTarget(x, y, lastClosest);
            if (closestTarget && closestTarget !== fluid.dropManager.NO_CHANGE) {
                lastClosest = closestTarget;
              
                that.dropChangeFirer.fire(closestTarget);
            }
        };
        
        that.dropChangeFirer = fluid.event.getEventFirer();
        
        var blankHolder = {
            element: null
        };
        
        that.closestTarget = function (x, y, lastClosest) {
            var mindistance = Number.MAX_VALUE;
            var minelem = blankHolder;
            var minlockeddistance = Number.MAX_VALUE;
            var minlockedelem = blankHolder;
            for (var i = 0; i < targets.length; ++ i) {
                var cacheelem = targets[i];
                if (cacheelem.clazz === "hidden") {
                    continue;
                }
                var distance = fluid.geom.minPointRectangle(x, y, cacheelem.rect);
                if (cacheelem.clazz === "locked") {
                    if (distance < minlockeddistance) {
                        minlockeddistance = distance;
                        minlockedelem = cacheelem;
                    }
                } else {
                    if (distance < mindistance) {
                        mindistance = distance;
                        minelem = cacheelem;
                    }
                    if (distance === 0) {
                        break;
                    }
                }
            }
            if (!minelem) {
                return minelem;
            }
            if (minlockeddistance >= mindistance) {
                minlockedelem = blankHolder;
            }
            //fluid.log("PRE: mindistance " + mindistance + " element " + 
            //   fluid.dumpEl(minelem.element) + " minlockeddistance " + minlockeddistance
            //    + " locked elem " + dumpelem(minlockedelem));
            if (lastClosest && lastClosest.position === minelem.position &&
                fluid.unwrap(lastClosest.element) === fluid.unwrap(minelem.element) &&
                fluid.unwrap(lastClosest.lockedelem) === fluid.unwrap(minlockedelem.element)
                ) {
                return fluid.dropManager.NO_CHANGE;
            }
            //fluid.log("mindistance " + mindistance + " minlockeddistance " + minlockeddistance);
            return {
                position: minelem.position,
                element: minelem.element,
                lockedelem: minlockedelem.element
            };
        };
        
        that.shuffleProjectFrom = function (element, direction, includeLocked, disableWrap) {
            var togo = that.projectFrom(element, direction, includeLocked, disableWrap);
            if (togo) {
                togo.position = fluid.position.REPLACE;
            }
            return togo;
        };
        
        that.projectFrom = function (element, direction, includeLocked, disableWrap) {
            that.updateGeometry(lastGeometry);
            var cacheelem = cache[fluid.dropManager.cacheKey(element)];
            var projected = fluid.geom.projectFrom(cacheelem.rect, direction, targets, includeLocked, disableWrap);
            if (!projected.cacheelem) {
                return null;
            }
            var retpos = projected.cacheelem.position;
            return {element: projected.cacheelem.element, 
                     position: retpos ? retpos : fluid.position.BEFORE 
                     };
        };
        
        that.logicalFrom = function (element, direction, includeLocked, disableWrap) {
            var orderables = that.getOwningSpan(element, fluid.position.INTERLEAVED, includeLocked);
            return {element: fluid.dropManager.getRelativeElement(element, direction, orderables, disableWrap), 
                position: fluid.position.REPLACE};
        };
           
        that.lockedWrapFrom = function (element, direction, includeLocked, disableWrap) {
            var base = that.logicalFrom(element, direction, includeLocked, disableWrap);
            var selectables = that.getOwningSpan(element, fluid.position.INTERLEAVED, includeLocked);
            var allElements = cache[fluid.dropManager.cacheKey(element)].owner.elements;
            if (includeLocked || selectables[0] === allElements[0]) {
                return base;
            }
            var directElement = fluid.dropManager.getRelativeElement(element, direction, allElements, disableWrap);
            if (lastGeometry.elementMapper(directElement) === "locked") {
                base.element = null;
                base.clazz = "locked";  
            }
            return base;
        }; 
        
        that.getOwningSpan = function (element, position, includeLocked) {
            var owner = cache[fluid.dropManager.cacheKey(element)].owner; 
            var elements = position === fluid.position.INSIDE ? [owner.parentElement] : owner.elements;
            if (!includeLocked && lastGeometry.elementMapper) {
                elements = $.makeArray(elements);
                fluid.remove_if(elements, function (element) {
                    return lastGeometry.elementMapper(element) === "locked";
                });
            }
            return elements;
        };
        
        that.geometricMove = function (element, target, position) {
            var sourceElements = that.getOwningSpan(element, null, true);
            var targetElements = that.getOwningSpan(target, position, true);
            fluid.permuteDom(element, target, position, sourceElements, targetElements);
        };              
        
        return that;
    };    
   
 
    fluid.dropManager.NO_CHANGE = "no change";
    
    fluid.dropManager.cacheKey = function (element) {
        return fluid.allocateSimpleId(element);
    };
    
    fluid.dropManager.sentinelizeElement = function (targets, sides, cacheelem, fc, disposition, clazz) {
        var elemCopy = $.extend(true, {}, cacheelem);
        elemCopy.rect[sides[fc]] = elemCopy.rect[sides[1 - fc]] + (fc ? 1: -1);
        elemCopy.rect[sides[1 - fc]] = (fc ? -1 : 1) * SENTINEL_DIMENSION;
        elemCopy.position = disposition === fluid.position.INSIDE ?
           disposition : (fc ? fluid.position.BEFORE : fluid.position.AFTER);
        elemCopy.clazz = clazz;
        targets[targets.length] = elemCopy;
    };
    
    fluid.dropManager.splitElement = function (targets, sides, cacheelem, disposition, clazz1, clazz2) {
        var elem1 = $.extend(true, {}, cacheelem);
        var elem2 = $.extend(true, {}, cacheelem);
        var midpoint = (elem1.rect[sides[0]] + elem1.rect[sides[1]]) / 2;
        elem1.rect[sides[1]] = midpoint; 
        elem1.position = fluid.position.BEFORE;
        
        elem2.rect[sides[0]] = midpoint; 
        elem2.position = fluid.position.AFTER;
        
        elem1.clazz = clazz1;
        elem2.clazz = clazz2;
        targets[targets.length] = elem1;
        targets[targets.length] = elem2;
    };
    
    // Expand this configuration point if we ever go back to a full "permissions" model
    fluid.dropManager.getRelativeClass = function (thisElements, index, relative, thisclazz, mapper) {
        index += relative;
        if (index < 0 && thisclazz === "locked") {
            return "locked";
        }
        if (index >= thisElements.length || mapper === null) {
            return null;
        } else {
            relative = thisElements[index];
            return mapper(relative) === "locked" && thisclazz === "locked" ? "locked" : null;
        }
    };
    
    fluid.dropManager.getRelativeElement = function (element, direction, elements, disableWrap) {
        var folded = fluid.directionSign(direction);
        
        var index = $(elements).index(element) + folded;
        if (index < 0) {
            index += elements.length;
        }
        
        // disable wrap
        if (disableWrap) {                   
            if (index === elements.length || index === (elements.length + folded)) {
                return element;
            }
        }
          
        index %= elements.length;
        return elements[index];              
    };
    
    fluid.geom = fluid.geom || {};
    
    // These distance algorithms have been taken from
    // http://www.cs.mcgill.ca/~cs644/Godfried/2005/Fall/fzamal/concepts.htm
    
    /** Returns the minimum squared distance between a point and a rectangle **/
    fluid.geom.minPointRectangle = function (x, y, rectangle) {
        var dx = x < rectangle.left ? (rectangle.left - x) : 
                  (x > rectangle.right ? (x - rectangle.right) : 0);
        var dy = y < rectangle.top ? (rectangle.top - y) : 
                  (y > rectangle.bottom ? (y - rectangle.bottom) : 0);
        return dx * dx + dy * dy;
    };
    
    /** Returns the minimum squared distance between two rectangles **/
    fluid.geom.minRectRect = function (rect1, rect2) {
        var dx = rect1.right < rect2.left ? rect2.left - rect1.right : 
                 rect2.right < rect1.left ? rect1.left - rect2.right :0;
        var dy = rect1.bottom < rect2.top ? rect2.top - rect1.bottom : 
                 rect2.bottom < rect1.top ? rect1.top - rect2.bottom :0;
        return dx * dx + dy * dy;
    };
    
    var makePenCollect = function () {
        return {
            mindist: Number.MAX_VALUE,
            minrdist: Number.MAX_VALUE
        };
    };

    /** Determine the one amongst a set of rectangle targets which is the "best fit"
     * for an axial motion from a "base rectangle" (commonly arising from the case
     * of cursor key navigation).
     * @param {Rectangle} baserect The base rectangl from which the motion is to be referred
     * @param {fluid.direction} direction  The direction of motion
     * @param {Array of Rectangle holders} targets An array of objects "cache elements" 
     * for which the member <code>rect</code> is the holder of the rectangle to be tested.
     * @param disableWrap which is used to enable or disable wrapping of elements
     * @return The cache element which is the most appropriate for the requested motion.
     */
    fluid.geom.projectFrom = function (baserect, direction, targets, forSelection, disableWrap) {
        var axis = fluid.directionAxis(direction);
        var frontSide = fluid.rectSides[direction];
        var backSide = fluid.rectSides[axis * 15 + 5 - direction];
        var dirSign = fluid.directionSign(direction);
        
        var penrect = {left: (7 * baserect.left + 1 * baserect.right) / 8,
                       right: (5 * baserect.left + 3 * baserect.right) / 8,
                       top: (7 * baserect.top + 1 * baserect.bottom) / 8,
                       bottom: (5 * baserect.top + 3 * baserect.bottom) / 8};
         
        penrect[frontSide] = dirSign * SENTINEL_DIMENSION;
        penrect[backSide] = -penrect[frontSide];
        
        function accPen(collect, cacheelem, backSign) {
            var thisrect = cacheelem.rect;
            var pdist = fluid.geom.minRectRect(penrect, thisrect);
            var rdist = -dirSign * backSign * (baserect[backSign === 1 ? frontSide:backSide] - 
                                                thisrect[backSign === 1 ? backSide:frontSide]);
            // fluid.log("pdist: " + pdist + " rdist: " + rdist);
            // the oddity in the rdist comparison is intended to express "half-open"-ness of rectangles
            // (backSign === 1 ? 0 : 1) - this is now gone - must be possible to move to perpendicularly abutting regions
            if (pdist <= collect.mindist && rdist >= 0) {
                if (pdist === collect.mindist && rdist * backSign > collect.minrdist) {
                    return;
                }
                collect.minrdist = rdist * backSign;
                collect.mindist = pdist;
                collect.minelem = cacheelem;
            }
        }
        var collect = makePenCollect();
        var backcollect = makePenCollect();
        var lockedcollect = makePenCollect();

        for (var i = 0; i < targets.length; ++ i) {
            var elem = targets[i];
            var isPure = elem.owner && elem.element === elem.owner.parentElement;
            if (elem.clazz === "hidden" || forSelection && isPure) {
                continue;
            }
            else if (!forSelection && elem.clazz === "locked") {
                accPen(lockedcollect, elem, 1);
            }
            else {
                accPen(collect, elem, 1);
                accPen(backcollect, elem, -1);
            }
            //fluid.log("Element " + i + " " + dumpelem(elem) + " mindist " + collect.mindist);
        }
        var wrap = !collect.minelem || backcollect.mindist < collect.mindist;
        
        // disable wrap
        wrap = wrap && !disableWrap;       
                
        var mincollect = wrap ? backcollect: collect;        
        
        var togo = {
            wrapped: wrap,
            cacheelem: mincollect.minelem
        };
        if (lockedcollect.mindist < mincollect.mindist) {
            togo.lockedelem = lockedcollect.minelem;
        }
        return togo;
    };
})(jQuery, fluid_1_4);
/*
Copyright 2007-2009 University of Toronto
Copyright 2007-2010 University of Cambridge
Copyright 2010 OCAD University
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    var defaultAvatarCreator = function (item, cssClass, dropWarning) {
        fluid.dom.cleanseScripts(fluid.unwrap(item));
        var avatar = $(item).clone();
        
        fluid.dom.iterateDom(avatar.get(0), function (node) {
            node.removeAttribute("id");
            if (node.tagName.toLowerCase() === "input") {
                node.setAttribute("disabled", "disabled");
            }
        });
        
        avatar.removeAttr("id");
        avatar.removeClass("ui-droppable");
        avatar.addClass(cssClass);
        
        if (dropWarning) {
            // Will a 'div' always be valid in this position?
            var avatarContainer = $(document.createElement("div"));
            avatarContainer.append(avatar);
            avatarContainer.append(dropWarning);
            avatar = avatarContainer;
        }
        $("body").append(avatar);
        if (!$.browser.safari) {
            // FLUID-1597: Safari appears incapable of correctly determining the dimensions of elements
            avatar.css("display", "block").width(item.offsetWidth).height(item.offsetHeight);
        }
        
        if ($.browser.opera) { // FLUID-1490. Without this detect, curCSS explodes on the avatar on Firefox.
            avatar.hide();
        }
        return avatar;
    };
    
    function bindHandlersToContainer(container, keyDownHandler, keyUpHandler, mouseMoveHandler) {
        var actualKeyDown = keyDownHandler;
        var advancedPrevention = false;

        // FLUID-1598 and others: Opera will refuse to honour a "preventDefault" on a keydown.
        // http://forums.devshed.com/javascript-development-115/onkeydown-preventdefault-opera-485371.html
        if ($.browser.opera) {
            container.keypress(function (evt) {
                if (advancedPrevention) {
                    advancedPrevention = false;
                    evt.preventDefault();
                    return false;
                }
            });
            actualKeyDown = function (evt) {
                var oldret = keyDownHandler(evt);
                if (oldret === false) {
                    advancedPrevention = true;
                }
            };
        }
        container.keydown(actualKeyDown);
        container.keyup(keyUpHandler);
    }
    
    function addRolesToContainer(that) {
        that.container.attr("role", that.options.containerRole.container);
        that.container.attr("aria-multiselectable", "false");
        that.container.attr("aria-readonly", "false");
        that.container.attr("aria-disabled", "false");
        // FLUID-3707: We require to have BOTH application role as well as our named role
        // This however breaks the component completely under NVDA and causes it to perpetually drop back into "browse mode"
        //that.container.wrap("<div role=\"application\"></div>");
    }
    
    function createAvatarId(parentId) {
        // Generating the avatar's id to be containerId_avatar
        // This is safe since there is only a single avatar at a time
        return parentId + "_avatar";
    }
    
    var adaptKeysets = function (options) {
        if (options.keysets && !(options.keysets instanceof Array)) {
            options.keysets = [options.keysets];    
        }
    };
    
    /**
     * @param container - A jQueryable designator for the root node of the reorderer (a selector, a DOM node, or a jQuery instance)
     * @param options - an object containing any of the available options:
     *                  containerRole - indicates the role, or general use, for this instance of the Reorderer
     *                  keysets - an object containing sets of keycodes to use for directional navigation. Must contain:
     *                            modifier - a function that returns a boolean, indicating whether or not the required modifier(s) are activated
     *                            up
     *                            down
     *                            right
     *                            left
     *                  styles - an object containing class names for styling the Reorderer
     *                                  defaultStyle
     *                                  selected
     *                                  dragging
     *                                  hover
     *                                  dropMarker
     *                                  mouseDrag
     *                                  avatar
     *                  avatarCreator - a function that returns a valid DOM node to be used as the dragging avatar
     */
    fluid.reorderer = function (container, options) {
        if (!container) {
            fluid.fail("Reorderer initialised with no container");
        }
        var thatReorderer = fluid.initView("fluid.reorderer", container, options);
        options = thatReorderer.options;
                
        var dropManager = fluid.dropManager();   
                
        thatReorderer.layoutHandler = fluid.initSubcomponent(thatReorderer,
            "layoutHandler", [thatReorderer.container, options, dropManager, thatReorderer.dom]);
        
        thatReorderer.activeItem = undefined;

        adaptKeysets(options);
 
        var kbDropWarning = thatReorderer.locate("dropWarning");
        var mouseDropWarning;
        if (kbDropWarning) {
            mouseDropWarning = kbDropWarning.clone();
        }

        var isMove = function (evt) {
            var keysets = options.keysets;
            for (var i = 0; i < keysets.length; i++) {
                if (keysets[i].modifier(evt)) {
                    return true;
                }
            }
            return false;
        };
        
        var isActiveItemMovable = function () {
            return $.inArray(thatReorderer.activeItem, thatReorderer.dom.fastLocate("movables")) >= 0;
        };
        
        var setDropEffects = function (value) {
            thatReorderer.dom.fastLocate("dropTargets").attr("aria-dropeffect", value);
        };
        
        var styles = options.styles;
        
        var noModifier = function (evt) {
            return (!evt.ctrlKey && !evt.altKey && !evt.shiftKey && !evt.metaKey);
        };
        
        var handleDirectionKeyDown = function (evt) {
            var item = thatReorderer.activeItem;
            if (!item) {
                return true;
            }
            var keysets = options.keysets;
            for (var i = 0; i < keysets.length; i++) {
                var keyset = keysets[i];
                var keydir = fluid.keyForValue(keyset, evt.keyCode);
                if (!keydir) {
                    continue;
                }
                var isMovement = keyset.modifier(evt);
                
                var dirnum = fluid.keycodeDirection[keydir];
                var relativeItem = thatReorderer.layoutHandler.getRelativePosition(item, dirnum, !isMovement);  
                if (!relativeItem) {
                    continue;
                }
                
                if (isMovement) {
                    var prevent = thatReorderer.events.onBeginMove.fire(item);
                    if (prevent === false) {
                        return false;
                    }
                    if (kbDropWarning.length > 0) {
                        if (relativeItem.clazz === "locked") {
                            thatReorderer.events.onShowKeyboardDropWarning.fire(item, kbDropWarning);
                            kbDropWarning.show();                       
                        }
                        else {
                            kbDropWarning.hide();
                        }
                    }
                    if (relativeItem.element) {
                        thatReorderer.requestMovement(relativeItem, item);
                    }
            
                } else if (noModifier(evt)) {
                    item.blur();
                    $(relativeItem.element).focus();
                }
                return false;
            }
            return true;
        };

        // unsupported, NON-API function
        thatReorderer.handleKeyDown = function (evt) {
            if (!thatReorderer.activeItem || thatReorderer.activeItem !== evt.target) {
                return true;
            }
            // If the key pressed is ctrl, and the active item is movable we want to restyle the active item.
            var jActiveItem = $(thatReorderer.activeItem);
            if (!jActiveItem.hasClass(styles.dragging) && isMove(evt)) {
               // Don't treat the active item as dragging unless it is a movable.
                if (isActiveItemMovable()) {
                    jActiveItem.removeClass(styles.selected);
                    jActiveItem.addClass(styles.dragging);
                    jActiveItem.attr("aria-grabbed", "true");
                    setDropEffects("move");
                }
                return false;
            }
            // The only other keys we listen for are the arrows.
            return handleDirectionKeyDown(evt);
        };

        // unsupported, NON-API function
        thatReorderer.handleKeyUp = function (evt) {
            if (!thatReorderer.activeItem || thatReorderer.activeItem !== evt.target) {
                return true;
            }
            var jActiveItem = $(thatReorderer.activeItem);
            
            // Handle a key up event for the modifier
            if (jActiveItem.hasClass(styles.dragging) && !isMove(evt)) {
                if (kbDropWarning) {
                    kbDropWarning.hide();
                }
                jActiveItem.removeClass(styles.dragging);
                jActiveItem.addClass(styles.selected);
                jActiveItem.attr("aria-grabbed", "false");
                setDropEffects("none");
                return false;
            }
            
            return false;
        };

        var dropMarker;

        var createDropMarker = function (tagName) {
            var dropMarker = $(document.createElement(tagName));
            dropMarker.addClass(options.styles.dropMarker);
            dropMarker.hide();
            return dropMarker;
        };
        // unsupported, NON-API function
        thatReorderer.requestMovement = function (requestedPosition, item) {
            item = fluid.unwrap(item);
          // Temporary censoring to get around ModuleLayout inability to update relative to self.
            if (!requestedPosition || fluid.unwrap(requestedPosition.element) === item) {
                return;
            }
            var activeItem = $(thatReorderer.activeItem);
            
            // Fixes FLUID-3288.
            // Need to unbind the blur event as safari will call blur on movements.
            // This caused the user to have to double tap the arrow keys to move.
            activeItem.unbind("blur.fluid.reorderer");
            
            thatReorderer.events.onMove.fire(item, requestedPosition);
            dropManager.geometricMove(item, requestedPosition.element, requestedPosition.position);
            //$(thatReorderer.activeItem).removeClass(options.styles.selected);
           
            // refocus on the active item because moving places focus on the body
            activeItem.focus();
            
            thatReorderer.refresh();
            
            dropManager.updateGeometry(thatReorderer.layoutHandler.getGeometricInfo());

            thatReorderer.events.afterMove.fire(item, requestedPosition, thatReorderer.dom.fastLocate("movables"));
        };

        var hoverStyleHandler = function (item, state) {
            thatReorderer.dom.fastLocate("grabHandle", item)[state ? "addClass":"removeClass"](styles.hover);
        };
        /**
         * Takes a $ object and adds 'movable' functionality to it
         */
        function initMovable(item) {
            var styles = options.styles;
            item.attr("aria-grabbed", "false");

            item.mouseover(
                function () {
                    thatReorderer.events.onHover.fire(item, true);
                }
            );
        
            item.mouseout(
                function () {
                    thatReorderer.events.onHover.fire(item, false);
                }
            );
            var avatar;
        
            thatReorderer.dom.fastLocate("grabHandle", item).draggable({
                refreshPositions: false,
                scroll: true,
                helper: function () {
                    var dropWarningEl;
                    if (mouseDropWarning) {
                        dropWarningEl = mouseDropWarning[0];
                    }
                    avatar = $(options.avatarCreator(item[0], styles.avatar, dropWarningEl));
                    avatar.attr("id", createAvatarId(thatReorderer.container.id));
                    return avatar;
                },
                start: function (e, ui) {
                    var prevent = thatReorderer.events.onBeginMove.fire(item);
                    if (prevent === false) {
                        return false;
                    }
                    var handle = thatReorderer.dom.fastLocate("grabHandle", item)[0];
                    var handlePos = fluid.dom.computeAbsolutePosition(handle);
                    var handleWidth = handle.offsetWidth;
                    var handleHeight = handle.offsetHeight;
                    item.focus();
                    item.removeClass(options.styles.selected);
                    item.addClass(options.styles.mouseDrag);
                    item.attr("aria-grabbed", "true");
                    setDropEffects("move");
                    dropManager.startDrag(e, handlePos, handleWidth, handleHeight);
                    avatar.show();
                },
                stop: function (e, ui) {
                    item.removeClass(options.styles.mouseDrag);
                    item.addClass(options.styles.selected);
                    $(thatReorderer.activeItem).attr("aria-grabbed", "false");
                    var markerNode = fluid.unwrap(dropMarker);
                    if (markerNode.parentNode) {
                        markerNode.parentNode.removeChild(markerNode);
                    }
                    avatar.hide();
                    ui.helper = null;
                    setDropEffects("none");
                    dropManager.endDrag();
                    
                    thatReorderer.requestMovement(dropManager.lastPosition(), item);
                    // refocus on the active item because moving places focus on the body
                    thatReorderer.activeItem.focus();
                },
                handle: thatReorderer.dom.fastLocate("grabHandle", item)
            });
        }
           
        function changeSelectedToDefault(jItem, styles) {
            jItem.removeClass(styles.selected);
            jItem.removeClass(styles.dragging);
            jItem.addClass(styles.defaultStyle);
            jItem.attr("aria-selected", "false");
        }
           
        var selectItem = function (anItem) {
            thatReorderer.events.onSelect.fire(anItem);
            var styles = options.styles;
            // Set the previous active item back to its default state.
            if (thatReorderer.activeItem && thatReorderer.activeItem !== anItem) {
                changeSelectedToDefault($(thatReorderer.activeItem), styles);
            }
            // Then select the new item.
            thatReorderer.activeItem = anItem;
            var jItem = $(anItem);
            jItem.removeClass(styles.defaultStyle);
            jItem.addClass(styles.selected);
            jItem.attr("aria-selected", "true");
        };
   
        var initSelectables = function () {
            var handleBlur = function (evt) {
                changeSelectedToDefault($(this), options.styles);
                return evt.stopPropagation();
            };
        
            var handleFocus = function (evt) {
                selectItem(this);
                return evt.stopPropagation();
            };
            
            var selectables = thatReorderer.dom.fastLocate("selectables");
            for (var i = 0; i < selectables.length; ++ i) {
                var selectable = $(selectables[i]);
                if (!$.data(selectable[0], "fluid.reorderer.selectable-initialised")) { 
                    selectable.addClass(styles.defaultStyle);
            
                    selectable.bind("blur.fluid.reorderer", handleBlur);
                    selectable.focus(handleFocus);
                    selectable.click(function (evt) {
                        var handle = fluid.unwrap(thatReorderer.dom.fastLocate("grabHandle", this));
                        if (fluid.dom.isContainer(handle, evt.target)) {
                            $(this).focus();
                        }
                    });
                    
                    selectable.attr("role", options.containerRole.item);
                    selectable.attr("aria-selected", "false");
                    selectable.attr("aria-disabled", "false");
                    $.data(selectable[0], "fluid.reorderer.selectable-initialised", true);
                }
            }
            if (!thatReorderer.selectableContext) {
                thatReorderer.selectableContext = fluid.selectable(thatReorderer.container, {
                    selectableElements: selectables,
                    selectablesTabindex: thatReorderer.options.selectablesTabindex,
                    direction: null
                });
            }
        };
    
        var dropChangeListener = function (dropTarget) {
            fluid.moveDom(dropMarker, dropTarget.element, dropTarget.position);
            dropMarker.css("display", "");
            if (mouseDropWarning) {
                if (dropTarget.lockedelem) {
                    mouseDropWarning.show();
                }
                else {
                    mouseDropWarning.hide();
                }
            }
        };
    
        var initItems = function () {
            var movables = thatReorderer.dom.fastLocate("movables");
            var dropTargets = thatReorderer.dom.fastLocate("dropTargets");
            initSelectables();
        
            // Setup movables
            for (var i = 0; i < movables.length; i++) {
                var item = movables[i];
                if (!$.data(item, "fluid.reorderer.movable-initialised")) { 
                    initMovable($(item));
                    $.data(item, "fluid.reorderer.movable-initialised", true);
                }
            }

            // In order to create valid html, the drop marker is the same type as the node being dragged.
            // This creates a confusing UI in cases such as an ordered list. 
            // drop marker functionality should be made pluggable. 
            if (movables.length > 0 && !dropMarker) {
                dropMarker = createDropMarker(movables[0].tagName);
            }
            
            dropManager.updateGeometry(thatReorderer.layoutHandler.getGeometricInfo());
            
            dropManager.dropChangeFirer.addListener(dropChangeListener, "fluid.Reorderer");
            // Set up dropTargets
            dropTargets.attr("aria-dropeffect", "none");  

        };


        // Final initialization of the Reorderer at the end of the construction process 
        if (thatReorderer.container) {
            bindHandlersToContainer(thatReorderer.container, 
                thatReorderer.handleKeyDown,
                thatReorderer.handleKeyUp);
            addRolesToContainer(thatReorderer);
            fluid.tabbable(thatReorderer.container);
            initItems();
        }

        if (options.afterMoveCallbackUrl) {
            thatReorderer.events.afterMove.addListener(function () {
                var layoutHandler = thatReorderer.layoutHandler;
                var model = layoutHandler.getModel ? layoutHandler.getModel():
                     options.acquireModel(thatReorderer);
                $.post(options.afterMoveCallbackUrl, JSON.stringify(model));
            }, "postModel");
        }
        thatReorderer.events.onHover.addListener(hoverStyleHandler, "style");

        thatReorderer.refresh = function () {
            thatReorderer.dom.refresh("movables");
            thatReorderer.dom.refresh("selectables");
            thatReorderer.dom.refresh("grabHandle", thatReorderer.dom.fastLocate("movables"));
            thatReorderer.dom.refresh("stylisticOffset", thatReorderer.dom.fastLocate("movables"));
            thatReorderer.dom.refresh("dropTargets");
            thatReorderer.events.onRefresh.fire();
            initItems();
            thatReorderer.selectableContext.selectables = thatReorderer.dom.fastLocate("selectables");
            thatReorderer.selectableContext.selectablesUpdated(thatReorderer.activeItem);
        };
        
        fluid.initDependents(thatReorderer);

        thatReorderer.refresh();

        return thatReorderer;
    };
    
    /**
     * Constants for key codes in events.
     */    
    fluid.reorderer.keys = {
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        META: 19,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        i: 73,
        j: 74,
        k: 75,
        m: 77
    };
    
    /**
     * The default key sets for the Reorderer. Should be moved into the proper component defaults.
     */
    fluid.reorderer.defaultKeysets = [{
        modifier : function (evt) {
            return evt.ctrlKey;
        },
        up : fluid.reorderer.keys.UP,
        down : fluid.reorderer.keys.DOWN,
        right : fluid.reorderer.keys.RIGHT,
        left : fluid.reorderer.keys.LEFT
    },
    {
        modifier : function (evt) {
            return evt.ctrlKey;
        },
        up : fluid.reorderer.keys.i,
        down : fluid.reorderer.keys.m,
        right : fluid.reorderer.keys.k,
        left : fluid.reorderer.keys.j
    }];
    
    /**
     * These roles are used to add ARIA roles to orderable items. This list can be extended as needed,
     * but the values of the container and item roles must match ARIA-specified roles.
     */  
    fluid.reorderer.roles = {
        GRID: { container: "grid", item: "gridcell" },
        LIST: { container: "list", item: "listitem" },
        REGIONS: { container: "main", item: "article" }
    };
    
    // Simplified API for reordering lists and grids.
    var simpleInit = function (container, layoutHandler, options) {
        options = options || {};
        options.layoutHandler = layoutHandler;
        return fluid.reorderer(container, options);
    };
    
    fluid.reorderList = function (container, options) {
        return simpleInit(container, "fluid.listLayoutHandler", options);
    };
    
    fluid.reorderGrid = function (container, options) {
        return simpleInit(container, "fluid.gridLayoutHandler", options); 
    };
    
    fluid.reorderer.SHUFFLE_GEOMETRIC_STRATEGY = "shuffleProjectFrom";
    fluid.reorderer.GEOMETRIC_STRATEGY         = "projectFrom";
    fluid.reorderer.LOGICAL_STRATEGY           = "logicalFrom";
    fluid.reorderer.WRAP_LOCKED_STRATEGY       = "lockedWrapFrom";
    fluid.reorderer.NO_STRATEGY = null;
    
    // unsupported, NON-API function
    fluid.reorderer.relativeInfoGetter = function (orientation, coStrategy, contraStrategy, dropManager, dom, disableWrap) {
        return function (item, direction, forSelection) {
            var dirorient = fluid.directionOrientation(direction);
            var strategy = dirorient === orientation ? coStrategy: contraStrategy;
            return strategy !== null ? dropManager[strategy](item, direction, forSelection, disableWrap) : null;
        };
    };
    
    fluid.defaults("fluid.reorderer", {
        styles: {
            defaultStyle: "fl-reorderer-movable-default",
            selected: "fl-reorderer-movable-selected",
            dragging: "fl-reorderer-movable-dragging",
            mouseDrag: "fl-reorderer-movable-dragging",
            hover: "fl-reorderer-movable-hover",
            dropMarker: "fl-reorderer-dropMarker",
            avatar: "fl-reorderer-avatar"
        },
        selectors: {
            dropWarning: ".flc-reorderer-dropWarning",
            movables: ".flc-reorderer-movable",
            grabHandle: "",
            stylisticOffset: ""
        },
        avatarCreator: defaultAvatarCreator,
        keysets: fluid.reorderer.defaultKeysets,
        layoutHandler: {
            type: "fluid.listLayoutHandler"
        },
        
        events: {
            onShowKeyboardDropWarning: null,
            onSelect: null,
            onBeginMove: "preventable",
            onMove: null,
            afterMove: null,
            onHover: null,
            onRefresh: null
        },
        
        mergePolicy: {
            keysets: "replace",
            "selectors.labelSource": "selectors.grabHandle",
            "selectors.selectables": "selectors.movables",
            "selectors.dropTargets": "selectors.movables"
        },
        components: {
            labeller: {
                type: "fluid.reorderer.labeller",
                options: {
                    dom: "{reorderer}.dom",
                    getGeometricInfo: "{reorderer}.layoutHandler.getGeometricInfo",
                    orientation: "{reorderer}.options.orientation",
                    layoutType: "{reorderer}.options.layoutHandler" // TODO, get rid of "global defaults"
                }          
            }
        },
        
        // The user option to enable or disable wrapping of elements within the container
        disableWrap: false        
        
    });


    /*******************
     * Layout Handlers *
     *******************/

    // unsupported, NON-API function
    fluid.reorderer.makeGeometricInfoGetter = function (orientation, sentinelize, dom) {
        return function () {
            var that = {
                sentinelize: sentinelize,
                extents: [{
                    orientation: orientation,
                    elements: dom.fastLocate("dropTargets")
                }],
                elementMapper: function (element) {
                    return $.inArray(element, dom.fastLocate("movables")) === -1 ? "locked": null;
                },
                elementIndexer: function (element) {
                    var selectables = dom.fastLocate("selectables");
                    return {
                        elementClass: that.elementMapper(element),
                        index: $.inArray(element, selectables),
                        length: selectables.length
                    };
                }
            };
            return that;
        };
    };
    
    fluid.defaults(true, "fluid.listLayoutHandler", 
        {orientation:         fluid.orientation.VERTICAL,
         containerRole:       fluid.reorderer.roles.LIST,
         selectablesTabindex: -1,
         sentinelize:         true
        });
    
    // Public layout handlers.
    fluid.listLayoutHandler = function (container, options, dropManager, dom) {
        var that = {};

        that.getRelativePosition = 
          fluid.reorderer.relativeInfoGetter(options.orientation, 
                fluid.reorderer.LOGICAL_STRATEGY, null, dropManager, dom, options.disableWrap);
        
        that.getGeometricInfo = fluid.reorderer.makeGeometricInfoGetter(options.orientation, options.sentinelize, dom);
        
        return that;
    }; // End ListLayoutHandler

    fluid.defaults(true, "fluid.gridLayoutHandler", 
        {orientation:         fluid.orientation.HORIZONTAL,
         containerRole:       fluid.reorderer.roles.GRID,
         selectablesTabindex: -1,
         sentinelize:         false
         });
    /*
     * Items in the Lightbox are stored in a list, but they are visually presented as a grid that
     * changes dimensions when the window changes size. As a result, when the user presses the up or
     * down arrow key, what lies above or below depends on the current window size.
     * 
     * The GridLayoutHandler is responsible for handling changes to this virtual 'grid' of items
     * in the window, and of informing the Lightbox of which items surround a given item.
     */
    fluid.gridLayoutHandler = function (container, options, dropManager, dom) {
        var that = {};

        that.getRelativePosition = 
           fluid.reorderer.relativeInfoGetter(options.orientation, 
                 options.disableWrap ? fluid.reorderer.SHUFFLE_GEOMETRIC_STRATEGY : fluid.reorderer.LOGICAL_STRATEGY, fluid.reorderer.SHUFFLE_GEOMETRIC_STRATEGY, 
                 dropManager, dom, options.disableWrap);
        
        that.getGeometricInfo = fluid.reorderer.makeGeometricInfoGetter(options.orientation, options.sentinelize, dom);
        
        return that;
    }; // End of GridLayoutHandler

    fluid.defaults("fluid.reorderer.labeller", {
        strings: {
            overallTemplate: "%recentStatus %item %position %movable",
            position:        "%index of %length",
            position_moduleLayoutHandler: "%index of %length in %moduleCell %moduleIndex of %moduleLength",
            moduleCell_0:    "row", // NB, these keys must agree with fluid.a11y.orientation constants
            moduleCell_1:    "column",
            movable:         "movable",
            fixed:           "fixed",
            recentStatus:    "moved from position %position"
        },
        components: {
            resolver: {
                type: "fluid.messageResolver",
                options: {
                    messageBase: "{labeller}.options.strings"
                }
            }
        },
        invokers: {
            renderLabel: {
                funcName: "fluid.reorderer.labeller.renderLabel",
                args: ["{labeller}", "@0", "@1"]
            }  
        }
    });

    // unsupported, NON-API function
    // Convert from 0-based to 1-based indices for announcement
    fluid.reorderer.indexRebaser = function (indices) {
        indices.index++;
        if (indices.moduleIndex !== undefined) {
            indices.moduleIndex++;
        }
        return indices;
    };

    /*************
     * Labelling *
     *************/
     
    fluid.reorderer.labeller = function (options) {
        var that = fluid.initLittleComponent("fluid.reorderer.labeller", options);
        fluid.initDependents(that);
        that.dom = that.options.dom;
        
        that.moduleCell = that.resolver.resolve("moduleCell_" + that.options.orientation);
        var layoutType = fluid.computeNickName(that.options.layoutType);
        that.positionTemplate = that.resolver.lookup(["position_" + layoutType, "position"]);
        
        var movedMap = {};
        
        that.returnedOptions = {
            listeners: {
                onRefresh: function () {
                    var selectables = that.dom.locate("selectables");
                    fluid.each(selectables, function (selectable) {
                        var labelOptions = {};
                        var id = fluid.allocateSimpleId(selectable);
                        var moved = movedMap[id];
                        var label = that.renderLabel(selectable);
                        var plainLabel = label;
                        if (moved) {
                            moved.newRender = plainLabel;
                            label = that.renderLabel(selectable, moved.oldRender.position);
                            $(selectable).one("focusout", function () {
                                if (movedMap[id]) {
                                    var oldLabel = movedMap[id].newRender.label;
                                    delete movedMap[id];
                                    fluid.updateAriaLabel(selectable, oldLabel);
                                }
                            });
                            labelOptions.dynamicLabel = true;
                        }
                        fluid.updateAriaLabel(selectable, label.label, labelOptions);
                    });
                },
                onMove: function (item, newPosition) {
                    fluid.clear(movedMap); // if we somehow were fooled into missing a defocus, at least clear the map on a 2nd move
                    var movingId = fluid.allocateSimpleId(item);
                    movedMap[movingId] = {
                        oldRender: that.renderLabel(item)
                    };
                }
            }
        };
        return that;
    };
    
    fluid.reorderer.labeller.renderLabel = function (that, selectable, recentPosition) {
        var geom = that.options.getGeometricInfo();
        var indices = fluid.reorderer.indexRebaser(geom.elementIndexer(selectable));
        indices.moduleCell = that.moduleCell;
            
        var elementClass = geom.elementMapper(selectable);
        var labelSource = that.dom.locate("labelSource", selectable);
        var recentStatus;
        if (recentPosition) {
            recentStatus = that.resolver.resolve("recentStatus", {position: recentPosition});
        }
        var topModel = {
            item: typeof(labelSource) === "string" ? labelSource: fluid.dom.getElementText(fluid.unwrap(labelSource)),
            position: that.positionTemplate.resolveFunc(that.positionTemplate.template, indices),
            movable: that.resolver.resolve(elementClass === "locked" ? "fixed" : "movable"),
            recentStatus: recentStatus || ""
        };
        
        var template = that.resolver.lookup(["overallTemplate"]);
        var label = template.resolveFunc(template.template, topModel);
        return {
            position: topModel.position,
            label: label
        };
    };

})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    var deriveLightboxCellBase = function (namebase, index) {
        return namebase + "lightbox-cell:" + index + ":";
    };
            
    var addThumbnailActivateHandler = function (container) {
        var enterKeyHandler = function (evt) {
            if (evt.which === fluid.reorderer.keys.ENTER) {
                var thumbnailAnchors = $("a", evt.target);
                document.location = thumbnailAnchors.attr("href");
            }
        };
        
        container.keypress(enterKeyHandler);
    };
    
    // Custom query method seeks all tags descended from a given root with a 
    // particular tag name, whose id matches a regex.
    var seekNodesById = function (rootnode, tagname, idmatch) {
        var inputs = rootnode.getElementsByTagName(tagname);
        var togo = [];
        for (var i = 0; i < inputs.length; i += 1) {
            var input = inputs[i];
            var id = input.id;
            if (id && id.match(idmatch)) {
                togo.push(input);
            }
        }
        return togo;
    };
    
    var createImageCellFinder = function (parentNode, containerId) {
        parentNode = fluid.unwrap(parentNode);
        
        var lightboxCellNamePattern = "^" + deriveLightboxCellBase(containerId, "[0-9]+") + "$";
        
        return function () {
            // This orderable finder assumes that the lightbox thumbnails are 'div' elements
            return seekNodesById(parentNode, "div", lightboxCellNamePattern);
        };
    };
    
    var seekForm = function (container) {
        return fluid.findAncestor(container, function (element) {
            return $(element).is("form");
        });
    };
    
    var seekInputs = function (container, reorderform) {
        return seekNodesById(reorderform, 
                             "input", 
                             "^" + deriveLightboxCellBase(container.attr("id"), "[^:]*") + "reorder-index$");
    };
    
    var mapIdsToNames = function (container, reorderform) {
        var inputs = seekInputs(container, reorderform);
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            var name = input.name;
            input.name = name || input.id;
        }
    };
    
    /**
     * Returns a default afterMove listener using the id-based, form-driven scheme for communicating with the server.
     * It is implemented by nesting hidden form fields inside each thumbnail container. The value of these form elements
     * represent the order for each image. This default listener submits the form's default 
     * action via AJAX.
     * 
     * @param {jQueryable} container the Image Reorderer's container element 
     */
    var createIDAfterMoveListener = function (container) {
        var reorderform = seekForm(container);
        mapIdsToNames(container, reorderform);
        
        return function () {
            var inputs, i;
            inputs = seekInputs(container, reorderform);
            
            for (i = 0; i < inputs.length; i += 1) {
                inputs[i].value = i;
            }
        
            if (reorderform && reorderform.action) {
                var order = $(reorderform).serialize();
                $.post(reorderform.action, 
                       order,
                       function (type, data, evt) { /* No-op response */ });
            }
        };
    };

    
    var setDefaultValue = function (target, path, value) {
        var previousValue = fluid.get(target, path);
        var valueToSet = previousValue || value;
        fluid.set(target, path, valueToSet);
    };
    
    // Public Lightbox API
    /**
     * Creates a new Lightbox instance from the specified parameters, providing full control over how
     * the Lightbox is configured.
     * 
     * @param {Object} container 
     * @param {Object} options 
     */
    fluid.reorderImages = function (container, options) {
        // Instantiate a mini-Image Reorderer component, then feed its options to the real Reorderer.
        var that = fluid.initView("fluid.reorderImages", container, options);
        
        // If the user didn't specify their own afterMove or movables options,
        // set up defaults for them using the old id-based scheme.
        // Backwards API compatiblity. Remove references to afterMoveCallback by Infusion 1.5.
        setDefaultValue(that, "options.listeners.afterMove", 
                        that.options.afterMoveCallback || createIDAfterMoveListener(that.container));
        setDefaultValue(that, "options.selectors.movables", 
                        createImageCellFinder(that.container, that.container.attr("id")));
        
        var reorderer = fluid.reorderer(that.container, that.options);
        
        fluid.tabindex($("a", that.container), -1);
        addThumbnailActivateHandler(that.container);
        
        return reorderer;
    };
   
    // This function now deprecated. Please use fluid.reorderImages() instead.
    fluid.lightbox = fluid.reorderImages;
    
    fluid.defaults("fluid.reorderImages", {
        layoutHandler: "fluid.gridLayoutHandler",

        selectors: {
            labelSource: ".flc-reorderer-imageTitle"
        }
    });

})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010-2011 OCAD University
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
    
    fluid.registerNamespace("fluid.moduleLayout");

    /**
     * Calculate the location of the item and the column in which it resides.
     * @return  An object with column index and item index (within that column) properties.
     *          These indices are -1 if the item does not exist in the grid.
     */
    // unsupported - NON-API function
    fluid.moduleLayout.findColumnAndItemIndices = function (item, layout) {
        return fluid.find(layout.columns,
            function (column, colIndex) {
                var index = $.inArray(item, column.elements);
                return index === -1 ? undefined : {columnIndex: colIndex, itemIndex: index};
            }, {columnIndex: -1, itemIndex: -1});
    };
    // unsupported - NON-API function
    fluid.moduleLayout.findColIndex = function (item, layout) {
        return fluid.find(layout.columns,
            function (column, colIndex) {
                return item === column.container ? colIndex : undefined;
            }, -1);
    };

    /**
     * Move an item within the layout object. 
     */
    // unsupported - NON-API function
    fluid.moduleLayout.updateLayout = function (item, target, position, layout) {
        item = fluid.unwrap(item);
        target = fluid.unwrap(target);
        var itemIndices = fluid.moduleLayout.findColumnAndItemIndices(item, layout);
        layout.columns[itemIndices.columnIndex].elements.splice(itemIndices.itemIndex, 1);
        var targetCol;
        if (position === fluid.position.INSIDE) {
            targetCol = layout.columns[fluid.moduleLayout.findColIndex(target, layout)].elements;
            targetCol.splice(targetCol.length, 0, item);

        } else {
            var relativeItemIndices = fluid.moduleLayout.findColumnAndItemIndices(target, layout);
            targetCol = layout.columns[relativeItemIndices.columnIndex].elements;
            position = fluid.normalisePosition(position, 
                  itemIndices.columnIndex === relativeItemIndices.columnIndex, 
                  relativeItemIndices.itemIndex, itemIndices.itemIndex);
            var relative = position === fluid.position.BEFORE ? 0 : 1;
            targetCol.splice(relativeItemIndices.itemIndex + relative, 0, item);
        }
    };
       
    /**
     * Builds a layout object from a set of columns and modules.
     * @param {jQuery} container
     * @param {jQuery} columns
     * @param {jQuery} portlets
     */
    fluid.moduleLayout.layoutFromFlat = function (container, columns, portlets) {
        var layout = {};
        layout.container = container;
        layout.columns = fluid.transform(columns, 
            function (column) {
                return {
                    container: column,
                    elements: $.makeArray(portlets.filter(function () {
                          // is this a bug in filter? would have expected "this" to be 1st arg
                        return fluid.dom.isContainer(column, this);
                    }))
                };
            });
        return layout;
    };
      
    /**
     * Builds a layout object from a serialisable "layout" object consisting of id lists
     */
    fluid.moduleLayout.layoutFromIds = function (idLayout) {
        return {
            container: fluid.byId(idLayout.id),
            columns: fluid.transform(idLayout.columns, function (column) {
                return {
                    container: fluid.byId(column.id),
                    elements: fluid.transform(column.children, fluid.byId)
                };
            })
        };
    };
      
    /**
     * Serializes the current layout into a structure of ids
     */
    fluid.moduleLayout.layoutToIds = function (idLayout) {
        return {
            id: fluid.getId(idLayout.container),
            columns: fluid.transform(idLayout.columns, function (column) {
                return {
                    id: fluid.getId(column.container),
                    children: fluid.transform(column.elements, fluid.getId)
                };
            })
        };
    };
    
    var defaultOnShowKeyboardDropWarning = function (item, dropWarning) {
        if (dropWarning) {
            var offset = $(item).offset();
            dropWarning = $(dropWarning);
            dropWarning.css("position", "absolute");
            dropWarning.css("top", offset.top);
            dropWarning.css("left", offset.left);
        }
    };
    
    fluid.defaults(true, "fluid.moduleLayoutHandler", 
        {orientation: fluid.orientation.VERTICAL,
         containerRole: fluid.reorderer.roles.REGIONS,
         selectablesTabindex: -1,
         sentinelize:         true
         });
       
    /**
     * Module Layout Handler for reordering content modules.
     * 
     * General movement guidelines:
     * 
     * - Arrowing sideways will always go to the top (moveable) module in the column
     * - Moving sideways will always move to the top available drop target in the column
     * - Wrapping is not necessary at this first pass, but is ok
     */
    fluid.moduleLayoutHandler = function (container, options, dropManager, dom) {
        var that = {};
        
        function computeLayout() {
            var togo;
            if (options.selectors.modules) {
                togo = fluid.moduleLayout.layoutFromFlat(container, dom.locate("columns"), dom.locate("modules"));
            }
            if (!togo) {
                var idLayout = fluid.get(options, "moduleLayout.layout");
                fluid.moduleLayout.layoutFromIds(idLayout);
            }
            return togo;
        }
        var layout = computeLayout();
        that.layout = layout;
        
        function isLocked(item) {
            var lockedModules = options.selectors.lockedModules ? dom.fastLocate("lockedModules") : [];
            return $.inArray(item, lockedModules) !== -1;
        }

        that.getRelativePosition  = 
           fluid.reorderer.relativeInfoGetter(options.orientation, 
                 fluid.reorderer.WRAP_LOCKED_STRATEGY, fluid.reorderer.GEOMETRIC_STRATEGY, 
                 dropManager, dom, options.disableWrap);
                 
        that.getGeometricInfo = function () {
            var extents = [];
            var togo = {extents: extents,
                        sentinelize: options.sentinelize};
            togo.elementMapper = function (element) {
                return isLocked(element) ? "locked" : null;
            };
            togo.elementIndexer = function (element) {
                var indices = fluid.moduleLayout.findColumnAndItemIndices(element, that.layout);
                return {
                    index:        indices.itemIndex,
                    length:       layout.columns[indices.columnIndex].elements.length,
                    moduleIndex:  indices.columnIndex,
                    moduleLength: layout.columns.length
                };
            };
            for (var col = 0; col < layout.columns.length; col++) {
                var column = layout.columns[col];
                var thisEls = {
                    orientation: options.orientation,
                    elements: $.makeArray(column.elements),
                    parentElement: column.container
                };
              //  fluid.log("Geometry col " + col + " elements " + fluid.dumpEl(thisEls.elements) + " isLocked [" + 
              //       fluid.transform(thisEls.elements, togo.elementMapper).join(", ") + "]");
                extents.push(thisEls);
            }

            return togo;
        };
        
        function computeModules(all) {
            return function () {
                var modules = fluid.accumulate(layout.columns, function (column, list) {
                    return list.concat(column.elements); // note that concat will not work on a jQuery
                }, []);
                if (!all) {
                    fluid.remove_if(modules, isLocked);
                }
                return modules;
            };
        }
        
        that.returnedOptions = {
            selectors: {
                movables: computeModules(false),
                dropTargets: computeModules(false),
                selectables: computeModules(true)
            },
            listeners: {
                onMove: {
                    priority: "last",
                    listener: function (item, requestedPosition) {
                        fluid.moduleLayout.updateLayout(item, requestedPosition.element, requestedPosition.position, layout);
                    }
                },
                onRefresh: function () {
                    layout = computeLayout();
                    that.layout = layout;
                },
                "onShowKeyboardDropWarning.setPosition": defaultOnShowKeyboardDropWarning
            }
        };
        
        that.getModel = function () {
            return fluid.moduleLayout.layoutToIds(layout);
        };
              
        return that;
    };
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {
 
    /**
     * Simple way to create a layout reorderer.
     * @param {selector} a jQueryable (selector, element, jQuery) for the layout container
     * @param {Object} a map of selectors for columns and modules within the layout
     * @param {Function} a function to be called when the order changes 
     * @param {Object} additional configuration options
     */
    fluid.reorderLayout = function (container, userOptions) {
        var assembleOptions = {
            layoutHandler: "fluid.moduleLayoutHandler",
            selectors: {
                columns: ".flc-reorderer-column",
                modules: ".flc-reorderer-module"
            }
        };
        var options = $.extend(true, assembleOptions, userOptions);
        return fluid.reorderer(container, options);
    };    
})(jQuery, fluid_1_4);
/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2010-2011 OCAD University
Copyright 2010 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_4:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_4 = fluid_1_4 || {};

(function ($, fluid) {

    /******************
     * Pager Bar View *
     ******************/

    
    function updateStyles(pageListThat, newModel, oldModel) {
        if (!pageListThat.pageLinks) {
            return;
        }
        if (oldModel.pageIndex !== undefined) {
            var oldLink = pageListThat.pageLinks.eq(oldModel.pageIndex);
            oldLink.removeClass(pageListThat.options.styles.currentPage);
        }
        var pageLink = pageListThat.pageLinks.eq(newModel.pageIndex);
        pageLink.addClass(pageListThat.options.styles.currentPage); 
    }
    
    function bindLinkClick(link, events, eventArg) {
        link.unbind("click.fluid.pager");
        link.bind("click.fluid.pager", function () {
            events.initiatePageChange.fire(eventArg);
        });
    }
    
    // 10 -> 1, 11 -> 2
    function computePageCount(model) {
        model.pageCount = Math.max(1, Math.floor((model.totalRange - 1) / model.pageSize) + 1);
    }

    fluid.pager = function () {
        return fluid.pagerImpl.apply(null, arguments);
    };
    
    fluid.pager.computePageLimit = function (model) {
        return Math.min(model.totalRange, (model.pageIndex + 1) * model.pageSize);
    };

    fluid.pager.directPageList = function (container, events, options) {
        var that = fluid.initView("fluid.pager.directPageList", container, options);
        that.pageLinks = that.locate("pageLinks");
        for (var i = 0; i < that.pageLinks.length; ++i) {
            var pageLink = that.pageLinks.eq(i);
            bindLinkClick(pageLink, events, {pageIndex: i});
        }
        events.onModelChange.addListener(
            function (newModel, oldModel) {
                updateStyles(that, newModel, oldModel);
            }
        );
        that.defaultModel = {
            pageIndex: undefined,
            pageSize: 1,
            totalRange: that.pageLinks.length
        };
        return that;
    };
    
    /** Returns an array of size count, filled with increasing integers, 
     *  starting at 0 or at the index specified by first. 
     */
    
    fluid.iota = function (count, first) {
        first = first || 0;
        var togo = [];
        for (var i = 0; i < count; ++i) {
            togo[togo.length] = first++;
        }
        return togo;
    };
    
    fluid.pager.everyPageStrategy = fluid.iota;
    
    fluid.pager.gappedPageStrategy = function (locality, midLocality) {
        if (!locality) {
            locality = 3;
        }
        if (!midLocality) {
            midLocality = locality;
        }
        return function (count, first, mid) {
            var togo = [];
            var j = 0;
            var lastSkip = false;
            for (var i = 0; i < count; ++i) {
                if (i < locality || (count - i - 1) < locality || (i >= mid - midLocality && i <= mid + midLocality)) {
                    togo[j++] = i;
                    lastSkip = false;
                } else if (!lastSkip) {
                    togo[j++] = -1;
                    lastSkip = true;
                }
            }
            return togo;
        };
    };
    
    /**
     * An impl of a page strategy that will always display same number of page links (including skip place holders). 
     * @param   endLinkCount    int     The # of elements first and last trunks of elements
     * @param   midLinkCount    int     The # of elements from beside the selected #
     * @author  Eric Dalquist
     */
    fluid.pager.consistentGappedPageStrategy = function (endLinkCount, midLinkCount) {
        if (!endLinkCount) {
            endLinkCount = 1;
        }
        if (!midLinkCount) {
            midLinkCount = endLinkCount;
        }
        var endWidth = endLinkCount + 2 + midLinkCount;

        return function (count, first, mid) {
            var pages = [];
            var anchoredLeft = mid < endWidth;
            var anchoredRight = mid >= count - endWidth;
            var anchoredEndWidth = endWidth + midLinkCount;
            var midStart = mid - midLinkCount;
            var midEnd = mid + midLinkCount;
            var lastSkip = false;
            
            for (var page = 0; page < count; page++) {
                if (page < endLinkCount || // start pages
                        count - page <= endLinkCount || // end pages
                        (anchoredLeft && page < anchoredEndWidth) || // pages if no skipped pages between start and mid
                        (anchoredRight && page >= count - anchoredEndWidth) || // pages if no skipped pages between mid and end
                        (page >= midStart && page <= midEnd) // pages around the mid
                        ) {
                    pages.push(page);
                    lastSkip = false;
                } else if (!lastSkip) {
                    pages.push(-1);
                    lastSkip = true;
                }
            }
            return pages;
        };
    };  
    
    fluid.pager.renderedPageList = function (container, events, pagerBarOptions, options, strings) {
        options = $.extend(true, pagerBarOptions, options);
        var that = fluid.initView("fluid.pager.renderedPageList", container, options);
        options = that.options; // pick up any defaults
        var idMap = {};
        var renderOptions = {
            cutpoints: [ 
                {
                    id: "page-link:link",
                    selector: pagerBarOptions.selectors.pageLinks
                },
                {
                    id: "page-link:skip",
                    selector: pagerBarOptions.selectors.pageLinkSkip
                }
            ],
            idMap: idMap
        };
        
        if (options.linkBody) {
            renderOptions.cutpoints[renderOptions.cutpoints.length] = {
                id: "payload-component",
                selector: options.linkBody
            };
        }   
        
        var assembleComponent = function (page, isCurrent) {
            var obj = {
                ID: "page-link:link",
                localID: page + 1,
                value: page + 1,
                pageIndex: page,
                decorators: [
                    {
                        type: "jQuery",
                        func: "click", 
                        args: function (event) {
                            events.initiatePageChange.fire({pageIndex: page});
                            event.preventDefault();
                        }
                    }
                ]
            };
            
            if (isCurrent) {
                obj.current = true;
                obj.decorators = obj.decorators.concat([
                    {
                        type: "addClass",
                        classes: that.options.styles.currentPage
                    },
                    {
                        type: "jQuery",
                        func: "attr", 
                        args: ["aria-label", that.options.strings.currentPageIndexMsg] 
                    }
                ]);
            }
            
            return obj;
        };
             
        function pageToComponent(current) {
            return function (page) {
                return page === -1 ? {
                    ID: "page-link:skip"
                } : assembleComponent(page, page === current);
            };
        }
        
        var root = that.locate("root");
        fluid.expectFilledSelector(root, "Error finding root template for fluid.pager.renderedPageList");
        
        var template = fluid.selfRender(root, {}, renderOptions);
        events.onModelChange.addListener(
            function (newModel, oldModel) {
                var pages = that.options.pageStrategy(newModel.pageCount, 0, newModel.pageIndex);
                var pageTree = fluid.transform(pages, pageToComponent(newModel.pageIndex));
                if (pageTree.length > 1) {
                    pageTree[pageTree.length - 1].value = pageTree[pageTree.length - 1].value + strings.last;
                }
                events.onRenderPageLinks.fire(pageTree, newModel);
                
                //Destroys all the tooltips before rerendering the pagelinks.
                //This will clean up the tooltips, which are all added to the end at the end of the DOM,
                //and prevent the tooltips from sticking around when using the keyboard to activate
                //the page links.
                $.each(idMap, function (key, id) {
                    var pageLink = fluid.jById(id);
                    if (pageLink.tooltip) {
                        pageLink.tooltip("destroy");
                    }
                });
                fluid.reRender(template, root, pageTree, renderOptions);
                updateStyles(that, newModel, oldModel);
            }
        );
        return that;
    };
    
    fluid.defaults("fluid.pager.renderedPageList", {
        selectors: {
            root: ".flc-pager-links"
        },
        linkBody: "a",
        pageStrategy: fluid.pager.everyPageStrategy
    });
    
    var updatePreviousNext = function (that, options, newModel) {
        if (newModel.pageIndex === 0) {
            that.previous.addClass(options.styles.disabled);
        } else {
            that.previous.removeClass(options.styles.disabled);
        }
        
        if (newModel.pageIndex === newModel.pageCount - 1) {
            that.next.addClass(options.styles.disabled);
        } else {
            that.next.removeClass(options.styles.disabled);
        }
    };
    
    fluid.pager.previousNext = function (container, events, options) {
        var that = fluid.initView("fluid.pager.previousNext", container, options);
        that.previous = that.locate("previous");
        bindLinkClick(that.previous, events, {relativePage: -1});
        that.next = that.locate("next");
        bindLinkClick(that.next, events, {relativePage: +1});
        events.onModelChange.addListener(
            function (newModel, oldModel, overallThat) {
                updatePreviousNext(that, options, newModel);
            }
        );
        return that;
    };

    fluid.pager.pagerBar = function (events, container, options, strings) {
        var that = fluid.initView("fluid.pager.pagerBar", container, options);
        that.pageList = fluid.initSubcomponent(that, "pageList", 
            [container, events, that.options, fluid.COMPONENT_OPTIONS, strings]);
        that.previousNext = fluid.initSubcomponent(that, "previousNext", 
            [container, events, that.options, fluid.COMPONENT_OPTIONS, strings]);
        
        return that;
    };

    
    fluid.defaults("fluid.pager.pagerBar", {
            
        previousNext: {
            type: "fluid.pager.previousNext"
        },
        
        pageList: {
            type: "fluid.pager.renderedPageList",
            options: {
                pageStrategy: fluid.pager.gappedPageStrategy(3, 1)
            }
        },
        
        selectors: {
            pageLinks: ".flc-pager-pageLink",
            pageLinkSkip: ".flc-pager-pageLink-skip",
            previous: ".flc-pager-previous",
            next: ".flc-pager-next"
        },
        
        styles: {
            currentPage: "fl-pager-currentPage",
            disabled: "fl-pager-disabled"
        },
        
        strings: {
            currentPageIndexMsg: "Current page"
        }
    });

    function getColumnDefs(that) {
        return that.options.columnDefs;
    }

    fluid.pager.findColumnDef = function (columnDefs, key) {
        var columnDef = $.grep(columnDefs, function (def) {
            return def.key === key;
        })[0];
        return columnDef;
    };
    
    function getRoots(target, overallThat, index) {
        var cellRoot = (overallThat.options.dataOffset ? overallThat.options.dataOffset + "." : "");
        target.shortRoot = index;
        target.longRoot = cellRoot + target.shortRoot;
    }
    
    function expandPath(EL, shortRoot, longRoot) {
        if (EL.charAt(0) === "*") {
            return longRoot + EL.substring(1); 
        } else {
            return EL.replace("*", shortRoot);
        }
    }
    
    fluid.pager.fetchValue = function (that, dataModel, index, valuebinding, roots) {
        getRoots(roots, that, index);

        var path = expandPath(valuebinding, roots.shortRoot, roots.longRoot);
        return fluid.get(dataModel, path);
    };
    
    fluid.pager.basicSorter = function (overallThat, model) {        
        var dataModel = overallThat.options.dataModel;
        var roots = {};
        var columnDefs = getColumnDefs(overallThat);
        var columnDef = fluid.pager.findColumnDef(columnDefs, model.sortKey);
        var sortrecs = [];
        for (var i = 0; i < model.totalRange; ++i) {
            sortrecs[i] = {
                index: i,
                value: fluid.pager.fetchValue(overallThat, dataModel, i, columnDef.valuebinding, roots)
            };
        }
        function sortfunc(arec, brec) {
            var a = arec.value;
            var b = brec.value;
            return a === b ? 0 : (a > b ? model.sortDir : -model.sortDir); 
        }
        sortrecs.sort(sortfunc);
        return fluid.transform(sortrecs, function (row) {
            return row.index;
        });
    };

    
    fluid.pager.directModelFilter = function (model, pagerModel, perm) {
        var togo = [];
        var limit = fluid.pager.computePageLimit(pagerModel);
        for (var i = pagerModel.pageIndex * pagerModel.pageSize; i < limit; ++i) {
            var index = perm ? perm[i] : i;
            togo[togo.length] = {index: index, row: model[index]};
        }
        return togo;
    };
    
    function expandVariables(value, opts) {
        var togo = "";
        var index = 0;
        while (true) {
            var nextindex = value.indexOf("${", index);
            if (nextindex === -1) {
                togo += value.substring(index);
                break;
            } else {
                togo += value.substring(index, nextindex);
                var endi = value.indexOf("}", nextindex + 2);
                var EL = value.substring(nextindex + 2, endi);
                if (EL === "VALUE") {
                    EL = opts.EL;
                } else {
                    EL = expandPath(EL, opts.shortRoot, opts.longRoot);
                }
                var val = fluid.get(opts.dataModel, EL);
                togo += val;
                index = endi + 1;
            }
        }
        return togo;
    }
   
    function expandPaths(target, tree, opts) {
        for (var i in tree) {
            var val = tree[i];
            if (val === fluid.VALUE) {
                if (i === "valuebinding") {
                    target[i] = opts.EL;
                } else {
                    target[i] = {"valuebinding" : opts.EL};
                }
            } else if (i === "valuebinding") {
                target[i] = expandPath(tree[i], opts);
            } else if (typeof (val) === 'object') {
                target[i] = val.length !== undefined ? [] : {};
                expandPaths(target[i], val, opts);
            } else if (typeof (val) === 'string') {
                target[i] = expandVariables(val, opts);
            } else {
                target[i] = tree[i];
            }
        }
        return target;
    }
   
   // sets opts.EL, returns ID
    function iDforColumn(columnDef, opts) {
        var options = opts.options;
        var EL = columnDef.valuebinding;
        var key = columnDef.key;
        if (!EL) {
            fluid.fail("Error in definition for column with key " + key + ": valuebinding is not set");
        }
        opts.EL = expandPath(EL, opts.shortRoot, opts.longRoot);
        if (!key) {
            var segs = fluid.model.parseEL(EL);
            key = segs[segs.length - 1];
        }
        var ID = (options.keyPrefix ? options.keyPrefix : "") + key;
        return ID;
    }
   
    function expandColumnDefs(filteredRow, opts) {
        var tree = fluid.transform(opts.columnDefs, function (columnDef) {
            var ID = iDforColumn(columnDef, opts);
            var togo;
            if (!columnDef.components) {
                return {
                    ID: ID,
                    valuebinding: opts.EL
                };
            } else if (typeof columnDef.components === 'function') {
                togo = columnDef.components(filteredRow.row, filteredRow.index);
            } else {
                togo = columnDef.components;
            }
            togo = expandPaths({}, togo, opts);
            togo.ID = ID;
            return togo;
        });
        return tree;
    }
   
    function fetchModel(overallThat) {
        return fluid.get(overallThat.options.dataModel, 
            overallThat.options.dataOffset);
    }
   
    
    function bigHeaderForKey(key, opts) {
        var id = opts.options.renderOptions.idMap["header:" + key];
        var smallHeader = fluid.jById(id);
        if (smallHeader.length === 0) {
            return null;
        }
        var headerSortStylisticOffset = opts.overallOptions.selectors.headerSortStylisticOffset;
        var bigHeader = fluid.findAncestor(smallHeader, function (element) {
            return $(element).is(headerSortStylisticOffset); 
        });
        return bigHeader;
    }
   
    function setSortHeaderClass(styles, element, sort) {
        element = $(element);
        element.removeClass(styles.ascendingHeader);
        element.removeClass(styles.descendingHeader);
        if (sort !== 0) {
            element.addClass(sort === 1 ? styles.ascendingHeader : styles.descendingHeader);
            //aria-sort property are specified in the w3 WAI spec, ascending, descending, none, other.
            //since pager currently uses ascending and descending, we do not support the others.
            //http://www.w3.org/WAI/PF/aria/states_and_properties#aria-sort
            element.attr('aria-sort', sort === 1 ? 'ascending' : 'descending'); 
        }
    }
    
    function isCurrentColumnSortable(columnDefs, model) {
        var columnDef = model.sortKey ? fluid.pager.findColumnDef(columnDefs, model.sortKey) : null;
        return columnDef ? columnDef.sortable : false;
    }
    
    function setModelSortHeaderClass(newModel, opts) {
        var styles = opts.overallOptions.styles;
        var sort = isCurrentColumnSortable(opts.columnDefs, newModel) ? newModel.sortDir : 0;
        setSortHeaderClass(styles, bigHeaderForKey(newModel.sortKey, opts), sort);
    }
   
    function fireModelChange(that, newModel, forceUpdate) {
        computePageCount(newModel);
        if (newModel.pageIndex >= newModel.pageCount) {
            newModel.pageIndex = newModel.pageCount - 1;
        }
        if (forceUpdate || newModel.pageIndex !== that.model.pageIndex || newModel.pageSize !== that.model.pageSize || newModel.sortKey !== that.model.sortKey ||
                newModel.sortDir !== that.model.sortDir) {
            var sorted = isCurrentColumnSortable(getColumnDefs(that), newModel) ? 
                that.options.sorter(that, newModel) : null;
            that.permutation = sorted;
            that.events.onModelChange.fire(newModel, that.model, that);
            fluid.model.copyModel(that.model, newModel);
        }
    }

    function generateColumnClick(overallThat, columnDef, opts) {
        return function () {
            if (columnDef.sortable === true) {
                var model = overallThat.model;
                var newModel = fluid.copy(model);
                var styles = overallThat.options.styles;
                var oldKey = model.sortKey;
                if (columnDef.key !== model.sortKey) {
                    newModel.sortKey = columnDef.key;
                    newModel.sortDir = 1;
                    var oldBig = bigHeaderForKey(oldKey, opts);
                    if (oldBig) {
                        setSortHeaderClass(styles, oldBig, 0);
                    }
                } else if (newModel.sortKey === columnDef.key) {
                    newModel.sortDir = -1 * newModel.sortDir;
                } else {
                    return false;
                }
                newModel.pageIndex = 0;
                fireModelChange(overallThat, newModel, true);
                setModelSortHeaderClass(newModel, opts);                
            }
            return false;
        };
    }
   
    function fetchHeaderDecorators(decorators, columnDef) {
        return decorators[columnDef.sortable ? "sortableHeader" : "unsortableHeader"];
    }
   
    function generateHeader(overallThat, newModel, columnDefs, opts) {
        var sortableColumnTxt = opts.options.strings.sortableColumnText;
        if (newModel.sortDir === 1) {
            sortableColumnTxt = opts.options.strings.sortableColumnTextAsc;
        } else if (newModel.sortDir === -1) {
            sortableColumnTxt = opts.options.strings.sortableColumnTextDesc;
        }

        return {
            children:  
                fluid.transform(columnDefs, function (columnDef) {
                return {
                    ID: iDforColumn(columnDef, opts),
                    value: columnDef.label,
                    decorators: [ 
                        {"jQuery": ["click", generateColumnClick(overallThat, columnDef, opts)]},
                        {identify: "header:" + columnDef.key},
                        {type: "attrs", attributes: { title: (columnDef.key === newModel.sortKey) ? sortableColumnTxt : opts.options.strings.sortableColumnText}}
                    ].concat(fetchHeaderDecorators(opts.overallOptions.decorators, columnDef))
                };
            })
        };
    }
   
    /** A body renderer implementation which uses the Fluid renderer to render a table section **/
   
    fluid.pager.selfRender = function (overallThat, inOptions) {
        var that = fluid.initView("fluid.pager.selfRender", overallThat.container, inOptions);
        var options = that.options;
        options.renderOptions.idMap = options.renderOptions.idMap || {};
        var idMap = options.renderOptions.idMap;
        var root = that.locate("root");
        var template = fluid.selfRender(root, {}, options.renderOptions);
        root.addClass(options.styles.root);
        var columnDefs = getColumnDefs(overallThat);
        var expOpts = {options: options, columnDefs: columnDefs, overallOptions: overallThat.options, dataModel: overallThat.options.dataModel, idMap: idMap};
        var directModel = fetchModel(overallThat);

        return {
            returnedOptions: {
                listeners: {
                    onModelChange: function (newModel, oldModel) {
                        var filtered = overallThat.options.modelFilter(directModel, newModel, overallThat.permutation);
                        var tree = fluid.transform(filtered, 
                            function (filteredRow) {
                                getRoots(expOpts, overallThat, filteredRow.index);
                                if (columnDefs === "explode") {
                                    return fluid.explode(filteredRow.row, expOpts.longRoot);
                                } else if (columnDefs.length) {
                                    return expandColumnDefs(filteredRow, expOpts);
                                }
                            });
                        var fullTree = {};
                        fullTree[options.row] = tree;
                        if (typeof (columnDefs) === "object") {
                            fullTree[options.header] = generateHeader(overallThat, newModel, columnDefs, expOpts);
                        }
                        options.renderOptions = options.renderOptions || {};
                        options.renderOptions.model = expOpts.dataModel;
                        fluid.reRender(template, root, fullTree, options.renderOptions);
                        setModelSortHeaderClass(newModel, expOpts); // TODO, should this not be actually renderable?
                    }
                }
            }
        };
    };

    fluid.defaults("fluid.pager.selfRender", {
        selectors: {
            root: ".flc-pager-body-template"
        },
        
        styles: {
            root: "fl-pager"
        },
        
        keyStrategy: "id",
        keyPrefix: "",
        row: "row:",
        header: "header:",
        
        strings: {
            sortableColumnText: "Select to sort",
            sortableColumnTextDesc: "Select to sort in ascending, currently in descending order.",
            sortableColumnTextAsc: "Select to sort in descending, currently in ascending order."
        },

        // Options passed upstream to the renderer
        renderOptions: {}
    });

    fluid.pager.summaryAria = function (element) {
        element.attr({
            "aria-relevant": "all",
            "aria-atomic": "false",
            "aria-live": "assertive",
            "role": "status"
        });
    };

    fluid.pager.summary = function (dom, options) {
        var node = dom.locate("summary");
        fluid.pager.summaryAria(node);
        return {
            returnedOptions: {
                listeners: {
                    onModelChange: function (newModel, oldModel) {
                        var text = fluid.stringTemplate(options.message, {
                            first: newModel.pageIndex * newModel.pageSize + 1,
                            last: fluid.pager.computePageLimit(newModel),
                            total: newModel.totalRange,
                            currentPage: newModel.pageIndex + 1
                        });
                        if (node.length > 0) {
                            node.text(text);
                        }
                    }
                }
            }
        };
    };
    
    fluid.pager.directPageSize = function (that) {
        var node = that.locate("pageSize");
        if (node.length > 0) {
            that.events.onModelChange.addListener(
                function (newModel, oldModel) {
                    if (node.val() !== newModel.pageSize) {
                        node.val(newModel.pageSize);
                    }
                }
            );
            node.change(function () {
                that.events.initiatePageSizeChange.fire(node.val());
            });
        }
    };


    fluid.pager.rangeAnnotator = function (that, options) {
        var roots = {};
        that.events.onRenderPageLinks.addListener(function (tree, newModel) {
            var column = that.options.annotateColumnRange;
            var dataModel = that.options.dataModel;
            // TODO: reaching into another component's options like this is a bit unfortunate
            var columnDefs = getColumnDefs(that);

            if (!column || !dataModel || !columnDefs) {
                return;
            }
            var columnDef = fluid.pager.findColumnDef(columnDefs, column);
            
            function fetchValue(index) {
                index = that.permutation ? that.permutation[index] : index;
                return fluid.pager.fetchValue(that, dataModel, index, columnDef.valuebinding, roots);
            }
            var tModel = {};
            fluid.model.copyModel(tModel, newModel);
            
            fluid.transform(tree, function (cell) {
                if (cell.ID === "page-link:link") {
                    var page = cell.pageIndex;
                    var start = page * tModel.pageSize;
                    tModel.pageIndex = page;
                    var limit = fluid.pager.computePageLimit(tModel);
                    var iValue = fetchValue(start);
                    var lValue = fetchValue(limit - 1);
                    
                    var tooltipOpts = fluid.copy(that.options.tooltip.options) || {};
                    
                    if (!tooltipOpts.content) {
                        tooltipOpts.content = function () { 
                            return fluid.stringTemplate(that.options.markup.rangeAnnotation, {
                                first: iValue,
                                last: lValue
                            });
                        };
                    }
                    
                    if (!cell.current) {
                        var decorators = [
                            {
                                type: "fluid",
                                func: that.options.tooltip.type,
                                options: tooltipOpts
                            },
                            {
                                identify: page
                            }
                        ];
                        cell.decorators = cell.decorators.concat(decorators);
                    }
                }
            });
        });
    };

    /*******************
     * Pager Component *
     *******************/
    
    fluid.pagerImpl = function (container, options) {
        var that = fluid.initView("fluid.pager", container, options);
                
        that.container.attr("role", "application");
        
        that.events.initiatePageChange.addListener(
            function (arg) {
                var newModel = fluid.copy(that.model);
                if (arg.relativePage !== undefined) {
                    newModel.pageIndex = that.model.pageIndex + arg.relativePage;
                } else {
                    newModel.pageIndex = arg.pageIndex;
                }
                if (newModel.pageIndex === undefined || newModel.pageIndex < 0) {
                    newModel.pageIndex = 0;
                }
                fireModelChange(that, newModel, arg.forceUpdate);
            }
        );
        
        that.events.initiatePageSizeChange.addListener(
            function (arg) {
                var newModel = fluid.copy(that.model);
                newModel.pageSize = arg;
                fireModelChange(that, newModel);     
            }
        );

        // Setup the top and bottom pager bars.
        var pagerBarElement = that.locate("pagerBar");
        if (pagerBarElement.length > 0) {
            that.pagerBar = fluid.initSubcomponent(that, "pagerBar", 
                [that.events, pagerBarElement, fluid.COMPONENT_OPTIONS, that.options.strings]);
        }
        
        var pagerBarSecondaryElement = that.locate("pagerBarSecondary");
        if (pagerBarSecondaryElement.length > 0) {
            that.pagerBarSecondary = fluid.initSubcomponent(that, "pagerBar",
                [that.events, pagerBarSecondaryElement, fluid.COMPONENT_OPTIONS, that.options.strings]);
        }
 
        that.bodyRenderer = fluid.initSubcomponent(that, "bodyRenderer", [that, fluid.COMPONENT_OPTIONS]);
        
        that.summary = fluid.initSubcomponent(that, "summary", [that.dom, fluid.COMPONENT_OPTIONS]);
        
        that.pageSize = fluid.initSubcomponent(that, "pageSize", [that]);
        
        that.rangeAnnotator = fluid.initSubcomponent(that, "rangeAnnotator", [that, fluid.COMPONENT_OPTIONS]);
 
        that.model = fluid.copy(that.options.model);
        
        var dataModel = fetchModel(that);
        if (dataModel) {
            that.model.totalRange = dataModel.length;
        }
        if (that.model.totalRange === undefined) {
            if (!that.pagerBar) {
                fluid.fail("Error in Pager configuration - cannot determine total range, " +
                    " since not configured in model.totalRange and no PagerBar is configured");
            }
            that.model = that.pagerBar.pageList.defaultModel;
        }
        that.applier = fluid.makeChangeApplier(that.model);

        that.events.initiatePageChange.fire({pageIndex: that.model.pageIndex ? that.model.pageIndex : 0, 
            forceUpdate: true});

        return that;
    };
    
    fluid.defaults("fluid.pager", {
        mergePolicy: {
            dataModel: "preserve",
            model: "preserve"
        },
        pagerBar: {
            type: "fluid.pager.pagerBar"
        },
        
        summary: {type: "fluid.pager.summary", options: {
            message: "Viewing page %currentPage. Showing records %first - %last of %total items." 
        }},
        
        pageSize: {
            type: "fluid.pager.directPageSize"
        },
        
        modelFilter: fluid.pager.directModelFilter,
        
        sorter: fluid.pager.basicSorter,
        
        bodyRenderer: {
            type: "fluid.pager.selfRender"
        },
        
        model: {
            pageIndex: undefined,
            pageSize: 10,
            totalRange: undefined
        },
        
        dataModel: undefined,
        // Offset of the tree's "main" data from the overall dataModel root
        dataOffset: "",
        
        // strategy for generating a tree row, either "explode" or an array of columnDef objects
        columnDefs: [
            {
                key: "column1",
                valuebinding: "*.value1",  
                sortable: true
            }
        ],
        
        annotateColumnRange: "column1",
        
        tooltip: {
            type: "fluid.tooltip"
        },
        
        rangeAnnotator: {
            type: "fluid.pager.rangeAnnotator"
        },
        
        selectors: {
            pagerBar: ".flc-pager-top",
            pagerBarSecondary: ".flc-pager-bottom",
            summary: ".flc-pager-summary",
            pageSize: ".flc-pager-page-size",
            headerSortStylisticOffset: ".flc-pager-sort-header"
        },
        
        styles: {
            ascendingHeader: "fl-pager-asc",
            descendingHeader: "fl-pager-desc"
        },
        
        decorators: {
            sortableHeader: [],
            unsortableHeader: []
        },
        
        strings: {
            last: " (last)"
        },
        
        events: {
            initiatePageChange: null,
            initiatePageSizeChange: null,
            onModelChange: null,
            onRenderPageLinks: null
        },
        
        markup: {
            rangeAnnotation: "<b> %first </b><br/>&mdash;<br/><b> %last </b>"
        }
    });
})(jQuery, fluid_1_4);
