export type TokenFormatInstruction = {
    stringBefore: string
    token: string
    stringAfter: string
}

export type NonTokenFormatInstruction = {
    string: string
}


export interface FormatInstructionWriter<TokenAnnotation, NonTokenAnnotation> {
    token: (instruction: TokenFormatInstruction, annotation: TokenAnnotation) => void
    nonToken: (instruction: NonTokenFormatInstruction, annotation: NonTokenAnnotation) => void
}