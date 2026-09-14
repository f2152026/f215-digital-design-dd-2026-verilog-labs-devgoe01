import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface Classroom50Config {
    classroom?: string;
    assignment?: string;
    source?: {
        owner?: string;
        repo?: string;
        branch?: string;
    };
}

export class GitManager {
    private static getGitExtension() {
        const vscodeGit = vscode.extensions.getExtension('vscode.git');
        return vscodeGit ? vscodeGit.exports : null;
    }

    public static async getRepository(): Promise<any> {
        const gitExtension = this.getGitExtension();
        if (!gitExtension) {
            vscode.window.showErrorMessage('Git extension is not active or installed.');
            return null;
        }
        const api = gitExtension.getAPI(1);
        if (api.repositories.length === 0) {
            vscode.window.showErrorMessage('No active Git repository found in the workspace.');
            return null;
        }
        return api.repositories[0];
    }

    private static runCommand(workspaceDir: string, cmd: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(cmd, { cwd: workspaceDir }, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    private static runGitCommand(workspaceDir: string, args: string): Promise<string> {
        return this.runCommand(workspaceDir, `git ${args}`);
    }

    private static parseClassroomConfig(workspaceDir: string): Classroom50Config | null {
        const configPath = path.join(workspaceDir, '.classroom50.yaml');
        if (!fs.existsSync(configPath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const config: Classroom50Config = {};

            const classroomMatch = content.match(/classroom:\s*["']?([^"'\r\n]+)["']?/);
            if (classroomMatch) { config.classroom = classroomMatch[1]; }

            const assignmentMatch = content.match(/assignment:\s*["']?([^"'\r\n]+)["']?/);
            if (assignmentMatch) { config.assignment = assignmentMatch[1]; }

            // Parse source block
            const sourceMatch = content.match(/source:\s*[\r\n]+(?:\s+.*\r?[\n]*)+/);
            if (sourceMatch) {
                config.source = {};
                const sourceBlock = sourceMatch[0];
                const ownerMatch = sourceBlock.match(/owner:\s*["']?([^"'\r\n]+)["']?/);
                if (ownerMatch) { config.source.owner = ownerMatch[1]; }
                const repoMatch = sourceBlock.match(/repo:\s*["']?([^"'\r\n]+)["']?/);
                if (repoMatch) { config.source.repo = repoMatch[1]; }
                const branchMatch = sourceBlock.match(/branch:\s*["']?([^"'\r\n]+)["']?/);
                if (branchMatch) { config.source.branch = branchMatch[1]; }
            }

            return config;
        } catch {
            return null;
        }
    }

    public static async syncTemplates(): Promise<void> {
        const repo = await this.getRepository();
        if (!repo) { return; }

        const workspaceDir = repo.rootUri.fsPath;

        // 1. Prompt for Sync Mode
        const syncMode = await vscode.window.showQuickPick([
            { label: 'Sync Course Tooling (Non-Labs)', description: 'Fetch configurations, workflows, and helper scripts from upstream template. Preserves all lab folders.' },
            { label: 'Sync Single Lab (Targeted)', description: 'Fetch/update a specific lab folder while preserving your design code inside it.' }
        ], {
            placeHolder: 'Select template synchronization mode:',
            ignoreFocusOut: true
        });

        if (!syncMode) { return; }

        let targetLab: string | undefined;
        if (syncMode.label === 'Sync Single Lab (Targeted)') {
            // Show list of labs (Lab 01 to Lab 10)
            const labs = Array.from({ length: 10 }, (_, i) => `Lab ${String(i + 1).padStart(2, '0')}`);
            const selectedLab = await vscode.window.showQuickPick(labs, {
                placeHolder: 'Select the lab to sync/update:',
                ignoreFocusOut: true
            });
            if (!selectedLab) { return; }
            targetLab = selectedLab.toLowerCase().replace(' ', ''); // e.g., "lab01"
        }

        let templateRemoteUrl = '';

        // 2. Try reading from .classroom50.yaml
        const classroomConfig = this.parseClassroomConfig(workspaceDir);
        if (classroomConfig && classroomConfig.source && classroomConfig.source.owner && classroomConfig.source.repo) {
            const { owner, repo } = classroomConfig.source;
            templateRemoteUrl = `https://github.com/${owner}/${repo}.git`;
        }

        // 3. Fallback to settings or default template URL
        if (!templateRemoteUrl) {
            const config = vscode.workspace.getConfiguration('classroom50');
            templateRemoteUrl = config.get<string>('templateRemoteUrl') || 'https://github.com/f2152026/verilog-labs.git';
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: targetLab 
                ? `Syncing ${targetLab.toUpperCase()} templates...`
                : "Syncing course configurations and tooling...",
            cancellable: false
        }, async (progress) => {
            try {
                // Configure upstream remote safely (add or update)
                progress.report({ message: "Configuring upstream remote..." });
                const remotesList = await this.runGitCommand(workspaceDir, 'remote');
                const remotes = remotesList.split(/\s+/);
                if (!remotes.includes('upstream')) {
                    await this.runGitCommand(workspaceDir, `remote add upstream "${templateRemoteUrl}"`);
                } else {
                    await this.runGitCommand(workspaceDir, `remote set-url upstream "${templateRemoteUrl}"`);
                }

                // Fetch template updates from upstream
                progress.report({ message: "Fetching latest templates from upstream..." });
                await this.runGitCommand(workspaceDir, 'fetch upstream');

                // Determine upstream branch
                let upstreamBranch = classroomConfig?.source?.branch || 'main';
                try {
                    await this.runGitCommand(workspaceDir, `rev-parse --verify upstream/${upstreamBranch}`);
                } catch {
                    try {
                        await this.runGitCommand(workspaceDir, 'rev-parse --verify upstream/master');
                        upstreamBranch = 'master';
                    } catch {
                        upstreamBranch = 'main';
                    }
                }

                if (targetLab) {
                    // MODE 1: TARGETED DIRECTORY CHECKOUT (SYNC SINGLE LAB)
                    progress.report({ message: `Backing up your ${targetLab} files...` });
                    const statusOutput = await this.runGitCommand(workspaceDir, 'status --porcelain');
                    const backup: Map<string, string> = new Map();

                    if (statusOutput) {
                        const lines = statusOutput.split('\n');
                        for (const line of lines) {
                            if (line.length < 4) { continue; }
                            const relPath = line.slice(3).trim();
                            const labRegex = new RegExp(`^labs/${targetLab}/task\\d/[^/]+\\.v$`);
                            if (relPath.match(labRegex)) {
                                const fullPath = path.join(workspaceDir, relPath);
                                if (fs.existsSync(fullPath)) {
                                    backup.set(relPath, fs.readFileSync(fullPath, 'utf8'));
                                }
                            }
                        }
                    }

                    progress.report({ message: `Checking out ${targetLab} templates...` });
                    await this.runGitCommand(workspaceDir, `checkout upstream/${upstreamBranch} -- labs/${targetLab} scripts .devcontainer .vscode`);

                    // Restore student design files for the target lab
                    if (backup.size > 0) {
                        progress.report({ message: "Restoring your design files..." });
                        for (const [relPath, content] of backup.entries()) {
                            const fullPath = path.join(workspaceDir, relPath);
                            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                            fs.writeFileSync(fullPath, content, 'utf8');
                        }
                    }

                    vscode.window.showInformationMessage(`🎉 Successfully synced ${targetLab.toUpperCase()} templates while preserving your design code!`);

                } else {
                    // MODE 2: SYNC COURSE TOOLING (EXPLICITLY EXCLUDING LABS)
                    progress.report({ message: "Scanning non-lab files..." });
                    
                    // List all top-level items in upstream branch
                    const topLevelStr = await this.runGitCommand(workspaceDir, `ls-tree --name-only upstream/${upstreamBranch}`);
                    const topLevelItems = topLevelStr
                        .split(/\r?\n/)
                        .map(item => item.trim())
                        .filter(item => item.length > 0 && item !== 'labs'); // STRICT FILTER: NEVER TOUCH LABS
                    
                    if (topLevelItems.length === 0) {
                        vscode.window.showWarningMessage('No non-lab files found to sync.');
                        return;
                    }
                    
                    progress.report({ message: "Checking out non-lab folders and tooling..." });
                    const checkoutArgs = `checkout upstream/${upstreamBranch} -- ` + topLevelItems.map(item => `"${item}"`).join(' ');
                    await this.runGitCommand(workspaceDir, checkoutArgs);

                    // Stage and commit ONLY the non-lab tooling files to keep working tree clean
                    progress.report({ message: "Saving tooling sync to Git history..." });
                    const addArgs = `add ` + topLevelItems.map(item => `"${item}"`).join(' ');
                    await this.runGitCommand(workspaceDir, addArgs);

                    const statusOutput = await this.runGitCommand(workspaceDir, 'status --porcelain');
                    const hasToolingChanges = statusOutput.split('\n').some(line => {
                        const code = line.trim().slice(0, 2);
                        const filePath = line.trim().slice(2).trim();
                        return (code.startsWith('A') || code.startsWith('M') || code.startsWith('D')) && !filePath.startsWith('labs/');
                    });

                    if (hasToolingChanges) {
                        await this.runGitCommand(workspaceDir, 'commit -m "Sync course tooling and configurations from template"');
                        try {
                            const currentBranch = await this.runGitCommand(workspaceDir, 'rev-parse --abbrev-ref HEAD');
                            await this.runGitCommand(workspaceDir, `push origin ${currentBranch}`);
                        } catch (pushErr: any) {
                            console.log(`Tooling push notice: ${pushErr.message || pushErr}`);
                        }
                    }
                    
                    vscode.window.showInformationMessage('🎉 Successfully synced course tooling (scripts, workflows, extension) with zero changes to your labs folder!');
                }
            } catch (err: any) {
                vscode.window.showErrorMessage(`Sync failed: ${err.message || err}`);
            }
        });
    }

    public static async submitLab(labName: string): Promise<void> {
        const repo = await this.getRepository();
        if (!repo) { return; }

        const workspaceDir = repo.rootUri.fsPath;
        const tagName = `submit-${labName}`;

        // 1. Enforce Single Submission: Check if this lab was already submitted locally or on remote
        try {
            const localTag = await this.runGitCommand(workspaceDir, `tag -l "${tagName}"`);
            if (localTag.trim() === tagName) {
                vscode.window.showErrorMessage(
                    `⛔ ${labName} has already been submitted (Tag: ${tagName}). Only 1 submission is allowed per lab.`,
                    { modal: true }
                );
                return;
            }

            const remoteTag = await this.runGitCommand(workspaceDir, `ls-remote --tags origin "refs/tags/${tagName}"`);
            if (remoteTag.trim().length > 0) {
                vscode.window.showErrorMessage(
                    `⛔ ${labName} was already submitted to GitHub (Tag: ${tagName}). Only 1 submission is allowed per lab.`,
                    { modal: true }
                );
                return;
            }
        } catch (tagErr: any) {
            console.log(`Tag pre-check notification: ${tagErr.message || tagErr}`);
        }

        // Check for SpecStory Copilot Chat history
        const specstoryPath = path.join(workspaceDir, '.specstory');
        let specstoryExists = false;
        try {
            specstoryExists = fs.existsSync(specstoryPath) && fs.readdirSync(specstoryPath).length > 0;
        } catch {
            specstoryExists = false;
        }

        if (specstoryExists) {
            vscode.window.showInformationMessage('Copilot chat history (.specstory) detected and will be included in the submission.');
        } else {
            vscode.window.showWarningMessage('No Copilot chat history found under .specstory/. Submitting design files only.');
        }

        // Submission flow: Staging lab directory, committing, tagging, and pushing
        const labRelativePath = path.join('labs', labName);
        const commitMessage = `Submit ${labName}`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: specstoryExists
                ? `Submitting ${labName} (including Copilot history)...`
                : `Submitting ${labName}...`,
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ message: `Staging ${labName} files...` });
                const stagePath = labRelativePath.replace(/\\/g, '/');
                await this.runGitCommand(workspaceDir, `add "${stagePath}"`);
                
                if (specstoryExists) {
                    await this.runGitCommand(workspaceDir, 'add .specstory');
                }

                // Check if there are staged changes to commit or previous commits to tag
                const status = await this.runGitCommand(workspaceDir, `status --porcelain`);
                const hasStagedChanges = status.split('\n').some(line => {
                    const code = line.trim().slice(0, 2);
                    return code.startsWith('A') || code.startsWith('M') || code.startsWith('D') || code.startsWith('R');
                });

                if (hasStagedChanges) {
                    progress.report({ message: "Committing submission..." });
                    await this.runGitCommand(workspaceDir, `commit -m "${commitMessage}"`);
                }

                progress.report({ message: `Creating submission tag ${tagName}...` });
                await this.runGitCommand(workspaceDir, `tag -a "${tagName}" -m "Single submission for ${labName}"`);

                progress.report({ message: "Pushing branch and submission tag to GitHub..." });
                const currentBranch = await this.runGitCommand(workspaceDir, 'rev-parse --abbrev-ref HEAD');
                await this.runGitCommand(workspaceDir, `push origin ${currentBranch}`);
                await this.runGitCommand(workspaceDir, `push origin refs/tags/${tagName}`);

                const actionsUrl = await this.getActionsUrl(workspaceDir);
                vscode.window.showInformationMessage(
                    `🎉 ${labName} submitted successfully (Tag: ${tagName})! Results in ${actionsUrl}`,
                    'Open Actions'
                ).then(selection => {
                    if (selection === 'Open Actions') {
                        vscode.env.openExternal(vscode.Uri.parse(actionsUrl));
                    }
                });
            } catch (err: any) {
                vscode.window.showErrorMessage(`Submission failed: ${err.message || err}`);
            }
        });
    }

    private static async getActionsUrl(workspaceDir: string, fallbackUrl?: string): Promise<string> {
        if (fallbackUrl) {
            const match = fallbackUrl.match(/(https:\/\/github\.com\/[^\/]+\/[^\/]+)/);
            if (match) {
                return `${match[1]}/actions`;
            }
        }
        try {
            let remoteUrl = await this.runGitCommand(workspaceDir, 'config --get remote.origin.url');
            remoteUrl = remoteUrl.trim().replace(/\.git$/, '');
            if (remoteUrl.startsWith('git@github.com:')) {
                remoteUrl = remoteUrl.replace('git@github.com:', 'https://github.com/');
            }
            return `${remoteUrl}/actions`;
        } catch {
            return 'https://github.com';
        }
    }
}
