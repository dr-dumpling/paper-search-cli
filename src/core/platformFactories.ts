import type { PaperSource } from '../platforms/PaperSource.js';
import { ACMSearcher } from '../platforms/ACMSearcher.js';
import { ArxivSearcher } from '../platforms/ArxivSearcher.js';
import { BioRxivSearcher, MedRxivSearcher } from '../platforms/BioRxivSearcher.js';
import { CORESearcher } from '../platforms/CORESearcher.js';
import { CrossrefSearcher } from '../platforms/CrossrefSearcher.js';
import { DBLPSearcher } from '../platforms/DBLPSearcher.js';
import { EuropePMCSearcher } from '../platforms/EuropePMCSearcher.js';
import { GoogleScholarSearcher } from '../platforms/GoogleScholarSearcher.js';
import { IACRSearcher } from '../platforms/IACRSearcher.js';
import { IEEESearcher } from '../platforms/IEEESearcher.js';
import { OpenAIRESearcher } from '../platforms/OpenAIRESearcher.js';
import { OpenAlexSearcher } from '../platforms/OpenAlexSearcher.js';
import { OpenReviewSearcher } from '../platforms/OpenReviewSearcher.js';
import { PMCSearcher } from '../platforms/PMCSearcher.js';
import { PubMedSearcher } from '../platforms/PubMedSearcher.js';
import { ScienceDirectSearcher } from '../platforms/ScienceDirectSearcher.js';
import { SciHubSearcher } from '../platforms/SciHubSearcher.js';
import { ScopusSearcher } from '../platforms/ScopusSearcher.js';
import { SemanticScholarSearcher } from '../platforms/SemanticScholarSearcher.js';
import { SpringerSearcher } from '../platforms/SpringerSearcher.js';
import { UnpaywallSearcher } from '../platforms/UnpaywallSearcher.js';
import { USENIXSearcher } from '../platforms/USENIXSearcher.js';
import { WebOfScienceSearcher } from '../platforms/WebOfScienceSearcher.js';
import { WileySearcher } from '../platforms/WileySearcher.js';

export interface PlatformFactoryContext {
  env: NodeJS.ProcessEnv;
  instances: Record<string, PaperSource>;
}

export type PlatformFactory = (context: PlatformFactoryContext) => PaperSource;

export const PLATFORM_FACTORIES: Record<string, PlatformFactory> = {
  crossref: ({ env }) => new CrossrefSearcher(env.CROSSREF_MAILTO),
  openalex: () => new OpenAlexSearcher(),
  pubmed: ({ env }) => new PubMedSearcher(env.PUBMED_API_KEY),
  pmc: () => new PMCSearcher(),
  europepmc: () => new EuropePMCSearcher(),
  arxiv: () => new ArxivSearcher(),
  biorxiv: () => new BioRxivSearcher('biorxiv'),
  medrxiv: () => new MedRxivSearcher(),
  semantic: ({ env }) => new SemanticScholarSearcher(env.SEMANTIC_SCHOLAR_API_KEY),
  iacr: () => new IACRSearcher(),
  core: () => new CORESearcher(),
  openaire: () => new OpenAIRESearcher(),
  googlescholar: () => new GoogleScholarSearcher(),
  webofscience: ({ env }) => new WebOfScienceSearcher(env.WOS_API_KEY, env.WOS_API_VERSION),
  sciencedirect: ({ env }) => new ScienceDirectSearcher(env.ELSEVIER_API_KEY),
  springer: ({ env }) => new SpringerSearcher(env.SPRINGER_API_KEY, env.SPRINGER_OPENACCESS_API_KEY),
  scopus: ({ env }) => new ScopusSearcher(env.ELSEVIER_API_KEY),
  scihub: () => new SciHubSearcher(),
  unpaywall: () => new UnpaywallSearcher(),
  dblp: () => new DBLPSearcher(),
  ieee: ({ env }) => new IEEESearcher(env.IEEE_API_KEY),
  acm: ({ env }) => new ACMSearcher(env.CROSSREF_MAILTO),
  usenix: ({ instances }) => {
    const dblp = instances.dblp instanceof DBLPSearcher ? instances.dblp : new DBLPSearcher();
    return new USENIXSearcher(dblp);
  },
  openreview: () => new OpenReviewSearcher(),
  wiley: ({ env }) => new WileySearcher(env.WILEY_TDM_TOKEN)
};
