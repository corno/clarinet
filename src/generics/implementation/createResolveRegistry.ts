import { IResolveRegistry, Resolve, ResolveError } from "../interface"

export function createResolveRegistry<Annotation>(): IResolveRegistry<Annotation> {
    class ResolveRegistry {
        public readonly references: Resolve<Annotation>[] = []
        public getRegistrater() {
            return {
                register: (reference: Resolve<Annotation>) => {
                    this.references.push(reference)
                },
            }
        }
        public register(reference: Resolve<Annotation>): void {
            this.references.push(reference)
        }
        public resolve(
            onError: (error: ResolveError<Annotation>) => void,
        ): boolean {
            let foundErrors = false
            this.references.forEach(r => {
                const result = r()
                if (result !== null) {
                    onError(result)
                    foundErrors = true
                }
            })
            return !foundErrors
        }
    }
    return new ResolveRegistry()
}