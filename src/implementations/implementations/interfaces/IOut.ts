export interface IOut<LeafEvent, BlockEvent> {
    sendEvent(event: LeafEvent): void
    sendBlock(
        event: BlockEvent,
        callback: (out: IOut<LeafEvent, BlockEvent>) => void,
    ): void
}