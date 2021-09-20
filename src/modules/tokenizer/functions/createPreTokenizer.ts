/* eslint
    complexity:"off",
    no-console:"off",
*/

import { Location, Range, RangeSize } from "../types/range";
import { TokenError } from "../types/TokenError"
import { PreToken, PreTokenDataType } from "../types/PreToken";

import { ILoopState, IPreTokenizer, TokenReturnType } from "../interfaces/IPreTokenizer";
import { ILocationState } from "../interfaces/ILocationState";
import { StructuralTokenType } from "../../parser/types/rawToken";

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}


const CommentChar = {
    solidus: 0x2F,           // /
    asterisk: 0x2A,          // *
}

const Whitespace = {
    tab: 0x09,               // \t
    lineFeed: 0x0A,          // \n
    carriageReturn: 0x0D,    // \r
    space: 0x20,             //
}

const WrappedString = {
    quotationMark: 0x22,     // ?
    apostrophe: 0x27,        // '
    backtick: 0x60,          // `
    reverseSolidus: 0x5C,    // \
    solidus: 0x2F,           // /

    b: 0x62,                 // b
    f: 0x66,                 // f
    n: 0x6E,                 // n
    r: 0x72,                 // r
    t: 0x74,                 // t
    u: 0x75,                 // u
}

const Structural = {
    exclamationMark: 0x21,   // !
    verticalLine: 0x7C,      // |
    comma: 0x2C,             // ,
    colon: 0x3A,             // :
    openBrace: 0x7B,         // {
    closeBrace: 0x7D,        // }
    openParen: 0x28,         // )
    closeParen: 0x29,        // )
    openBracket: 0x5B,       // [
    closeBracket: 0x5D,      // ]
    openAngleBracket: 0x3C,  // <
    closeAngleBracket: 0x3E, // >
}

const UnicodeChars = {
    0: 0x30,
    9: 0x39,
    A: 0x41,
    F: 0x46,
    a: 0x61,
    f: 0x66,

}

function createRangeFromLocations(start: Location, end: Location): Range {
    return {
        start: start,
        length: end.position - start.position,
        size: ((): RangeSize => {
            if (start.line === end.line) {
                return ["single line", { "column offset": end.column - start.column }]
            } else {
                return ["multi line", { "line offset": end.line - start.line, "column": end.column }]
            }
        })(),
    }
}

function createRangeFromSingleLocation(location: Location): Range {
    return {
        start: location,
        length: 0,
        size: ["single line", { "column offset": 0 }],
    }
}

enum TokenType {
    BLOCK_COMMENT,
    LINE_COMMENT,
    WRAPPED_STRING,
    NONWRAPPED_STRING,
    WHITESPACE,
    NONE,
}

type CurrentToken =
    | [TokenType.BLOCK_COMMENT, BlockCommentContext]
    | [TokenType.LINE_COMMENT]
    | [TokenType.NONE, NoneContext]
    | [TokenType.NONWRAPPED_STRING]
    | [TokenType.WRAPPED_STRING, StringContext]
    | [TokenType.WHITESPACE]

type BlockCommentContext = {
    locationOfFoundAsterisk: null | Location
}

enum FoundNewlineCharacterType {
    CARRIAGE_RETURN,
    LINE_FEED,
}

type FoundNewlineCharacter = {
    type: FoundNewlineCharacterType
    startLocation: Location
}

type NoneContext = {
    foundNewlineCharacter: FoundNewlineCharacter | null
    foundSolidus: Location | null
}

type Unicode = {
    charactersLeft: number
    foundCharacters: ""
}

type StringContext = {
    slashed: boolean
    readonly startCharacter: number
    unicode: null | Unicode
    foundNewlineCharacter: FoundNewlineCharacter | null
}

function getCurrentCharacterRange(ls: ILocationState): Range {
    return createRangeFromLocations(ls.getCurrentLocation(), ls.getNextLocation())
}

type OnError = ($: {
    error: TokenError
    range: Range
}) => void


//const loopState = createLoopState(currentChunk, locationState)

// function createLoopState(
//     chunk: IChunk,
//     locationState: ILocationState,
// ): ILoopState {
//     let startIndex: null | number = null

//     function ensureFlushed(callback: () => TokenReturnType): TokenReturnType {
//         if (startIndex !== null) {
//             return {
//                 startSnippet: false,
//                 consumeCharacter: false,
//                 preToken: {
//                     type: [PreTokenDataType.Snippet, {
//                         chunk: chunk.getString(),
//                         begin: startIndex,
//                         end: chunk.getCurrentIndex(),
//                     }],
//                 },
//             }
//         }
//         return callback()
//     }

//     return {
//         /**
//          * if not flushed, the callback is not called.
//          * the current character position should not change so that the next round
//          * the same call will be made, but now it is flushed, so the callback will be called
//          */
//         ensureFlushed: (callback: () => TokenReturnType) => {
//             return ensureFlushed(callback)
//         },
//         whileLoop: (
//             callback: (
//                 nextChar: number,
//             ) => TokenReturnType
//         ): PreToken | null => {
//             while (true) {

//                 const nextChar = chunk.lookahead()

//                 if (nextChar === null) {
//                     return ensureFlushed(() => {
//                         return {
//                             startSnippet: false,
//                             consumeCharacter: false,
//                             preToken: null,
//                         }
//                     }).preToken
//                 }
//                 const result = callback(nextChar)
//                 if (result.startSnippet) {
//                     if (startIndex === null) {
//                         startIndex = chunk.getCurrentIndex()
//                     }
//                 }
//                 if (result.consumeCharacter) {
//                     const cc = chunk.lookahead()
//                     if (cc === null) {
//                         throw new Error("Unexpected consume")
//                     }
//                     locationState.increase(cc)
//                     chunk.increaseIndex()
//                 }
//                 if (result.preToken !== null) {
//                     return result.preToken
//                 }
//             }
//         },
//     }
// }

export function createPreTokenizer(
    locationState: ILocationState,
    onError: OnError,
): IPreTokenizer {

    let currentToken: CurrentToken = [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }]


    function changeCurrentTokenType(ct: CurrentToken, tokenData: PreToken): PreToken {
        currentToken = ct
        return tokenData
    }


    function handleNewlineCharacter(
        fnlc: FoundNewlineCharacter,
        nextChar: number,
    ): TokenReturnType {
        switch (fnlc.type) {
            case FoundNewlineCharacterType.CARRIAGE_RETURN: {
                /*
                if nextChar === Whitespace.lineFeed
                    windows style newlines (\r\n)
                else
                    old style Mac OS newlines (\r)
                */
                return {
                    startSnippet: false,
                    consumeCharacter: nextChar === Whitespace.lineFeed,
                    preToken: changeCurrentTokenType(
                        [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }],
                        {
                            type: [PreTokenDataType.NewLine, {
                                range: createRangeFromLocations(fnlc.startLocation, locationState.getCurrentLocation()),
                            }],
                        }
                    ),
                }

            }
            case FoundNewlineCharacterType.LINE_FEED: {
                /*
                if nextChar === Whitespace.carriageReturn
                    //strange style newline (\n\r)
                else
                    //unix style newlines (\n)
                    //don't consume character
                */
                return {
                    startSnippet: false,
                    consumeCharacter: nextChar === Whitespace.carriageReturn,
                    preToken: changeCurrentTokenType(
                        [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }],
                        {
                            type: [PreTokenDataType.NewLine, {
                                range: createRangeFromLocations(fnlc.startLocation, locationState.getCurrentLocation()),
                            }],
                        }
                    ),
                }
            }
            default:
                return assertUnreachable(fnlc.type)
        }
    }
    function flushString(
        str: string,
    ): PreToken {
        return {
            type: [PreTokenDataType.Snippet, {
                chunk: str,
                begin: 0,
                end: str.length,
            }],
        }
    }
    function processUntilFirstNotIncludedCharacter(
        loopState: ILoopState,
        isIncludedCharacter: (char: number) => boolean,
        onEndOfToken: () => TokenReturnType,
    ): null | PreToken {

        return loopState.whileLoop(
            (nextChar) => {

                //first check if we are breaking out of an nonwrapped string. Can only be done by checking the character that comes directly after the nonwrapped string
                if (!isIncludedCharacter(nextChar)) {

                    return loopState.ensureFlushed(onEndOfToken)

                    //this character does not belong to the keyword so don't go to the next character by breaking
                } else {
                    //normal character
                    //don't flush
                    return {
                        startSnippet: true,
                        consumeCharacter: true,
                        preToken: null,
                    }
                }
            }
        )
    }
    return {
        handleDanglingToken: () => {
            const ct = currentToken
            switch (ct[0]) {
                case TokenType.BLOCK_COMMENT: {
                    onError({
                        error: { type: ["unterminated block comment"] },
                        range: createRangeFromSingleLocation(locationState.getCurrentLocation()),
                    })
                    return {
                        type: [PreTokenDataType.BlockCommentEnd, {
                            range: createRangeFromSingleLocation(locationState.getCurrentLocation()),
                        }],
                    }
                }
                case TokenType.LINE_COMMENT: {
                    return {
                        type: [PreTokenDataType.LineCommentEnd, {
                            location: locationState.getCurrentLocation(),
                        }],
                    }
                }
                case TokenType.NONE:
                    const $ = ct[1]
                    if ($.foundNewlineCharacter !== null) {
                        return {
                            type: [PreTokenDataType.NewLine, {
                                range: createRangeFromLocations(
                                    $.foundNewlineCharacter.startLocation,
                                    locationState.getCurrentLocation(),
                                ),
                            }],
                        }
                    } else if ($.foundSolidus) {
                        onError({
                            error: { type: ["found dangling slash at the end of the text"] },
                            range: getCurrentCharacterRange(locationState),
                        })
                        return null
                    } else {
                        return null
                    }
                case TokenType.WRAPPED_STRING: {
                    onError({
                        error: { type: ["unterminated string"] },
                        range: createRangeFromLocations(locationState.getCurrentLocation(), locationState.getCurrentLocation()),
                    })
                    return {
                        type: [PreTokenDataType.WrappedStringEnd, {
                            range: createRangeFromLocations(
                                locationState.getCurrentLocation(),
                                locationState.getCurrentLocation(),
                            ),
                            wrapper: null,
                        }],
                    }
                }
                case TokenType.NONWRAPPED_STRING:
                    return {
                        type: [PreTokenDataType.NonWrappedStringEnd, {
                            location: locationState.getCurrentLocation(),
                        }],
                    }
                case TokenType.WHITESPACE:
                    return {
                        type: [PreTokenDataType.WhiteSpaceEnd, {
                            location: locationState.getCurrentLocation(),
                        }],
                    }
                default:
                    return assertUnreachable(ct[0])
            }
        },
        createNextToken: (loopState) => {

            switch (currentToken[0]) {
                case TokenType.BLOCK_COMMENT: {
                    const $$ = currentToken[1]

                    return loopState.whileLoop(
                        (nextChar) => {
                            if ($$.locationOfFoundAsterisk !== null) {
                                if (nextChar === CommentChar.solidus) {
                                    //end of block comment
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: true,
                                        preToken: changeCurrentTokenType(
                                            [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }],
                                            {
                                                type: [PreTokenDataType.BlockCommentEnd, {
                                                    range: createRangeFromLocations($$.locationOfFoundAsterisk, locationState.getCurrentLocation()),
                                                }],
                                            }
                                        ),
                                    }
                                } else {
                                    //false alarm, not the end of the comment

                                    //don't consume next token yet
                                    $$.locationOfFoundAsterisk = null
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: false,
                                        preToken: flushString("*"),
                                    }
                                }
                            } else {

                                if (nextChar === CommentChar.asterisk) {
                                    return loopState.ensureFlushed(() => {
                                        $$.locationOfFoundAsterisk = locationState.getCurrentLocation()
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: true,
                                            preToken: null,
                                        }
                                    })

                                } else {
                                    return {
                                        startSnippet: true,
                                        consumeCharacter: true,
                                        preToken: null,
                                    }
                                }

                            }
                        }
                    )
                }
                case TokenType.LINE_COMMENT: {

                    return processUntilFirstNotIncludedCharacter(
                        loopState,
                        (char) => {
                            return char !== Whitespace.lineFeed &&
                                char !== Whitespace.carriageReturn
                        },
                        () => {
                            return {
                                startSnippet: false,
                                consumeCharacter: false,
                                preToken: changeCurrentTokenType(
                                    [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }],
                                    {
                                        type: [PreTokenDataType.LineCommentEnd, {
                                            location: locationState.getCurrentLocation(),
                                        }],
                                    },
                                ),
                            }
                        }
                    )
                }
                case TokenType.NONE: {
                    const $ = currentToken[1]
                    return loopState.whileLoop(
                        (nextChar) => {

                            if ($.foundNewlineCharacter !== null) {
                                return handleNewlineCharacter($.foundNewlineCharacter, nextChar)
                            } else if ($.foundSolidus !== null) {

                                if (nextChar === CommentChar.solidus) {
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: true,
                                        preToken: changeCurrentTokenType(
                                            [TokenType.LINE_COMMENT],
                                            {
                                                type: [PreTokenDataType.LineCommentBegin, {
                                                    range: createRangeFromLocations($.foundSolidus, locationState.getCurrentLocation()),
                                                }],
                                            },
                                        ),
                                    }

                                } else if (nextChar === CommentChar.asterisk) {

                                    return {
                                        startSnippet: false,
                                        consumeCharacter: true,
                                        preToken: changeCurrentTokenType(
                                            [TokenType.BLOCK_COMMENT, { locationOfFoundAsterisk: null }],
                                            {
                                                type: [PreTokenDataType.BlockCommentBegin, {
                                                    range: createRangeFromLocations($.foundSolidus, locationState.getNextLocation()),
                                                }],
                                            },
                                        ),
                                    }

                                } else {
                                    onError({
                                        error: { type: ["found dangling slash"] },
                                        range: getCurrentCharacterRange(locationState),
                                    })
                                    $.foundSolidus = null
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: false,
                                        preToken: null,
                                    }
                                }

                            } else {

                                switch (nextChar) {
                                    case Whitespace.carriageReturn: {

                                        $.foundNewlineCharacter = {
                                            type: FoundNewlineCharacterType.CARRIAGE_RETURN,
                                            startLocation: locationState.getCurrentLocation(),
                                        }
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: true,
                                            preToken: null,
                                        }
                                    }
                                    case Whitespace.lineFeed: {

                                        $.foundNewlineCharacter = {
                                            type: FoundNewlineCharacterType.LINE_FEED,
                                            startLocation: locationState.getCurrentLocation(),
                                        }
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: true,
                                            preToken: null,
                                        }
                                    }
                                    case Whitespace.space: {
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: false,
                                            preToken: changeCurrentTokenType(
                                                [TokenType.WHITESPACE],
                                                {
                                                    type: [PreTokenDataType.WhiteSpaceBegin, {
                                                        location: locationState.getCurrentLocation(),
                                                    }],
                                                },
                                            ),
                                        }
                                    }
                                    case CommentChar.solidus: {
                                        $.foundSolidus = locationState.getCurrentLocation()
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: true,
                                            preToken: null,
                                        }
                                    }
                                    case Whitespace.tab: {
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: false,
                                            preToken: changeCurrentTokenType(
                                                [TokenType.WHITESPACE],
                                                {
                                                    type: [PreTokenDataType.WhiteSpaceBegin, {
                                                        location: locationState.getCurrentLocation(),
                                                    }],
                                                },
                                            ),
                                        }
                                    }
                                    case WrappedString.apostrophe: {
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: true,
                                            preToken: changeCurrentTokenType(
                                                [TokenType.WRAPPED_STRING, {
                                                    startCharacter: nextChar,
                                                    slashed: false,
                                                    unicode: null,
                                                    foundNewlineCharacter: null,
                                                }],
                                                {
                                                    type: [PreTokenDataType.WrappedStringBegin, {
                                                        type: ["apostrophe", {}],
                                                        range: getCurrentCharacterRange(locationState),
                                                    }],
                                                },
                                            ),
                                        }
                                    }
                                    case WrappedString.backtick: {
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: true,
                                            preToken: changeCurrentTokenType(
                                                [TokenType.WRAPPED_STRING, {
                                                    startCharacter: nextChar,
                                                    slashed: false,
                                                    unicode: null,
                                                    foundNewlineCharacter: null,
                                                }],
                                                {
                                                    type: [PreTokenDataType.WrappedStringBegin, {
                                                        type: ["multiline", {
                                                            previousLines: [],
                                                        }],
                                                        range: getCurrentCharacterRange(locationState),
                                                    }],
                                                },
                                            ),
                                        }
                                    }
                                    case WrappedString.quotationMark: {
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: true,
                                            preToken: changeCurrentTokenType(
                                                [TokenType.WRAPPED_STRING, {
                                                    startCharacter: nextChar,
                                                    slashed: false,
                                                    unicode: null,
                                                    foundNewlineCharacter: null,
                                                }],
                                                {
                                                    type: [PreTokenDataType.WrappedStringBegin, {
                                                        type: ["quote", {}],
                                                        range: getCurrentCharacterRange(locationState),
                                                    }],
                                                },
                                            ),
                                        }
                                    }
                                    default: {
                                        function createStructuralToken(type: StructuralTokenType): TokenReturnType {
                                            return {
                                                startSnippet: false,
                                                consumeCharacter: true,
                                                preToken: {
                                                    type: [PreTokenDataType.Structural, {
                                                        range: getCurrentCharacterRange(locationState),
                                                        type: type,
                                                    }],
                                                },
                                            }
                                        }
                                        switch (nextChar) {
                                            case Structural.closeAngleBracket: return createStructuralToken(["close shorthand group"])
                                            case Structural.closeBrace: return createStructuralToken(["close dictionary"])
                                            case Structural.closeBracket: return createStructuralToken(["close list"])
                                            case Structural.closeParen: return createStructuralToken(["close verbose group"])
                                            case Structural.colon: return {
                                                startSnippet: false,
                                                consumeCharacter: true,
                                                preToken: null,
                                            }
                                            case Structural.comma: return {
                                                startSnippet: false,
                                                consumeCharacter: true,
                                                preToken: null,
                                            }
                                            case Structural.exclamationMark: return createStructuralToken(["header start"])
                                            case Structural.openAngleBracket: return createStructuralToken(["open shorthand group"])
                                            case Structural.openBrace: return createStructuralToken(["open dictionary"])
                                            case Structural.openBracket: return createStructuralToken(["open list"])
                                            case Structural.openParen: return createStructuralToken(["open verbose group"])
                                            case Structural.verticalLine: return createStructuralToken(["tagged union start"])
                                            default:
                                                return {
                                                    startSnippet: false,
                                                    consumeCharacter: false,
                                                    preToken: changeCurrentTokenType(
                                                        [TokenType.NONWRAPPED_STRING],
                                                        {
                                                            type: [PreTokenDataType.NonWrappedStringBegin, {
                                                                location: locationState.getCurrentLocation(),
                                                            }],
                                                        },
                                                    ),
                                                }
                                        }
                                    }
                                }

                            }
                        }
                    )
                }
                case TokenType.WRAPPED_STRING: {
                    /**
                     * QUOTED STRING PROCESSING
                     */
                    const $ = currentToken[1]

                    return loopState.whileLoop(
                        (nextChar) => {

                            if ($.slashed) {
                                const flushChar = (str: string): TokenReturnType => {
                                    $.slashed = false
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: true,
                                        preToken: flushString(str),
                                    }
                                }

                                if (nextChar === WrappedString.quotationMark) { return flushChar('"') }
                                else if (nextChar === WrappedString.apostrophe) { return flushChar('\'') } //deviation from the JSON standard
                                else if (nextChar === WrappedString.apostrophe) { return flushChar('`') } //deviation from the JSON standard
                                else if (nextChar === WrappedString.reverseSolidus) { return flushChar('\\') }
                                else if (nextChar === WrappedString.solidus) { return flushChar('\/') }
                                else if (nextChar === WrappedString.b) {
                                    return flushChar('\b')
                                }
                                else if (nextChar === WrappedString.f) { return flushChar('\f') }
                                else if (nextChar === WrappedString.n) {
                                    if ($.startCharacter === WrappedString.backtick) {
                                        return loopState.ensureFlushed(() => {
                                            $.slashed = false
                                            return {
                                                startSnippet: false,
                                                consumeCharacter: true,
                                                preToken: {
                                                    type: [PreTokenDataType.NewLine, {
                                                        range: getCurrentCharacterRange(locationState),
                                                    }],
                                                },
                                            }
                                        })
                                    } else {
                                        return flushChar('\n')
                                    }
                                }
                                else if (nextChar === WrappedString.r) {
                                    if ($.startCharacter === WrappedString.backtick) {
                                        $.slashed = false

                                        return loopState.ensureFlushed(() => {
                                            return {
                                                startSnippet: false,
                                                consumeCharacter: true,
                                                preToken: {
                                                    type: [PreTokenDataType.NewLine, {
                                                        range: getCurrentCharacterRange(locationState),
                                                    }],
                                                },
                                            }
                                        })
                                    } else {
                                        return flushChar('\r')
                                    }
                                }
                                else if (nextChar === WrappedString.t) { return flushChar('\t') }
                                else if (nextChar === WrappedString.u) {
                                    // \uxxxx
                                    $.slashed = false
                                    $.unicode = {
                                        charactersLeft: 4,
                                        foundCharacters: "",
                                    }
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: true,
                                        preToken: null,
                                    }
                                }
                                else {
                                    //no special character

                                    onError({
                                        error: {
                                            type: ["expected special character after escape slash", {
                                                found: String.fromCharCode(nextChar),
                                            }],
                                        },
                                        range: getCurrentCharacterRange(locationState),
                                    })
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: true,
                                        preToken: null,
                                    }
                                }

                            } else if ($.unicode !== null) {
                                if (
                                    (nextChar < UnicodeChars["0"] && nextChar > UnicodeChars["9"])
                                    &&
                                    (nextChar < UnicodeChars.A && nextChar > UnicodeChars.F)
                                    &&
                                    (nextChar < UnicodeChars.a && nextChar > UnicodeChars.f)
                                ) {

                                    onError({
                                        error: {
                                            type: ["expected hexadecimal digit", {
                                                found: String.fromCharCode(nextChar),
                                            }],
                                        },
                                        range: getCurrentCharacterRange(locationState),
                                    })
                                }
                                const nextCharAsString = String.fromCharCode(nextChar)

                                $.unicode.foundCharacters += nextCharAsString
                                $.unicode.charactersLeft--
                                if ($.unicode.charactersLeft === 0) {
                                    const textNode = String.fromCharCode(parseInt($.unicode.foundCharacters, 16))
                                    $.unicode = null
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: true,
                                        preToken: flushString(textNode),
                                    }
                                } else {
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: true,
                                        preToken: null,
                                    }
                                }
                            } else if ($.foundNewlineCharacter !== null) {

                                switch ($.foundNewlineCharacter.type) {
                                    case FoundNewlineCharacterType.CARRIAGE_RETURN: {
                                        /*
                                        if nextChar === Whitespace.lineFeed
                                            windows style newlines (\r\n)
                                        else
                                            old style Mac OS newlines (\r)
                                        */
                                        const fnlc = $.foundNewlineCharacter
                                        $.foundNewlineCharacter = null
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: nextChar === Whitespace.lineFeed,
                                            preToken: {
                                                type: [PreTokenDataType.NewLine, {
                                                    range: createRangeFromLocations(fnlc.startLocation, locationState.getCurrentLocation()),
                                                }],
                                            },
                                        }

                                    }
                                    case FoundNewlineCharacterType.LINE_FEED: {
                                        /*
                                        if nextChar === Whitespace.carriageReturn
                                            //strange style newline (\n\r)
                                        else
                                            //unix style newlines (\n)
                                            //don't consume character
                                        */
                                        const fnlc = $.foundNewlineCharacter
                                        $.foundNewlineCharacter = null
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: nextChar === Whitespace.carriageReturn,
                                            preToken: {
                                                type: [PreTokenDataType.NewLine, {
                                                    range: createRangeFromLocations(fnlc.startLocation, locationState.getCurrentLocation()),
                                                }],
                                            },
                                        }
                                    }
                                    default:
                                        return assertUnreachable($.foundNewlineCharacter.type)
                                }
                            } else {
                                //not slashed, not unicode, not newline
                                if (nextChar === WrappedString.reverseSolidus) {//backslash
                                    return loopState.ensureFlushed(() => {
                                        $.slashed = true
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: true,
                                            preToken: null,
                                        }
                                    })
                                } else if (nextChar === $.startCharacter) {
                                    /**
                                     * THE QUOTED STRING IS FINISHED
                                     */

                                    return loopState.ensureFlushed(() => {
                                        const rangeInfo = getCurrentCharacterRange(locationState)

                                        return {
                                            startSnippet: false,
                                            consumeCharacter: true,
                                            preToken: changeCurrentTokenType(
                                                [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }],
                                                {
                                                    type: [PreTokenDataType.WrappedStringEnd, {
                                                        range: rangeInfo,
                                                        wrapper: String.fromCharCode(nextChar),
                                                    }],
                                                },
                                            ),
                                        }
                                    })
                                } else if (nextChar === Whitespace.carriageReturn || nextChar === Whitespace.lineFeed) {
                                    if ($.startCharacter === WrappedString.backtick) { //multiline

                                        return loopState.ensureFlushed(() => {

                                            $.foundNewlineCharacter = {
                                                type: nextChar === Whitespace.carriageReturn ? FoundNewlineCharacterType.CARRIAGE_RETURN : FoundNewlineCharacterType.LINE_FEED,
                                                startLocation: locationState.getCurrentLocation(),
                                            }
                                            return {
                                                startSnippet: false,
                                                consumeCharacter: true,
                                                preToken: null,
                                            }
                                        })
                                    } else {
                                        return loopState.ensureFlushed(() => {
                                            const rangeInfo = getCurrentCharacterRange(locationState)
                                            onError({
                                                error: { type: ["unterminated string"] },
                                                range: rangeInfo,
                                            })

                                            return {
                                                startSnippet: false,
                                                consumeCharacter: true,
                                                preToken: changeCurrentTokenType(
                                                    [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }],
                                                    {
                                                        type: [PreTokenDataType.WrappedStringEnd, {
                                                            range: rangeInfo,
                                                            wrapper: null,
                                                        }],
                                                    }
                                                ),
                                            }
                                        })
                                    }
                                } else {
                                    //normal character
                                    //don't flush
                                    return {
                                        startSnippet: true,
                                        consumeCharacter: true,
                                        preToken: null,
                                    }
                                }
                            }
                        }
                    )

                }
                case TokenType.NONWRAPPED_STRING: {
                    /**
                     * nonwrapped string PROCESSING (null, true, false)
                     */

                    return processUntilFirstNotIncludedCharacter(
                        loopState,
                        (char: number) => {
                            const isOtherCharacter = (false
                                || char === Whitespace.carriageReturn
                                || char === Whitespace.lineFeed
                                || char === Whitespace.space
                                || char === Whitespace.tab

                                || char === Structural.closeBrace
                                || char === Structural.closeParen
                                || char === Structural.colon
                                || char === Structural.comma
                                || char === Structural.openBrace
                                || char === Structural.openParen
                                || char === Structural.closeAngleBracket
                                || char === Structural.closeBracket
                                || char === Structural.openAngleBracket
                                || char === Structural.openBracket
                                || char === Structural.verticalLine

                                || char === CommentChar.solidus

                                || char === WrappedString.quotationMark
                                || char === WrappedString.apostrophe
                            )
                            return !isOtherCharacter
                        },
                        () => {
                            return {
                                startSnippet: false,
                                consumeCharacter: false,
                                preToken: changeCurrentTokenType(
                                    [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }],
                                    {
                                        type: [PreTokenDataType.NonWrappedStringEnd, {
                                            location: locationState.getCurrentLocation(),
                                        }],
                                    }
                                ),
                            }
                        },
                    )
                }
                case TokenType.WHITESPACE: {
                    /**
                     * nonwrapped string PROCESSING (null, true, false)
                     */
                    return loopState.whileLoop(
                        (nextChar) => {
                            //first check if we are breaking out of an whitespace token. Can only be done by checking the character that comes directly after the whitespace token
                            if (nextChar !== Whitespace.space && nextChar !== Whitespace.tab) {
                                return loopState.ensureFlushed(() => {
                                    return {
                                        startSnippet: false,
                                        consumeCharacter: false,
                                        preToken: changeCurrentTokenType(
                                            [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }],
                                            {
                                                type: [PreTokenDataType.WhiteSpaceEnd, {
                                                    location: locationState.getCurrentLocation(),
                                                }],
                                            }
                                        ),
                                    }
                                })
                            } else {
                                //whitespace character
                                return {
                                    startSnippet: true,
                                    consumeCharacter: true,
                                    preToken: null,
                                }
                            }
                        }
                    )
                }
                default:
                    return assertUnreachable(currentToken[0])
            }
        },
    }
}