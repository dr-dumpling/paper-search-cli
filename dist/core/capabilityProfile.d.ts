export type CapabilityStatus = 'available' | 'degraded' | 'unavailable';
export interface CapabilityEntry {
    id: 'metadata_search' | 'body_snippet_search' | 'journal_metrics' | 'pdf_discovery' | 'entitled_access';
    status: CapabilityStatus;
    reason: string;
    configured: string[];
    missing: string[];
    sourceGroups?: Record<string, string[]>;
    requiredKeys?: string[];
    optionalKeys?: string[];
}
export interface CapabilityProfile {
    ok: boolean;
    entries: CapabilityEntry[];
    summary: Record<string, CapabilityStatus>;
}
export declare function buildCapabilityProfile(): CapabilityProfile;
//# sourceMappingURL=capabilityProfile.d.ts.map