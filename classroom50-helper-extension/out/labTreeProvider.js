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
exports.LabTreeItem = exports.LabTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
class LabTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        // Auto-refresh the view when files are saved or git configuration changes
        vscode.workspace.onDidSaveTextDocument(() => this.refresh());
        vscode.workspace.onDidChangeConfiguration(() => this.refresh());
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!this.workspaceRoot) {
            return [];
        }
        const labsDirPath = path.join(this.workspaceRoot, 'labs');
        if (!fs.existsSync(labsDirPath)) {
            return [];
        }
        if (!element) {
            // Root level: fetch all lab directories
            try {
                const files = fs.readdirSync(labsDirPath);
                const labDirs = files.filter(file => {
                    const fullPath = path.join(labsDirPath, file);
                    return fs.statSync(fullPath).isDirectory() && file.startsWith('lab');
                }).sort();
                return labDirs.map(dir => new LabTreeItem(dir, path.join(labsDirPath, dir), vscode.TreeItemCollapsibleState.Collapsed, 'lab'));
            }
            catch (err) {
                return [];
            }
        }
        else if (element.contextValue === 'lab') {
            // Lab level: fetch tasks inside the lab directory
            try {
                const files = fs.readdirSync(element.fsPath);
                const taskDirs = files.filter(file => {
                    const fullPath = path.join(element.fsPath, file);
                    return fs.statSync(fullPath).isDirectory() && file.startsWith('task');
                }).sort();
                const taskItems = [];
                for (const dir of taskDirs) {
                    const taskPath = path.join(element.fsPath, dir);
                    const status = this.getGitStatus(taskPath);
                    const item = new LabTreeItem(dir, taskPath, vscode.TreeItemCollapsibleState.None, 'task', element.label, status);
                    // Add command to open main file (dut.v) on click
                    const dutFile = path.join(taskPath, 'dut.v');
                    if (fs.existsSync(dutFile)) {
                        item.command = {
                            command: 'vscode.open',
                            title: 'Open dut.v',
                            arguments: [vscode.Uri.file(dutFile)]
                        };
                    }
                    taskItems.push(item);
                }
                return taskItems;
            }
            catch (err) {
                return [];
            }
        }
        return [];
    }
    getGitStatus(dirPath) {
        if (!this.workspaceRoot) {
            return 'clean';
        }
        try {
            const relPath = path.relative(this.workspaceRoot, dirPath).replace(/\\/g, '/');
            const statusOut = (0, child_process_1.execSync)(`git status --porcelain "${relPath}"`, {
                cwd: this.workspaceRoot,
                stdio: ['pipe', 'pipe', 'ignore']
            }).toString().trim();
            if (!statusOut) {
                return 'clean';
            }
            const lines = statusOut.split('\n');
            let hasModified = false;
            let hasUntracked = false;
            for (const line of lines) {
                const code = line.slice(0, 2);
                if (code.includes('?') || code.includes('U')) {
                    hasUntracked = true;
                }
                else {
                    hasModified = true;
                }
            }
            if (hasModified) {
                return 'modified';
            }
            if (hasUntracked) {
                return 'untracked';
            }
            return 'clean';
        }
        catch (err) {
            return 'clean';
        }
    }
}
exports.LabTreeProvider = LabTreeProvider;
class LabTreeItem extends vscode.TreeItem {
    constructor(label, fsPath, collapsibleState, contextValue, parentLab, status) {
        super(label, collapsibleState);
        this.label = label;
        this.fsPath = fsPath;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.parentLab = parentLab;
        this.status = status;
        this.tooltip = `${this.label} (${this.fsPath})`;
        if (contextValue === 'lab') {
            this.iconPath = new vscode.ThemeIcon('folder-opened');
        }
        else if (contextValue === 'task') {
            this.description = this.status;
            // Premium coloring & iconography based on task status
            switch (this.status) {
                case 'modified':
                    this.iconPath = new vscode.ThemeIcon('diff-modified', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'));
                    this.tooltip = `${this.label} - Modified (Ready to run or submit)`;
                    break;
                case 'untracked':
                    this.iconPath = new vscode.ThemeIcon('new-file', new vscode.ThemeColor('gitDecoration.untrackedResourceForeground'));
                    this.tooltip = `${this.label} - Untracked (New task)`;
                    break;
                case 'clean':
                default:
                    this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));
                    this.tooltip = `${this.label} - Submitted/Clean`;
                    break;
            }
        }
    }
}
exports.LabTreeItem = LabTreeItem;
//# sourceMappingURL=labTreeProvider.js.map