import ogs from 'open-graph-scraper';

export interface OpenGraphData {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    siteName?: string;
    favicon?: string;
    domain?: string;
    resourceType?: 'video' | 'pdf' | 'repo' | 'doc' | 'image' | 'ai' | 'link';
}

/** Extract clean domain from URL */
export function getDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

/** Detect resource type from URL patterns */
export function detectResourceType(url: string): OpenGraphData['resourceType'] {
    const lower = url.toLowerCase();
    if (/youtube\.com|youtu\.be|vimeo\.com|loom\.com/.test(lower)) return 'video';
    if (/\.pdf($|\?)/.test(lower) || /drive\.google\.com.*pdf|dropbox.*\.pdf/.test(lower)) return 'pdf';
    if (/github\.com|gitlab\.com|bitbucket\.org/.test(lower)) return 'repo';
    if (/notion\.so|confluence|docs\.google\.com|overleaf\.com|canva\.com/.test(lower)) return 'doc';
    if (/openai\.com|claude\.ai|gemini\.google|huggingface\.co|perplexity\.ai/.test(lower)) return 'ai';
    if (/\.(png|jpg|jpeg|gif|webp|svg)($|\?)/.test(lower)) return 'image';
    return 'link';
}

/** Generate Google Drive thumbnail URL from share link */
function getDrivePreview(url: string): string | undefined {
    const fileId = url.match(/\/d\/([\w-]+)/)?.[1] || url.match(/id=([\w-]+)/)?.[1];
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w640`;
    return undefined;
}

/** Special metadata for known cloud storage providers */
function getCloudFallback(url: string): Partial<OpenGraphData> | null {
    const lower = url.toLowerCase();

    if (lower.includes('drive.google.com')) {
        return {
            siteName: 'Google Drive',
            favicon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
            image: getDrivePreview(url),
            resourceType: detectResourceType(url),
        };
    }
    if (lower.includes('dropbox.com')) {
        return {
            siteName: 'Dropbox',
            favicon: 'https://cfl.dropboxstatic.com/static/images/logo_catalog/dropbox_logo_glyph.png',
            resourceType: detectResourceType(url),
        };
    }
    if (lower.includes('onedrive') || lower.includes('sharepoint')) {
        return {
            siteName: 'OneDrive',
            favicon: 'https://res.cdn.office.net/files/fabric-cdn-prod_20230922.001/assets/brand-icons/product/svg/onedrive_32x1.svg',
            resourceType: detectResourceType(url),
        };
    }
    if (lower.includes('youtu')) {
        // Extract YouTube video ID for thumbnail
        const videoId = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1];
        return {
            siteName: 'YouTube',
            image: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined,
            resourceType: 'video',
        };
    }
    return null;
}

export async function extractOpenGraph(url: string): Promise<OpenGraphData | null> {
    const domain = getDomain(url);
    const resourceType = detectResourceType(url);
    const cloudFallback = getCloudFallback(url);

    try {
        const { error, result } = await ogs({
            url,
            timeout: 6000,
            fetchOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; UniConnectBot/1.0; +https://uniconnect.edu)',
                },
            },
        });

        if (!error && result) {
            let imageUrl: string | undefined;
            if (Array.isArray(result.ogImage) && result.ogImage.length > 0) {
                imageUrl = result.ogImage[0].url;
            } else if (result.ogImage && !Array.isArray(result.ogImage)) {
                imageUrl = (result.ogImage as any).url;
            }

            // Prefer cloud fallback image if OG image is missing (e.g. Drive)
            if (!imageUrl && cloudFallback?.image) imageUrl = cloudFallback.image;

            return {
                title: result.ogTitle || result.twitterTitle,
                description: result.ogDescription || result.twitterDescription,
                image: imageUrl,
                url: result.ogUrl || url,
                siteName: result.ogSiteName || cloudFallback?.siteName || domain,
                favicon: cloudFallback?.favicon,
                domain,
                resourceType: cloudFallback?.resourceType || resourceType,
            };
        }
    } catch (e: any) {
        // Timeout or fetch error — fall through to best-effort fallback
        console.warn(`[OG] Could not scrape ${url}: ${e?.message}`);
    }

    // Best-effort fallback: return cloud metadata or minimal domain info
    if (cloudFallback) {
        return {
            domain,
            siteName: cloudFallback.siteName || domain,
            favicon: cloudFallback.favicon,
            image: cloudFallback.image,
            resourceType: cloudFallback.resourceType || resourceType,
        };
    }

    // Minimal fallback so the card still renders
    return {
        domain,
        siteName: domain,
        resourceType,
    };
}

export function findUrlsInText(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}
