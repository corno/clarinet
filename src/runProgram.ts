import * as stream from "stream"
import { IStreamConsumer } from "./IStreamConsumer"


export type CreateStreamConsumer = (
    write: (str: string) => void,
    onError: (str: string) => void,
) => IStreamConsumer<string, null, null>

export function runProgram(
    createStreamConsumer: CreateStreamConsumer
): void {
    const ssp = createStreamConsumer(
        (str) => process.stdout.write(str),
        (str) => console.error(str)
    )
    process.stdin.setEncoding("utf-8")
    process.stdin.pipe(
        new stream.Writable({
            defaultEncoding: "utf-8",
            write: function (data, _encoding, callback) {
                ssp.onData(data.toString()).handle((_abort) => {
                    callback()
                })
            },
        })
    ).on('finish', () => {
        ssp.onEnd(false, null).handle(
            (_result) => {
                //
            },
        )
    })
}