"use strict"


class RemoteException extends Error {
    constructor(message) {
        super(message)
        this.name = "RemoteException"
    }
}


class InvalidHTTPStatus extends Error {
    constructor(status) {
        super(status)
        this.name = "InvalidHTTPStatus"
    }
}


class ConnectionError extends Error {
    constructor() {
        super("ConnectionError")
        this.name = "ConnectionError"
    }
}


class InvalidResponse extends Error {
    constructor() {
        super("InvalidResponse")
        this.name = "InvalidResponse"
    }
}


class InvalidResponseObject extends InvalidResponse {
    constructor() {
        super("InvalidResponseObject")
        this.name = "InvalidResponseObject"
    }
}


class InvalidJson extends InvalidResponse {
    constructor() {
        super("InvalidJson")
        this.name = "InvalidJson"
    }
}


class RemoteServer {
    constructor(endpoint, token = "public") {
        this.functions = new Map

        this.endpoint = endpoint
        this.token = token

        this.proxy = new Proxy(this, {

            get(target, prop) {
                if (prop == "functions") {
                    return target.functions
                }

                if (target.functions.get(prop) != undefined) {
                    return target.functions.get(prop)
                }

                console.log("creating")
                let func = function() {
                    let args_array = []
                    for (const arg of arguments) {
                        args_array.push(arg)
                    }

                    let request_object = {
                        token: target.token,
                        function: {
                            name: prop,
                            args: args_array,
                            kwargs: {}
                        }
                    }

                    try {
                        var request = new XMLHttpRequest();
                        request.open('POST', target.endpoint, false);  // `false` makes the request synchronous
                        request.send(JSON.stringify(request_object));
                    } catch {
                        throw new ConnectionError()
                        return undefined
                    }

                    if (request.status !== 200) {
                        throw new InvalidHTTPStatus(request.status)
                        return undefined
                    }

                    let response_object

                    try {
                        response_object = JSON.parse(request.responseText)
                    } catch {
                        throw new InvalidJson()
                        return undefined
                    }

                    let remote_exception, return_object

                    try {
                        remote_exception = response_object["exception"]
                        return_object = response_object["return"]
                    } catch {
                        throw new InvalidResponseObject()
                        return undefined
                    }

                    if (remote_exception !== "") {
                        throw new RemoteException(remote_exception)
                    }

                    if (return_object === "NoneType") {
                        return undefined
                    }

                    return return_object
                    
                }

                target.functions.set(prop, func)
                return func
                
            }

        })

        return this.proxy
    }

}