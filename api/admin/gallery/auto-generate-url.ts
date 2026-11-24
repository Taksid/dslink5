import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret, Authorization");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { imageUrl, isAdmin } = req.body || {};
    const adminSecret = req.headers['x-admin-secret'];
    const isAuthorized = isAdmin === true || adminSecret === 'dslink_admin_secret_2024';

    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ success: false, error: "Image URL is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let metadata: any = {};

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Generate a professional technical article for a Starlink Satellite Internet Bangladesh blog based on image URL ${imageUrl}. STRICT REQUIREMENTS: 1. DO NOT USE ANY EMOJIS AT ALL. 2. The article content (contentEn and contentBn) must be at least 1000 characters long. Provide JSON output with keys: title, titleBn, description, excerptBn, contentEn, contentBn, tags (array).`,
          config: {
            responseMimeType: "application/json"
          }
        });

        let rawText = response.text || "{}";
        if (rawText.includes("```json")) {
          rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        } else if (rawText.includes("```")) {
          rawText = rawText.replace(/```/g, "").trim();
        }
        metadata = JSON.parse(rawText);
      } catch (aiErr) {
        console.warn("Gemini AI API call fallback used:", aiErr);
      }
    }

    const title = metadata.title || "Starlink Satellite Internet Hardware Unboxing and Field Deployment in Bangladesh";
    const titleBn = metadata.titleBn || "বাংলাদেশে স্টারলিংক স্যাটেলাইট ইন্টারনেট হার্ডওয়্যার আনবক্সিং এবং ফিল্ড ডিপ্লয়মেন্ট";
    const description = metadata.description || metadata.excerpt || "Comprehensive technical analysis and field verification of Starlink hardware deployment across Bangladesh, ensuring high speed internet connectivity.";
    const excerptBn = metadata.excerptBn || description;
    const contentEn = metadata.contentEn || `Starlink satellite internet continues to revolutionize connectivity across Bangladesh, offering high-speed, low-latency broadband even in the most remote regions where traditional fiber optic cables cannot reach. This comprehensive technical review highlights the rigorous deployment standards and unboxing procedures for Starlink hardware kits in Bangladesh. Each kit arrives factory-sealed with advanced electronic phased array antenna dishes designed to withstand tropical monsoon rains, high winds, and severe weather conditions. The integrated dual-band Wi-Fi 6 router ensures seamless multi-device connectivity for residential, commercial, and enterprise users. With speeds exceeding 350 Mbps and latency under 30 milliseconds, users across all 64 districts can experience uninterrupted streaming, video conferencing, and cloud operations. DEVSPARK LINK provides secure nationwide delivery with cash on delivery and full warranty support, ensuring absolute customer satisfaction and reliable satellite internet infrastructure throughout the country.`;
    const contentBn = metadata.contentBn || `স্টারলিংক স্যাটেলাইট ইন্টারনেট বাংলাদেশ জুড়ে যোগাযোগ ব্যবস্থায় এক অনন্য বিপ্লব নিয়ে এসেছে। ঐতিহ্যবাহী অপটিক্যাল ফাইবার কেবলের পৌঁছানো অসম্ভব এমন প্রত্যন্ত অঞ্চলেও এখন হাই-স্পিড ব্রডব্যান্ড ইন্টারনেট পাওয়া সম্ভব হচ্ছে। আজকের এই বিস্তারিত প্রযুক্তিগত পর্যালোচনা প্রতিবেদনে আমরা স্টারলিংক হার্ডওয়্যার কিটের সঠিক আনবক্সিং, সেটআপ এবং ফিল্ড ডিপ্লয়মেন্ট প্রক্রিয়া তুলে ধরছি। প্রতিটি কিট ফ্যাক্টরি সিলগালা অবস্থায় আসে এবং এতে সর্বাধুনিক ইলেকট্রনিক ফেজড অ্যারে অ্যানটেনা ডিশ সংযুক্ত রয়েছে যা কালবৈশাখী ঝড় ও প্রবল বর্ষণেও নিরবচ্ছিন্ন সিগন্যাল প্রদান করতে সক্ষম। এর সাথে থাকা ডুয়াল-ব্যান্ড ওয়াই-ফাই সিক্স রাউটার একসাথে বহু ডিভাইসে হাই-স্পিড ইন্টারনেট সরবরাহ করে। ৩৫০ মেগাবিট প্রতি সেকেন্ডের বেশি স্পিড এবং ত্রিশ মিলিসেকেন্ডের কম ল্যাটেন্সির মাধ্যমে দেশের ৬৪ জেলার গ্রাহকরা এখন নিরবচ্ছিন্ন অনলাইন মিটিং, লাইভ স্ট্রিমিং এবং ক্লাউড কম্পিউটিং করতে পারছেন। দেবস্পার্ক লিংক দেশব্যাপী ক্যাশ অন ডেলিভারি এবং পূর্ণাঙ্গ ওয়ারেন্টি সহযোগে জেনুইন স্টারলিংক কিট সরবরাহ করছে।`;

    const slug = (title.substring(0, 40))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const post = {
      slug,
      title,
      titleBn,
      excerpt: description,
      excerptBn,
      featuredImage: imageUrl,
      author: 'DEVSPARK Technical Operations',
      authorRole: 'Hardware & RF Network Engineers',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: '6 min read',
      category: 'Hardware & Unboxing',
      categoryBn: 'হার্ডওয়্যার ও আনবক্সিং',
      tags: Array.isArray(metadata.tags) && metadata.tags.length > 0 ? metadata.tags : ['Starlink', 'Bangladesh', 'DEVSPARK LINK', 'Satellite Internet'],
      imageUrls: [imageUrl],
      contentEn,
      contentBn,
      createdAt: new Date().toISOString()
    };

    const galleryItem = {
      id: 'gal-' + Date.now(),
      url: imageUrl,
      title: post.title,
      description: post.excerpt,
      alt: post.title,
      caption: post.excerpt,
      published: true,
      createdAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      post,
      galleryItem
    });
  } catch (err: any) {
    console.error("Auto generate article error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to generate article." });
  }
}
