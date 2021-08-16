/* eslint
    quote-props: "off",

*/
import * as def from "../../../apis/typedTreeHandler"
import {
    AnnotatedString,
    createDictionaryBuilder,
    createReference,
    createResolveRegistry,
} from "../../../generics"
import { IExpectContext, Schema, TreeHandler, TypeDefinition, ValueHandler } from "../../../apis/Iuntyped"

/**
 * this function is only calls back if the value is not null
 * @param value value
 * @param callback
 */

export function createASTNSchemaDeserializer<TokenAnnotation, NonTokenAnnotation>(
    context: IExpectContext<TokenAnnotation, NonTokenAnnotation>,
    onValidationError: (message: string, annotation: TokenAnnotation) => void,
    callback: (metaData: Schema | null) => void,
): TreeHandler<TokenAnnotation, NonTokenAnnotation> {
    const resolveRegistry = createResolveRegistry<TokenAnnotation>()
    const types = createDictionaryBuilder<TypeDefinition>()
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
        return context.expectGroup({
            properties: {
                "type": {
                    onExists: () => wrap(
                        context.expectTaggedUnion({
                            options: {
                                "group": () => {
                                    const properties = createDictionaryBuilder<def.ValueDefinition>()
                                    return wrap(context.expectGroup({
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
                                                        return wrap(context.expectGroup({
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
                                                "properties": properties.toDictionary(),
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
                                    return wrap(context.expectGroup({
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
                                                        context.expectGroup({
                                                            properties: {
                                                                "quoted": {
                                                                    onExists: () => wrap(context.expectTaggedUnion({
                                                                        options: {
                                                                            "yes": () => {
                                                                                return wrap(context.expectGroup({}))
                                                                            },
                                                                            "no": () => {
                                                                                quoted = false
                                                                                return wrap(context.expectGroup({}))
                                                                            },
                                                                        },
                                                                    })),
                                                                    onNotExists: () => {
                                                                    },
                                                                },
                                                                "default value": {
                                                                    onExists: () => wrap(context.expectQuotedString({
                                                                        warningOnly: true,
                                                                        callback: $ => {
                                                                            defaultValue = $.token.data.value

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
                                    return wrap(context.expectGroup({
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
                                    return wrap(context.expectGroup({
                                        properties: {
                                            "type": {
                                                onExists: () => wrap(context.expectQuotedString({
                                                    warningOnly: true,
                                                    callback: $ => {
                                                        targetComponentTypeName = {
                                                            value: $.token.data.value,
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
                                                    types.toDictionary().getLookup(),
                                                    resolveRegistry.getRegistrater(),
                                                ),
                                            }]
                                        },
                                    }))
                                },
                                "tagged union": () => {
                                    const options = createDictionaryBuilder<def.OptionDefinition>()
                                    let defaultOptionName: null | AnnotatedString<TokenAnnotation> = null
                                    return wrap(context.expectGroup({
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
                                                        return wrap(context.expectGroup({
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
                                                            value: $.token.data.value,
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
                                                "options": options.toDictionary(),
                                                "default option": createReference(
                                                    "default option",
                                                    defaultOptionName,
                                                    "yes",
                                                    $.annotation,
                                                    options.toDictionary().getLookup(),
                                                    resolveRegistry.getRegistrater(),
                                                ),
                                            }]
                                        },
                                    }))
                                },
                                "simple string": () => {
                                    let quoted = true
                                    let defaultValue = ""
                                    return {
                                        exists: context.expectGroup({
                                            properties: {
                                                "quoted": {
                                                    onExists: () => wrap(context.expectTaggedUnion({
                                                        options: {
                                                            "yes": () => {
                                                                return wrap(context.expectGroup({}))
                                                            },
                                                            "no": () => {
                                                                quoted = false
                                                                return wrap(context.expectGroup({}))
                                                            },
                                                        },
                                                    })),
                                                    onNotExists: () => {
                                                    },
                                                },
                                                "default value": {
                                                    onExists: () => wrap(context.expectQuotedString({
                                                        warningOnly: true,
                                                        callback: $ => {
                                                            defaultValue = $.token.data.value

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
        onEnd: () => {},
        root: wrap(context.expectGroup({
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
                                return wrap(context.expectGroup({
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
                                    value: $.token.data.value,
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
                    "types": types.toDictionary(),
                    "root type": createReference(
                        "root type",
                        rootTypeName,
                        "root",
                        $.annotation,
                        types.toDictionary().getLookup(),
                        resolveRegistry.getRegistrater(),
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
