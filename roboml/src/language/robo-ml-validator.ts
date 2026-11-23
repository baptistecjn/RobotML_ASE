import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { FunctionCall, RoboMlAstType, RobotMLProgram } from './generated/ast.js';
import type { RoboMlServices } from './robo-ml-module.js';

export function registerValidationChecks(services: RoboMlServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.RoboMlValidator;
    const checks: ValidationChecks<RoboMlAstType> = {
        RobotMLProgram: validator.checkEntryFunctionExists,
        FunctionCall: validator.checkFunctionCallArguments
    };
    registry.register(checks, validator);
}

export class RoboMlValidator {

    checkEntryFunctionExists(program: RobotMLProgram, accept: ValidationAcceptor): void {
        const hasEntry = program.functions.some(fn => fn.name === 'entry');
        if (!hasEntry && program.functions.length > 0) {
            accept('warning', 'A RoboML program should define an "entry" function.', {
                node: program,
                property: 'functions'
            });
        }
    }

    checkFunctionCallArguments(call: FunctionCall, accept: ValidationAcceptor): void {
        const target = call.function.ref;
        if (target && call.arguments.length !== target.parameters.length) {
            accept('error', `Function '${target.name}' expects ${target.parameters.length} argument(s), but got ${call.arguments.length}.`, {
                node: call,
                property: 'arguments'
            });
        }
    }
}
