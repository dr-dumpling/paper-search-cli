import type { Searchers } from './searchers.js';
export declare function handleToolCall(toolNameRaw: string, rawArgs: unknown, searchers: Searchers): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=handleToolCall.d.ts.map