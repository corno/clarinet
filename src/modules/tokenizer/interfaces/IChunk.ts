
export interface IChunk {
    lookahead(): number | null
    getIndexOfNextCharacter(): number
    getString(): string
    increaseIndex(): void
}