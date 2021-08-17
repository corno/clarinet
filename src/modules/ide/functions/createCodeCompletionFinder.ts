import * as p from "pareto"

import { isPositionBeforeLocation } from "./isPositionBeforeLocation"
import { getEndLocationFromRange } from "../../../modules/tokenizer/functions/getEndLocationFromRange"
import { ITypedTreeHandler } from "../../../modules/typed/interfaces/ITypedTreeHandler"
import { TokenizerAnnotationData } from "../../../modules/tokenizer/types/TokenizerAnnotationData"
import { createCodeCompletionsGenerator } from "./createCodeCompletionsGenerator"

export function createCodeCompletionFinder(
    completionPositionLine: number,
    completionPositionCharacter: number,
    callback: (codeCompletion: string) => void
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
            if (isPositionBeforeLocation(completionPositionLine, completionPositionCharacter, annotation.range.start)) {
                generate(previousAfter)
                positionAlreadyFound = true
                return
            }
            if (isPositionBeforeLocation(completionPositionLine, completionPositionCharacter, getEndLocationFromRange(annotation.range))) {
                generate(intra)
                positionAlreadyFound = true
                return
            }
            previousAfter = after
        },
        () => {
            if (!positionAlreadyFound) {
                generate(previousAfter)
            }
            return p.value(null)
        }
    )
}
