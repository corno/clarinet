import { Schema } from "../../schema/types/definitions"
import { ITypedTreeHandler } from "../interfaces/ITypedTreeHandler"
import { TreeHandler } from "../../parser/interfaces/ITreeHandler"
import { DiagnosticSeverity } from "../../diagnosticSeverity/types/DiagnosticSeverity"
import { UnmarshallError } from "../types/UnmarshallError"
import { createValueUnmarshaller, defaultInitializeValue } from "./createValueUnmarshaller"

export function createTreeUnmarshaller<TokenAnnotation, NonTokenAnnotation>(
    schema: Schema,
    handler: ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation>,
    onError: (message: UnmarshallError, annotation: TokenAnnotation, severity: DiagnosticSeverity) => void,
): TreeHandler<TokenAnnotation, NonTokenAnnotation> {

    return {
        root: {
            exists: createValueUnmarshaller(
                schema["root type"].get().value,
                handler.root,
                onError,
                () => {
                    //
                },
                null,
            ),
            missing: () => {
                defaultInitializeValue(
                    schema["root type"].get().value,
                    handler.root,
                    onError,
                )
            },
        },
        onEnd: () => handler.onEnd({}),
    }
}
