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
            } else {
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
        let vcdFilePath = path.join(artefactsLabDir, `${activeTask}_tb.vcd`);
        
        if (!fs.existsSync(vcdFilePath) && fs.existsSync(artefactsLabDir)) {
            const files = fs.readdirSync(artefactsLabDir);
            const altVcd = files.find(f => f.startsWith(`${activeTask}_`) && f.endsWith('.vcd'));
            if (altVcd) {
                vcdFilePath = path.join(artefactsLabDir, altVcd);
            }
        }

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
