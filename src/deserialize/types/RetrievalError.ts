
export type RetrievalError =
| ["not found", {
    //
}]
| ["other", {
    "description": string
}]