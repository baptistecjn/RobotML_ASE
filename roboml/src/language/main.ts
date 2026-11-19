import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { createRoboMlServices } from './robo-ml-module.js';

const connection = createConnection(ProposedFeatures.all);

const { shared } = createRoboMlServices({ connection, ...NodeFileSystem });

startLanguageServer(shared);
