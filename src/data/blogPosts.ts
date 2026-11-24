export interface BlogPost {
  slug: string;
  title: string;
  titleBn: string;
  excerpt: string;
  excerptBn: string;
  featuredImage: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  category: string;
  categoryBn: string;
  tags: string[];
  imageUrls?: string[];
  contentBn?: string;
  contentEn?: string;
}

// All mock posts deleted as requested.
// Only genuine articles added by admin/user will be shown.
export const BLOG_POSTS: BlogPost[] = [];
