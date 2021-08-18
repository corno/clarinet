import { TokenizerAnnotationData } from "../../tokenizer/types/TokenizerAnnotationData"
import { Range } from "../../tokenizer/types/range"

import { ITypedTreeHandler } from "../../typed/interfaces/ITypedTreeHandler"

import { getEndLocationFromRange } from "../../tokenizer/functions/getEndLocationFromRange"
import { createCodeCompletionsGenerator } from "./createCodeCompletionsGenerator"
import { isPositionBeforeLocation } from "./isPositionBeforeLocation"

function onPositionInContextOfRange(
    positionLine: number,
    positionCharacter: number,
    range: Range,
    onBefore: () => void,
    onIn: () => void,
    onAfter: () => void,
) {
    if (isPositionBeforeLocation(positionLine, positionCharacter, range.start)) {
        onBefore()
        return
    }
    if (isPositionBeforeLocation(positionLine, positionCharacter, getEndLocationFromRange(range))) {
        onIn()
        return
    }
    onAfter()
}

export function createCodeCompletionFinder(
    completionPositionLine: number,
    completionPositionCharacter: number,
    callback: (codeCompletion: string) => void,
): ITypedTreeHandler<TokenizerAnnotationData, null> {
    let positionAlreadyFound = false
    let previousAfter: null | (() => string[]) = null
    //console.log("FINDING COMPLETIONS", line, character)
    function generate(gs: (() => string[]) | null) {
        if (gs !== null) {
            const codeCompletions = gs()
            //console.log(codeCompletions)
            codeCompletions.forEach(codeCompletion => {
                //console.log("codeCompletion", codeCompletion)
                callback(codeCompletion)
            })
        }
    }

    return createCodeCompletionsGenerator(
        (annotation, intra, after) => {

            if (positionAlreadyFound) {
                return
            }
            onPositionInContextOfRange(
                completionPositionLine,
                completionPositionCharacter,
                annotation.range,
                () => {
                    generate(previousAfter)
                    positionAlreadyFound = true
                },
                () => {
                    generate(intra)
                    positionAlreadyFound = true
                },
                () => {
                    previousAfter = after
                }
            )
        },
        () => {
            if (!positionAlreadyFound) {
                generate(previousAfter)
            }
        }
    )
}
