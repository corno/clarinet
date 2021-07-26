/* eslint
    no-console:"off",
    max-classes-per-file:"off",
*/
import * as p from "pareto"
import * as core from "../../core"
import * as Char from "../../generic/characters"
import { StructureErrorType as StructureErrorType } from "./functionTypes"
import { MultilineStringData, SimpleStringData, StructuralTokenData, TokenConsumer, TokenType } from "../../interfaces/ITokenConsumer"
import { createDummyValueHandler, createTreeParser, TreeParserErrorType } from "../../core"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

export interface StructureErrorHandler<Annotation> {
    onTreeError: ($: {
        error: TreeParserErrorType
        annotation: Annotation
    }) => void
    onStructureError: ($: {
        error: StructureErrorType
        annotation: Annotation
    }) => void
}

/**
 * @param onEmbeddedSchema a text can contain schema data. If this is the case, this callback will be called.
 * it enables the consuming code to prepare for the instance data. It cannot produce a result itself, hence the type parameters are null and null
 * @param onInstanceDataStart when the instance data starts, this callback is called and a TextParserEventConsumer should be returned. This consumer will also produce the final resulting type
 * @param onTextParserError a handler for when a parsing error occurs
 * @param onHeaderOverheadToken when a whitespace, newline or comment is encountered while parsing the header, this callback is called
 */
export function createStructureParser<Annotation>($: {
    onEmbeddedSchema: (
        schemaSchemaName: string,
        firstTokenAnnotation: Annotation,
    ) => core.TreeHandler<Annotation, null>
    onSchemaReference: (token: core.SimpleStringToken<Annotation>) => p.IValue<boolean>
    onBody: (
        annotation: Annotation,
    ) => core.TreeHandler<Annotation, null>
    onEnd: (endAnnotation: Annotation) => p.IValue<null>
    errors: StructureErrorHandler<Annotation>
}): TokenConsumer<Annotation> {

    enum StructureState {
        EXPECTING_SCHEMA_START_OR_ROOT_VALUE,
        EXPECTING_SCHEMA,
        PROCESSING_SCHEMA,
        EXPECTING_BODY,
        PROCESSING_BODY,
        EXPECTING_END, // no more input expected}

    }
    type RootContext = {
        state:
        | [StructureState.EXPECTING_SCHEMA_START_OR_ROOT_VALUE]
        | [StructureState.EXPECTING_SCHEMA]
        | [StructureState.PROCESSING_SCHEMA, {
            schemaParser: core.ITreeParser<Annotation>
        }]
        | [StructureState.EXPECTING_BODY, {
        }]
        | [StructureState.PROCESSING_BODY, {
            bodyParser: core.ITreeParser<Annotation>
        }]
        | [StructureState.EXPECTING_END, {
        }]
    }


    const rootContext: RootContext = { state: [StructureState.EXPECTING_SCHEMA_START_OR_ROOT_VALUE] }

    return {
        /*
        a structure overhead token is a newline/whitspace/comment outside the content parts: (schema data, instance data)
        */
        onEnd: (_aborted, annotation) => {
            function raiseError(error: StructureErrorType) {
                $.errors.onStructureError({
                    error: error,
                    annotation: annotation,
                })
            }
            switch (rootContext.state[0]) {
                case StructureState.EXPECTING_SCHEMA_START_OR_ROOT_VALUE: {
                    //const $ = rootContext.state[1]
                    raiseError(["expected the schema start (!) or root value"])
                    break
                }
                case StructureState.EXPECTING_SCHEMA: {
                    raiseError(["expected the schema"])
                    break
                }
                case StructureState.PROCESSING_SCHEMA: {
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
            return $.onEnd(annotation)
        },
        onData: data => {
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
                parser: core.ITreeParser<Annotation>,
            ) {
                return handleToken(
                    punctuation => {
                        function createToken<Data>(dta: Data): core.Token<Data, Annotation> {
                            return {
                                data: dta,
                                annotation: data.annotation,
                            }
                        }
                        switch (punctuation.char) {
                            case Char.Punctuation.exclamationMark:
                                raiseError(["unexpected '!'"])
                                break
                            case Char.Punctuation.closeAngleBracket:
                                parser.closeArray(createToken({

                                }))
                                break
                            case Char.Punctuation.closeBracket:
                                parser.closeArray(createToken({

                                }))
                                break
                            case Char.Punctuation.comma:
                                //TODO add as annotation to next token
                                break
                            case Char.Punctuation.openAngleBracket:
                                parser.openArray(createToken({
                                    type: ["shorthand group"],
                                }))
                                break
                            case Char.Punctuation.openBracket:
                                parser.openArray(createToken({
                                    type: ["list"],
                                }))
                                break
                            case Char.Punctuation.closeBrace:
                                parser.closeObject(createToken({

                                }))
                                break
                            case Char.Punctuation.closeParen:
                                parser.closeObject(createToken({

                                }))
                                break
                            case Char.Punctuation.colon:
                                //TODO add as annotation to next token
                                break
                            case Char.Punctuation.openBrace:
                                parser.openObject(createToken({
                                    type: ["dictionary"],
                                }))
                                break
                            case Char.Punctuation.openParen:
                                parser.openObject(createToken({
                                    type: ["verbose group"],
                                }))
                                break
                            case Char.Punctuation.verticalLine:
                                parser.taggedUnion(createToken({

                                }))
                                break
                            default:
                                raiseError(
                                    ['unknown punctuation', {
                                        found: String.fromCharCode(punctuation.char),
                                    }],
                                )
                        }
                        return p.value(false)
                    },
                    string => {
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
                    string => {
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
                case StructureState.EXPECTING_SCHEMA_START_OR_ROOT_VALUE: {
                    return handleToken(
                        punctuation => {
                            switch (punctuation.char) {
                                case Char.Punctuation.exclamationMark:
                                    rootContext.state = [StructureState.EXPECTING_SCHEMA]
                                    break
                                default:
                                    startBody()
                            }
                            return p.value(false)
                        },
                        _string => {
                            startBody()
                            return p.value(false)
                        },
                        _string => {
                            startBody()
                            return p.value(false)
                        }
                    )
                }
                case StructureState.EXPECTING_SCHEMA: {
                    return handleToken(
                        _punctuation => {
                            console.error("FIXME schema schema reference")
                            const schemaParser = createTreeParser(
                                $.onEmbeddedSchema(
                                    "mrshl/metadata@0.1",
                                    data.annotation,
                                ),
                                $.errors.onTreeError,
                                createDummyValueHandler,
                                () => {
                                    rootContext.state = [StructureState.EXPECTING_BODY, {
                                    }]
                                }
                            )
                            rootContext.state = [StructureState.PROCESSING_SCHEMA, {
                                schemaParser: schemaParser,
                            }]
                            callStackedParser(
                                schemaParser,
                            )
                            return p.value(false)
                        },
                        stringData => {
                            rootContext.state = [StructureState.EXPECTING_BODY, {
                            }]
                            return $.onSchemaReference({
                                data: stringData,
                                annotation: data.annotation,
                            })
                        },
                        _stringData => {
                            raiseError([`expected a schema reference or a schema body`])
                            return p.value(false)
                        },
                    )
                }
                case StructureState.PROCESSING_SCHEMA: {
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
                        punctuation => {
                            raiseError([`unexpected data after end`, {
                                data: String.fromCharCode(punctuation.char),
                            }])
                            return p.value(false)
                        },
                        string => {
                            raiseError([`unexpected data after end`, {
                                data: string.value,
                            }])
                            return p.value(false)
                        },
                        string => {
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
