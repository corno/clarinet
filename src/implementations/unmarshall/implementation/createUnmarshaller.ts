import { DiagnosticSeverity } from "../../../generic"
import { ITypedTreeHandler, UnmarshallError } from "../../../apis/Ityped"
import { TreeHandler } from "../../../apis/Iuntyped"
import { Schema } from "../../../apis/typedTreeHandler"
import { createValueUnmarshaller, defaultInitializeValue } from "./createValueUnmarshaller"

export function createUnmarshaller<TokenAnnotation, NonTokenAnnotation>(
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
