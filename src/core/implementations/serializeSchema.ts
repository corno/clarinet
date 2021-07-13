import { IReadonlyDictionary, IReference, Schema, TreeParserEvent, ValueDefinition } from "../interfaces"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function serializeSchema(
    schema: Schema,
    onEvent: (event: TreeParserEvent) => void,
): void {
    function addEvent(e: TreeParserEvent) {
        //console.error(JSON.stringify(e))
        onEvent(e)
    }

    function serializeDictionary<T>(
        dict: IReadonlyDictionary<T>,
        entryCallback: (t: T) => void,
    ) {
        addEvent(["open object", {
            type: ["dictionary"],
        }])
        dict.forEach((entry, key) => {
            addEvent(["simple string", {
                value: key,
                wrapping: ["quote", {}],
            }])
            entryCallback(entry)
        })
        addEvent(["close object", {
        }])
    }
    function serializeVerboseType(properties: { [key: string]: () => void }) {
        addEvent(["open object", {
            type: ["verbose group"],
        }])
        Object.keys(properties).sort().forEach(key => {
            addEvent(["simple string", {
                value: key,
                wrapping: ["apostrophe", {}],
            }])
            properties[key]()
        })
        addEvent(["close object", {
        }])
    }
    function serializeTaggedUnion(option: string, callback: () => void) {
        addEvent(["tagged union", {
        }])
        addEvent(["simple string", {
            value: option,
            wrapping: ["apostrophe", {}],
        }])
        callback()
    }
    function serializeQuotedString(value: string) {
        addEvent(["simple string", {
            value: value,
            wrapping: ["quote", {}],
        }])
    }
    function serializeReference<T>(reference: IReference<T>) {
        addEvent(["simple string", {
            value: reference.name,
            wrapping: ["quote", {}],
        }])
    }

    function serializeNonWrappedString(value: string) {
        addEvent(["simple string", {
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
                type => {
                    serializeVerboseType({
                        node: () => serializeValueDefinition(type.value),
                    })
                }
            )
        },
        "root type": () => {
            serializeReference(schema["root type"])
        },
    })
}