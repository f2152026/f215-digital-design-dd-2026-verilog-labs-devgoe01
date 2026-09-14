"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const gitManager_1 = require("./gitManager");
const codeRunner_1 = require("./codeRunner");
const labTreeProvider_1 = require("./labTreeProvider");
function activate(context) {
    console.log('Classroom 50 Lab Assistant Extension is active.');
    // 1. Initialize Tree Data Provider
    const labTreeProvider = new labTreeProvider_1.LabTreeProvider();
    vscode.window.registerTreeDataProvider('classroom50-navigator', labTreeProvider);
    // 2. Register Sync Templates command
    const syncCommand = vscode.commands.registerCommand('classroom50.sync', async () => {
        await gitManager_1.GitManager.syncTemplates();
        labTreeProvider.refresh();
    });
    // 3. Register Compile & Run command
    const runCommand = vscode.commands.registerCommand('classroom50.run', async (item) => {
        if (item && item.contextValue === 'task') {
            await codeRunner_1.CodeRunner.runCode(item.parentLab, item.label);
        }
        else {
            await codeRunner_1.CodeRunner.runCode();
        }
    });
    // 4. Register Submit Lab command
    const submitCommand = vscode.commands.registerCommand('classroom50.submit', async (item) => {
        let labName;
        if (item) {
            if (item.contextValue === 'lab') {
                labName = item.label;
            }
            else if (item.contextValue === 'task') {
                labName = item.parentLab;
            }
        }
        else {
            // Try to auto-detect from active editor
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const filePath = activeEditor.document.uri.fsPath;
                const relativePath = vscode.workspace.asRelativePath(filePath);
                const pathParts = relativePath.split(/[\\/]/);
                if (pathParts[0] === 'labs' && pathParts[1]) {
                    labName = pathParts[1];
                }
            }
        }
        if (!labName) {
            vscode.window.showWarningMessage('Please open a Verilog design file inside a lab folder or select a lab from the sidebar.');
            return;
        }
        // Ask student for confirmation and emphasize single submission policy
        const confirm = await vscode.window.showWarningMessage(`⚠️ Are you sure you want to submit all of ${labName.toUpperCase()}? You are allowed only 1 submission attempt for this lab.`, { modal: true }, 'Submit Lab');
        if (confirm === 'Submit Lab') {
            await gitManager_1.GitManager.submitLab(labName);
            labTreeProvider.refresh();
        }
    });
    // 5. Register View Waveform command
    const viewWaveformCommand = vscode.commands.registerCommand('classroom50.viewWaveform', async (item) => {
        if (item && item.contextValue === 'task') {
            await codeRunner_1.CodeRunner.viewWaveform(item.parentLab, item.label);
        }
        else {
            await codeRunner_1.CodeRunner.viewWaveform();
        }
    });
    context.subscriptions.push(syncCommand, runCommand, submitCommand, viewWaveformCommand);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map