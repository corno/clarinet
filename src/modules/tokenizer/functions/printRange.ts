import { Range } from "../types/range"

export function printRange(range: Range): string {
    const tail = range.size[0] === "single line" ? `${range.start.column + range.size[1]["column offset"]}` : `${range.size[1]["line offset"] + range.start.line}:${range.size[1].column}`
    return `${range.start.line}:${range.start.column}-${tail}`
}
