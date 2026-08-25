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
exports.CodeRunner = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CodeRunner {
    static getTerminal() {
        if (this.terminal && this.terminal.exitStatus === undefined) {
            return this.terminal;
        }
        // Dispose old terminal if it closed
        if (this.terminal) {
            this.terminal.dispose();
        }
        this.terminal = vscode.window.createTerminal("Classroom 50 Runner");
        return this.terminal;
    }
    static async runCode(labName, taskName) {
        let activeLab = labName;
        let activeTask = taskName;
        // Auto-detect from active editor if not provided via tree view
        if (!activeLab || !activeTask) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const filePath = activeEditor.document.uri.fsPath;
                const relativePath = vscode.workspace.asRelativePath(filePath);
                // Expected path: labs/lab01/task0/dut.v
                const pathParts = relativePath.split(/[\\/]/);
                if (pathParts[0] === 'labs' && pathParts[1] && pathParts[2]) {
                    activeLab = pathParts[1];
                    activeTask = pathParts[2];
                }
            }
        }
        if (!activeLab || !activeTask) {
            vscode.window.showWarningMessage('Please open a Verilog design file inside a task folder or select a task from the sidebar.');
            return;
        }
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        // Locate the student testbench inside the task folder: labs/<lab>/<task>/tb.v
        const tbFilePath = path.join('labs', activeLab, activeTask, 'tb.v');
        const tbFullPath = path.join(workspaceFolder.uri.fsPath, tbFilePath);
        if (!fs.existsSync(tbFullPath)) {
            vscode.window.showErrorMessage(`Student testbench not found at: ${tbFilePath}`);
            return;
        }
        const terminal = this.getTerminal();
        terminal.show();
        // Under the hood commands for compilation and execution using unix-like relative paths
        const compileCmd = `./scripts/compile.sh ${activeLab} ${activeTask} labs/${activeLab}/${activeTask}/tb.v`;
        const runCmd = `./scripts/run.sh ${activeLab} ${activeTask} labs/${activeLab}/${activeTask}/tb.v`;
        terminal.sendText(`${compileCmd} && ${runCmd}`);
    }
    static async viewWaveform(labName, taskName) {
        let activeLab = labName;
        let activeTask = taskName;
        // Auto-detect if not provided
        if (!activeLab || !activeTask) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const filePath = activeEditor.document.uri.fsPath;
                const relativePath = vscode.workspace.asRelativePath(filePath);
                const pathParts = relativePath.split(/[\\/]/);
                if (pathParts[0] === 'labs' && pathParts[1] && pathParts[2]) {
                    activeLab = pathParts[1];
                    activeTask = pathParts[2];
                }
            }
        }
        if (!activeLab || !activeTask) {
            vscode.window.showWarningMessage('Please open a Verilog design file inside a task folder or select a task from the sidebar.');
            return;
        }
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const artefactsLabDir = path.join(workspaceFolder.uri.fsPath, 'artefacts', activeLab);
        const vcdFileName = `${activeTask}_tb.vcd`;
        const vcdFilePath = path.join(artefactsLabDir, vcdFileName);
        if (!fs.existsSync(vcdFilePath)) {
            const runOption = await vscode.window.showWarningMessage(`No waveform (.vcd) file found for ${activeLab} ${activeTask}. Please run the simulation first.`, 'Run Simulation');
            if (runOption === 'Run Simulation') {
                this.runCode(activeLab, activeTask);
            }
            return;
        }
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(vcdFilePath));
    }
}
exports.CodeRunner = CodeRunner;
CodeRunner.terminal = null;
//# sourceMappingURL=codeRunner.js.map