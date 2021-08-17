import * as p from "pareto";
import { Token2 } from "../types/rawToken";

export interface IParser<Annotation> {
    onToken(token: Token2<Annotation>): p.IValue<boolean>
    onEnd(annotation: Annotation): void
}
