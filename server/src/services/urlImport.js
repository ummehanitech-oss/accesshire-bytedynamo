import dns from 'dns/promises';
import { URL } from 'url';
import * as cheerio from 'cheerio';

// Friendly message required when a job page cannot be read or is blocked
export const BLOCKED_PAGE_MESSAGE =
  'We could not read this page. Many job sites block automatic reading or need a login. Please paste the job description text instead.';

/**
 * Check if an IP address is a private, loopback, or link-local address (SSRF protection)
 */
function isPrivateIp(ip) {
  if (!ip) return true;

  // Normalize IPv4-mapped IPv6 address (e.g., ::ffff:127.0.0.1)
  let cleanIp = ip.toLowerCase();
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.replace('::ffff:', '');
  }

  // IPv4 checks
  if (cleanIp.includes('.')) {
    const parts = cleanIp.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8 (Private)
    if (a === 127) return true; // 127.0.0.0/8 (Loopback / Localhost)
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 (Link-local)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 (Private)
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 (Private)
    if (a >= 224) return true; // 224.0.0.0/4 (Multicast/Reserved)
    return false;
  }

  // IPv6 checks
  if (cleanIp === '::1' || cleanIp === '::') return true;
  if (cleanIp.startsWith('fe8') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) return true; // link-local fe80::/10
  if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true; // unique local fc00::/7

  return false;
}

/**
 * Validate that a URL is safe to fetch (HTTP/HTTPS only, resolves to public IP)
 *
 * @param {string} urlString - Target URL string
 * @returns {Promise<URL>} Resolves with URL object if safe, throws if unsafe or invalid
 */
export async function isSafeUrl(urlString) {
  if (!urlString || typeof urlString !== 'string' || urlString.trim().length === 0) {
    const err = new Error('Please provide a valid URL.');
    err.status = 400;
    throw err;
  }

  if (urlString.length > 2000) {
    const err = new Error('URL is too long. Maximum allowed length is 2000 characters.');
    err.status = 400;
    throw err;
  }

  let parsed;
  try {
    parsed = new URL(urlString.trim());
  } catch {
    const err = new Error('The URL provided is not valid. Please check the link and try again.');
    err.status = 400;
    throw err;
  }

  // Only allow http and https protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    const err = new Error('Only HTTP and HTTPS URLs are allowed.');
    err.status = 400;
    throw err;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check literal localhost or internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    const err = new Error('Access to local network and internal addresses is prohibited.');
    err.status = 403;
    throw err;
  }

  // Resolve hostname DNS to check IP addresses
  let records;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch (dnsErr) {
    const err = new Error(`Could not resolve hostname "${hostname}". Please check that the URL is correct.`);
    err.status = 404;
    throw err;
  }

  // Check all resolved IP addresses against private / link-local ranges
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      const err = new Error('Access to private, link-local, or internal network addresses is prohibited.');
      err.status = 403;
      throw err;
    }
  }

  return parsed;
}

/**
 * Fetch HTML content of a single page with SSRF protection, timeout, and redirect limits.
 *
 * @param {string} initialUrl - URL to fetch
 * @returns {Promise<{ html: string, finalUrl: string }>}
 */
export async function fetchPage(initialUrl) {
  let currentUrl = initialUrl;
  let redirectsRemaining = 3;
  const maxBytes = 1.5 * 1024 * 1024; // 1.5 MB limit

  while (redirectsRemaining >= 0) {
    // Re-verify safe URL before every fetch / redirect
    await isSafeUrl(currentUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response;
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual', // We handle redirects manually to verify SSRF on each hop
        headers: {
          'User-Agent': 'AccessHireBot/0.1 (student hackathon)',
          'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        signal: controller.signal
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        const err = new Error('The request timed out after 10 seconds. Please paste the job description text instead.');
        err.status = 408;
        throw err;
      }
      const err = new Error('Failed to connect to the website. Please check the link or paste the text instead.');
      err.status = 502;
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle redirects (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        const err = new Error(BLOCKED_PAGE_MESSAGE);
        err.status = 422;
        throw err;
      }

      currentUrl = new URL(location, currentUrl).toString();
      redirectsRemaining--;

      if (redirectsRemaining < 0) {
        const err = new Error('Too many redirects encountered while reading this page.');
        err.status = 400;
        throw err;
      }
      continue;
    }

    // Check for authorization blocks, forbidden access, rate limits
    if ([401, 403, 429].includes(response.status)) {
      const err = new Error(BLOCKED_PAGE_MESSAGE);
      err.status = 422;
      throw err;
    }

    if (!response.ok) {
      const err = new Error(`The website responded with error HTTP ${response.status}. Please paste the text instead.`);
      err.status = 422;
      throw err;
    }

    // Validate Content-Type: accept text/html only
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html') && !contentType.toLowerCase().includes('application/xhtml+xml')) {
      const err = new Error('The URL did not return an HTML web page. Please paste the job text instead.');
      err.status = 400;
      throw err;
    }

    // Read at most 1.5 MB using response body stream
    const chunks = [];
    let bytesRead = 0;
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      bytesRead += value.length;
      if (bytesRead >= maxBytes) {
        await reader.cancel();
        break;
      }
    }

    const totalBuffer = Buffer.concat(chunks);
    const html = totalBuffer.toString('utf-8');

    return { html, finalUrl: currentUrl };
  }

  const err = new Error('Too many redirects encountered.');
  err.status = 400;
  throw err;
}

/**
 * Extract clean, readable job posting text from an HTML document.
 * 1. Checks JSON-LD schema.org JobPosting.
 * 2. Falls back to Cheerio semantic element parsing.
 *
 * @param {string} html - Raw HTML string
 * @returns {string} Clean job text (>= 200 chars)
 */
export function extractJobText(html) {
  if (!html || typeof html !== 'string') {
    const err = new Error(BLOCKED_PAGE_MESSAGE);
    err.status = 422;
    throw err;
  }

  const $ = cheerio.load(html);

  // Strategy A: Look for schema.org JobPosting in JSON-LD scripts
  const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
  for (const script of jsonLdScripts) {
    try {
      const content = $(script).html();
      if (!content) continue;
      const data = JSON.parse(content);

      // Find JobPosting item (handles arrays, @graph, or direct object)
      const candidateList = Array.isArray(data)
        ? data
        : (data['@graph'] && Array.isArray(data['@graph']) ? data['@graph'] : [data]);

      const jobPosting = candidateList.find(item => item && (item['@type'] === 'JobPosting' || item['@type']?.includes?.('JobPosting')));

      if (jobPosting) {
        // Strip HTML from description
        const rawDesc = jobPosting.description ? cheerio.load(jobPosting.description).text() : '';
        const companyName = jobPosting.hiringOrganization?.name || '';
        const title = jobPosting.title || '';
        const employmentType = jobPosting.employmentType || '';
        const skills = Array.isArray(jobPosting.skills) ? jobPosting.skills.join(', ') : (jobPosting.skills || '');
        const qualifications = jobPosting.qualifications || jobPosting.experienceRequirements || '';

        const composed = [
          title ? `Job Title: ${title}` : '',
          companyName ? `Company: ${companyName}` : '',
          employmentType ? `Employment Type: ${employmentType}` : '',
          skills ? `Skills: ${skills}` : '',
          qualifications ? `Qualifications: ${qualifications}` : '',
          rawDesc ? `\nJob Description:\n${rawDesc}` : ''
        ].filter(Boolean).join('\n');

        if (composed.trim().length >= 200) {
          return composed.trim();
        }
      }
    } catch {
      // Ignore individual JSON-LD parse errors and try next
    }
  }

  // Strategy B: Cheerio HTML extraction
  // Remove scripts, styles, headers, footers, navigation, iframes, forms
  $('script, style, noscript, nav, header, footer, aside, form, iframe, svg, button').remove();

  // Prefer <main> or <article> if available and sufficiently long
  let target = $('main');
  if (target.length === 0 || target.text().trim().length < 200) {
    target = $('article');
  }
  if (target.length === 0 || target.text().trim().length < 200) {
    target = $('body');
  }

  const rawText = target.text();
  // Collapse whitespace
  const cleanText = rawText.replace(/\s+/g, ' ').trim();

  // If text is under 200 characters, it's likely a JS-only SPA or empty page
  if (cleanText.length < 200) {
    const err = new Error(BLOCKED_PAGE_MESSAGE);
    err.status = 422;
    throw err;
  }

  return cleanText;
}
