import type { AppLanguage } from './i18n';
import { translateToMyanmar } from './myanmarTranslations';

/**
 * Chinese (Simplified) UI Phrase Dictionary across all pages & components.
 */
const ZH_CN_EXACT_DICT: Record<string, string> = {
  // Navigation & Core Chrome
  'Home': '首页',
  'Home Page': '首页',
  'Packages': '网络套餐',
  'Internet Packages': '卫星网络套餐',
  'Starlink Kits': 'Starlink 套件',
  'Starlink Kits & Shop': 'Starlink 套件商城',
  'Starlink Shop': 'Starlink 商城',
  'Kits': '硬件套件',
  'Rental': '设备租赁',
  'Roaming': '漫游套餐',
  'Delivery': '全球配送',
  'Worldwide Delivery': '全球配送',
  'Warranty': '保修服务',
  'Track': '订单追踪',
  'Track Order': '追踪订单',
  'Track Your Order': '追踪您的订单',
  'Legal': '法律与政策',
  'Legal Center': '政策中心',
  'Back to Legal Center': '返回政策中心',
  'Legal & Policies': '法律与政策',
  'Legal & Policy Center': '法律与政策中心',
  'Legal & Policies (/Legal)': '法律与政策 (/Legal)',
  'Legal & Policies Center (/Legal)': '法律与政策中心 (/Legal)',
  'Support': '技术支持',
  'Customer Support': '客户支持',
  'Contact Support': '联系客服',
  '24/7 Support Desk': '24/7 客服中心',
  'FAQ': '常见问题',
  'Frequently Asked Questions': '常见问题解答',
  'Image Gallery': '安装图库',
  'Photo Gallery & Setups': '实景安装图库',
  'Blog': '官方博客',
  'Official Blog': '官方博客',
  'Special Offers': '特惠活动',
  'Offers': '优惠活动',
  'Affiliate & Partnerships': '合作伙伴计划',
  'Cart': '购物车',
  'Cart & Global Checkout': '购物车与全球结账',
  'Shopping Cart & Checkout': '购物车与结账',
  'Customer Dashboard': '客户中心',
  'Quick Links': '快捷链接',
  'Contact': '联系我们',
  'Dhaka, Bangladesh': '孟加拉国 达卡',
  'Login': '登录',
  'Logout': '退出登录',
  'Create Account': '创建账号',
  'Sign In': '登录',
  'Order Now': '立即订购',
  'Buy Now': '立即购买',
  'Rent Now': '立即租赁',
  'Rent': '租赁',
  'Explore Roaming': '探索漫游套餐',
  'Add to Cart': '加入购物车',
  'Added to Cart': '已加入购物车',
  'Details': '查看详情',
  'Read Details': '查看详情',
  'Full Policy': '完整政策',
  'Privacy Policy': '隐私政策',
  'Data Deletion': '数据删除申请',
  'Red Policy Alert': '红线安全警示 (Red Policy Alert)',
  'Price Syndicate Alert': '价格警示 (Price Syndicate Alert)',
  'Price Syndicate Alert (Rental Kit)': '租赁套件价格警示',
  'Rental Policy & Restrictions': '租赁政策与使用限制',
  'Rental & Restrictions Policy': '租赁与使用限制政策',
  'Warranty & Replacement': '保修与更换政策',
  '24-Month Replacement Warranty': '24 个月更换保修',
  '24-Month DSLink Replacement Warranty': '24 个月 DSLink 更换保修',
  '90-Day Roaming Money-Back': '90 天漫游退款保障',
  '90-Day Roaming Money-Back Guarantee': '90 天漫游退款保障',
  'Worldwide DHL / FedEx': '全球 DHL / FedEx 配送',
  'Roaming Packages': '漫游套餐',
  'Starlink Rental Kit (৳3,000)': 'Starlink 租赁套件 (৳3,000)',
  'Rental Kit (৳3,000 One-Time)': '租赁套件 (৳3,000 一次性费用)',
  'Rental Kit Checkout': '租赁套件结账',
  'Rental Checkout': '租赁结账',
  'Install App': '安装应用',
  'Installing...': '正在安装...',
  'Close': '关闭',
  'Copy': '复制',
  'Copied': '已复制',
  'Reset Filter': '重置筛选',
  'Quick filter:': '快速筛选：',
  'WhatsApp Support': 'WhatsApp 客服支持',
  'Chat Directly on WhatsApp': '通过 WhatsApp 直接咨询',
  'Newsletter Alerts': '订阅新品与价格通知',
  'Get Notified About Hardware Drops & Price Updates': '获取 Starlink 硬件到货与价格更新通知',
  'Subscribe with your email to receive exclusive discount coupons and stock alert notifications.':
    '输入您的邮箱订阅独家优惠券与库存到货提醒。',
  'Enter your email...': '输入您的电子邮箱...',
  'Subscribe': '立即订阅',
  'Subscribing...': '订阅中...',
  'Successfully subscribed to newsletter!': '成功订阅邮件通知！',
  'High-Speed Satellite Plans For Everyone': '适用于所有场景的高速卫星互联网套餐',
  'Experience seamless broadband anywhere in Bangladesh with zero cellular towers or phone lines required.':
    '无需光纤或移动基站，在偏远地区、山区、海岛及全球各地畅享高速低延迟卫星宽带。',
  'Why Choose DSLink & Starlink?': '为什么选择 DSLink 与 Starlink？',
  'Product Comparison': '硬件型号对比',
  'Starlink Standard vs. Mini': 'Starlink Standard 4X 与 Mini 对比',
  'View All Kits': '查看全部套件',
  'View Products': '查看产品',
  'View Full Gallery': '查看完整图库',
  'One-Time Charge:': '一次性费用：',
  'One-Time Charge': '一次性费用',
  'Store, Delivery & Guarantees': '商城、全球配送与保障',
  'Legal, Account & Contact': '法律政策、账户与联系方式',
  'DSLink is operated by ': 'DSLink 运营方为 ',
  '.': '。',
};

const NORMALIZED_ZH_DICT: Record<string, string> = {};
for (const [k, v] of Object.entries(ZH_CN_EXACT_DICT)) {
  NORMALIZED_ZH_DICT[k.trim().toLowerCase()] = v;
}

export function translateUiPhrase(
  lang: AppLanguage,
  bnText: string,
  myText: string,
  enText: string,
  zhText?: string
): string {
  if (lang === 'bn') return bnText || enText;
  if (lang === 'my') {
    if (myText && myText !== enText) return myText;
    return translateToMyanmar(enText, bnText);
  }
  if (lang === 'zh-CN' || lang === 'zh-TW') {
    if (zhText) return zhText;
    const trimmed = (enText || '').trim();
    if (ZH_CN_EXACT_DICT[trimmed]) return ZH_CN_EXACT_DICT[trimmed];
    const lower = trimmed.toLowerCase();
    if (NORMALIZED_ZH_DICT[lower]) return NORMALIZED_ZH_DICT[lower];
  }
  return enText;
}
