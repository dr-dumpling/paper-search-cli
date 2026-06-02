export declare const SKILL_NAME = "paper-search";
export interface SkillTarget {
    id: string;
    label: string;
    relativeRoot: string;
}
export interface SkillTargetStatus {
    target: string;
    label: string;
    path: string;
    status: 'missing' | 'up_to_date' | 'stale' | 'extra_files' | 'error';
    files: number;
    installedFiles: number;
    bundledHash: string;
    installedHash: string;
    hashMatch: boolean;
    managedHashMatch: boolean;
    extraFiles: string[];
    missingFiles: string[];
    staleFiles: string[];
    error?: string;
}
export interface SkillStatusResult {
    ok: boolean;
    root: string;
    skill: string;
    selected: string[];
    bundledFiles: number;
    bundledHash: string;
    targets: SkillTargetStatus[];
    statusCounts: Record<string, number>;
}
export interface SkillInstallResult {
    ok: boolean;
    root: string;
    skill: string;
    selected: string[];
    installed: Array<{
        target: string;
        label: string;
        path: string;
        files: number;
    }>;
    failed: Array<{
        target: string;
        label: string;
        path: string;
        error: string;
    }>;
    installedCount: number;
    failedCount: number;
    status: SkillStatusResult;
}
export interface SkillManagedFileDiff {
    file: string;
    status: 'missing' | 'stale' | 'up_to_date';
    bundledHash: string;
    installedHash: string;
    diff?: string;
}
export interface SkillTargetDiff {
    target: string;
    label: string;
    path: string;
    status: SkillTargetStatus['status'];
    files: number;
    installedFiles: number;
    bundledHash: string;
    installedHash: string;
    hashMatch: boolean;
    managedHashMatch: boolean;
    managedFiles: SkillManagedFileDiff[];
    extraFiles: string[];
    missingFiles: string[];
    staleFiles: string[];
    error?: string;
}
export interface SkillDiffResult {
    ok: boolean;
    root: string;
    skill: string;
    selected: string[];
    bundledFiles: number;
    bundledHash: string;
    targets: SkillTargetDiff[];
    statusCounts: Record<string, number>;
}
export declare const SKILL_TARGETS: SkillTarget[];
export declare function defaultSkillTargetIds(root?: string): string[];
export declare function parseSkillTargets(raw: string, root?: string): string[];
export declare function describeSkillTargets(targetIds: string[], root?: string): Array<{
    target: string;
    label: string;
    path: string;
}>;
export declare function statusSkillTargets(targetIds: string[], options?: {
    skillsRoot?: string;
    sourceRoot?: string;
}): SkillStatusResult;
export declare function installSkillTargets(targetIds: string[], options?: {
    skillsRoot?: string;
    sourceRoot?: string;
}): SkillInstallResult;
export declare function diffSkillTargets(targetIds: string[], options?: {
    skillsRoot?: string;
    sourceRoot?: string;
}): SkillDiffResult;
//# sourceMappingURL=SkillInstaller.d.ts.map