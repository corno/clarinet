
import * as p from "pareto"
import {
    IDictionaryHandler,
    IGroupHandler,
    IListHandler,
    ITypedTaggedUnionHandler,
    ITypedTreeHandler,
    ITypedValueHandler,
} from "../interfaces/ITypedTreeHandler"

export function createDummyTypedHandler<TokenAnnotation, NonTokenAnnotation>(
): ITypedTreeHandler<TokenAnnotation, NonTokenAnnotation> {

    function createGroupNOPSideEffects(): IGroupHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onUnexpectedProperty: () => {
                //
            },
            onProperty: () => {
                return createValueNOPSideEffects()
            },
            // onUnexpectedProperty: () => {
            //     //
            // }
            onClose: () => {
                //
            },
        }
    }

    function createTaggedUnionNOPSideEffects(): ITypedTaggedUnionHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onUnexpectedOption: () => {
                return createValueNOPSideEffects()
            },
            onOption: () => {
                return createValueNOPSideEffects()
            },
            onEnd: () => {
                //
            },
        }
    }

    function createValueNOPSideEffects(): ITypedValueHandler<TokenAnnotation, NonTokenAnnotation> {

        return {
            onDictionary: () => {
                return createDictionaryNOPSideEffects()
            },
            onList: () => {
                return createListNOPSideEffects()
            },
            onTaggedUnion: () => {
                return createTaggedUnionNOPSideEffects()
            },
            onSimpleString: () => {
                //
            },
            onMultilineString: () => {
                //
            },
            onTypeReference: () => {
                return createValueNOPSideEffects()
            },
            onGroup: () => {
                return createGroupNOPSideEffects()
            },
        }
    }


    function createDictionaryNOPSideEffects(): IDictionaryHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onClose: () => {
                //
            },
            onEntry: () => {
                return createValueNOPSideEffects()
            },
        }
    }

    function createListNOPSideEffects(): IListHandler<TokenAnnotation, NonTokenAnnotation> {
        return {
            onClose: () => {
                //
            },
            onElement: () => {
                return createValueNOPSideEffects()
            },
        }
    }
    return {
        root: createValueNOPSideEffects(),
        onEnd: () => {
            return p.value(null)
        },
    }
}