import { IResolveRegistry, Resolve } from "../interfaces/IResolveRegistry"


export function createResolveRegistry<Annotation>(): IResolveRegistry<Annotation> {
    const references: Resolve<Annotation>[] = []
    return {
        getRegistrater: () => {
            return {
                register: (reference) => {
                    references.push(reference)
                },
            }
        },
        resolve: (onError) => {
            let foundErrors = false
            references.forEach((r) => {
                const result = r()
                if (result !== null) {
                    onError(result)
                    foundErrors = true
                }
            })
            return !foundErrors
        },
    }
}