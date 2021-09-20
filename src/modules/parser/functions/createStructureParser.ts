
import * as p from "pareto"

import { MultilineStringData, SimpleStringData, StructuralTokenData, TokenType } from "../types/rawToken"
import { SimpleStringToken, Token } from "../types/tokens"
import { StructureErrorType } from "../types/StructureErrorType"

import { ITreeParser } from "../interfaces/ITreeParser"
import { TreeHandler } from "../interfaces/ITreeHandler"
import { StructureErrorHandler } from "../interfaces/IStructureErrorHandler"
import { IParser } from "../interfaces/IParser"


import { createTreeParser } from "./createTreeParser"
import { createDummyValueHandler } from "./dummyHandlers"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export function createStructureParser<Annotation>($: {
    onEmbeddedSchema: ($: {
        headerAnnotation: Annotation
        embeddedSchemaAnnotation: Annotation
        schemaSchemaReferenceToken: SimpleStringToken<Annotation>
    }) => TreeHandler<Annotation, null>
    onSchemaReference: ($: {
        headerAnnotation: Annotation
        token: SimpleStringToken<Annotation>
    }) => p.IValue<boolean>
    onBody: (
        annotation: Annotation,
    ) => TreeHandler<Annotation, null>
    onEnd: (endAnnotation: Annotation) => void
    errors: StructureErrorHandler<Annotation>
}): IParser<Annotation> {

    enum StructureState {
        EXPECTING_HEADER_OR_BODY,
        EXPECTING_SCHEMA_REFERENCE_OR_EMBEDDED_SCHEMA,
        EXPECTING_SCHEMA_SCHEMA_REFERENCE,
        EXPECTING_EMBEDDED_SCHEMA,
        PROCESSING_EMBEDDED_SCHEMA,
        EXPECTING_BODY,
        PROCESSING_BODY,
        EXPECTING_END,
    }
    type RootContext = {
        state:
        | [StructureState.EXPECTING_HEADER_OR_BODY]
        | [StructureState.EXPECTING_SCHEMA_REFERENCE_OR_EMBEDDED_SCHEMA, {
            headerAnnotation: Annotation
        }]
        | [StructureState.EXPECTING_SCHEMA_SCHEMA_REFERENCE, {
            headerAnnotation: Annotation
            embeddedSchemaAnnotation: Annotation
        }]
        | [StructureState.EXPECTING_EMBEDDED_SCHEMA, {
            treeHandler: TreeHandler<Annotation, null>
        }]
        | [StructureState.PROCESSING_EMBEDDED_SCHEMA, {
            schemaParser: ITreeParser<Annotation>
        }]
        | [StructureState.EXPECTING_BODY, {
        }]
        | [StructureState.PROCESSING_BODY, {
            bodyParser: ITreeParser<Annotation>
        }]
        | [StructureState.EXPECTING_END, {
        }]
    }

    const rootContext: RootContext = { state: [StructureState.EXPECTING_HEADER_OR_BODY] }

    return {
        onEnd: (annotation) => {
            function raiseError(error: StructureErrorType) {
                $.errors.onStructureError({
                    error: error,
                    annotation: annotation,
                })
            }
            switch (rootContext.state[0]) {
                case StructureState.EXPECTING_HEADER_OR_BODY: {
                    //const $ = rootContext.state[1]
                    raiseError(["expected the schema start (!) or root value"])
                    break
                }
                case StructureState.EXPECTING_SCHEMA_REFERENCE_OR_EMBEDDED_SCHEMA: {
                    raiseError(["expected a schema reference or an embedded schema"])
                    break
                }
                case StructureState.EXPECTING_SCHEMA_SCHEMA_REFERENCE: {
                    raiseError(["expected a schema schema reference"])
                    break
                }
                case StructureState.EXPECTING_EMBEDDED_SCHEMA: {
                    raiseError(["expected the schema"])
                    break
                }
                case StructureState.PROCESSING_EMBEDDED_SCHEMA: {
                    const $$ = rootContext.state[1]
                    //errors should be reported by schema parser
                    $$.schemaParser.forceEnd(annotation)
                    break
                }
                case StructureState.EXPECTING_BODY: {
                    //const $ = rootContext.state[1]
                    raiseError(["expected rootvalue"])
                    break
                }
                case StructureState.PROCESSING_BODY: {
                    const $$ = rootContext.state[1]
                    $$.bodyParser.forceEnd(annotation)
                    break
                }
                case StructureState.EXPECTING_END: {
                    //const $ = rootContext.state[1]
                    break
                }
                default:
                    return assertUnreachable(rootContext.state[0])
            }
            $.onEnd(annotation)
        },
        onToken: (data) => {
            function raiseError(error: StructureErrorType) {
                $.errors.onStructureError({
                    error: error,
                    annotation: data.annotation,
                })
            }
            function handleToken(
                onStructuralToken: (data: StructuralTokenData) => p.IValue<boolean>,
                onSimpleString: (stringData: SimpleStringData) => p.IValue<boolean>,
                onMultilineString: (stringData: MultilineStringData) => p.IValue<boolean>,
            ): p.IValue<boolean> {
                switch (data.type[0]) {
                    case TokenType.Structural: {
                        const $ = data.type[1]
                        return onStructuralToken($)
                    }
                    case TokenType.SimpleString: {
                        const $ = data.type[1]
                        return onSimpleString($)
                    }
                    case TokenType.MultilineString: {
                        const $ = data.type[1]
                        return onMultilineString($)
                    }
                    default:
                        return assertUnreachable(data.type[0])
                }
            }

            function callStackedParser(
                parser: ITreeParser<Annotation>,
            ) {
                return handleToken(
                    (punctuation) => {
                        function createToken<Data>(dta: Data): Token<Data, Annotation> {
                            return {
                                data: dta,
                                annotation: data.annotation,
                            }
                        }
                        switch (punctuation.type[0]) {
                            case "header start":
                                raiseError(["unexpected '!'"])
                                break
                            case "close shorthand group":
                                parser.closeArray(createToken({

                                }))
                                break
                            case "close list":
                                parser.closeArray(createToken({

                                }))
                                break
                            case "open shorthand group":
                                parser.openArray(createToken({
                                    type: ["shorthand group"],
                                }))
                                break
                            case "open list":
                                parser.openArray(createToken({
                                    type: ["list"],
                                }))
                                break
                            case "close dictionary":
                                parser.closeObject(createToken({

                                }))
                                break
                            case "close verbose group":
                                parser.closeObject(createToken({

                                }))
                                break
                            case "open dictionary":
                                parser.openObject(createToken({
                                    type: ["dictionary"],
                                }))
                                break
                            case "open verbose group":
                                parser.openObject(createToken({
                                    type: ["verbose group"],
                                }))
                                break
                            case "tagged union start":
                                parser.taggedUnion(createToken({

                                }))
                                break
                            default:
                                assertUnreachable(punctuation.type[0])
                        }
                        return p.value(false)
                    },
                    (string) => {
                        parser.simpleString(
                            {
                                annotation: data.annotation,
                                data: {
                                    value: string.value,
                                    wrapping: string.wrapping,
                                },
                            },
                        )
                        return p.value(false)
                    },
                    (string) => {
                        parser.multilineString(
                            {
                                annotation: data.annotation,
                                data: {
                                    lines: string.lines,
                                },
                            },
                        )
                        return p.value(false)
                    }
                )
            }
            function startBody() {
                const bp = createTreeParser(
                    $.onBody(
                        data.annotation,
                    ),
                    $.errors.onTreeError,
                    createDummyValueHandler,
                    () => {
                        rootContext.state = [StructureState.EXPECTING_END, {
                        }]
                    },
                )
                rootContext.state = [StructureState.PROCESSING_BODY, {
                    bodyParser: bp,
                }]
                callStackedParser(
                    bp,
                )

            }
            switch (rootContext.state[0]) {
                case StructureState.EXPECTING_HEADER_OR_BODY: {
                    return handleToken(
                        (punctuation) => {
                            switch (punctuation.type[0]) {
                                case "header start":
                                    rootContext.state = [StructureState.EXPECTING_SCHEMA_REFERENCE_OR_EMBEDDED_SCHEMA, {
                                        headerAnnotation: data.annotation,
                                    }]
                                    break
                                default:
                                    startBody()
                            }
                            return p.value(false)
                        },
                        (_string) => {
                            startBody()
                            return p.value(false)
                        },
                        (_string) => {
                            startBody()
                            return p.value(false)
                        }
                    )
                }
                case StructureState.EXPECTING_SCHEMA_REFERENCE_OR_EMBEDDED_SCHEMA: {
                    const headerAnnotation = rootContext.state[1].headerAnnotation
                    return handleToken(
                        (structuralToken) => {
                            if (structuralToken.type[0] !== "header start") {
                                raiseError(["expected a schema reference or an embedded schema"])
                                return p.value(false)
                            }
                            rootContext.state = [StructureState.EXPECTING_SCHEMA_SCHEMA_REFERENCE, {
                                headerAnnotation: headerAnnotation,
                                embeddedSchemaAnnotation: data.annotation,
                            }]
                            return p.value(false)
                        },
                        (stringData) => {
                            rootContext.state = [StructureState.EXPECTING_BODY, {
                            }]
                            return $.onSchemaReference({
                                headerAnnotation: headerAnnotation,
                                token: {
                                    data: stringData,
                                    annotation: data.annotation,
                                },
                            })
                        },
                        () => {
                            raiseError(["expected an embedded schema"])
                            return p.value(false)
                        },
                    )
                }
                case StructureState.EXPECTING_SCHEMA_SCHEMA_REFERENCE: {
                    const headerAnnotation = rootContext.state[1].headerAnnotation
                    const embeddedSchemaAnnotation = rootContext.state[1].embeddedSchemaAnnotation
                    if (data.type[0] !== TokenType.SimpleString) {
                        raiseError(["expected a schema schema reference"])
                        return p.value(false)
                    }

                    rootContext.state = [StructureState.EXPECTING_EMBEDDED_SCHEMA, {
                        treeHandler: $.onEmbeddedSchema({
                            headerAnnotation: headerAnnotation,
                            embeddedSchemaAnnotation: embeddedSchemaAnnotation,
                            schemaSchemaReferenceToken: {
                                data: data.type[1],
                                annotation: data.annotation,
                            },
                        }),
                    }]
                    return p.value(false)
                }
                case StructureState.EXPECTING_EMBEDDED_SCHEMA: {

                    const schemaParser = createTreeParser(
                        rootContext.state[1].treeHandler,
                        $.errors.onTreeError,
                        createDummyValueHandler,
                        () => {
                            rootContext.state = [StructureState.EXPECTING_BODY, {
                            }]
                        }
                    )
                    rootContext.state = [StructureState.PROCESSING_EMBEDDED_SCHEMA, {
                        schemaParser: schemaParser,
                    }]
                    callStackedParser(
                        schemaParser,
                    )
                    return p.value(false)
                }
                case StructureState.PROCESSING_EMBEDDED_SCHEMA: {
                    const $ = rootContext.state[1]
                    callStackedParser(
                        $.schemaParser,
                    )
                    return p.value(false)
                }
                case StructureState.EXPECTING_BODY: {
                    startBody()
                    return p.value(false)
                }
                case StructureState.PROCESSING_BODY: {
                    const $ = rootContext.state[1]
                    callStackedParser(
                        $.bodyParser,
                    )
                    return p.value(false)
                }
                case StructureState.EXPECTING_END: {
                    return handleToken(
                        (_punctuation) => {
                            raiseError([`unexpected data after end`, {
                            }])
                            return p.value(false)
                        },
                        (string) => {
                            raiseError([`unexpected data after end`, {
                                data: string.value,
                            }])
                            return p.value(false)
                        },
                        (string) => {
                            raiseError([`unexpected data after end`, {
                                data: string.lines.join("\n"),
                            }])
                            return p.value(false)
                        },
                    )
                }
                default:
                    return assertUnreachable(rootContext.state[0])
            }
        },
    }
}
