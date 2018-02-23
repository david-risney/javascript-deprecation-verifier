(() => {
    let callCount = 0;
    function copy(original) { return JSON.parse(JSON.stringify(original)); }

    function shimProperty(object, propertyName, start, end, asyncStart, asyncEnd, instanceContext) {
        const originalDescriptor = Object.getOwnPropertyDescriptor(object, propertyName);
        const newDescriptor = {};
        let dirty = false;

        function shimCallback(potentialCallback, options) {
            let shimmedCallback = potentialCallback;
            if (typeof potentialCallback === "function") {
                shimmedCallback = function () {
                    const argsArray = Array.from(arguments);
                    let startContext = asyncStart(copy(options));
                    let result;
                    try {
                        result = potentialCallback.apply(this, argsArray);
                    }
                    catch (error) {
                        let endOptions = copy(options);
                        endOptions.startContext = startContext;
                        endOptions.error = error;
                        asyncEnd(endOptions);
                        throw error;
                    }
                    let endOptions = copy(options);
                    endOptions.startContext = startContext;
                    asyncEnd(endOptions);
                    return result;
                }
            }
            return shimmedCallback;
        }

        for (descriptorPropertyName in originalDescriptor) {
            const originalPropertyValue = originalDescriptor[descriptorPropertyName];
            let descriptorPropertyValue = originalPropertyValue;

            if (descriptorPropertyName === "get") {
                descriptorPropertyValue = function () {
                    const callIndex = callCount++;
                    let startContext = start({ propertyName, callIndex, type: "get", instanceContext });
                    let result = null;
                    try {
                        result = originalPropertyValue.call(object);
                    }
                    catch (error) {
                        end({ propertyName, callIndex, type: "get", error, instanceContext, startContext });
                        throw err;
                    }
                    end({ propertyName, callIndex, type: "get", instanceContext, startContext });
                    return result;
                };
                dirty = true;
            }
            else if (descriptorPropertyName === "set") {
                descriptorPropertyValue = function (setValue) {
                    const callIndex = callCount++;
                    let startContext = start({ propertyName, callIndex, type: "set", instanceContext });
                    let result = null;
                    try {
                        result = originalPropertyValue.call(this, shimCallback(setValue, { propertyName, callIndex, type: "set", instanceContext, startContext }));
                    }
                    catch (error) {
                        end({ propertyName, callIndex, type: "set", error, instanceContext, startContext });
                        throw error;
                    }
                    end({ propertyName, callIndex, type: "set", instanceContext, startContext });
                    return result;
                };
                dirty = true;
            }
            else if (descriptorPropertyName === "value" && typeof descriptorPropertyValue === "function") {
                descriptorPropertyValue = function () {
                    const callIndex = callCount++;
                    let startContext = start({ propertyName, callIndex, type: "value", instanceContext });
                    const argsArray = Array.from(arguments).map(arg => shimCallback(arg, { propertyName, callIndex, type: "value", instanceContext, startContext }));
                    let result = null;
                    try {
                        result = originalPropertyValue.apply(this, argsArray);
                    }
                    catch (error) {
                        end({ propertyName, callIndex, type: "value", error, instanceContext, startContext });
                        throw error;
                    }
                    end({ propertyName, callIndex, type: "value", instanceContext, startContext });
                    return result;
                };
                dirty = true;
            }
            newDescriptor[descriptorPropertyName] = descriptorPropertyValue;
        }

        if (dirty) {
            try {
                Object.defineProperty(object, propertyName, newDescriptor);
            }
            catch (err) {
                console.error("Unable to defineProperty " + propertyName, instanceContext, err);
            }
        }
    }

    function logStart(options) { 
        console.log(options.instanceContext + " " + options.callIndex);
    }

    function logEnd(options) { }

    function logAsyncStart(options) { 
        console.log(options.instanceContext + " callback " + options.callIndex);
    }

    function logAsyncEnd(options) { }

    const apiList = {0};

    apiList.forEach(api => {
        const parts = api.split(".");
        const obj = window[parts[0]];
        if (obj.hasOwnProperty(parts[1])) {
            shimProperty(obj, parts[1], shimStart, shimEnd, shimAsyncStart, shimAsyncEnd, api);
        }
        else if (obj.prototype.hasOwnProperty(parts[1])) {
            shimProperty(obj.prototype, parts[1], shimStart, shimEnd, shimAsyncStart, shimAsyncEnd, api);
        }
        else {
            console.error("Unable to find property " + api);
        }
    })
})();