import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { clearDocuments, parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import { createRoboMlServices } from "../../src/language/robo-ml-module.js";
import { RobotMLProgram, isRobotMLProgram } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createRoboMlServices>;
let parse: (input: string) => Promise<LangiumDocument<RobotMLProgram>>;
let document: LangiumDocument<RobotMLProgram> | undefined;

beforeAll(async () => {
    services = createRoboMlServices(EmptyFileSystem);
    const doParse = parseHelper<RobotMLProgram>(services.RoboMl);
    parse = (input: string) => doParse(input, { validation: true });
});

afterEach(async () => {
    if (document) {
        await clearDocuments(services.shared, [document]);
    }
});

describe('Validating', () => {

    test('check no errors on valid program', async () => {
        document = await parse(`
            let void entry() {
                moveSquare(30)
            }

            let void moveSquare(number size) {
                Forward size in cm
            }
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toHaveLength(0);
    });

    test('check warning when entry function is missing', async () => {
        document = await parse(`
            let void helper() {
                Forward 10 in cm
            }
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            expect.stringContaining('A RoboML program should define an "entry" function.')
        );
    });

    test('check error on wrong number of arguments', async () => {
        document = await parse(`
            let void entry() {
                moveSquare()
            }

            let void moveSquare(number size) {
                Forward size in cm
            }
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            expect.stringContaining("Function 'moveSquare' expects 1 argument(s), but got 0.")
        );
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    if (document.parseResult.parserErrors.length > 0) {
        return s`
            Parser errors:
              ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
        `;
    }
    if (document.parseResult.value === undefined) {
        return `ParseResult is 'undefined'.`;
    }
    if (!isRobotMLProgram(document.parseResult.value)) {
        return `Root AST object is a ${document.parseResult.value.$type}, expected a 'RobotMLProgram'.`;
    }
    return undefined;
}

function diagnosticToString(d: Diagnostic) {
    return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}
