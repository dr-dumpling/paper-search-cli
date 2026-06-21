import axios, { type AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { logDebug } from './Logger.js';

export interface HttpPolicy {
  rateLimit?: { rps: number; burst?: number };
  cache?: { ttlMs: number; maxSize?: number };
  timeoutMs?: number;
  retry?: { maxRetries: number };
  userAgent?: string;
  validateStatus?: (status: number) => boolean;
}

export interface HttpRequestConfig extends AxiosRequestConfig {
  cacheKey?: string;
}

export class HttpClient {
  constructor(private readonly policy: HttpPolicy = {}) {}

  async request<T>(config: HttpRequestConfig): Promise<T> {
    const response = await axios.request<T>({
      ...config,
      timeout: config.timeout ?? this.policy.timeoutMs,
      validateStatus: config.validateStatus ?? this.policy.validateStatus,
      headers: this.policy.userAgent
        ? {
            ...config.headers,
            'User-Agent': this.policy.userAgent
          }
        : config.headers
    });
    return response.data;
  }
}

/**
 * Initializes global HTTP/HTTPS and SOCKS proxy agents for Axios
 * based on standard proxy environment variables.
 */
export function setupGlobalProxy(): void {
  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy;

  if (!proxy) {
    return;
  }

  try {
    logDebug(`Configuring global HTTP/HTTPS proxy: ${proxy}`);
    const agent = proxy.startsWith('socks')
      ? new SocksProxyAgent(proxy)
      : new HttpsProxyAgent(proxy);

    // Inject agent as default for both http and https protocols
    axios.defaults.httpAgent = agent;
    axios.defaults.httpsAgent = agent;
  } catch (error: any) {
    logDebug(`Failed to initialize global proxy agent: ${error.message}`);
  }
}
