/* eslint
*/
import * as p from "pareto"
import * as generic from "../../../generic"
import * as rng from "../../../modules/tokenizer/types/range"
import { IPreTokenStreamConsumer } from "../../../apis/ITokenizer"
import { ITokenConsumer, TokenType } from "../../../apis/ITokenizer"
import { PreToken, PreTokenDataType, WrappedStringType } from "../../../apis/ITokenizer"
import { TokenizerAnnotationData } from "../../../apis/ITokenizer"
import { printRange } from "../../../modules/tokenizer/functions/printRange"
import { getEndLocationFromRange } from "../../../modules/tokenizer/functions/getEndLocationFromRange"

function createRangeFromLocations(start: rng.Location, end: rng.Location): rng.Range {
    return {
        start: start,
        length: end.position - start.position,
        size: ((): rng.RangeSize => {
            if (start.line === end.line) {
                return ["single line", { "column offset": end.column - start.column }]
            } else {
                return ["multi line", { "line offset": end.line - start.line, "column": end.column }]
            }
        })(),
    }
}

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}


function createRangeFromSingleLocation(location: rng.Location): rng.Range {
    return {
        start: location,
        length: 0,
        size: ["single line", { "column offset": 0 }],
    }
}



type NonWrappedStringContext = {
    nonwrappedStringNode: string
    readonly start: rng.Location
}
type WhitespaceContext = {
    whitespaceNode: string
    readonly start: rng.Location
}

type CommentContext = {
    commentNode: string
    readonly start: rng.Range
    readonly indentation: null | string
}

enum CurrentTokenType {
    LINE_COMMENT,
    BLOCK_COMMENT,
    QUOTED_STRING,
    NONE,
    NONWRAPPED_STRING,
    WHITESPACE,
}


type WrappedStringContext = {
    readonly type: WrappedStringType
    readonly start: rng.Range
    wrappedStringNode: string
    indentation: string

}


type CurrentToken =
    | [CurrentTokenType.NONE]
    | [CurrentTokenType.LINE_COMMENT, CommentContext]
    | [CurrentTokenType.BLOCK_COMMENT, CommentContext]
    | [CurrentTokenType.NONWRAPPED_STRING, NonWrappedStringContext]
    | [CurrentTokenType.QUOTED_STRING, WrappedStringContext]
    | [CurrentTokenType.WHITESPACE, WhitespaceContext]


export class RangeError extends Error {
    public readonly range: rng.Range
    /**
     * as a RangeError extends a regular Error, it will have a message. In this message there will be range information
     * If you need a message without the range information, use this property
     */
    public readonly rangeLessMessage: string
    constructor(message: string, range: rng.Range) {
        super(`${message} @ ${printRange(range)}`)
        this.rangeLessMessage = message
        this.range = range
    }
}

class TokenizerStackPanicError extends RangeError {
    constructor(message: string, range: rng.Range) {
        super(`stack panic: ${message}`, range)
    }
}

export function createTokenizer(
    parser: ITokenConsumer<TokenizerAnnotationData>,
): IPreTokenStreamConsumer {

    class IndentationState {
        private indentation = ""
        private lineIsDirty = false
        setLineDirty() {
            this.lineIsDirty = true
        }
        onWhitespace(value: string) {
            if (!this.lineIsDirty) {
                this.indentation = value
            }
        }
        onNewline() {
            this.indentation = ""
            this.lineIsDirty = false
        }
        getIndentation() {
            return this.indentation
        }
    }

    const indentationState = new IndentationState()

    function createAnnotation(
        range: rng.Range,
        tokenString: string | null,
    ): TokenizerAnnotationData {
        return {
            tokenString: tokenString,
            range: range,
            indentation: indentationState.getIndentation(),
            contextData: {
                before: {
                    comments: [],
                },
                lineCommentAfter: null,
            },

        }
    }
    let currentToken: CurrentToken = [CurrentTokenType.NONE]


    function setCurrentToken(contextType: CurrentToken, range: rng.Range) {
        if (currentToken[0] !== CurrentTokenType.NONE) {
            throw new TokenizerStackPanicError(`unexpected start of token`, range)
        }
        currentToken = contextType
    }
    function unsetCurrentToken(range: rng.Range) {
        if (currentToken[0] === CurrentTokenType.NONE) {
            throw new TokenizerStackPanicError(`unexpected, parser is already in 'none' mode`, range)
        }
        currentToken = [CurrentTokenType.NONE]
    }

    return {
        onData: (data: PreToken): p.IValue<boolean> => {
            switch (data.type[0]) {
                case PreTokenDataType.BlockCommentBegin: {
                    const $ = data.type[1]

                    setCurrentToken([CurrentTokenType.BLOCK_COMMENT, {
                        commentNode: "",
                        start: $.range,
                        indentation: indentationState.getIndentation(),
                    }], $.range)

                    indentationState.setLineDirty()
                    return p.value(false)
                }
                case PreTokenDataType.BlockCommentEnd: {
                    const $ = data.type[1]

                    if (currentToken[0] !== CurrentTokenType.BLOCK_COMMENT) {
                        throw new TokenizerStackPanicError(`Unexpected block comment end`, $.range)
                    }
                    //const $ = currentToken[1]
                    //const endOfStart = getEndLocationFromRange($.start)
                    // const od = parser.onData({
                    //     tokenString: "*/",
                    //     range: createRangeFromLocations(
                    //         $.start.start,
                    //         getEndLocationFromRange(end),
                    //     ),
                    //     type: [TokenType.Overhead, {
                    //         type: [OverheadTokenType.Comment, {
                    //             comment: $.commentNode,
                    //             innerRange: createRangeFromLocations(
                    //                 {
                    //                     position: endOfStart.position,
                    //                     line: endOfStart.line,
                    //                     column: endOfStart.column,
                    //                 },
                    //                 {
                    //                     position: end.start.position,
                    //                     line: end.start.line,
                    //                     column: end.start.column,
                    //                 },
                    //             ),
                    //             indentation: $.indentation,
                    //             type: "block",
                    //         }],
                    //     }],
                    // })
                    unsetCurrentToken($.range)
                    //return od
                    return p.value(false)
                }
                case PreTokenDataType.LineCommentBegin: {
                    const $ = data.type[1]

                    setCurrentToken(
                        [CurrentTokenType.LINE_COMMENT, {
                            commentNode: "",
                            start: $.range,
                            indentation: indentationState.getIndentation(),
                        }],
                        $.range
                    )
                    indentationState.setLineDirty()
                    return p.value(false)
                }
                case PreTokenDataType.LineCommentEnd: {
                    const $ = data.type[1]
                    function onLineCommentEnd(location: rng.Location): p.IValue<boolean> {

                        if (currentToken[0] !== CurrentTokenType.LINE_COMMENT) {
                            throw new TokenizerStackPanicError(`Unexpected line comment end`, createRangeFromSingleLocation(location))
                        }

                        //const $ = currentToken[1]
                        // const range = createRangeFromLocations($.start.start, location)
                        // const endOfStart = getEndLocationFromRange($.start)
                        // const od = parser.onData({
                        //     tokenString: "",
                        //     range: range,
                        //     type: [TokenType.Overhead, {
                        //         type: [OverheadTokenType.Comment, {
                        //             comment: $.commentNode,
                        //             innerRange: createRangeFromLocations(
                        //                 {
                        //                     position: endOfStart.position,
                        //                     line: endOfStart.line,
                        //                     column: endOfStart.column,
                        //                 },
                        //                 location,
                        //             ),
                        //             indentation: $.indentation,
                        //             type: "line",
                        //         }],
                        //     }],
                        // })
                        unsetCurrentToken(createRangeFromSingleLocation(location))
                        return p.value(false)
                    }
                    return onLineCommentEnd($.location)
                }
                case PreTokenDataType.NewLine: {
                    const $ = data.type[1]
                    function onNewLine(_range: rng.Range, _tokenString: string): p.IValue<boolean> {

                        indentationState.onNewline()


                        switch (currentToken[0]) {
                            case CurrentTokenType.LINE_COMMENT: {
                                throw new Error(`unexpected newline`)
                            }
                            case CurrentTokenType.BLOCK_COMMENT: {
                                throw new Error("IMPLEMENT ME: BLOCK COMMENT NEWLINE")
                                // $.type[1].previousLines.push($.wrappedStringNode)
                                // $.wrappedStringNode = ""
                                return p.value(false)
                            }
                            case CurrentTokenType.NONE: {

                                // return parser.onData({
                                //     tokenString: tokenString,
                                //     range: range,
                                //     type: [TokenType.Overhead, {
                                //         type: [OverheadTokenType.NewLine, {
                                //         }],
                                //     }],
                                // })
                                return p.value(false)
                            }
                            case CurrentTokenType.QUOTED_STRING: {
                                const $ = currentToken[1]
                                if ($.type[0] !== "multiline") {
                                    throw new Error(`unexpected newline`)
                                }
                                $.type[1].previousLines.push($.wrappedStringNode)
                                $.wrappedStringNode = ""
                                return p.value(false)
                            }
                            case CurrentTokenType.NONWRAPPED_STRING: {
                                throw new Error(`unexpected newline`)
                            }
                            case CurrentTokenType.WHITESPACE: {
                                throw new Error(`unexpected newline`)
                            }
                            default:
                                return assertUnreachable(currentToken[0])
                        }
                    }
                    return onNewLine($.range, "FIXME NEWLINE TOKEN STRING")
                }
                case PreTokenDataType.Punctuation: {
                    const $ = data.type[1]
                    indentationState.setLineDirty()
                    return parser.onData({
                        annotation: createAnnotation(
                            $.range,
                            String.fromCharCode($.char),
                        ),
                        type: [TokenType.Structural, {
                            char: $.char,
                        }],
                    })
                }
                case PreTokenDataType.Snippet: {
                    const $ = data.type[1]
                    function onSnippet(chunk: string, begin: number, end: number): p.IValue<boolean> {

                        switch (currentToken[0]) {
                            case CurrentTokenType.LINE_COMMENT: {
                                const $ = currentToken[1]
                                $.commentNode += chunk.substring(begin, end)
                                break
                            }
                            case CurrentTokenType.BLOCK_COMMENT: {
                                const $ = currentToken[1]
                                $.commentNode += chunk.substring(begin, end)
                                break
                            }
                            case CurrentTokenType.NONE: {
                                throw new Error(`unexpected snippet`)
                            }
                            case CurrentTokenType.QUOTED_STRING: {
                                const $ = currentToken[1]
                                $.wrappedStringNode += chunk.substring(begin, end)
                                break
                            }
                            case CurrentTokenType.NONWRAPPED_STRING: {
                                const $ = currentToken[1]
                                $.nonwrappedStringNode += chunk.substring(begin, end)
                                break
                            }
                            case CurrentTokenType.WHITESPACE: {
                                const $ = currentToken[1]
                                $.whitespaceNode += chunk.substring(begin, end)
                                break
                            }
                            default:
                                assertUnreachable(currentToken[0])
                        }
                        return p.value(false)
                    }
                    return onSnippet($.chunk, $.begin, $.end)
                }
                case PreTokenDataType.WrappedStringBegin: {
                    const $ = data.type[1]
                    indentationState.setLineDirty()
                    function onWrappedStringBegin(begin: rng.Range, quote: WrappedStringType): p.IValue<boolean> {
                        setCurrentToken(
                            [CurrentTokenType.QUOTED_STRING, {
                                wrappedStringNode: "",
                                start: begin,
                                type: quote,
                                indentation: indentationState.getIndentation(),
                            }],
                            begin
                        )
                        return p.value(false)
                    }
                    return onWrappedStringBegin($.range, $.type)
                }
                case PreTokenDataType.WrappedStringEnd: {
                    const $ = data.type[1]
                    function onWrappedStringEnd(end: rng.Range, wrapper: string | null): p.IValue<boolean> {
                        if (currentToken[0] !== CurrentTokenType.QUOTED_STRING) {
                            throw new TokenizerStackPanicError(`Unexpected nonwrapped string end`, end)
                        }
                        const $tok = currentToken[1]
                        const $ = currentToken[1]

                        const range = createRangeFromLocations($tok.start.start, getEndLocationFromRange(end))

                        unsetCurrentToken(end)

                        switch ($.type[0]) {
                            case "apostrophe": {
                                return parser.onData({
                                    annotation: createAnnotation(
                                        range,
                                        `'${$.wrappedStringNode}'`,
                                    ),
                                    type: [TokenType.SimpleString, {
                                        value: $.wrappedStringNode,
                                        wrapping: ["apostrophe", {
                                            terminated: wrapper !== null,
                                        }],
                                    }],
                                })
                            }
                            case "multiline": {
                                const $$ = $.type[1]
                                function trimStringLines(lines: string[], indentation: string) {
                                    return lines.map((line, index) => {
                                        if (index === 0) { //the first line needs no trimming
                                            return line
                                        }
                                        if (line.startsWith(indentation)) {
                                            return line.substr(indentation.length)
                                        }
                                        return line
                                    })
                                }
                                return parser.onData({
                                    annotation: createAnnotation(
                                        range,
                                        `\`${$.type[1].previousLines.concat([$.wrappedStringNode]).join("\n")}\``,
                                    ),
                                    type: [TokenType.MultilineString, {
                                        lines: trimStringLines($$.previousLines.concat([$.wrappedStringNode]), $.indentation),
                                        terminated: wrapper !== null,
                                    }],
                                })
                            }
                            case "quote": {
                                return parser.onData({
                                    annotation: createAnnotation(
                                        range,
                                        `'${$.wrappedStringNode}'`,
                                    ),
                                    type: [TokenType.SimpleString, {
                                        value: $.wrappedStringNode,
                                        wrapping: ["quote", {
                                            terminated: wrapper !== null,
                                        }],
                                    }],
                                })
                            }
                            default:
                                return assertUnreachable($.type[0])
                        }
                    }
                    return onWrappedStringEnd($.range, $.wrapper)
                }
                case PreTokenDataType.NonWrappedStringBegin: {
                    const $ = data.type[1]
                    function onNonWrappedStringBegin(location: rng.Location): p.IValue<boolean> {

                        indentationState.setLineDirty()

                        setCurrentToken([CurrentTokenType.NONWRAPPED_STRING, { nonwrappedStringNode: "", start: location }], createRangeFromSingleLocation(location))
                        return p.value(false)
                    }
                    return onNonWrappedStringBegin($.location)
                }
                case PreTokenDataType.NonWrappedStringEnd: {
                    const $ = data.type[1]
                    function onNonWrappedStringEnd(location: rng.Location): p.IValue<boolean> {

                        if (currentToken[0] !== CurrentTokenType.NONWRAPPED_STRING) {
                            throw new TokenizerStackPanicError(`Unexpected nonwrapped string end`, createRangeFromSingleLocation(location))
                        }
                        const $ = currentToken[1]

                        const $tok = currentToken[1]
                        const value = $tok.nonwrappedStringNode
                        const range = createRangeFromLocations($.start, location)
                        unsetCurrentToken(createRangeFromSingleLocation(location))
                        return parser.onData({
                            annotation: createAnnotation(
                                range,
                                ""
                            ),
                            type: [TokenType.SimpleString, {
                                value: value,
                                wrapping: ["none", {
                                }],
                                //startCharacter: $tok.startCharacter,
                                //terminated: null,
                                //wrapper: null,
                            }],
                        })
                    }
                    return onNonWrappedStringEnd($.location)
                }
                case PreTokenDataType.WhiteSpaceBegin: {
                    const $ = data.type[1]
                    function onWhitespaceBegin(location: rng.Location): p.IValue<boolean> {
                        const $: WhitespaceContext = { whitespaceNode: "", start: location }

                        setCurrentToken([CurrentTokenType.WHITESPACE, $], createRangeFromSingleLocation(location))
                        return p.value(false)
                    }

                    return onWhitespaceBegin($.location)
                }
                case PreTokenDataType.WhiteSpaceEnd: {
                    const $ = data.type[1]
                    function onWhitespaceEnd(location: rng.Location): p.IValue<boolean> {

                        if (currentToken[0] !== CurrentTokenType.WHITESPACE) {
                            throw new TokenizerStackPanicError(`Unexpected whitespace end`, createRangeFromSingleLocation(location))
                        }
                        const $ = currentToken[1]
                        //const range = createRangeFromLocations($.start, location)
                        indentationState.onWhitespace($.whitespaceNode)
                        // const od = parser.onData({
                        //     tokenString: $.whitespaceNode,
                        //     range: range,
                        //     type: [TokenType.Overhead, {
                        //         type: [OverheadTokenType.WhiteSpace, {
                        //             value: $.whitespaceNode,
                        //         }],
                        //     }],
                        // })
                        unsetCurrentToken(createRangeFromSingleLocation(location))
                        //return od
                        return p.value(false)
                    }
                    return onWhitespaceEnd($.location)
                }
                default:
                    return assertUnreachable(data.type[0])
            }
        },
        onEnd: (aborted: boolean, location: rng.Location): p.IValue<null> => {
            parser.onEnd(
                aborted,
                createAnnotation(
                    createRangeFromLocations(location, location),
                    null,
                )
            )
            return p.value(null)
        },
    }
}