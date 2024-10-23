export interface BookPage {
    id: number;
    title: {
      rendered: string; 
    };
    slug: string;
    content: {
        rendered: string;
    }
    excerpt: {
      rendered: string; 
    };
    featured_media: number; 
    featured_media_url: string; 
    _embedded?: {
      'wp:featuredmedia'?: Array<FeaturedMedia>;
    }; 
  }
  
  
  export interface FeaturedMedia {
    id: number;
    source_url: string;
    media_details: {
      file: string;
      height: number;
      width: number;
      sizes: {
        [key: string]: {
          file: string;
          width: number;
          height: number;
          mime_type: string;
          source_url: string;
        };
      };
    };
  }
  