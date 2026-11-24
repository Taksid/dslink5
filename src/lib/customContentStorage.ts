import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { BlogPost } from '../data/blogPosts';
import { GalleryImage } from '../data/imageGallery';

const LOCAL_CUSTOM_BLOGS = 'dslink_custom_blogs_v1';
const LOCAL_CUSTOM_GALLERY = 'dslink_custom_gallery_v1';

// All mock seed images deleted as requested.
// Only user/admin added images and posts will be stored.
export async function seedInitialImages() {
  if (typeof window === 'undefined') return;
  // Cleanup any old mock seed data from localStorage
  try {
    const rawBlogs = localStorage.getItem(LOCAL_CUSTOM_BLOGS);
    if (rawBlogs) {
      const parsedBlogs: BlogPost[] = JSON.parse(rawBlogs);
      const filtered = parsedBlogs.filter(p => !p.slug.includes('-101') && !p.slug.includes('-102') && !p.slug.includes('-103') && !p.slug.includes('-104') && !p.slug.includes('-105') && !p.slug.includes('-106') && !p.slug.includes('-107'));
      if (filtered.length !== parsedBlogs.length) {
        localStorage.setItem(LOCAL_CUSTOM_BLOGS, JSON.stringify(filtered));
      }
    }

    const rawGallery = localStorage.getItem(LOCAL_CUSTOM_GALLERY);
    if (rawGallery) {
      const parsedGal: GalleryImage[] = JSON.parse(rawGallery);
      const filtered = parsedGal.filter(g => !g.id.startsWith('seed-'));
      if (filtered.length !== parsedGal.length) {
        localStorage.setItem(LOCAL_CUSTOM_GALLERY, JSON.stringify(filtered));
      }
    }
  } catch (e) {
    // Ignore migration cleanup error
  }
}

export async function addBlogAndGalleryItem(data: {
  imageUrl: string;
  title: string;
  titleBn?: string;
  excerpt: string;
  excerptBn?: string;
  category?: string;
  tags?: string[];
  location?: string;
  locationBn?: string;
  specs?: string;
}) {
  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

  const longContentEn = `${data.title}. Official Starlink satellite internet deployment and inspection by DEVSPARK LINK in Bangladesh. This hardware verification ensures authentic SpaceX equipment delivery with high-speed, low-latency connectivity for enterprise and residential customers.`;
  const longContentBn = `${data.titleBn || data.title}। বাংলাদেশে দেবস্পার্ক লিংক কর্তৃক অফিশিয়াল স্টারলিংক স্যাটেলাইট ইন্টারনেট কিট পরিদর্শন ও ডেলিভারি প্রতিবেদন। ১০০% জেনুইন হার্ডওয়্যার এবং দেশব্যাপী ক্যাশ অন ডেলিভারি সুবিধাসহ সার্বক্ষণিক টেকনিক্যাল সাপোর্ট।`;

  const newPost: BlogPost = {
    slug,
    title: data.title,
    titleBn: data.titleBn || data.title,
    excerpt: data.excerpt,
    excerptBn: data.excerptBn || data.excerpt,
    featuredImage: data.imageUrl,
    author: 'DEVSPARK Technical Operations',
    authorRole: 'Hardware & RF Network Engineers',
    publishedAt: new Date().toISOString().split('T')[0],
    readTime: '4 min read',
    category: data.category || 'Hardware & Unboxing',
    categoryBn: data.category === 'Installation & Setup' ? 'ইন্সটলেশন ও সেটআপ গাইড' : 'হার্ডওয়্যার ও আনবক্সিং',
    tags: data.tags && data.tags.length > 0 ? data.tags : ['Starlink', 'Bangladesh', 'DEVSPARK LINK'],
    imageUrls: [data.imageUrl],
    contentBn: longContentBn,
    contentEn: longContentEn
  };

  const newGalleryItem: GalleryImage = {
    id: 'gal-' + Date.now(),
    url: data.imageUrl,
    title: data.title,
    titleBn: data.titleBn || data.title,
    description: data.excerpt,
    descriptionBn: data.excerptBn || data.excerpt,
    category: data.category || 'custom',
    categoryLabel: data.category || 'Custom Photo',
    categoryLabelBn: data.category || 'কাস্টম ফটো',
    location: data.location || 'Dhaka, Bangladesh',
    locationBn: data.locationBn || 'ঢাকা, বাংলাদেশ',
    date: new Date().toISOString().split('T')[0],
    tags: data.tags || ['Starlink', 'Bangladesh', 'DEVSPARK LINK'],
    specs: data.specs,
    alt: data.title,
    caption: data.excerpt,
    published: true,
    createdAt: new Date().toISOString(),
    relatedArticleSlug: slug
  };

  try {
    const existingBlogs = getCustomBlogs();
    localStorage.setItem(LOCAL_CUSTOM_BLOGS, JSON.stringify([newPost, ...existingBlogs]));

    const existingGallery = getCustomGallery();
    localStorage.setItem(LOCAL_CUSTOM_GALLERY, JSON.stringify([newGalleryItem, ...existingGallery]));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  try {
    await addDoc(collection(db, 'blog_posts'), { ...newPost, createdAt: new Date().toISOString() });
    await addDoc(collection(db, 'gallery_images'), { ...newGalleryItem, createdAt: new Date().toISOString() });
  } catch (e) {
    console.warn('Firestore save warning:', e);
  }

  return { newPost, newGalleryItem };
}

export function getCustomBlogs(): BlogPost[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_BLOGS);
    if (raw) {
      const parsed: BlogPost[] = JSON.parse(raw);
      // Remove any legacy mock seed posts
      return parsed.filter(p => !p.slug.includes('-101') && !p.slug.includes('-102') && !p.slug.includes('-103') && !p.slug.includes('-104') && !p.slug.includes('-105') && !p.slug.includes('-106') && !p.slug.includes('-107'));
    }
  } catch (e) {}
  return [];
}

export function getCustomGallery(): GalleryImage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_GALLERY);
    if (raw) {
      const parsed: GalleryImage[] = JSON.parse(raw);
      // Remove any legacy mock seed images
      return parsed.filter(i => !i.id.startsWith('seed-'));
    }
  } catch (e) {}
  return [];
}

export function deleteGalleryItem(id: string) {
  try {
    const existing = getCustomGallery().filter(i => i.id !== id);
    localStorage.setItem(LOCAL_CUSTOM_GALLERY, JSON.stringify(existing));
  } catch (e) {}
}

export function deleteBlogPost(slug: string) {
  try {
    const existing = getCustomBlogs().filter(p => p.slug !== slug);
    localStorage.setItem(LOCAL_CUSTOM_BLOGS, JSON.stringify(existing));
  } catch (e) {}
}
