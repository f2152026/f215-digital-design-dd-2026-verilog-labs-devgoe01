import * as vscode from 'vscode';
import { GitManager } from './gitManager';
import { CodeRunner } from './codeRunner';
import { LabTreeProvider, LabTreeItem } from './labTreeProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Classroom 50 Lab Assistant Extension is active.');

    // 1. Initialize Tree Data Provider
    const labTreeProvider = new LabTreeProvider();
    vscode.window.registerTreeDataProvider('classroom50-navigator', labTreeProvider);

    // 2. Register Sync Templates command
    const syncCommand = vscode.commands.registerCommand('classroom50.sync', async () => {
        await GitManager.syncTemplates();
        labTreeProvider.refresh();
    });

    // 3. Register Compile & Run command
    const runCommand = vscode.commands.registerCommand('classroom50.run', async (item?: LabTreeItem) => {
        if (item && item.contextValue === 'task') {
            await CodeRunner.runCode(item.parentLab, item.label);
        } else {
            await CodeRunner.runCode();
        }
    });

    // 4. Register Submit Task command
    const submitCommand = vscode.commands.registerCommand('classroom50.submit', async (item?: LabTreeItem) => {
        let labName: string | undefined;
        let taskName: string | undefined;

        if (item && item.contextValue === 'task') {
            labName = item.parentLab;
            taskName = item.label;
        } else {
            // Try to auto-detect from active editor
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const filePath = activeEditor.document.uri.fsPath;
                const relativePath = vscode.workspace.asRelativePath(filePath);
                const pathParts = relativePath.split(/[\\/]/);
                if (pathParts[0] === 'labs' && pathParts[1] && pathParts[2]) {
                    labName = pathParts[1];
                    taskName = pathParts[2];
                }
            }
        }

        if (!labName || !taskName) {
            vscode.window.showWarningMessage('Please open a Verilog design file inside a task folder or select a task from the sidebar.');
            return;
        }

        // Ask student for confirmation to reduce accidental submits
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to submit ${labName} ${taskName}?`,
            { modal: true },
            'Submit'
        );

        if (confirm === 'Submit') {
            await GitManager.submitTask(labName, taskName);
            labTreeProvider.refresh();
        }
    });

    // 5. Register View Waveform command
    const viewWaveformCommand = vscode.commands.registerCommand('classroom50.viewWaveform', async (item?: LabTreeItem) => {
        if (item && item.contextValue === 'task') {
            await CodeRunner.viewWaveform(item.parentLab, item.label);
        } else {
            await CodeRunner.viewWaveform();
        }
    });

    context.subscriptions.push(syncCommand, runCommand, submitCommand, viewWaveformCommand);
}

export function deactivate() {}
