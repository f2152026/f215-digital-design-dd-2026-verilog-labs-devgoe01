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
        const taskDirPath = path.join(workspaceFolder.uri.fsPath, 'labs', activeLab, activeTask);
        if (!fs.existsSync(taskDirPath)) {
            vscode.window.showErrorMessage(`Task directory not found: labs/${activeLab}/${activeTask}`);
            return;
        }
        // Locate the student testbench inside the task folder: labs/<lab>/<task>/tb.v (or custom testbench)
        let tbFileName = 'tb.v';
        let tbFullPath = path.join(taskDirPath, tbFileName);
        if (!fs.existsSync(tbFullPath)) {
            const files = fs.readdirSync(taskDirPath);
            const altTb = files.find(f => (f.startsWith('tb') || f.endsWith('_tb.v')) && f.endsWith('.v'));
            if (altTb) {
                tbFileName = altTb;
                tbFullPath = path.join(taskDirPath, tbFileName);
            }
            else {
                vscode.window.showErrorMessage(`Student testbench not found in: labs/${activeLab}/${activeTask} (expected tb.v)`);
                return;
            }
        }
        const terminal = this.getTerminal();
        terminal.show();
        // Under the hood commands for compilation and execution using unix-like relative paths
        const tbUnixPath = `labs/${activeLab}/${activeTask}/${tbFileName}`;
        const compileCmd = `./scripts/compile.sh ${activeLab} ${activeTask} ${tbUnixPath}`;
        const runCmd = `./scripts/run.sh ${activeLab} ${activeTask} ${tbUnixPath}`;
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
        let vcdFilePath = path.join(artefactsLabDir, `${activeTask}_tb.vcd`);
        if (!fs.existsSync(vcdFilePath) && fs.existsSync(artefactsLabDir)) {
            const files = fs.readdirSync(artefactsLabDir);
            const altVcd = files.find(f => f.startsWith(`${activeTask}_`) && f.endsWith('.vcd'));
            if (altVcd) {
                vcdFilePath = path.join(artefactsLabDir, altVcd);
            }
        }
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