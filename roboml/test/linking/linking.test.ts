import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { clearDocuments, parseHelper } from "langium/test";
import { createRoboMlServices } from "../../src/language/robo-ml-module.js";
import { RobotMLProgram, isLoop, isAssignment, isFunctionCall } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createRoboMlServices>;
let parse: ReturnType<typeof parseHelper<RobotMLProgram>>;
let document: LangiumDocument<RobotMLProgram> | undefined;

beforeAll(async () => {
    services = createRoboMlServices(EmptyFileSystem);
    parse = parseHelper<RobotMLProgram>(services.RoboMl);
});

afterEach(async () => {
    document && clearDocuments(services.shared, [document]);
});

describe('Linking tests', () => {

    test('linking of variables and function calls', async () => {
        document = await parse(`
            let void entry () {
                var number count = 0
                loop count < 5 {
                    count = count + 1
                    square()
                }
            }
            let void square() {
                Forward 30 in cm
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        const entryFn = document.parseResult.value.functions[0];
        const loopStmt = entryFn.body[1];
        expect(isLoop(loopStmt)).toBe(true);
        if (isLoop(loopStmt)) {
            const assign = loopStmt.body[0];
            const call = loopStmt.body[1];
            expect(isAssignment(assign) && assign.variable.ref?.name).toBe('count');
            expect(isFunctionCall(call) && call.function.ref?.name).toBe('square');
        }
    });
});
