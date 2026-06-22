import type { ArxivSearcher } from '../platforms/ArxivSearcher.js';
import type { BioRxivSearcher, MedRxivSearcher } from '../platforms/BioRxivSearcher.js';
import type { CORESearcher } from '../platforms/CORESearcher.js';
import type { CrossrefSearcher } from '../platforms/CrossrefSearcher.js';
import type { EuropePMCSearcher } from '../platforms/EuropePMCSearcher.js';
import type { GoogleScholarSearcher } from '../platforms/GoogleScholarSearcher.js';
import type { IACRSearcher } from '../platforms/IACRSearcher.js';
import type { OpenAIRESearcher } from '../platforms/OpenAIRESearcher.js';
import type { OpenAlexSearcher } from '../platforms/OpenAlexSearcher.js';
import type { PaperSource } from '../platforms/PaperSource.js';
import type { PMCSearcher } from '../platforms/PMCSearcher.js';
import type { PubMedSearcher } from '../platforms/PubMedSearcher.js';
import type { ScienceDirectSearcher } from '../platforms/ScienceDirectSearcher.js';
import type { SciHubSearcher } from '../platforms/SciHubSearcher.js';
import type { ScopusSearcher } from '../platforms/ScopusSearcher.js';
import type { SemanticScholarSearcher } from '../platforms/SemanticScholarSearcher.js';
import type { SpringerSearcher } from '../platforms/SpringerSearcher.js';
import type { UnpaywallSearcher } from '../platforms/UnpaywallSearcher.js';
import type { WebOfScienceSearcher } from '../platforms/WebOfScienceSearcher.js';
import type { WileySearcher } from '../platforms/WileySearcher.js';
import { PLATFORM_FACTORIES } from '../registry/platformFactories.js';
import { PLATFORM_METADATA } from '../registry/platformMetadata.js';
import { logDebug } from '../utils/Logger.js';

export type SearcherMap = Record<string, PaperSource>;

export interface Searchers extends SearcherMap {
  arxiv: ArxivSearcher;
  webofscience: WebOfScienceSearcher;
  pubmed: PubMedSearcher;
  biorxiv: BioRxivSearcher;
  medrxiv: MedRxivSearcher;
  semantic: SemanticScholarSearcher;
  iacr: IACRSearcher;
  googlescholar: GoogleScholarSearcher;
  scihub: SciHubSearcher;
  sciencedirect: ScienceDirectSearcher;
  springer: SpringerSearcher;
  wiley: WileySearcher;
  scopus: ScopusSearcher;
  crossref: CrossrefSearcher;
  openalex: OpenAlexSearcher;
  unpaywall: UnpaywallSearcher;
  pmc: PMCSearcher;
  europepmc: EuropePMCSearcher;
  core: CORESearcher;
  openaire: OpenAIRESearcher;
}

let searchers: Searchers | null = null;

export function initializeSearchers(): Searchers {
  if (searchers) return searchers;

  logDebug('Initializing searchers...');

  const instances: Record<string, PaperSource> = {};
  for (const platform of PLATFORM_METADATA) {
    const factory = PLATFORM_FACTORIES[platform.id];
    if (!factory) continue;

    const instance = factory({ env: process.env, instances });
    instances[platform.id] = instance;
    for (const alias of platform.aliases || []) {
      instances[alias] = instance;
    }
  }

  searchers = instances as unknown as Searchers;

  logDebug('Searchers initialized successfully');
  return searchers;
}
