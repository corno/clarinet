import { PreToken } from "../../tokenizer/types/PreToken";

export type TokenReturnType = {
    startSnippet: boolean
    consumeCharacter: boolean
    preToken: null | PreToken
}
export interface ILoopState {
    ensureFlushed(callback: () => TokenReturnType): TokenReturnType
    whileLoop(
        callback: (
            nextChar: number,
        ) => TokenReturnType,
    ): PreToken | null
}
export interface IPreTokenizer {
    handleDanglingToken(): PreToken | null
    createNextToken(loopState: ILoopState): null | PreToken
}