import * as p from "pareto"
import { isPositionBeforeLocation } from "./isPositionBeforeLocation"
import { getEndLocationFromRange } from "../../../modules/tokenizer/functions/getEndLocationFromRange"
import { ITypedTreeHandler } from "../../../modules/typed/interfaces/ITypedTreeHandler"
import { TokenizerAnnotationData } from "../../../modules/tokenizer/types/TokenizerAnnotationData"
import { createHoverTextsGenerator } from "./createHoverTextsGenerator"

export function createHoverTextFinder(
    positionLine: number, //the line where the hover is requested
    positionCharacter: number, //the character where the hover is requested
    callback: (hoverText: string) => void
): ITypedTreeHandler<TokenizerAnnotationData, null> {
    return createHoverTextsGenerator(
        (annotation, getHoverText) => {
            //console.log("LOCATION", range.start.line, range.start.column, range.end.line, range.end.column)

            if (isPositionBeforeLocation(positionLine, positionCharacter, annotation.range.start)) {
                return
            }
            if (isPositionBeforeLocation(positionLine, positionCharacter, getEndLocationFromRange(annotation.range))) {
                if (getHoverText !== null) {
                    callback(getHoverText())
                }
            }
        },
        () => {
            return p.value(null)
        }
    )
}
