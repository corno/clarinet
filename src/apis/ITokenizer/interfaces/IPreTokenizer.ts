import { IChunk } from "./IChunk";
import { PreToken } from "./IPreTokenStreamConsumer"

export interface IPreTokenizer {
    handleDanglingToken(): PreToken | null
    createNextToken(currentChunk: IChunk): null | PreToken
}