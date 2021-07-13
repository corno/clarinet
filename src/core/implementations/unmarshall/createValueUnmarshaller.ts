/* eslint
    "@typescript-eslint/no-shadow": "off"
 */
import * as i from "../../interfaces"
import {
    createDummyArrayHandler,
    createDummyObjectHandler,
    createDummyRequiredValueHandler,
    createDummyTaggedUnionHandler,
} from "../untypedHandlers/dummyHandlers"
import { createState } from "./createState"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("Unreachable")
}

type OnError<TokenAnnotation> = (message: i.UnmarshallError, annotation: TokenAnnotation, severity: i.DiagnosticSeverity) => void

function wrap<TokenAnnotation, NonTokenAnnotation>(
    handler: i.ValueHandler<TokenAnnotation, NonTokenAnnotation>,
    onMissing: () => void,
): i.RequiredValueHandler<TokenAnnotation, NonTokenAnnotation> {
    return {
        exists: handler,
        missing: (): void => {
            onMissing()
        },
    }
}

function createUnexpectedArrayHandler<TokenAnnotation, NonTokenAnnotation>(
    message: i.UnmarshallError,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
): i.ArrayHandler<TokenAnnotation, NonTokenAnnotation> {
    onError(message, annotation, i.DiagnosticSeverity.error)
    return createDummyArrayHandler()
}

function createUnexpectedObjectHandler<TokenAnnotation, NonTokenAnnotation>(
    message: i.UnmarshallError,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
): i.ObjectHandler<TokenAnnotation, NonTokenAnnotation> {
    onError(message, annotation, i.DiagnosticSeverity.error)
    return createDummyObjectHandler()
}

function createUnexpectedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>(
    message: i.UnmarshallError,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
): i.TaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
    onError(message, annotation, i.DiagnosticSeverity.error)
    return createDummyTaggedUnionHandler()
}

function createUnexpectedStringHandler<TokenAnnotation>(
    message: i.UnmarshallError,
    annotation: TokenAnnotation,
    onError: OnError<TokenAnnotation>,
): void {
    onError(message, annotation, i.DiagnosticSeverity.error)
}


export function defaultInitializeValue<TokenAnnotation, NonTokenAnnotation>(
    definition: i.ValueDefinition,
    handler: i.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>,
    onError: OnError<TokenAnnotation>,
): void {
    switch (definition.type[0]) {
        case "dictionary": {
            handler.onDictionary({
                token: null,
                definition: definition.type[1],
            }).onClose({
                token: null,
            })
            break
        }
        case "list": {
            handler.onList({
                token: null,
                definition: definition.type[1],
            }).onClose({
                token: null,
            })
            break
        }
        case "type reference": {
            const $e = definition.type[1]
            defaultInitializeValue(
                $e.type.get().value,
                handler.onTypeReference({
                    definition: $e,
                }),
                onError,
            )
            break
        }
        case "tagged union": {
            const $e = definition.type[1]
            const defOpt = $e["default option"].get()
            defaultInitializeValue(
                defOpt.value,
                handler.onTaggedUnion({
                    definition: $e,
                    token: null,
                }).onOption({
                    name: $e["default option"].name,
                    token: null,
                    definition: defOpt,
                }),
                onError,
            )
            break
        }
        case "simple string": {
            const $e = definition.type[1]
            handler.onSimpleString({
                value: $e["default value"],
                token: null,
                definition: $e,
            })
            break
        }
        case "multiline string": {
            const $e = definition.type[1]
            handler.onMultilineString({
                token: null,
                definition: $e,
            })
            break
        }
        case "group": {
            const $e = definition.type[1]

            const groupHandler = handler.onGroup({
                type: ["omitted"],
                definition: $e,
            })
            $e.properties.forEach((propDef, key) => {
                defaultInitializeValue(
                    propDef,
                    groupHandler.onProperty({
                        key: key,
                        token: null,
                        definition: propDef,
                    }),
                    onError,
                )
            })
            break
        }
        default:
            assertUnreachable(definition.type[0])
    }
}

type MixidIn<TokenAnnotation, NonTokenAnnotation> = {
    pushGroup: (
        definition: i.GroupDefinition,
        groupContainerHandler: i.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>
    ) => i.ValueHandler<TokenAnnotation, NonTokenAnnotation>
    pushTaggedUnion: (
        definition: i.OptionDefinition,
        taggedUnionHandler: i.TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>,
        optionHandler: i.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>,
    ) => void
}

export function createValueUnmarshaller<TokenAnnotation, NonTokenAnnotation>(
    definition: i.ValueDefinition,
    handler: i.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>,
    onError: OnError<TokenAnnotation>,
    flagNonDefaultPropertiesFound: () => void,
    mixedIn: null | MixidIn<TokenAnnotation, NonTokenAnnotation>,
): i.ValueHandler<TokenAnnotation, NonTokenAnnotation> {
    function defInit() {
        defaultInitializeValue(
            definition,
            handler,
            onError,
        )
    }
    switch (definition.type[0]) {
        case "dictionary": {
            const $d = definition.type[1]
            return {
                array: $e => {
                    defInit()
                    return createUnexpectedArrayHandler(
                        ["expected a dictionary"],
                        $e.token.annotation,
                        onError,
                    )
                },
                object: $e => {
                    const foundKeys: string[] = []
                    if ($e.token.data.type[0] !== "dictionary") {
                        onError(["object is not a dictionary"], $e.token.annotation, i.DiagnosticSeverity.warning)
                    }

                    const dictHandler = handler.onDictionary({
                        token: {
                            data: $e.token.data,
                            annotation: $e.token.annotation,
                        },
                        definition: $d,
                    })
                    return {
                        property: $p => {

                            if (foundKeys.includes($p.token.data.value)) {
                                onError(["double key"], $p.token.annotation, i.DiagnosticSeverity.error)
                            }
                            foundKeys.push($p.token.data.value)
                            flagNonDefaultPropertiesFound()

                            const entryHandler = dictHandler.onEntry({
                                token: {
                                    data: $p.token.data,
                                    annotation: $p.token.annotation,
                                },
                            })
                            return wrap(
                                createValueUnmarshaller(
                                    $d.value,
                                    entryHandler,
                                    onError,
                                    () => {
                                        //
                                    },
                                    null,
                                ),
                                () => {
                                    defaultInitializeValue(
                                        $d.value,
                                        entryHandler,
                                        onError,
                                    )
                                }
                            )
                        },
                        objectEnd: $ee => {
                            dictHandler.onClose({
                                token: {
                                    data: {},
                                    annotation: $ee.token.annotation,
                                },
                            })

                        },
                    }
                },
                taggedUnion: $e => {
                    defInit()
                    return createUnexpectedTaggedUnionHandler(
                        ["expected a dictionary"],
                        $e.token.annotation,
                        onError,
                    )
                },
                simpleString: $e => {
                    defInit()
                    return createUnexpectedStringHandler(
                        ["expected a dictionary"],
                        $e.token.annotation,
                        onError,
                    )
                },
                multilineString: $e => {
                    defInit()
                    return createUnexpectedStringHandler(
                        ["expected a dictionary"],
                        $e.token.annotation,
                        onError,
                    )
                },
            }

        }
        case "list": {
            const $d = definition.type[1]
            return {
                array: $e => {
                    if ($e.token.data.type[0] !== "list") {
                        onError(["array is not a list"], $e.token.annotation, i.DiagnosticSeverity.error)
                    }
                    const listHandler = handler.onList({
                        token: {
                            data: $e.token.data,
                            annotation: $e.token.annotation,
                        },
                        definition: $d,
                    })
                    return {
                        element: $ => {
                            flagNonDefaultPropertiesFound()
                            // const entry = collBuilder.createEntry(_errorMessage => {
                            //     //onError(errorMessage, svData)
                            // })
                            const elementSideEffects = listHandler.onElement({
                                annotation: $.annotation,
                            })
                            return createValueUnmarshaller(
                                $d.value,
                                elementSideEffects,
                                onError,
                                () => {
                                    //
                                },
                                null,
                            )
                        },
                        arrayEnd: $ => {
                            listHandler.onClose({
                                token: {
                                    data: {},
                                    annotation: $.token.annotation,
                                },
                            })
                        },
                    }
                },
                object: $e => {
                    defInit()
                    return createUnexpectedObjectHandler(
                        ["expected a list"],
                        $e.token.annotation,
                        onError,
                    )
                },
                taggedUnion: $e => {
                    defInit()
                    return createUnexpectedTaggedUnionHandler(
                        ["expected a list"],
                        $e.token.annotation,
                        onError,
                    )
                },
                simpleString: $e => {
                    defInit()
                    return createUnexpectedStringHandler(
                        ["expected a list"],
                        $e.token.annotation,
                        onError,
                    )
                },
                multilineString: $e => {
                    defInit()
                    return createUnexpectedStringHandler(
                        ["expected a list"],
                        $e.token.annotation,
                        onError,
                    )
                },
            }
        }
        case "type reference": {
            const $e = definition.type[1]
            return createValueUnmarshaller(
                $e.type.get().value,
                handler.onTypeReference({
                    definition: $e,
                }),
                onError,
                flagNonDefaultPropertiesFound,
                mixedIn,
            )
        }
        case "tagged union": {
            const $d = definition.type[1]
            function doOption<T>(
                optionToken: i.SimpleStringToken<TokenAnnotation>,
                definition: i.TaggedUnionDefinition,
                tuHandler: i.TypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation>,
                unknownCallback: () => T,
                knownCallback: (option: i.OptionDefinition, handler: i.TypedValueHandler<TokenAnnotation, NonTokenAnnotation>) => T,
            ): T {
                return definition.options.with(
                    optionToken.data.value,
                    optionDefinition => {
                        if (optionDefinition !== definition["default option"].get()) {
                            flagNonDefaultPropertiesFound()
                        }
                        return knownCallback(
                            optionDefinition,
                            tuHandler.onOption({
                                definition: optionDefinition,
                                name: optionToken.data.value,
                                token: optionToken,
                            })
                        )
                    },
                    keys => {
                        onError(
                            ["unknown option", {
                                "known options": keys,
                            }],
                            optionToken.annotation,
                            i.DiagnosticSeverity.error
                        )
                        defaultInitializeValue(
                            definition["default option"].get().value,
                            tuHandler.onUnexpectedOption({
                                defaultOption: definition["default option"].name,
                                expectedOptions: keys,
                                token: optionToken,
                                //stateGroupDefinition: $e,
                            }),
                            onError,
                        )
                        return unknownCallback()
                    },
                )
            }
            return {
                array: $e => {
                    defInit()
                    return createUnexpectedArrayHandler(
                        ["expected a tagged union"],
                        $e.token.annotation,
                        onError,
                    )
                },
                object: $e => {
                    defInit()
                    return createUnexpectedObjectHandler(
                        ["expected a tagged union"],
                        $e.token.annotation,
                        onError,
                    )
                },
                taggedUnion: $tu => {
                    const tuHandler = handler.onTaggedUnion({
                        definition: $d,
                        token: $tu.token,
                    })
                    return {
                        option: $e => {
                            return doOption(
                                $e.token,
                                $d,
                                tuHandler,
                                () => createDummyRequiredValueHandler(),
                                (option, subHandler) => {
                                    return wrap(
                                        createValueUnmarshaller(
                                            option.value,
                                            subHandler,
                                            onError,
                                            flagNonDefaultPropertiesFound,
                                            mixedIn,
                                        ),
                                        () => {
                                            defaultInitializeValue(
                                                option.value,
                                                subHandler,
                                                onError,
                                            )
                                        }
                                    )
                                }
                            )
                        },
                        missingOption: () => {
                            onError(["missing option"], $tu.token.annotation, i.DiagnosticSeverity.error)
                            defaultInitializeValue(
                                $d["default option"].get().value,
                                tuHandler.onOption({
                                    name: $d["default option"].name,
                                    token: null,
                                    definition: $d["default option"].get(),
                                }),
                                onError,
                            )
                        },
                        end: $ => {
                            tuHandler.onEnd({
                                annotation: $.annotation,
                            })
                        },
                    }
                },
                simpleString: $e => {
                    if (mixedIn !== null) {
                        if ($e.token.data.wrapping[0] === "apostrophe") {
                            const tuHandler = handler.onTaggedUnion({
                                definition: $d,
                                token: null,
                            })
                            return doOption(
                                $e.token,
                                $d,
                                tuHandler,
                                () => {
                                    //
                                },
                                (option, subHandler) => {
                                    mixedIn.pushTaggedUnion(
                                        option,
                                        tuHandler,
                                        subHandler
                                    )
                                }
                            )
                        } else {
                            defInit()
                            return createUnexpectedStringHandler(
                                ["expected a tagged union"],
                                $e.token.annotation,
                                onError,
                            )
                        }
                    } else {
                        defInit()
                        return createUnexpectedStringHandler(
                            ["expected a tagged union"],
                            $e.token.annotation,
                            onError,
                        )
                    }
                },
                multilineString: $e => {
                    defInit()
                    return createUnexpectedStringHandler(
                        ["expected a tagged union"],
                        $e.token.annotation,
                        onError,
                    )
                },
            }
        }
        case "simple string": {
            const $d = definition.type[1]
            const error: i.UnmarshallError = $d.quoted
                ? ["expected an unquoted string"]
                : ["expected a quoted string"]
            return {
                array: $e => {
                    defInit()
                    return createUnexpectedArrayHandler(
                        error,
                        $e.token.annotation,
                        onError,
                    )
                },
                object: $e => {
                    defInit()
                    return createUnexpectedObjectHandler(
                        error,
                        $e.token.annotation,
                        onError,
                    )
                },
                taggedUnion: $e => {
                    defInit()
                    return createUnexpectedTaggedUnionHandler(
                        error,
                        $e.token.annotation,
                        onError,
                    )
                },
                multilineString: $e => {
                    defInit()
                    return createUnexpectedStringHandler(
                        error,
                        $e.token.annotation,
                        onError,
                    )
                },
                simpleString: $e => {
                    const value = $e.token.data.value
                    if (value !== $d["default value"]) {
                        flagNonDefaultPropertiesFound()
                    }
                    handler.onSimpleString({
                        value: $e.token.data.value,
                        token: {
                            data: $e.token.data,
                            annotation: $e.token.annotation,
                        },
                        definition: $d,
                        //  valueBuilder:   valueBuilder,
                        //     $e
                    })
                    switch ($e.token.data.wrapping[0]) {
                        case "none": {
                            if ($d.quoted) {
                                onError(["value should have quotes"], $e.token.annotation, i.DiagnosticSeverity.warning)
                            }
                            break
                        }
                        case "quote": {
                            if (!$d.quoted) {
                                onError(["value should not have quotes"], $e.token.annotation, i.DiagnosticSeverity.warning)
                            }
                            break
                        }
                        case "apostrophe": {
                            onError($d.quoted ? ["value should have quotes instead of apostrophes"] : ["value should not have apostrophes"], $e.token.annotation, i.DiagnosticSeverity.warning)
                            break
                        }
                        default:
                            assertUnreachable($e.token.data.wrapping[0])
                    }
                },
            }
        }
        case "multiline string": {
            const $d = definition.type[1]

            return {
                array: $e => {
                    defInit()
                    return createUnexpectedArrayHandler(
                        ["expected a multiline string"],
                        $e.token.annotation,
                        onError,
                    )
                },
                object: $e => {
                    defInit()
                    return createUnexpectedObjectHandler(
                        ["expected a multiline string"],
                        $e.token.annotation,
                        onError,
                    )
                },
                taggedUnion: $e => {
                    defInit()
                    return createUnexpectedTaggedUnionHandler(
                        ["expected a multiline string"],
                        $e.token.annotation,
                        onError,
                    )
                },
                multilineString: $e => {
                    if ($e.token.data.lines.length > 1) {
                        flagNonDefaultPropertiesFound()
                    } else {
                        if ($e.token.data.lines.length === 1 && $e.token.data.lines[0] !== "") {
                            flagNonDefaultPropertiesFound()
                        }
                    }
                    handler.onMultilineString({
                        token: {
                            data: $e.token.data,
                            annotation: $e.token.annotation,
                        },
                        definition: $d,
                    })
                },
                simpleString: $e => {
                    defInit()
                    return createUnexpectedStringHandler(
                        ["expected a multiline string"],
                        $e.token.annotation,
                        onError,
                    )
                },
            }
        }
        case "group": {
            const $d = definition.type[1]
            return {
                array: $e => {
                    if ($e.token.data.type[0] !== "shorthand group") {
                        if (mixedIn === null) {
                            onError(["expected a group"], $e.token.annotation, i.DiagnosticSeverity.error)
                            defInit()
                            return createDummyArrayHandler()
                        } else {
                            return mixedIn.pushGroup($d, handler).array($e)
                        }
                    } else {
                        //start a shorthand group

                        const state = createState(
                            $d,
                            handler.onGroup({
                                type: ["shorthand", {
                                    data: $e.token.data,
                                    annotation: $e.token.annotation,
                                }],
                                definition: $d,
                            }),
                        )

                        function createUnmarshallerForNextValue(): i.ValueHandler<TokenAnnotation, NonTokenAnnotation> {
                            const nextValue = state.findNextValue()
                            if (nextValue === null) {
                                return {
                                    array: $ => {
                                        onError(["superfluous element"], $.token.annotation, i.DiagnosticSeverity.error)
                                        return createDummyArrayHandler()
                                    },
                                    object: $ => {
                                        onError(["superfluous element"], $.token.annotation, i.DiagnosticSeverity.error)
                                        return createDummyObjectHandler()
                                    },
                                    taggedUnion: $ => {
                                        onError(["superfluous element"], $.token.annotation, i.DiagnosticSeverity.error)
                                        return createDummyTaggedUnionHandler()
                                    },
                                    simpleString: $ => {
                                        onError(["superfluous element"], $.token.annotation, i.DiagnosticSeverity.error)
                                    },
                                    multilineString: $ => {
                                        onError(["superfluous element"], $.token.annotation, i.DiagnosticSeverity.error)
                                    },
                                }
                            } else {

                                return createValueUnmarshaller(
                                    nextValue.definition,
                                    nextValue.handler,
                                    onError,
                                    flagNonDefaultPropertiesFound,
                                    {
                                        pushGroup: (definition, handler) => {
                                            state.pushGroup(definition, handler)
                                            return createUnmarshallerForNextValue()
                                        },
                                        pushTaggedUnion: (definition, taggedUnionHandler, optionHandler) => {
                                            state.pushTaggedUnion(definition, taggedUnionHandler, optionHandler)
                                        },
                                    }
                                )
                            }
                        }
                        return {
                            element: () => {
                                return createUnmarshallerForNextValue()
                            },
                            arrayEnd: $e => {
                                state.wrapup(
                                    $e.token.annotation,
                                    onError,
                                )
                            },
                        }
                    }
                },
                object: $e => {
                    if ($e.token.data.type[0] !== "verbose group") {
                        if (mixedIn === null) {
                            onError(["expected a group"], $e.token.annotation, i.DiagnosticSeverity.error)
                            defInit()
                            return createDummyObjectHandler()
                        } else {
                            return mixedIn.pushGroup($d, handler).object($e)
                        }
                    } else {
                        //start a verbose group
                        const groupHandler = handler.onGroup({
                            type: ["verbose", {
                                annotation: $e.token.annotation,
                                data: $e.token.data,
                            }],
                            definition: $d,
                        })

                        const processedProperties: {
                            [key: string]: {
                                annotation: TokenAnnotation
                                isNonDefault: boolean
                            }
                        } = {}
                        return {
                            property: $p => {
                                const key = $p.token.data.value
                                return $d.properties.with(
                                    key,
                                    propertyDefinition => {
                                        const pp = {
                                            annotation: $p.token.annotation,
                                            isNonDefault: false,
                                        }
                                        processedProperties[key] = pp

                                        const propertyHandler = groupHandler.onProperty({
                                            key: $p.token.data.value,
                                            token: $p.token,
                                            definition: propertyDefinition,
                                        })
                                        return wrap(
                                            createValueUnmarshaller(
                                                propertyDefinition,
                                                propertyHandler,
                                                onError,
                                                () => {
                                                    pp.isNonDefault = true
                                                },
                                                null,
                                            ),
                                            () => {
                                                defaultInitializeValue(
                                                    propertyDefinition,
                                                    propertyHandler,
                                                    onError,
                                                )
                                            }
                                        )
                                    },
                                    keys => {
                                        onError(["unknown property", { "known properties": keys }], $p.token.annotation, i.DiagnosticSeverity.error)
                                        groupHandler.onUnexpectedProperty({
                                            token: $p.token,
                                            groupDefinition: $d,
                                            expectedProperties: keys,
                                        })
                                        return createDummyRequiredValueHandler()
                                    }
                                )
                            },
                            objectEnd: $$ => {
                                let hadNonDefaultProperties = false

                                $d.properties.forEach((propDefinition, propKey) => {
                                    const pp = processedProperties[propKey]
                                    if (pp === undefined) {
                                        defaultInitializeValue(
                                            propDefinition,
                                            groupHandler.onProperty({
                                                key: propKey,
                                                token: null,
                                                definition: propDefinition,
                                            }),
                                            onError,
                                        )
                                    } else {
                                        if (!pp.isNonDefault) {
                                            onError(["property has default value, remove"], pp.annotation, i.DiagnosticSeverity.warning)
                                        } else {
                                            hadNonDefaultProperties = true
                                        }
                                    }
                                })
                                if (hadNonDefaultProperties) {
                                    flagNonDefaultPropertiesFound()
                                }
                                groupHandler.onClose({
                                    token: {
                                        data: {},
                                        annotation: $$.token.annotation,
                                    },
                                })
                            },
                        }
                    }
                },
                taggedUnion: $e => {
                    if (mixedIn === null) {
                        onError(["expected a group"], $e.token.annotation, i.DiagnosticSeverity.error)
                        defInit()
                        return createDummyTaggedUnionHandler()
                    } else {
                        return mixedIn.pushGroup($d, handler).taggedUnion($e)
                    }
                },
                simpleString: $e => {
                    if (mixedIn === null) {
                        onError(["expected a group"], $e.token.annotation, i.DiagnosticSeverity.error)
                        defInit()
                    } else {
                        return mixedIn.pushGroup($d, handler).simpleString($e)
                    }
                },
                multilineString: $e => {
                    if (mixedIn === null) {
                        onError(["expected a group"], $e.token.annotation, i.DiagnosticSeverity.error)
                        defInit()
                    } else {
                        mixedIn.pushGroup($d, handler).multilineString($e)
                    }
                },

            }
        }
        default:
            return assertUnreachable(definition.type[0])
    }
}
