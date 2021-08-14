export type TreeParserErrorType =
    | ["missing array close"]
    | ["missing key"]
    | ["missing object close"]
    | ["missing option"]
    | ["missing property value"]
    | ["missing tagged union option and value"]
    | ["missing tagged union value"]
    | ["unexpected data after end"]
    | ["unexpected end of array"]
    | ["unexpected end of object"]
    | ["unexpected end of text", {
        "still in":
        | ["array"]
        | ["object"]
        | ["tagged union"]
    }]

export type TreeParserError<TokenAnnotation> = {
    type: TreeParserErrorType
    annotation: TokenAnnotation
}