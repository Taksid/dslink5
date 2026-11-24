export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  titleBn?: string;
  description: string;
  descriptionBn?: string;
  category?: 'unboxing' | 'installation' | 'delivery' | 'speedtest' | 'hardware' | 'custom' | string;
  categoryLabel?: string;
  categoryLabelBn?: string;
  location?: string;
  locationBn?: string;
  date?: string;
  tags?: string[];
  specs?: string;
  alt?: string;
  relatedArticleSlug?: string;
  caption?: string;
  published?: boolean;
  createdAt?: string;
}

// All mock images deleted as requested.
// Only genuine images added by admin/user will be shown.
export const GALLERY_IMAGES: GalleryImage[] = [];
