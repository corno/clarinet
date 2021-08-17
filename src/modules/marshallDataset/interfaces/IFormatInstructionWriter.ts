import { NonTokenFormatInstruction, TokenFormatInstruction } from "../types/FormatInstruction";

export interface IFormatInstructionWriter<TokenAnnotation, NonTokenAnnotation> {
    token: (instruction: TokenFormatInstruction, annotation: TokenAnnotation) => void
    nonToken: (instruction: NonTokenFormatInstruction, annotation: NonTokenAnnotation) => void
}