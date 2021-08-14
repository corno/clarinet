import { DiagnosticSeverity, TypedTreeHandler, UnmarshallError } from "../../interfaces/typed"
import { TreeHandler } from "../../interfaces/untyped"
import { Schema } from "../../typedHandler"
import { createValueUnmarshaller, defaultInitializeValue } from "./createValueUnmarshaller"

export function createUnmarshaller<TokenAnnotation, NonTokenAnnotation>(
    schema: Schema,
    handler: TypedTreeHandler<TokenAnnotation, NonTokenAnnotation>,
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
