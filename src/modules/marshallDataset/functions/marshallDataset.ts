/* eslint
    "@typescript-eslint/no-shadow": 0,
*/

import { TypeDefinition, ValueDefinition } from "../../schema/types/definitions"
import { SerializationStyle } from "../types/SerializationStyle"
import { TreeParserEvent } from "../../parser/types/TreeParserEvent"

import { IOut } from "../interfaces/IOut"
import { IMarshallableDataset, IMarshallableValue } from "../interfaces/IMarshallableDataset"
import { IReadonlyDictionary } from "../../../generics/interfaces/IReadonlyDictionary"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export type SerializeOut = IOut<TreeParserEvent, {
    open: TreeParserEvent
    close: TreeParserEvent
}>

function getUnsafe<T>(
    dictionary: IReadonlyDictionary<T>,
    key: string
): T {
    let entry: T | null = null
    dictionary.forEach((e, k) => {
        if (k === key) {
            entry = e
        }
    })
    if (entry === null) {
        throw new Error("MISSING")
    }
    return entry
}

function onValueIsNonDefault(
    value: IMarshallableValue,
    definition: ValueDefinition,
    callback: () => void,
): void {
    switch (definition.type[0]) {
        case "type reference": {
            const $ = definition.type[1]
            onValueIsNonDefault(
                value,
                $.type.get().value,
                callback
            )
            break
        }
        case "dictionary": {
            value.toDictionary(dict => {
                if (!dict.entries.isEmpty()) {
                    callback()

                }
            })
            break
        }
        case "list": {
            value.toList(list => {
                if (!list.elements.isEmpty()) {
                    callback()
                }
            })
            break
        }
        case "tagged union": {
            const $ = definition.type[1]
            value.toTaggedUnion(tu => {
                if (tu.option !== $["default option"].name) {
                    callback()
                } else {
                    onValueIsNonDefault(
                        tu.value,
                        getUnsafe($.options, tu.option).value,
                        callback,
                    )
                }
            })
            break
        }
        case "simple string": {
            const $ = definition.type[1]
            value.toSimpleString(str => {
                if (str !== $["default value"]) {
                    callback()
                }
            })
            break
        }
        case "multiline string": {
            value.toMultilineString(lines => {
                if (lines.length > 1) {
                    callback()
                }
                if (lines.length === 1 && lines[0] !== "") {
                    callback()
                }
            })
            break
        }
        case "group": {
            const $ = definition.type[1]
            value.toGroup(group => {
                let foundNonDefault = false
                $.properties.forEach((p, key) => {
                    group.onProperty(key, value => {
                        onValueIsNonDefault(
                            value,
                            p.value,
                            () => {
                                foundNonDefault = true
                            }
                        )
                    })
                })
                if (foundNonDefault) {
                    callback()
                }
            })
            break
        }
        default:
            return assertUnreachable(definition.type[0])
    }
}

export function marshallDataset(
    dataset: IMarshallableDataset,
    definition: TypeDefinition,
    out: SerializeOut,
    style: SerializationStyle,
): void {
    marshallValue(
        dataset.root,
        definition.value,
        out,
        style,
        false,
    )
}

function marshallValue(
    value: IMarshallableValue,
    definition: ValueDefinition,
    out: SerializeOut,
    style: SerializationStyle,
    inMixinMode: boolean,
): void {
    switch (definition.type[0]) {
        case "dictionary": {
            const $ = definition.type[1]
            value.toDictionary(dict => {
                out.sendBlock(
                    {
                        open: ["open object", {
                            type: ["dictionary"],
                        }],
                        close:
                            ["close object", {
                                //
                            }],
                    },
                    out => {
                        dict.entries.forEach((entry, key) => {
                            out.sendEvent(["simple string", {
                                value: key,
                                wrapping: ["quote", {}],
                            }])
                            marshallValue(
                                entry,
                                $.value,
                                out,
                                style,
                                false,
                            )
                        })
                    },
                )
            })
            break
        }
        case "list": {
            const $$ = definition.type[1]
            value.toList(list => {
                out.sendBlock(
                    {
                        open: ["open array", {
                            type: ["shorthand group"],
                        }],
                        close:
                            ["close array", {
                                //
                            }],
                    },
                    out => {
                        list.elements.forEach(e => {
                            marshallValue(
                                e,
                                $$.value,
                                out,
                                style,
                                false,
                            )
                        })
                    },
                )
            })
            break
        }
        case "type reference": {
            const $ = definition.type[1]
            marshallValue(
                value,
                $.type.get().value,
                out,
                style,
                inMixinMode,
            )
            break
        }
        case "tagged union": {
            const $ = definition.type[1]
            value.toTaggedUnion(taggedUnion => {
                if (!inMixinMode) {
                    out.sendEvent(["tagged union", {}])
                }
                if (taggedUnion.option !== null) {
                    out.sendEvent(["simple string", {
                        value: taggedUnion.option,
                        wrapping: ["apostrophe", {}],
                    }])
                    marshallValue(
                        taggedUnion.value,
                        getUnsafe($.options, taggedUnion.option).value,
                        out,
                        style,
                        inMixinMode
                    )
                }
            })
            break
        }
        case "simple string": {
            const $ = definition.type[1]
            value.toSimpleString(str => {
                out.sendEvent(["simple string", {
                    value: str,
                    wrapping: $.quoted
                        ? ["quote", {
                        }]
                        : ["none", {
                        }],
                }])
            })
            break
        }
        case "multiline string": {
            value.toMultilineString(lines => {
                out.sendEvent(["multiline string", {
                    lines: lines,
                }])
            })
            break
        }
        case "group": {
            const $ = definition.type[1]
            value.toGroup(group => {
                if (inMixinMode) {
                    $.properties.forEach((propDef, key) => {
                        group.onProperty(key, prop => {
                            marshallValue(
                                prop,
                                propDef.value,
                                out,
                                style,
                                true,
                            )

                        })
                    })
                } else {
                    switch (style[0]) {
                        case "expanded": {
                            const expandedStyle = style[1]
                            out.sendBlock(
                                {
                                    open: ["open object", {
                                        type: ["verbose group"],
                                    }],
                                    close:
                                        ["close object", {
                                            //
                                        }],
                                },
                                out => {
                                    $.properties.forEach((propDef, key) => {
                                        group.onProperty(key, prop => {
                                            function serializeProperty() {
                                                out.sendEvent(["simple string", {
                                                    value: key,
                                                    wrapping: ["apostrophe", {}],
                                                }])
                                                marshallValue(
                                                    prop,
                                                    propDef.value,
                                                    out,
                                                    style,
                                                    false,
                                                )

                                            }
                                            if (expandedStyle.omitPropertiesWithDefaultValues) {
                                                onValueIsNonDefault(
                                                    prop,
                                                    propDef.value,
                                                    () => {
                                                        serializeProperty()
                                                    }
                                                )
                                            } else {
                                                serializeProperty()
                                            }

                                        })
                                    })
                                },
                            )
                            break
                        }
                        case "compact": {
                            out.sendBlock(
                                {
                                    open: ["open array", {
                                        type: ["shorthand group"],
                                    }],
                                    close:
                                        ["close array", {
                                            //
                                        }],
                                },
                                out => {
                                    $.properties.forEach((propDef, key) => {
                                        group.onProperty(key, prop => {
                                            marshallValue(
                                                prop,
                                                propDef.value,
                                                out,
                                                style,
                                                true,
                                            )
                                        })
                                    })
                                },
                            )
                            break
                        }
                        default:
                            assertUnreachable(style[0])
                    }
                }

            })
            break
        }
        default:
            assertUnreachable(definition.type[0])
    }
}
