import { inject, type Module } from 'langium';
import { createDefaultModule, createDefaultSharedModule, type DefaultSharedModuleContext, type LangiumServices, type LangiumSharedServices, type PartialLangiumServices } from 'langium/lsp';
import { RoboMLGeneratedModule, RoboMlGeneratedSharedModule } from './generated/module.js';
import { RoboMlValidator, registerValidationChecks } from './robo-ml-validator.js';

export type RoboMlAddedServices = {
    validation: {
        RoboMlValidator: RoboMlValidator
    }
}

export type RoboMlServices = LangiumServices & RoboMlAddedServices

export const RoboMlModule: Module<RoboMlServices, PartialLangiumServices & RoboMlAddedServices> = {
    validation: {
        RoboMlValidator: () => new RoboMlValidator()
    }
};

export function createRoboMlServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    RoboMl: RoboMlServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        RoboMlGeneratedSharedModule
    );
    const RoboMl = inject(
        createDefaultModule({ shared }),
        RoboMLGeneratedModule,
        RoboMlModule
    );
    shared.ServiceRegistry.register(RoboMl);
    registerValidationChecks(RoboMl);
    if (!context.connection) {
        shared.workspace.ConfigurationProvider.initialized({});
    }
    return { shared, RoboMl };
}
