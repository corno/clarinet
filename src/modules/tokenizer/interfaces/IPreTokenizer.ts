import { PreToken } from "../../tokenizer/types/PreToken";
import { IChunk } from "./IChunk";

export interface IPreTokenizer {
    handleDanglingToken(): PreToken | null
    createNextToken(currentChunk: IChunk): null | PreToken
}