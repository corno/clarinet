import { DiagnosticSeverity } from "../../../generic"
import {UnmarshallError } from "../../../apis/Ityped"
import { Schema } from "../../../modules/typed/types/definitions"
import { createValueUnmarshaller, defaultInitializeValue } from "./createValueUnmarshaller"
import { ITypedTreeHandler } from "../../../modules/typed/interfaces/ITypedTreeHandler"
import { TreeHandler } from "../../../modules/treeHandler/interfaces/ITreeHandler"

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
