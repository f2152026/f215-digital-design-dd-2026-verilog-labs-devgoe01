import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class CodeRunner {
    private static terminal: vscode.Terminal | null = null;

    private static getTerminal(): vscode.Terminal {
        if (this.terminal && (this.terminal as any).exitStatus === undefined) {
            return this.terminal;
        }
        // Dispose old terminal if it closed
        if (this.terminal) {
            this.terminal.dispose();
        }
        this.terminal = vscode.window.createTerminal("Classroom 50 Runner");
        return this.terminal;
    }

    public static async runCode(labName?: string, taskName?: string): Promise<void> {
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

    public static async viewWaveform(labName?: string, taskName?: string): Promise<void> {
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
            const runOption = await vscode.window.showWarningMessage(
                `No waveform (.vcd) file found for ${activeLab} ${activeTask}. Please run the simulation first.`,
                'Run Simulation'
            );
            if (runOption === 'Run Simulation') {
                this.runCode(activeLab, activeTask);
            }
            return;
        }

        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(vcdFilePath));
    }
}
