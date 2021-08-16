import { TokenFormatInstruction, NonTokenFormatInstruction } from "../types"

export interface IFormatInstructionWriter<TokenAnnotation, NonTokenAnnotation> {
    token: (instruction: TokenFormatInstruction, annotation: TokenAnnotation) => void
    nonToken: (instruction: NonTokenFormatInstruction, annotation: NonTokenAnnotation) => void
}