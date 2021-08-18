import { Location } from "../../tokenizer/types/location";

export function isPositionBeforeLocation(
    positionLine: number,
    positionCharacter: number,
    location: Location
): boolean {
    return positionLine < location.line
        || (
            positionLine === location.line
            && positionCharacter < location.column
        )
}