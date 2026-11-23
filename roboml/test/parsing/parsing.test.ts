import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { createRoboMlServices } from "../../src/language/robo-ml-module.js";
import { RobotMLProgram, isRobotMLProgram } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createRoboMlServices>;
let parse: ReturnType<typeof parseHelper<RobotMLProgram>>;
let document: LangiumDocument<RobotMLProgram> | undefined;

beforeAll(async () => {
    services = createRoboMlServices(EmptyFileSystem);
    parse = parseHelper<RobotMLProgram>(services.RoboMl);
});

describe('Parsing tests', () => {

    test('parse square example program', async () => {
        document = await parse(`
            let void entry () {
                setSpeed(150 in mm) // distance per second (here 150mm/s)
                var number count = 0
                loop count < 5
                {
                    count = count + 1
                    square()
                }
            }

            let void square(){
                Forward 30 in cm
                Clock 90
                Forward 300 in mm
                Clock 90
                Forward 30 in cm
                Clock 90
                Forward 300 in mm
                Clock 90
            }
        `);

        expect(checkDocumentValid(document)).toBeUndefined();
        expect(document.parseResult.value.functions).toHaveLength(2);
    });

    test('parse sensor example program', async () => {
        document = await parse(`
            let void entry () {
                setSpeed(200 mm)
                var number time = getTimestamp()
                loop time < 60000
                {
                    var number dist = getDistance() in cm
                    Forward dist - 25 in cm
                    Clock 90
                    time = getTimestamp()
                }
            }
        `);

        expect(checkDocumentValid(document)).toBeUndefined();
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length
        ? `Parser errors:\n  ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}`
        : document.parseResult.value === undefined
            ? `ParseResult is 'undefined'.`
            : !isRobotMLProgram(document.parseResult.value)
                ? `Root AST object is a ${document.parseResult.value.$type}, expected a 'RobotMLProgram'.`
                : undefined;
}
