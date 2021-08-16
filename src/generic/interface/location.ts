
export type Location = {
    readonly position: number
    readonly line: number
    readonly column: number
}

export type Range = {
    readonly start: Location
    readonly length: number
    readonly size: RangeSize
}

export type RangeSize =
    | ["single line", {
        "column offset": number
    }]
    | ["multi line", {
        "line offset": number
        "column": number
    }]
