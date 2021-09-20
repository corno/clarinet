import * as astn from "../src"
import { testProgram } from "./testProgram"

describe('formatting', () => {
    const dir = "./test/data/formatting"

    it("normalized ASTN", () => {
        return testProgram(
            dir + "/" + "in.astn",
            dir,
            "normalized",
            "astn",
            astn.normalize,
        )
    })
    it("JSON", () => {
        return testProgram(
            dir + "/" + "in.astn",
            dir,
            "out",
            "json",
            astn.toJSON,
        )
    })
})
