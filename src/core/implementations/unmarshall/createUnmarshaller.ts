import * as i from "../../interfaces"
import { createValueUnmarshaller, defaultInitializeValue } from "./createValueUnmarshaller"

export function createUnmarshaller<TokenAnnotation, NonTokenAnnotation>(
    schema: i.Schema,
    handler: i.TypedTreeHandler<TokenAnnotation, NonTokenAnnotation>,
    onError: (message: i.UnmarshallError, annotation: TokenAnnotation, severity: i.DiagnosticSeverity) => void,
): i.TreeHandler<TokenAnnotation, NonTokenAnnotation> {

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
    }
}
