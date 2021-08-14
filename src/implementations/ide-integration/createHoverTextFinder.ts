import * as p from "pareto"
import { getEndLocationFromRange } from "../../generic"
import { TokenizerAnnotationData } from "../../interfaces"
import { TypedTreeHandler } from "../../interfaces/typed"
import { createHoverTextsGenerator } from "../typedHandlers"
import { isPositionBeforeLocation } from "./isPositionBeforeLocation"

export function createHoverTextFinder(
    positionLine: number, //the line where the hover is requested
    positionCharacter: number, //the character where the hover is requested
    callback: (hoverText: string) => void
): TypedTreeHandler<TokenizerAnnotationData, null> {
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
