import { createASTNSerializer } from ".";
import { formatCLI } from "../src/formatCLI";
import { CreateStreamConsumer } from "../src/runProgram"

export const normalize: CreateStreamConsumer = (
    write,
    onError,
) => {
    return formatCLI(
        write,
        onError,
        createASTNSerializer,
    )
}