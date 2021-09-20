import * as p from "pareto"

export interface IStreamConsumer<DataType, EndDataType, ReturnType> {
    onData(data: DataType): p.IValue<boolean>
    onEnd(aborted: boolean, data: EndDataType): p.IValue<ReturnType>
}