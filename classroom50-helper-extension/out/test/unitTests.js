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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const assert = __importStar(require("assert"));
// -------------------------------------------------------------
// 1. Mock the VS Code API
// -------------------------------------------------------------
const mockVscode = {
    workspace: {
        workspaceFolders: [
            {
                uri: { fsPath: path.resolve(__dirname, '../..') },
                name: 'test-workspace'
            }
        ],
        getConfiguration: () => ({
            get: (_key) => ''
        }),
        onDidSaveTextDocument: () => { },
        onDidChangeConfiguration: () => { }
    },
    window: {
        showErrorMessage: (msg) => console.log(`[Mock VSCode Error] ${msg}`),
        showInformationMessage: (msg) => console.log(`[Mock VSCode Info] ${msg}`),
        showWarningMessage: (msg) => console.log(`[Mock VSCode Warn] ${msg}`),
        createTerminal: (name) => ({
            sendText: (txt) => console.log(`[Mock Terminal ${name} Sent] ${txt}`),
            show: () => { }
        })
    },
    Uri: {
        file: (pathStr) => ({
            fsPath: pathStr,
            toString: () => `file://${pathStr}`
        })
    },
    ThemeIcon: class {
        constructor(id, color) {
            this.id = id;
            this.color = color;
        }
    },
    ThemeColor: class {
        constructor(id) {
            this.id = id;
        }
    },
    TreeItem: class {
        constructor(label, collapsibleState) {
            this.label = label;
            this.collapsibleState = collapsibleState;
            this.tooltip = '';
            this.description = '';
        }
    },
    TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2
    },
    EventEmitter: class EventEmitter {
        constructor() {
            this.listeners = [];
            this.event = (listener) => {
                this.listeners.push(listener);
                return {
                    dispose: () => {
                        this.listeners = this.listeners.filter(l => l !== listener);
                    }
                };
            };
        }
        fire(data) {
            this.listeners.forEach(l => l(data));
        }
    }
};
// Inject mock into require cache
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
    if (id === 'vscode') {
        return mockVscode;
    }
    return originalRequire.apply(this, arguments);
};
// -------------------------------------------------------------
// 2. Import modules to be tested (now using mocked VS Code)
// -------------------------------------------------------------
const gitManager_1 = require("../gitManager");
const labTreeProvider_1 = require("../labTreeProvider");
// Set workspace root for testing relative to workspace directory
const repoRoot = path.resolve(__dirname, '../../..');
// -------------------------------------------------------------
// 3. Define Unit Tests
// -------------------------------------------------------------
function runTests() {
    console.log('🧪 Starting Classroom 50 Extension Backend Unit Tests...');
    // Test Case 1: .classroom50.yaml parsing
    console.log('\nCase 1: Testing .classroom50.yaml parser...');
    const mockYamlPath = path.join(repoRoot, '.classroom50.yaml');
    const mockYamlContent = `
schema: classroom50/repo-config/v1
classroom: test-classroom-ca
assignment: lab-01
source:
  owner: BITS-Pilani-CS
  repo: csf342-labs-template
  branch: main
`;
    fs.writeFileSync(mockYamlPath, mockYamlContent);
    try {
        const config = gitManager_1.GitManager.parseClassroomConfig(repoRoot);
        assert.ok(config, 'Config parsing returned null');
        assert.strictEqual(config.classroom, 'test-classroom-ca', 'Classroom parsed incorrectly');
        assert.strictEqual(config.assignment, 'lab-01', 'Assignment parsed incorrectly');
        assert.strictEqual(config.source?.owner, 'BITS-Pilani-CS', 'Source owner parsed incorrectly');
        assert.strictEqual(config.source?.repo, 'csf342-labs-template', 'Source repo parsed incorrectly');
        assert.strictEqual(config.source?.branch, 'main', 'Source branch parsed incorrectly');
        console.log('✔ Case 1 Passed successfully!');
    }
    finally {
        // Clean up mock file
        if (fs.existsSync(mockYamlPath)) {
            fs.unlinkSync(mockYamlPath);
        }
    }
    // Test Case 2: LabTreeProvider scanning
    console.log('\nCase 2: Testing LabTreeProvider directory scanning...');
    // We modify workspaceRoot mock to point to repo root for scanning actual lab folders
    mockVscode.workspace.workspaceFolders[0].uri.fsPath = repoRoot;
    const treeProvider = new labTreeProvider_1.LabTreeProvider();
    treeProvider.getChildren().then(labs => {
        try {
            assert.ok(labs.length > 0, 'No labs found in labs/ directory');
            const lab1 = labs.find(l => l.label === 'lab01');
            assert.ok(lab1, 'lab01 folder not found by tree provider');
            console.log(`✔ Found ${labs.length} labs (including ${lab1?.label}).`);
            console.log(`[Test Debug] lab1 label: ${lab1.label}`);
            console.log(`[Test Debug] lab1 fsPath: ${lab1.fsPath}`);
            console.log(`[Test Debug] lab1 exists: ${fs.existsSync(lab1.fsPath)}`);
            if (fs.existsSync(lab1.fsPath)) {
                console.log(`[Test Debug] lab1 contents: ${fs.readdirSync(lab1.fsPath)}`);
            }
            // Check sub-tasks of lab01
            treeProvider.getChildren(lab1).then(tasks => {
                try {
                    console.log(`[Test Debug] tasks length: ${tasks.length}`);
                    assert.ok(tasks.length > 0, 'No tasks found in lab01');
                    const task4 = tasks.find(t => t.label === 'task4');
                    assert.ok(task4, 'task4 not found in lab01');
                    console.log(`✔ Found ${tasks.length} tasks in lab01 (including ${task4?.label}).`);
                    console.log('✔ Case 2 Passed successfully!');
                    // Run extra verification tests
                    runExtraTests();
                }
                catch (err) {
                    console.error('❌ Case 2 (Sub-tasks) Failed:', err.message);
                    process.exit(1);
                }
            });
        }
        catch (err) {
            console.error('❌ Case 2 Failed:', err.message);
            process.exit(1);
        }
    }).catch(err => {
        console.error('❌ Case 2 Error:', err);
        process.exit(1);
    });
}
async function runExtraTests() {
    console.log('\nCase 3: Testing Actions URL Helper (getActionsUrl) with commit URL...');
    try {
        const commitUrl = 'https://github.com/BITS-Pilani-CS/csf342-labs-template/commit/1234567890abcdef';
        const actionsUrl = await gitManager_1.GitManager.getActionsUrl(repoRoot, commitUrl);
        assert.strictEqual(actionsUrl, 'https://github.com/BITS-Pilani-CS/csf342-labs-template/actions', 'Actions URL parsed from commit URL incorrectly');
        console.log('✔ Case 3 Passed successfully!');
    }
    catch (err) {
        console.error('❌ Case 3 Failed:', err.message);
        process.exit(1);
    }
    console.log('\nCase 4: Testing Git remote origin parser in getActionsUrl (fallback mode)...');
    try {
        const actionsUrl = await gitManager_1.GitManager.getActionsUrl(repoRoot);
        assert.ok(actionsUrl.startsWith('https://github.com/'), 'Resolved remote URL is invalid');
        assert.ok(actionsUrl.endsWith('/actions'), 'Resolved actions path is invalid');
        console.log(`✔ Case 4 Passed successfully! Resolved Actions URL: ${actionsUrl}`);
        console.log('\n🎉 All Extension Unit Tests PASSED!');
    }
    catch (err) {
        console.error('❌ Case 4 Failed:', err.message);
        process.exit(1);
    }
}
runTests();
//# sourceMappingURL=unitTests.js.map