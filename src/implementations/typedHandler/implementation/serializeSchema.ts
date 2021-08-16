import { IReadonlyDictionary, IReference } from "../../../generics"
import { Schema, ValueDefinition } from ".."
import { TreeParserEvent } from "../../../apis/Iuntyped"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function serializeSchema(
    schema: Schema,
    sendEvent: (event: TreeParserEvent) => void,
): void {
    function serializeDictionary<T>(
        dict: IReadonlyDictionary<T>,
        entryCallback: (t: T) => void,
    ) {
        sendEvent(["open object", {
            type: ["dictionary"],
        }])
        dict.forEach((entry, key) => {
            sendEvent(["simple string", {
                value: key,
                wrapping: ["quote", {}],
            }])
            entryCallback(entry)
        })
        sendEvent(["close object", {
        }])
    }
    function serializeVerboseType(
        properties: { [key: string]: () => void }
    ) {
        sendEvent(["open object", {
            type: ["verbose group"],
        }])
        Object.keys(properties).sort().forEach(key => {
            sendEvent(["simple string", {
                value: key,
                wrapping: ["apostrophe", {}],
            }])
            properties[key]()
        })
        sendEvent(["close object", {
        }])
    }
    function serializeTaggedUnion(option: string, callback: () => void) {
        sendEvent(["tagged union", {
        }])
        sendEvent(["simple string", {
            value: option,
            wrapping: ["apostrophe", {}],
        }])
        callback()
    }
    function serializeQuotedString(value: string) {
        sendEvent(["simple string", {
            value: value,
            wrapping: ["quote", {}],
        }])
    }
    function serializeReference<T>(reference: IReference<T>) {
        sendEvent(["simple string", {
            value: reference.name,
            wrapping: ["quote", {}],
        }])
    }

    function serializeNonWrappedString(value: string) {
        sendEvent(["simple string", {
            value: value,
            wrapping: ["none", {}],
        }])
    }


    function serializeValueDefinition(valueDefinition: ValueDefinition) {
        serializeVerboseType({
            type: () => {
                serializeTaggedUnion(valueDefinition.type[0], () => {
                    switch (valueDefinition.type[0]) {
                        case "dictionary": {
                            const $$ = valueDefinition.type[1]
                            serializeVerboseType({
                                "key": () => {
                                    serializeVerboseType({
                                        "default value": () => {
                                            serializeQuotedString($$.key["default value"])
                                        },
                                        "quoted": () => {
                                            serializeNonWrappedString($$.key.quoted ? "true" : "false")
                                        },
                                    })
                                },
                                "value": () => {
                                    serializeValueDefinition($$.value)
                                },
                            })
                            break
                        }
                        case "list": {
                            const $$ = valueDefinition.type[1]
                            serializeVerboseType({
                                "value": () => {
                                    serializeValueDefinition($$.value)
                                },
                            })
                            break
                        }
                        case "type reference": {
                            const $ = valueDefinition.type[1]
                            serializeVerboseType({
                                type: () => {
                                    serializeReference($.type)
                                },
                            })
                            break
                        }
                        case "tagged union": {
                            const $ = valueDefinition.type[1]
                            serializeVerboseType({
                                "default option": () => {
                                    serializeReference($["default option"])
                                },
                                "options": () => {
                                    serializeDictionary(
                                        $.options,
                                        state => {
                                            serializeVerboseType({
                                                node: () => serializeValueDefinition(state.value),
                                            })
                                        }
                                    )
                                },

                            })
                            break
                        }
                        case "simple string": {
                            const $ = valueDefinition.type[1]
                            serializeVerboseType({
                                "default value": () => {
                                    serializeQuotedString($["default value"])
                                },
                                "quoted": () => {
                                    serializeNonWrappedString($.quoted ? "true" : "false")
                                },
                            })
                            break
                        }
                        case "multiline string": {
                            //const $ = propDef.type[1]
                            serializeVerboseType({
                            })
                            break
                        }
                        case "group": {
                            const $ = valueDefinition.type[1]
                            serializeVerboseType({
                                properties: () => {
                                    serializeDictionary($.properties, $ => {
                                        serializeValueDefinition($)
                                    })
                                },
                            })
                            break
                        }
                        default:
                            assertUnreachable(valueDefinition.type[0])
                    }
                })
            },
        })
    }
    serializeVerboseType({
        "component types": () => {
            serializeDictionary(
                schema.types,
                entry => {
                    serializeVerboseType({
                        node: () => serializeValueDefinition(entry.value),
                    })
                }
            )
        },
        "root type": () => {
            serializeReference(schema["root type"])
        },
    })
}