
/*eslint
    "@typescript-eslint/no-unused-vars": 0,
    "camelcase": 0,
    "dot-notation": 0,
    "no-underscore-dangle": 0,
    "quote-props": 0
*/
import { ValueHandler, RequiredValueHandler, IExpectContext } from "astn"

interface IDictionary<T> {
    forEach(callback: (e: T, key: string) => void): void
}

interface IArray<T> {
    forEach(callback: (e: T) => void): void
}

function createDictionary<T>(raw: { [key: string]: T }): IDictionary<T> {
    return {
        forEach: (callback: (e: T, key: string) => void) => { Object.keys(raw).sort().forEach(key => { callback(raw[key], key) }) },
    }
}

export type __types_T = {
    readonly "value": __value_T
}

export type __root_T = {
    readonly "root value": __value_T
    readonly "types": IDictionary<__types_T>
}

export type __no_T = {
}

export type __yes_T = {
}

export type __quoted_TU =
    | ["no", __no_T]
    | ["yes", __yes_T]

export type __simple_string_T = {
    readonly "default value": string
    readonly "quoted": __quoted_TU
}

export type __dictionary_T = {
    readonly "key": __simple_string_T
    readonly "value": __value_T
}

export type __properties_T = {
    readonly "value": __value_T
}

export type __group_T = {
    readonly "properties": IDictionary<__properties_T>
}

export type __list_T = {
    readonly "value": __value_T
}

export type __multiline_string_T = {
}

export type __simple_string_type_T = {
    readonly "definition": __simple_string_T
}

export type __options_T = {
    readonly "value": __value_T
}

export type __tagged_union_T = {
    readonly "default option": string
    readonly "options": IDictionary<__options_T>
}

export type __type_reference_T = {
    readonly "type": string
}

export type __type_TU =
    | ["dictionary", __dictionary_T]
    | ["group", __group_T]
    | ["list", __list_T]
    | ["multiline string", __multiline_string_T]
    | ["simple string", __simple_string_type_T]
    | ["tagged union", __tagged_union_T]
    | ["type reference", __type_reference_T]

export type __value_T = {
    readonly "type": __type_TU
}

export type __types_B = {
    readonly "value": __value_B
}

export type __root_B = {
    readonly "root value": __value_B
    readonly "types": { callback: (key: string, value: __types_B ) => void }
}

export type __no_B = {
}

export type __yes_B = {
}

export type __quoted_TU_Builder =
    | ["no", __no_B]
    | ["yes", __yes_B]

export type __simple_string_B = {
    readonly "default value": string
    readonly "quoted": __quoted_TU_Builder
}

export type __dictionary_B = {
    readonly "key": __simple_string_B
    readonly "value": __value_B
}

export type __properties_B = {
    readonly "value": __value_B
}

export type __group_B = {
    readonly "properties": { callback: (key: string, value: __properties_B ) => void }
}

export type __list_B = {
    readonly "value": __value_B
}

export type __multiline_string_B = {
}

export type __simple_string_type_B = {
    readonly "definition": __simple_string_B
}

export type __options_B = {
    readonly "value": __value_B
}

export type __tagged_union_B = {
    readonly "default option": string
    readonly "options": { callback: (key: string, value: __options_B ) => void }
}

export type __type_reference_B = {
    readonly "type": string
}

export type __type_TU_Builder =
    | ["dictionary", __dictionary_B]
    | ["group", __group_B]
    | ["list", __list_B]
    | ["multiline string", __multiline_string_B]
    | ["simple string", __simple_string_type_B]
    | ["tagged union", __tagged_union_B]
    | ["type reference", __type_reference_B]

export type __value_B = {
    readonly "type": __type_TU_Builder
}

export function createDeserializer<TokenAnnotation, NonTokenAnnotation>(
    context: IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    raiseValidationError: (message: string, annotation: TokenAnnotation) => void,
    callback: (result: __root_T) => void,
): RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
    function wrap(handler: ValueHandler<TokenAnnotation, NonTokenAnnotation>): RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            exists: handler,
            missing: () => {
                //
            },
        }
    }
    function _generateHandler_root(
        callback: (out: __root_T) => void,
    ): ValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return ((callback: (out: __root_T) => void) => {
            let _root_value_v: __value_T | null = null
            const _types_v: { [key: string]: __types_T } = {}
            return context.expectVerboseGroup({
                properties: {
                    "root value": {
                        onNotExists: () => { /**/ },
                        onExists: () => wrap(_generateHandler_value(
                            node => _root_value_v = node
                        )),
                    },
                    "types": {
                        onNotExists: () => { /**/ },
                        onExists: () => wrap(context.expectDictionary({
                            onProperty: propertyData => {
                                return wrap(((callback: (out: __types_T) => void) => {
                                    let _value_v: __value_T | null = null
                                    return context.expectVerboseGroup({
                                        properties: {
                                            "value": {
                                                onNotExists: () => { /**/ },
                                                onExists: () => wrap(_generateHandler_value(
                                                    node => _value_v = node
                                                )),
                                            },
                                        },
                                        onEnd: () => {
                                            if (_value_v === null) {
                                                _value_v = {
                                                    "type": [ "simple string", {
                                                        "definition": {
                                                            "default value": "",
                                                            "quoted": [ "yes", {
                                                            } ],
                                                        },
                                                    } ],
                                                }
                                            }
                                            callback({
                                                "value": _value_v,
                                            })
                                        },
                                    })
                                })(node => _types_v[propertyData.token.data.value] = node))
                            },
                        })),
                    },
                },
                onEnd: () => {
                    if (_root_value_v === null) {
                        _root_value_v = {
                            "type": [ "simple string", {
                                "definition": {
                                    "default value": "",
                                    "quoted": [ "yes", {
                                    } ],
                                },
                            } ],
                        }
                    }
                    callback({
                        "root value": _root_value_v,
                        "types": createDictionary(_types_v),
                    })
                },
            })
        })(node => callback(node))
    }

    function _generateHandler_simple_string(
        callback: (out: __simple_string_T) => void,
    ): ValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return ((callback: (out: __simple_string_T) => void) => {
            let _default_value_v: string | null = null
            let _quoted_v: __quoted_TU | null = null
            return context.expectVerboseGroup({
                properties: {
                    "default value": {
                        onNotExists: () => { /**/ },
                        onExists: () => wrap(context.expectQuotedString({
                            warningOnly: true,
                            callback: $ => {
                                _default_value_v = $.token.data.value
                            },
                        })),
                    },
                    "quoted": {
                        onNotExists: () => { /**/ },
                        onExists: () => wrap(context.expectTaggedUnion({
                            options: {
                                "no": () => {
                                    return wrap(((callback: (out: __no_T) => void) => {
                                        return context.expectVerboseGroup({
                                            properties: {
                                            },
                                            onEnd: () => {
                                                callback({
                                                })
                                            },
                                        })
                                    })(node => _quoted_v = ["no", node]))
                                },
                                "yes": () => {
                                    return wrap(((callback: (out: __yes_T) => void) => {
                                        return context.expectVerboseGroup({
                                            properties: {
                                            },
                                            onEnd: () => {
                                                callback({
                                                })
                                            },
                                        })
                                    })(node => _quoted_v = ["yes", node]))
                                },
                            },
                        })),
                    },
                },
                onEnd: () => {
                    if (_default_value_v === null) {
                        _default_value_v = ""
                    }
                    if (_quoted_v === null) {
                        _quoted_v = ["yes", {
                        }]
                    }
                    callback({
                        "default value": _default_value_v,
                        "quoted": _quoted_v,
                    })
                },
            })
        })(node => callback(node))
    }

    function _generateHandler_value(
        callback: (out: __value_T) => void,
    ): ValueHandler<TokenAnnotation, NonTokenAnnotation> {
        return ((callback: (out: __value_T) => void) => {
            let _type_v: __type_TU | null = null
            return context.expectVerboseGroup({
                properties: {
                    "type": {
                        onNotExists: () => { /**/ },
                        onExists: () => wrap(context.expectTaggedUnion({
                            options: {
                                "dictionary": () => {
                                    return wrap(((callback: (out: __dictionary_T) => void) => {
                                        let _key_v: __simple_string_T | null = null
                                        let _value_v: __value_T | null = null
                                        return context.expectVerboseGroup({
                                            properties: {
                                                "key": {
                                                    onNotExists: () => { /**/ },
                                                    onExists: () => wrap(_generateHandler_simple_string(
                                                        node => _key_v = node
                                                    )),
                                                },
                                                "value": {
                                                    onNotExists: () => { /**/ },
                                                    onExists: () => wrap(_generateHandler_value(
                                                        node => _value_v = node
                                                    )),
                                                },
                                            },
                                            onEnd: () => {
                                                if (_key_v === null) {
                                                    _key_v = {
                                                        "default value": "",
                                                        "quoted": [ "yes", {
                                                        } ],
                                                    }
                                                }
                                                if (_value_v === null) {
                                                    _value_v = {
                                                        "type": [ "simple string", {
                                                            "definition": {
                                                                "default value": "",
                                                                "quoted": [ "yes", {
                                                                } ],
                                                            },
                                                        } ],
                                                    }
                                                }
                                                callback({
                                                    "key": _key_v,
                                                    "value": _value_v,
                                                })
                                            },
                                        })
                                    })(node => _type_v = ["dictionary", node]))
                                },
                                "group": () => {
                                    return wrap(((callback: (out: __group_T) => void) => {
                                        const _properties_v: { [key: string]: __properties_T } = {}
                                        return context.expectVerboseGroup({
                                            properties: {
                                                "properties": {
                                                    onNotExists: () => { /**/ },
                                                    onExists: () => wrap(context.expectDictionary({
                                                        onProperty: propertyData => {
                                                            return wrap(((callback: (out: __properties_T) => void) => {
                                                                let _value_v: __value_T | null = null
                                                                return context.expectVerboseGroup({
                                                                    properties: {
                                                                        "value": {
                                                                            onNotExists: () => { /**/ },
                                                                            onExists: () => wrap(_generateHandler_value(
                                                                                node => _value_v = node
                                                                            )),
                                                                        },
                                                                    },
                                                                    onEnd: () => {
                                                                        if (_value_v === null) {
                                                                            _value_v = {
                                                                                "type": [ "simple string", {
                                                                                    "definition": {
                                                                                        "default value": "",
                                                                                        "quoted": [ "yes", {
                                                                                        } ],
                                                                                    },
                                                                                } ],
                                                                            }
                                                                        }
                                                                        callback({
                                                                            "value": _value_v,
                                                                        })
                                                                    },
                                                                })
                                                            })(node => _properties_v[propertyData.token.data.value] = node))
                                                        },
                                                    })),
                                                },
                                            },
                                            onEnd: () => {
                                                callback({
                                                    "properties": createDictionary(_properties_v),
                                                })
                                            },
                                        })
                                    })(node => _type_v = ["group", node]))
                                },
                                "list": () => {
                                    return wrap(((callback: (out: __list_T) => void) => {
                                        let _value_v: __value_T | null = null
                                        return context.expectVerboseGroup({
                                            properties: {
                                                "value": {
                                                    onNotExists: () => { /**/ },
                                                    onExists: () => wrap(_generateHandler_value(
                                                        node => _value_v = node
                                                    )),
                                                },
                                            },
                                            onEnd: () => {
                                                if (_value_v === null) {
                                                    _value_v = {
                                                        "type": [ "simple string", {
                                                            "definition": {
                                                                "default value": "",
                                                                "quoted": [ "yes", {
                                                                } ],
                                                            },
                                                        } ],
                                                    }
                                                }
                                                callback({
                                                    "value": _value_v,
                                                })
                                            },
                                        })
                                    })(node => _type_v = ["list", node]))
                                },
                                "multiline string": () => {
                                    return wrap(((callback: (out: __multiline_string_T) => void) => {
                                        return context.expectVerboseGroup({
                                            properties: {
                                            },
                                            onEnd: () => {
                                                callback({
                                                })
                                            },
                                        })
                                    })(node => _type_v = ["multiline string", node]))
                                },
                                "simple string": () => {
                                    return wrap(((callback: (out: __simple_string_type_T) => void) => {
                                        let _definition_v: __simple_string_T | null = null
                                        return context.expectVerboseGroup({
                                            properties: {
                                                "definition": {
                                                    onNotExists: () => { /**/ },
                                                    onExists: () => wrap(_generateHandler_simple_string(
                                                        node => _definition_v = node
                                                    )),
                                                },
                                            },
                                            onEnd: () => {
                                                if (_definition_v === null) {
                                                    _definition_v = {
                                                        "default value": "",
                                                        "quoted": [ "yes", {
                                                        } ],
                                                    }
                                                }
                                                callback({
                                                    "definition": _definition_v,
                                                })
                                            },
                                        })
                                    })(node => _type_v = ["simple string", node]))
                                },
                                "tagged union": () => {
                                    return wrap(((callback: (out: __tagged_union_T) => void) => {
                                        let _default_option_v: string | null = null
                                        const _options_v: { [key: string]: __options_T } = {}
                                        return context.expectVerboseGroup({
                                            properties: {
                                                "default option": {
                                                    onNotExists: () => { /**/ },
                                                    onExists: () => wrap(context.expectQuotedString({
                                                        warningOnly: true,
                                                        callback: $ => {
                                                            _default_option_v = $.token.data.value
                                                        },
                                                    })),
                                                },
                                                "options": {
                                                    onNotExists: () => { /**/ },
                                                    onExists: () => wrap(context.expectDictionary({
                                                        onProperty: propertyData => {
                                                            return wrap(((callback: (out: __options_T) => void) => {
                                                                let _value_v: __value_T | null = null
                                                                return context.expectVerboseGroup({
                                                                    properties: {
                                                                        "value": {
                                                                            onNotExists: () => { /**/ },
                                                                            onExists: () => wrap(_generateHandler_value(
                                                                                node => _value_v = node
                                                                            )),
                                                                        },
                                                                    },
                                                                    onEnd: () => {
                                                                        if (_value_v === null) {
                                                                            _value_v = {
                                                                                "type": [ "simple string", {
                                                                                    "definition": {
                                                                                        "default value": "",
                                                                                        "quoted": [ "yes", {
                                                                                        } ],
                                                                                    },
                                                                                } ],
                                                                            }
                                                                        }
                                                                        callback({
                                                                            "value": _value_v,
                                                                        })
                                                                    },
                                                                })
                                                            })(node => _options_v[propertyData.token.data.value] = node))
                                                        },
                                                    })),
                                                },
                                            },
                                            onEnd: () => {
                                                if (_default_option_v === null) {
                                                    _default_option_v = ""
                                                }
                                                callback({
                                                    "default option": _default_option_v,
                                                    "options": createDictionary(_options_v),
                                                })
                                            },
                                        })
                                    })(node => _type_v = ["tagged union", node]))
                                },
                                "type reference": () => {
                                    return wrap(((callback: (out: __type_reference_T) => void) => {
                                        let _type_v: string | null = null
                                        return context.expectVerboseGroup({
                                            properties: {
                                                "type": {
                                                    onNotExists: () => { /**/ },
                                                    onExists: () => wrap(context.expectQuotedString({
                                                        warningOnly: true,
                                                        callback: $ => {
                                                            _type_v = $.token.data.value
                                                        },
                                                    })),
                                                },
                                            },
                                            onEnd: () => {
                                                if (_type_v === null) {
                                                    _type_v = ""
                                                }
                                                callback({
                                                    "type": _type_v,
                                                })
                                            },
                                        })
                                    })(node => _type_v = ["type reference", node]))
                                },
                            },
                        })),
                    },
                },
                onEnd: () => {
                    if (_type_v === null) {
                        _type_v = ["simple string", {
                            "definition": {
                                "default value": "",
                                "quoted": [ "yes", {
                                } ],
                            },
                        }]
                    }
                    callback({
                        "type": _type_v,
                    })
                },
            })
        })(node => callback(node))
    }

    return wrap(_generateHandler_root(callback))
}