
import * as p from "pareto"
import { Location } from "../types/location"
import { PreToken } from "../types/PreToken"


export type IPreTokenStreamConsumer = p.IStreamConsumer<PreToken, Location, null>