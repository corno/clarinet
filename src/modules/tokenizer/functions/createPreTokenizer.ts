/* eslint
    complexity:"off",
    no-console:"off",
*/

import { Location, Range, RangeSize } from "../types/range";
import { TokenError } from "../types/TokenError"
import { PreToken, PreTokenDataType } from "../types/PreToken";

import { IChunk } from "../interfaces/IChunk";
import { IPreTokenizer } from "../interfaces/IPreTokenizer";
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

type TokenReturnType = {
    consumeCharacter: boolean
    preToken: null | PreToken
}

class Snippet {
    private readonly chunk: IChunk
    private startIndex: null | number = null
    constructor(chunk: IChunk) {
        this.chunk = chunk
    }
    public start() {
        if (this.startIndex === null) {
            this.startIndex = this.chunk.getIndexOfNextCharacter()
        }
    }
    /**
     * if not flushed, the callback is not called.
     * the current character position should not change so that the next round
     * the same call will be made, but now it is flushed, so the callback will be called
     */
    public ensureFlushed(callback: () => TokenReturnType): TokenReturnType {
        if (this.startIndex !== null) {
            return {
                consumeCharacter: false,
                preToken: {
                    type: [PreTokenDataType.Snippet, {
                        chunk: this.chunk.getString(),
                        begin: this.startIndex,
                        end: this.chunk.getIndexOfNextCharacter(),
                    }],
                },
            }
        }
        return callback()
    }
}

function getCurrentCharacterRange(ls: ILocationState): Range {
    return createRangeFromLocations(ls.getCurrentLocation(), ls.getNextLocation())
}

type OnError = ($: {
    error: TokenError
    range: Range
}) => void


export function createPreTokenizer(
    locationState: ILocationState,
    onError: OnError,
): IPreTokenizer {

    let currentTokenType: CurrentToken = [TokenType.NONE, { foundNewlineCharacter: null, foundSolidus: null }]


    function changeCurrentTokenType(tokenType: CurrentToken, tokenData: PreToken): PreToken {
        currentTokenType = tokenType
        return tokenData
    }
    class PreTokenizer {

        private flushString(
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
        private processUntilFirstNotIncludedCharacter(
            currentChunk: IChunk,
            isIncludedCharacter: (char: number) => boolean,
            onEndOfToken: () => TokenReturnType,
        ): null | PreToken {
            return this.whileLoop(
                currentChunk,
                (nextChar, snippet) => {

                    //first check if we are breaking out of an nonwrapped string. Can only be done by checking the character that comes directly after the nonwrapped string
                    if (!isIncludedCharacter(nextChar)) {

                        return snippet.ensureFlushed(onEndOfToken)

                        //this character does not belong to the keyword so don't go to the next character by breaking
                    } else {
                        //normal character
                        //don't flush
                        snippet.start()
                        return {
                            consumeCharacter: true,
                            preToken: null,
                        }
                    }
                }
            )
        }
        private whileLoop(
            currentChunk: IChunk,
            callback: (
                nextChar: number,
                snippet: Snippet,
            ) => TokenReturnType
        ): PreToken | null {
            const snippet = new Snippet(currentChunk)
            while (true) {

                const nextChar = currentChunk.lookahead()

                if (nextChar === null) {
                    return snippet.ensureFlushed(() => {
                        return {
                            consumeCharacter: false,
                            preToken: null,
                        }
                    }).preToken
                }
                const result = callback(nextChar, snippet)
                if (result.consumeCharacter) {
                    const cc = currentChunk.lookahead()
                    if (cc === null) {
                        throw new Error("Unexpected consume")
                    }
                    locationState.increase(cc)
                    currentChunk.increaseIndex()
                }
                if (result.preToken !== null) {
                    return result.preToken
                }
            }
        }
        public handleDanglingToken(): PreToken | null {
            const ct = currentTokenType
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
        }
        private handleNewlineCharacter(
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
        public createNextToken(currentChunk: IChunk): null | PreToken {
            const currentTokenType2 = currentTokenType
            switch (currentTokenType2[0]) {
                case TokenType.BLOCK_COMMENT: {
                    const $$ = currentTokenType2[1]
                    return this.whileLoop(
                        currentChunk,
                        (nextChar, snippet) => {
                            if ($$.locationOfFoundAsterisk !== null) {
                                if (nextChar === CommentChar.solidus) {
                                    //end of block comment
                                    return {
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
                                    return { consumeCharacter: false, preToken: this.flushString("*") }
                                }
                            } else {

                                if (nextChar === CommentChar.asterisk) {
                                    return snippet.ensureFlushed(() => {
                                        $$.locationOfFoundAsterisk = locationState.getCurrentLocation()
                                        return {
                                            consumeCharacter: true,
                                            preToken: null,
                                        }
                                    })

                                } else {
                                    snippet.start()
                                    return {
                                        consumeCharacter: true,
                                        preToken: null,
                                    }
                                }

                            }
                        }
                    )
                }
                case TokenType.LINE_COMMENT: {
                    return this.processUntilFirstNotIncludedCharacter(
                        currentChunk,
                        char => {
                            return char !== Whitespace.lineFeed &&
                                char !== Whitespace.carriageReturn
                        },
                        () => {
                            return {
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
                    return this.whileLoop(
                        currentChunk,
                        nextChar => {

                            const $ = currentTokenType2[1]
                            if ($.foundNewlineCharacter !== null) {
                                return this.handleNewlineCharacter($.foundNewlineCharacter, nextChar)
                            } else if ($.foundSolidus !== null) {

                                if (nextChar === CommentChar.solidus) {
                                    return {
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
                                            consumeCharacter: true,
                                            preToken: null,
                                        }
                                    }
                                    case Whitespace.space: {
                                        return {
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
                                            consumeCharacter: true,
                                            preToken: null,
                                        }
                                    }
                                    case Whitespace.tab: {
                                        return {
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
                                            case Structural.colon: return { consumeCharacter: true, preToken: null }
                                            case Structural.comma: return { consumeCharacter: true, preToken: null }
                                            case Structural.exclamationMark: return createStructuralToken(["header start"])
                                            case Structural.openAngleBracket: return createStructuralToken(["open shorthand group"])
                                            case Structural.openBrace: return createStructuralToken(["open dictionary"])
                                            case Structural.openBracket: return createStructuralToken(["open list"])
                                            case Structural.openParen: return createStructuralToken(["open verbose group"])
                                            case Structural.verticalLine: return createStructuralToken(["tagged union start"])
                                            default:
                                                return {
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
                    const $ = currentTokenType2[1]

                    return this.whileLoop(
                        currentChunk,
                        (nextChar, snippet): TokenReturnType => {

                            if ($.slashed) {
                                const flushChar = (str: string): TokenReturnType => {
                                    $.slashed = false
                                    return {
                                        consumeCharacter: true,
                                        preToken: this.flushString(str),
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
                                        return snippet.ensureFlushed(() => {
                                            $.slashed = false
                                            return {
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

                                        return snippet.ensureFlushed(() => {
                                            return {
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
                                        consumeCharacter: true,
                                        preToken: this.flushString(textNode),
                                    }
                                } else {
                                    return {
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
                                    return snippet.ensureFlushed(() => {
                                        $.slashed = true
                                        return {
                                            consumeCharacter: true,
                                            preToken: null,
                                        }
                                    })
                                } else if (nextChar === $.startCharacter) {
                                    /**
                                     * THE QUOTED STRING IS FINISHED
                                     */

                                    return snippet.ensureFlushed(() => {
                                        const rangeInfo = getCurrentCharacterRange(locationState)

                                        return {
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

                                        return snippet.ensureFlushed(() => {

                                            $.foundNewlineCharacter = {
                                                type: nextChar === Whitespace.carriageReturn ? FoundNewlineCharacterType.CARRIAGE_RETURN : FoundNewlineCharacterType.LINE_FEED,
                                                startLocation: locationState.getCurrentLocation(),
                                            }
                                            return {
                                                consumeCharacter: true,
                                                preToken: null,
                                            }
                                        })
                                    } else {
                                        return snippet.ensureFlushed(() => {
                                            const rangeInfo = getCurrentCharacterRange(locationState)
                                            onError({
                                                error: { type: ["unterminated string"] },
                                                range: rangeInfo,
                                            })

                                            return {
                                                consumeCharacter: true, preToken: changeCurrentTokenType(
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
                                    snippet.start()
                                    return {
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
                    return this.processUntilFirstNotIncludedCharacter(
                        currentChunk,
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

                    return this.whileLoop(
                        currentChunk,
                        (nextChar, snippet) => {
                            //first check if we are breaking out of an whitespace token. Can only be done by checking the character that comes directly after the whitespace token
                            if (nextChar !== Whitespace.space && nextChar !== Whitespace.tab) {
                                return snippet.ensureFlushed(() => {
                                    return {
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
                                snippet.start()
                                return {
                                    consumeCharacter: true,
                                    preToken: null,
                                }
                            }
                        }
                    )

                }
                default:
                    return assertUnreachable(currentTokenType2[0])
            }
        }
    }
    return new PreTokenizer()
}