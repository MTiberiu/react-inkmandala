import { BookPage } from "../types/BookPage";

/**
 * Get the URL of the featured image in the requested size.
 * Falls back to full size if the specified size is not available.
 * @param post - The post object containing embedded media details
 * @param size - The desired image size (e.g., 'thumbnail', 'medium_large')
 * @returns The URL of the image or null if no image is found
 */
export function thePostThumbnailUrl(post: BookPage, size: string = 'full'): string | null {
    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
    
    if (featuredMedia) {
        const sizes = featuredMedia.media_details?.sizes;
        
        if (sizes && sizes[size]) {
            return sizes[size].source_url;
        } else if (sizes && sizes['full']) {
            return sizes['full'].source_url;
        }
    }
    
    return null;
}
