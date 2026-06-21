import type { PaperSource } from '../platforms/PaperSource.js';
export interface PlatformFactoryContext {
    env: NodeJS.ProcessEnv;
    instances: Record<string, PaperSource>;
}
export type PlatformFactory = (context: PlatformFactoryContext) => PaperSource;
export declare const PLATFORM_FACTORIES: Record<string, PlatformFactory>;
//# sourceMappingURL=platformFactories.d.ts.map