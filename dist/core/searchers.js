import { PLATFORM_FACTORIES } from './platformFactories.js';
import { PLATFORM_METADATA } from './platformMetadata.js';
import { logDebug } from '../utils/Logger.js';
let searchers = null;
export function initializeSearchers() {
    if (searchers)
        return searchers;
    logDebug('Initializing searchers...');
    const instances = {};
    for (const platform of PLATFORM_METADATA) {
        const factory = PLATFORM_FACTORIES[platform.id];
        if (!factory)
            continue;
        const instance = factory({ env: process.env, instances });
        instances[platform.id] = instance;
        for (const alias of platform.aliases || []) {
            instances[alias] = instance;
        }
    }
    searchers = instances;
    logDebug('Searchers initialized successfully');
    return searchers;
}
//# sourceMappingURL=searchers.js.map