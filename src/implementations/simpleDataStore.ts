/* eslint
    "@typescript-eslint/no-empty-function": 0,
    "complexity": 0
*/

import { DiagnosticSeverity, TypedTreeHandler, TypedValueHandler } from "../core"
import * as serialize from "./serializeDataset"

export type OnError<Annotation> = (message: string, annotation: Annotation, severity: DiagnosticSeverity) => void

type Group = { [key: string]: Value }

type Dictionary = { [key: string]: Value }

type TaggedUnion = {
    option: null | string
    value: Value
}

export type Datastore = {
    root: Value
}

type Value = {
    type:
    | null
    | ["dictionary", Dictionary]
    | ["list", Value[]]
    | ["tagged union", TaggedUnion]
    | ["simple string", string]
    | ["multiline string", string[]]
    | ["group", Group]
}

function buildValue<TokenAnnotation, NonTokenAnnotation>(
    value: Value,
): TypedValueHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        onDictionary: () => {
            const dict: Dictionary = {}
            value.type = ["dictionary", dict]
            return {
                onClose: () => {
                    //
                },
                onEntry: $ => {
                    const entry: Value = { type: null }
                    dict[$.token.data.value] = entry
                    return buildValue(
                        entry,
                    )
                },
            }
        },
        onList: () => {
            const list: Value[] = []
            value.type = ["list", list]
            return {
                onClose: () => {
                    //
                },
                onElement: () => {
                    const element: Value = { type: null }
                    list.push(element)
                    return buildValue(
                        element,
                    )
                },
            }
        },
        onTaggedUnion: $ => {
            const taggedUnion: TaggedUnion = {
                option: null,
                value: { type: null },
            }
            value.type = ["tagged union", taggedUnion]
            return {
                onUnexpectedOption: () => {
                    taggedUnion.option = $.definition["default option"].name
                    return buildValue(
                        taggedUnion.value,
                    )
                },
                onOption: $$ => {
                    taggedUnion.option = $$.name
                    return buildValue(
                        taggedUnion.value,
                    )
                },
                onEnd: () => {
                    //
                },
            }
        },
        onSimpleString: $ => {
            value.type = ["simple string", $.value]
        },
        onMultilineString: $ => {
            value.type = ["multiline string", $.token === null ? [] : $.token.data.lines]
        },
        onTypeReference: () => {
            return buildValue(
                value,
            )
        },
        onGroup: () => {
            const group: Group = {}
            value.type = ["group", group]
            return {
                onUnexpectedProperty: () => {
                    //
                },
                onProperty: $ => {
                    const property: Value = { type: null }
                    group[$.key] = property
                    return buildValue(
                        property,
                    )
                },
                onClose: () => {
                },
            }
        },
    }
}

export function createBuilder<TokenAnnotation, NonTokenAnnotation>(
    ds: Datastore,
    onEnd: () => void,
): TypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        root: buildValue(
            ds.root,
        ),
        onEnd: () => {
            onEnd()
        },
    }
}

function createValueSerializeInterface(value: Value): serialize.Value {
    return {
        toDictionary: callback => {
            if (value.type === null || value.type[0] !== "dictionary") {
                throw new Error("Unexpected: missing or invalid dictionary")
            }
            const dict = value.type[1]
            callback({
                entries: {
                    forEach: callback2 => {
                        Object.keys(dict).forEach(key => {
                            callback2(createValueSerializeInterface(dict[key]), key)
                        })
                    },
                    isEmpty: () => Object.keys(dict).length === 0,
                },
            })
        },
        toGroup: callback => {
            if (value.type === null || value.type[0] !== "group") {
                throw new Error("Unexpected: missing or invalid group")
            }
            const group = value.type[1]
            callback({
                onProperty: (key, callback2) => {
                    const property = group[key]
                    if (property !== undefined) {
                        callback2(createValueSerializeInterface(property))
                    }

                },
            })
        },
        toList: callback => {
            if (value.type === null || value.type[0] !== "list") {
                throw new Error("Unexpected: missing or invalid list")
            }
            const list = value.type[1]
            callback({
                elements: {
                    forEach: callback2 => {
                        list.forEach(e => {
                            callback2(createValueSerializeInterface(e))
                        })
                    },
                    isEmpty: () => list.length === 0,

                },
            })
        },
        toMultilineString: callback => {
            if (value.type === null || value.type[0] !== "multiline string") {
                throw new Error("Unexpected: missing or invalid multiline string")
            }
            callback(value.type[1])
        },
        toSimpleString: callback => {
            if (value.type === null || value.type[0] !== "simple string") {
                throw new Error("Unexpected: missing or invalid simple string")
            }
            callback(value.type[1])
        },
        toTaggedUnion: callback => {
            if (value.type === null || value.type[0] !== "tagged union") {
                throw new Error("Unexpected: missing or invalid tagged union")
            }
            const tu = value.type[1]
            if (tu.option !== null) {
                callback({
                    option: tu.option,
                    value: createValueSerializeInterface(tu.value),
                })

            }
        },
    }
}

export function createSerializeInterface(
    ds: Datastore
): serialize.SerializableDataset {
    return {
        root: createValueSerializeInterface(ds.root),
    }
}