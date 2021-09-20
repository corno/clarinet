/* eslint
    complexity:"off",
    no-console:"off",
*/
import * as p from "pareto"

const Whitespace = {
    tab: 0x09,               // \t
    lineFeed: 0x0A,          // \n
    carriageReturn: 0x0D,    // \r
    space: 0x20,             //
}

import { Range } from "../types/range"
import { TokenizerOptions } from "../types/TokenizerOptions"
import { TokenError } from "../types/TokenError"


import { IChunk } from "../interfaces/IChunk"
import { IPreTokenStreamConsumer } from "../interfaces/IPreTokenStreamConsumer"
import { ILocationState } from "../interfaces/ILocationState"

import { createPreTokenizer } from "./createPreTokenizer"
import { ILoopState, TokenReturnType } from "../interfaces/IPreTokenizer"
import { PreToken, PreTokenDataType } from "../types/PreToken"
import { IStreamConsumer } from "../../../IStreamConsumer"

/**
 *
 * @param tokenStreamConsumer
 * @param onError
 * @param opt
 */
export function createStreamPreTokenizer(
    tokenStreamConsumer: IPreTokenStreamConsumer,
    onError: ($: {
        error: TokenError
        range: Range
    }) => void,
    opt?: TokenizerOptions
): IStreamConsumer<string, null, null> {

    const location = {
        position: -1,
        column: 0,
        line: 1,
    }
    const spacesPerTab: number = opt === undefined
        ? 4
        : opt.spaces_per_tab === undefined
            ? 4
            : opt.spaces_per_tab

    const locationState: ILocationState = {
        getCurrentLocation: () => {
            return {
                position: location.position + 1,
                line: location.line,
                column: location.column + 1,
            }
        },
        getNextLocation: () => {
            return {
                position: location.position + 2,
                line: location.line,
                column: location.column + 2,
            }
        },
        increase: (character) => {
            location.position++
            //set the position
            switch (character) {
                case Whitespace.lineFeed:
                    location.line++
                    location.column = 0
                    break
                case Whitespace.carriageReturn:
                    break
                case Whitespace.tab:
                    location.column += spacesPerTab
                    break
                default:
                    location.column++
            }
        },
    }
    const tokenizerState = createPreTokenizer(locationState, onError)
    let aborted = false

    function loopUntilPromiseOrEnd(currentChunk: IChunk): p.IValue<boolean> {
        if (aborted) {
            //ignore this data
            return p.value(true)
        }
        while (true) {
            const la = currentChunk.lookahead()
            if (la === null) {
                return p.value(false)
            }


            function createLoopState(
                chunk: IChunk,
            ): ILoopState {
                let startIndex: null | number = null

                function ensureFlushed(callback: () => TokenReturnType): TokenReturnType {
                    if (startIndex !== null) {
                        return {
                            startSnippet: false,
                            consumeCharacter: false,
                            preToken: {
                                type: [PreTokenDataType.Snippet, {
                                    chunk: chunk.getString(),
                                    begin: startIndex,
                                    end: chunk.getCurrentIndex(),
                                }],
                            },
                        }
                    }
                    return callback()
                }

                return {
                    /**
                     * if not flushed, the callback is not called.
                     * the current character position should not change so that the next round
                     * the same call will be made, but now it is flushed, so the callback will be called
                     */
                    ensureFlushed: (callback: () => TokenReturnType) => {
                        return ensureFlushed(callback)
                    },
                    whileLoop: (
                        callback: (
                            nextChar: number,
                        ) => TokenReturnType
                    ): PreToken | null => {
                        function whileLoop<RT>(
                            callback2: () => undefined | RT,
                        ): RT {
                            while (true) {
                                const returnValue = callback2()
                                if (returnValue !== undefined) {
                                    return returnValue
                                }
                            }
                        }
                        return whileLoop(
                            () => {
                                const nextChar = chunk.lookahead()
                                if (nextChar === null) {
                                    return ensureFlushed(() => {
                                        return {
                                            startSnippet: false,
                                            consumeCharacter: false,
                                            preToken: null,
                                        }
                                    }).preToken
                                }
                                const result = callback(nextChar)
                                if (result.startSnippet) {
                                    if (startIndex === null) {
                                        startIndex = chunk.getCurrentIndex()
                                    }
                                }
                                if (result.consumeCharacter) {
                                    const cc = chunk.lookahead()
                                    if (cc === null) {
                                        throw new Error("Unexpected consume")
                                    }
                                    locationState.increase(cc)
                                    chunk.increaseIndex()
                                }
                                if (result.preToken !== null) {
                                    return result.preToken
                                }
                                return undefined
                            }
                        )
                    },
                }
            }
            const loopState = createLoopState(currentChunk)

            const tokenData = tokenizerState.createNextToken(loopState)

            if (tokenData !== null) {
                const onDataResult = tokenStreamConsumer.onData(tokenData)
                return onDataResult.mapResult((abortRequested) => {

                    if (abortRequested) {
                        aborted = true
                        return p.value(true)
                    } else {
                        return loopUntilPromiseOrEnd(currentChunk)
                    }
                })
            }
        }
    }
    return {
        onData: (chunk: string): p.IValue<boolean> => {
            let currentIndex = 0
            const str = chunk

            return loopUntilPromiseOrEnd({
                lookahead: () => {
                    const char = str.charCodeAt(currentIndex)
                    return isNaN(char) ? null : char
                },
                increaseIndex: () => {
                    currentIndex += 1
                },
                getCurrentIndex: () => {
                    return currentIndex
                },
                getString: () => {
                    return str
                },
            })
        },
        onEnd: (aborted2: boolean): p.IValue<null> => {
            const tokenData = tokenizerState.handleDanglingToken()
            if (tokenData !== null) {
                const onDataReturnValue = tokenStreamConsumer.onData(tokenData)
                return onDataReturnValue.mapResult((_abort) => {
                    //nothing to abort anymore
                    return tokenStreamConsumer.onEnd(aborted2, locationState.getCurrentLocation())
                })
            } else {
                return tokenStreamConsumer.onEnd(aborted2, locationState.getCurrentLocation())
            }
        },
    }

}