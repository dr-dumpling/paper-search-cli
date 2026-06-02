export function renderDoctorTextReport(report) {
    const lines = [
        'Paper Search Doctor',
        '',
        `Config: ${report.config.path}`,
        `Configured keys: ${report.config.configured}`,
        `Missing keys: ${report.config.missing.length}`,
        ''
    ];
    const configuredEntries = report.config.entries.filter(entry => entry.configured);
    if (configuredEntries.length > 0) {
        lines.push('Configured:');
        for (const entry of configuredEntries) {
            lines.push(`- ${entry.key}: ${entry.value} (${entry.source})`);
        }
        lines.push('');
    }
    lines.push('Capability Profile:');
    for (const entry of report.capabilityProfile.entries) {
        lines.push(`- ${entry.id}: ${entry.status}`);
        lines.push(`  Reason: ${entry.reason}`);
        if (entry.missing.length > 0) {
            lines.push(`  Missing: ${entry.missing.join(', ')}`);
        }
    }
    lines.push('');
    const platformData = report.platformStatus?.data;
    if (Array.isArray(platformData)) {
        const counts = countBy(platformData, item => String(item.apiKeyStatus || 'unknown'));
        lines.push('Platform API key status:');
        for (const [status, count] of Object.entries(counts).sort()) {
            lines.push(`- ${status}: ${count}`);
        }
        lines.push('');
    }
    lines.push('Next commands:');
    lines.push('- paper-search smoke --mock --pretty');
    lines.push('- paper-search smoke --live --pretty');
    lines.push('- paper-search skills status --pretty');
    return lines.join('\n');
}
export function renderSkillDiffTextReport(report) {
    const lines = [
        'Paper Search Skill Diff',
        '',
        `Skill: ${report.skill}`,
        `Root: ${report.root}`,
        `Targets: ${report.selected.join(', ') || '(none)'}`,
        ''
    ];
    for (const target of report.targets) {
        lines.push(`${target.target} (${target.label})`);
        lines.push(`Path: ${target.path}`);
        lines.push(`Status: ${target.status}`);
        lines.push(`Managed files: ${target.files}; installed files: ${target.installedFiles}`);
        if (target.error) {
            lines.push(`Error: ${target.error}`);
        }
        if (target.missingFiles.length > 0) {
            lines.push(`Missing managed files: ${target.missingFiles.join(', ')}`);
        }
        if (target.staleFiles.length > 0) {
            lines.push(`Stale managed files: ${target.staleFiles.join(', ')}`);
        }
        if (target.extraFiles.length > 0) {
            lines.push(`Extra Skill Files (${target.extraFiles.length}, names only): ${target.extraFiles.join(', ')}`);
        }
        const diffs = target.managedFiles.filter(file => file.status === 'stale' && file.diff);
        for (const diff of diffs) {
            lines.push('');
            lines.push(String(diff.diff));
        }
        lines.push('');
    }
    return lines.join('\n').trimEnd();
}
function countBy(items, getKey) {
    const counts = {};
    for (const item of items) {
        const key = getKey(item);
        counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
}
//# sourceMappingURL=textReports.js.map