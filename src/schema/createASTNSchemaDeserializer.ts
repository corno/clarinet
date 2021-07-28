/* eslint
    quote-props: "off",

*/
import * as def from "./definitions"
import {
    AnnotatedString,
    createReference,
    ResolveRegistry,
} from "./Reference"
import * as g from "./Dictionary"
import { IExpectContext, TreeHandler, ValueHandler } from "../core"

/**
 * this function is only calls back if the value is not null
 * @param value value
 * @param callback
 */

export function createASTNSchemaDeserializer<TokenAnnotation, NonTokenAnnotation>(
    context: IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    onValidationError: (message: string, annotation: TokenAnnotation) => void,
    callback: (metaData: def.Schema | null) => void,
): TreeHandler<TokenAnnotation, NonTokenAnnotation> {
    const resolveRegistry = new ResolveRegistry<TokenAnnotation>()
    const types = g.createDictionary<def.TypeDefinition>({})
    let rootTypeName: AnnotatedString<TokenAnnotation> | null = null
    function wrap(handler: ValueHandler<TokenAnnotation, NonTokenAnnotation>) {
        return {
            exists: handler,
            missing: () => {
                console.error("MISSING VALUE")
            },
        }
    }
    function createValueHandler(
        valueCallback: (value: def.ValueDefinition) => void,
    ): ValueHandler<TokenAnnotation, NonTokenAnnotation> {

        let targetValueType: def.ValueTypeDefinition = ["simple string", {
            "default value": "",
            "quoted": true,
        }]
        return context.expectType({
            properties: {
                "type": {
                    onExists: () => wrap(
                        context.expectTaggedUnion({
                            options: {
                                "group": () => {
                                    const properties = g.createDictionary<def.ValueDefinition>({})
                                    return wrap(context.expectType({
                                        properties: {
                                            "properties": {
                                                onExists: () => wrap(context.expectDictionary({
                                                    onProperty: propertyData => {
                                                        let targetValue: def.ValueDefinition = {
                                                            type: ["simple string", {
                                                                "default value": "",
                                                                "quoted": true,
                                                            }],
                                                        }
                                                        return wrap(context.expectType({
                                                            properties: {
                                                                "value": {
                                                                    onExists: () => wrap(
                                                                        createValueHandler(
                                                                            value => targetValue = value,
                                                                        )
                                                                    ),
                                                                    onNotExists: () => {
                                                                    },
                                                                },
                                                            },
                                                            onTypeEnd: () => {
                                                                properties.add(propertyData.token.data.value, targetValue)
                                                            },
                                                        }))
                                                    },
                                                })),
                                                onNotExists: () => {
                                                },
                                            },
                                        },
                                        onTypeEnd: () => {
                                            targetValueType = ["group", {
                                                "properties": properties,
                                            }]
                                        },
                                    }))
                                },
                                "dictionary": () => {
                                    let targetValue: def.ValueDefinition = {
                                        type: ["simple string", {
                                            "default value": "",
                                            "quoted": true,
                                        }],
                                    }
                                    let targetKey: def.SimpleStringDefinition = {
                                        "default value": "",
                                        "quoted": true,
                                    }
                                    return wrap(context.expectType({
                                        properties: {
                                            "value": {
                                                onExists: () => wrap(
                                                    createValueHandler(
                                                        value => targetValue = value,
                                                    )
                                                ),
                                                onNotExists: () => {
                                                },
                                            },
                                            "key": {
                                                onExists: () => {
                                                    let quoted = true
                                                    let defaultValue = ""
                                                    return wrap(
                                                        context.expectType({
                                                            properties: {
                                                                "quoted": {
                                                                    onExists: () => wrap(context.expectBoolean({
                                                                        callback: $ => {
                                                                            quoted = $.value

                                                                        },
                                                                    })),
                                                                    onNotExists: () => {
                                                                    },
                                                                },
                                                                "default value": {
                                                                    onExists: () => wrap(context.expectQuotedString({
                                                                        warningOnly: true,
                                                                        callback: $ => {
                                                                            defaultValue = $.value

                                                                        },
                                                                    })),
                                                                    onNotExists: () => {
                                                                    },
                                                                },
                                                            },
                                                            onTypeEnd: () => {
                                                                targetKey = {
                                                                    "quoted": quoted,
                                                                    "default value": defaultValue,
                                                                }
                                                            },
                                                        })
                                                    )
                                                },
                                                onNotExists: () => {
                                                },
                                            },
                                        },
                                        onTypeEnd: () => {
                                            targetValueType = ["dictionary", {
                                                "value": targetValue,
                                                "key": targetKey,
                                            }]
                                        },
                                    }))
                                },
                                "list": () => {
                                    let targetValue: def.ValueDefinition = {
                                        type: ["simple string", {
                                            "default value": "",
                                            "quoted": true,
                                        }],
                                    }
                                    return wrap(context.expectType({
                                        properties: {
                                            "value": {
                                                onExists: () => wrap(
                                                    createValueHandler(
                                                        value => targetValue = value,
                                                    )
                                                ),
                                                onNotExists: () => {
                                                },
                                            },
                                        },
                                        onTypeEnd: () => {
                                            targetValueType = ["list", {
                                                "value": targetValue,
                                            }]
                                        },
                                    }))
                                },
                                "type reference": () => {
                                    let targetComponentTypeName: AnnotatedString<TokenAnnotation> | null = null
                                    return wrap(context.expectType({
                                        properties: {
                                            "type": {
                                                onExists: () => wrap(context.expectQuotedString({
                                                    warningOnly: true,
                                                    callback: $ => {
                                                        targetComponentTypeName = {
                                                            value: $.value,
                                                            annotation: $.token.annotation,
                                                        }
                                                    },
                                                })),
                                                onNotExists: () => {
                                                },
                                            },
                                        },
                                        onTypeEnd: $ => {
                                            targetValueType = ["type reference", {
                                                "type": createReference(
                                                    "type",
                                                    targetComponentTypeName,
                                                    "",
                                                    $.annotation,
                                                    types,
                                                    resolveRegistry,
                                                ),
                                            }]
                                        },
                                    }))
                                },
                                "tagged union": () => {
                                    const options = g.createDictionary<def.OptionDefinition>({})
                                    let defaultOptionName: null | AnnotatedString<TokenAnnotation> = null
                                    return wrap(context.expectType({
                                        properties: {
                                            "options": {
                                                onExists: () => wrap(context.expectDictionary({
                                                    onProperty: stateData => {
                                                        let targetValue: def.ValueDefinition = {
                                                            type: ["simple string", {
                                                                "default value": "",
                                                                "quoted": true,
                                                            }],
                                                        }
                                                        return wrap(context.expectType({
                                                            properties: {
                                                                "value": {
                                                                    onExists: () => wrap(
                                                                        createValueHandler(
                                                                            value => targetValue = value,
                                                                        )
                                                                    ),
                                                                    onNotExists: () => {
                                                                    },
                                                                },
                                                            },
                                                            onTypeEnd: () => {
                                                                options.add(stateData.token.data.value, {
                                                                    value: targetValue,
                                                                })
                                                            },
                                                        }))
                                                    },
                                                })),
                                                onNotExists: () => {
                                                },
                                            },
                                            "default option": {
                                                onExists: () => wrap(context.expectQuotedString({
                                                    warningOnly: true,
                                                    callback: $ => {
                                                        defaultOptionName = {
                                                            value: $.value,
                                                            annotation: $.token.annotation,
                                                        }
                                                    },
                                                })),
                                                onNotExists: () => {
                                                },
                                            },
                                        },
                                        onTypeEnd: $ => {
                                            targetValueType = ["tagged union", {
                                                "options": options,
                                                "default option": createReference(
                                                    "option",
                                                    defaultOptionName,
                                                    "yes",
                                                    $.annotation,
                                                    options,
                                                    resolveRegistry,
                                                ),
                                            }]
                                        },
                                    }))
                                },
                                "simple string": () => {
                                    let quoted = true
                                    let defaultValue = ""
                                    return {
                                        exists: context.expectType({
                                            properties: {
                                                "quoted": {
                                                    onExists: () => wrap(context.expectBoolean({
                                                        callback: $ => {
                                                            quoted = $.value

                                                        },
                                                    })),
                                                    onNotExists: () => {
                                                    },
                                                },
                                                "default value": {
                                                    onExists: () => wrap(context.expectQuotedString({
                                                        warningOnly: true,
                                                        callback: $ => {
                                                            defaultValue = $.value

                                                        },
                                                    })),
                                                    onNotExists: () => {
                                                    },
                                                },
                                            },
                                            onTypeEnd: () => {
                                                targetValueType = ["simple string", {
                                                    "quoted": quoted,
                                                    "default value": defaultValue,
                                                }]
                                            },
                                        }),
                                        missing: () => {
                                            targetValueType = ["simple string", {
                                                "default value": "",
                                                "quoted": true,
                                            }]
                                        },
                                    }
                                },
                            },
                        })
                    ),
                    onNotExists: () => {
                    },
                },
            },
            onTypeEnd: () => {
                valueCallback({
                    "type": targetValueType,
                })
            },
        })
    }
    return {
        root: wrap(context.expectType({
            properties: {
                "types": {
                    onExists: () => {
                        return wrap(context.expectDictionary({
                            onProperty: propertyData => {
                                let targetValue: def.ValueDefinition = {
                                    type: ["simple string", {
                                        "default value": "",
                                        "quoted": true,
                                    }],
                                }
                                return wrap(context.expectType({
                                    properties: {
                                        "value": {
                                            onExists: () => wrap(
                                                createValueHandler(
                                                    value => targetValue = value,
                                                )
                                            ),
                                            onNotExists: () => {
                                            },
                                        },
                                    },
                                    onTypeEnd: () => {
                                        types.add(propertyData.token.data.value, {
                                            value: targetValue,
                                        })
                                    },
                                }))
                            },
                        }))
                    },
                    onNotExists: () => {
                    },
                },
                "root type": {
                    onExists: () => {
                        return wrap(context.expectQuotedString({
                            warningOnly: true,
                            callback: $ => {
                                rootTypeName = {
                                    annotation: $.token.annotation,
                                    value: $.value,
                                }
                            },
                        }))
                    },
                    onNotExists: () => {
                    },
                },
            },
            onTypeEnd: $ => {
                let schema: def.Schema | null = null
                schema = {
                    "types": types,
                    "root type": createReference(
                        "type",
                        rootTypeName,
                        "root",
                        $.annotation,
                        types,
                        resolveRegistry,
                    ),
                }
                const success = resolveRegistry.resolve(
                    error => {
                        onValidationError(error.message, error.annotation)
                    }
                )
                if (success) {
                    callback(schema)
                } else {
                    callback(null)
                }
            },
        })),
    }
}
