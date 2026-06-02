import type { CapabilityProfile } from './capabilityProfile.js';
import type { SkillDiffResult } from '../skills/SkillInstaller.js';
interface DoctorReportInput {
    config: {
        path: string;
        configured: number;
        missing: string[];
        entries: Array<{
            key: string;
            configured: boolean;
            source: string;
            value: string;
        }>;
    };
    capabilityProfile: CapabilityProfile;
    platformStatus: any;
}
export declare function renderDoctorTextReport(report: DoctorReportInput): string;
export declare function renderSkillDiffTextReport(report: SkillDiffResult): string;
export {};
//# sourceMappingURL=textReports.d.ts.map