import { createJSONSerializer } from ".";
import { formatCLI } from "./formatCLI";
import { CreateStreamConsumer } from "./runProgram"

export const toJSON: CreateStreamConsumer = (
    write,
    onError,
) => {
    return formatCLI(
        write,
        onError,
        createJSONSerializer,
    )
}