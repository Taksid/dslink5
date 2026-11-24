/**
 * Comprehensive Myanmar (Burmese / မြန်မာဘာသာ) Translation Dictionary & Smart Phrase Engine
 * Maps English & Bengali UI keys across the full application to natural Burmese script.
 */

const MYANMAR_EXACT_DICT: Record<string, string> = {
  // Navigation & Core Chrome
  'Home': 'ပင်မစာမျက်နှာ',
  'Home Page': 'ပင်မစာမျက်နှာ',
  'Packages': 'အင်တာနက် ပက်ကေ့ချ်များ',
  'Internet Packages': 'အင်တာနက် ပက်ကေ့ချ်များ',
  'Starlink Kits': 'Starlink စက်ပစ္စည်းများ',
  'Starlink Kits & Shop': 'Starlink စက်ပစ္စည်းဆိုင်',
  'Starlink Shop': 'Starlink ဆိုင်',
  'Kits': 'စက်ပစ္စည်းများ',
  'Offers': 'အထူးလျှော့စျေး',
  'Special Price Offers': 'အထူးစျေးနှုန်းနှင့် ပရိုမိုးရှင်းများ',
  'Special Offers': 'အထူးကမ်းလှမ်းချက်များ',
  'Track Order': 'မှာယူမှု စစ်ဆေးရန်',
  'Track Your Order': 'သင့်မှာယူမှုကို ခြေရာခံပါ',
  'Image Gallery': 'ဓာတ်ပုံပြခန်း',
  'Photo Gallery & Setups': 'တပ်ဆင်မှု ဓာတ်ပုံများ',
  'Blog': 'ဘလော့ဂ်',
  'Official Blog': 'တရားဝင် ဘလော့ဂ်',
  'Blog & Knowledge': 'ဘလော့ဂ်နှင့် ဗဟုသုတ',
  'Support': 'အကူအညီ',
  'Customer Support': 'ဖောက်သည် ဝန်ဆောင်မှု',
  '24/7 Support Desk': '၂၄/၇ အကူအညီဌာန',
  'Support Desk': 'အကူအညီဌာန',
  'FAQ': 'အမေးများသော မေးခွန်းများ',
  'Frequently Asked Questions': 'အမေးများသော မေးခွန်းများ',
  'Main Navigation': 'ပင်မ လမ်းညွှန်',
  'Tools & Utilities': 'ကိရိယာများနှင့် ဝန်ဆောင်မှုများ',
  'Partnerships & Business': 'မိတ်ဖက်နှင့် စီးပွားရေး',
  'Partnerships Program': 'မိတ်ဖက်အစီအစဉ်',
  'DEV SPARK SOFT LIMITED': 'DEV SPARK SOFT LIMITED',
  'Help & Policies': 'အကူအညီနှင့် မူဝါဒများ',
  'Quick Links': 'အမြန်လင့်ခ်များ',
  'Contact': 'ဆက်သွယ်ရန်',
  'Dhaka, Bangladesh': 'ဒါကာ၊ ဘင်္ဂလားဒေ့ရှ်',
  'Logout': 'ထွက်ရန်',
  'Login': 'ဝင်ရောက်ရန်',
  'Order Now': 'ယခု မှာယူပါ',
  'Order Now (Starlink Shop)': 'ယခု မှာယူပါ (Starlink ဆိုင်)',
  'Self-Activate Subscription': 'လစဉ်ကြေး ကိုယ်တိုင် ဖွင့်လှစ်ရန်',
  'Warranty Policy': 'အာမခံ မူဝါဒ',
  'Warranty & Replacement': 'အာမခံနှင့် အစားထိုးလဲလှယ်ခြင်း',
  'Money Back Guarantee': 'ငွေပြန်အမ်းခြင်း အာမခံချက်',
  '30-Day Money-Back Guarantee': 'ရက် ၃၀ ငွေပြန်အမ်း အာမခံချက်',
  'Rental Policy & Restrictions': 'ငှားရမ်းခြင်း စည်းမျဉ်းနှင့် မူဝါဒ',
  'View Rental Policy': 'ငှားရမ်းခြင်း မူဝါဒ ကြည့်ရန်',
  'Privacy Policy': 'ကိုယ်ရေးအချက်အလက် မူဝါဒ',
  'Data Deletion': 'ဒေတာ ဖျက်သိမ်းရန်',
  'Red Policy Alert (Buyer Safety)': 'Red Policy သတိပေးချက် (ဝယ်ယူသူ လုံခြုံရေး)',
  'Red Policy Alert': 'Red Policy သတိပေးချက်',
  'Price Syndicate Alert (Rental Kit)': 'စျေးနှုန်းသတိပေးချက် (Rental Kit)',
  'Starlink Rental Kit (৳3,000 One-Time Charge)': 'Starlink ငှားရမ်းစက် (တစ်ကြိမ်ကြေး ৳3,000)',
  'Back': 'နောက်သို့',
  'Back to Home': 'ပင်မစာမျက်နှာသို့ ပြန်သွားရန်',
  'Back to Blog': 'ဘလော့ဂ်သို့ ပြန်သွားရန်',
  'Back to Checkout': 'ငွေရှင်းစာမျက်နှာသို့ ပြန်သွားရန်',
  'Return to Checkout': 'ငွေရှင်းစာမျက်နှာသို့ ပြန်သွားရန်',

  // Hero & Home Sections
  'Global Delivery Available — Worldwide Starlink Kit Shipping':
    'ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ပေးခြင်း — Starlink Kit Global Delivery',
  'Fast, Reliable Satellite Internet in Bangladesh':
    'မြန်မာ၊ ဘင်္ဂလားဒေ့ရှ်နှင့် နိုင်ငံတကာအတွက် မြန်နှုန်းမြင့် Starlink ဂြိုဟ်တု အင်တာနက်',
  'Global Delivery Available — Order Starlink Standard Kit 4X (৳41,500), Starlink Mini Kit (৳21,500), or Starlink Rental Kit (৳3,000 One-Time Charge) with technical support. Monthly Starlink subscription fees are separate.':
    'ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ပေးခြင်း — Starlink Standard Kit 4X (৳41,500)၊ Starlink Mini Kit (৳21,500) နှင့် Starlink Rental Kit (৳3,000 တစ်ကြိမ်ကြေး) ကို နည်းပညာပံ့ပိုးမှုဖြင့် မှာယူနိုင်ပါပြီ။ လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်။',
  'View Service Plans': 'ဝန်ဆောင်မှု အစီအစဉ်များ ကြည့်ရန်',
  'View Packages': 'ပက်ကေ့ချ်များ ကြည့်ရန်',
  'Chat Directly on WhatsApp': 'WhatsApp မှတဆင့် တိုက်ရိုက် ဆက်သွယ်ပါ',
  'WhatsApp Helpline': 'WhatsApp အကူအညီလိုင်း',
  'High-Speed Satellite Plans For Everyone': 'လူတိုင်းအတွက် မြန်နှုန်းမြင့် ဂြိုဟ်တု အင်တာနက် အစီအစဉ်များ',
  'Experience seamless broadband anywhere in Bangladesh with zero cellular towers or phone lines required.':
    'ဖုန်းတာဝါတိုင်နှင့် ဖိုက်ဘာကြိုး မလိုအပ်ဘဲ နေရာမရွေး မြန်နှုန်းမြင့် အင်တာနက်ကို အသုံးပြုနိုင်ပါသည်။',
  'Select This Plan': 'ဤအစီအစဉ်ကို ရွေးချယ်ပါ',
  'Select This Plan & Order': 'ဤအစီအစဉ်ကို ရွေးချယ်ပြီး မှာယူပါ',
  'Popular': 'လူကြိုက်များ',
  'POPULAR': 'လူကြိုက်များ',
  'Best Value': 'အတန်ဆုံး',
  'Portable': 'သယ်ဆောင်ရလွယ်ကူ',
  'Enterprise': 'လုပ်ငန်းသုံး',
  'Unlimited': 'အကန့်အသတ်မဲ့',
  'Residential Lite': 'အိမ်သုံး Lite (Residential Lite)',
  'Residential Unlimited': 'အိမ်သုံး အကန့်အသတ်မဲ့ (Residential Unlimited)',
  'Roam 50GB': 'ခရီးသွား Roam 50GB',
  'Roam Unlimited': 'ခရီးသွား Roam အကန့်အသတ်မဲ့',
  'Business Priority': 'စီးပွားရေး ဦးစားပေး (Business Priority)',
  '/mo': '/လ',
  '/month (Official Price)': '/လ (တရားဝင် စျေးနှုန်း)',
  'Up to 200 Mbps': '200 Mbps အထိ',
  'Up to 400+ Mbps': '400+ Mbps အထိ',
  'Up to 450+ Mbps SLA': '450+ Mbps SLA အထိ',
  'Up to 200 Mbps. Ideal for everyday home streaming, work, and browsing.':
    '200 Mbps အထိ မြန်နှုန်းဖြင့် နေ့စဉ် အိမ်သုံး၊ အလုပ်နှင့် ဗီဒီယိုကြည့်ရှုရန် သင့်လျော်သည်။',
  'Up to 400+ Mbps. Top tier performance for heavy 4K streaming and multi-users.':
    '400+ Mbps အထိ မြန်နှုန်းမြင့် 4K ဗီဒီယိုနှင့် မိသားစု အများအပြား သုံးစွဲရန် အကောင်းဆုံးဖြစ်သည်။',
  'Portable high-speed data for occasional travelers, campers, and remote fieldwork.':
    'ခရီးသွားများ၊ စခန်းချသူများနှင့် ဝေးလံခေါင်သီသော နေရာများအတွက် သယ်ဆောင်ရလွယ်ကူသော ဒေတာအစီအစဉ်။',
  'High-priority satellite data, static IP, and 24/7 SLA support for enterprises.':
    'ကုမ္ပဏီကြီးများ၊ ဟိုတယ်များနှင့် လုပ်ငန်းများအတွက် ဦးစားပေး ဂြိုဟ်တုဒေတာနှင့် ၂၄/၇ SLA ဝန်ဆောင်မှု။',

  // Rental Kit 3,000 One-Time Charge Strings
  'Starlink Hardware Rental Plan': 'Starlink စက်ငှားရမ်းခြင်း အစီအစဉ်',
  'Starlink Rental Kit — ৳3,000 (One-Time Charge) · Monthly Starlink subscription fees are separate':
    'Starlink ငှားရမ်းစက် — ৳3,000 (တစ်ကြိမ်ကြေး) · လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်',
  'Starlink Rental Kit · ৳3,000 One-Time Charge (Bangla QR Only)':
    'Starlink ငှားရမ်းစက် · ৳3,000 တစ်ကြိမ်ကြေး (Bangla QR သီးသန့်)',
  'One-Time Charge': 'တစ်ကြိမ်သာ ပေးဆောင်ရသောကြေး',
  'Monthly Subscription Fee': 'လစဉ် အင်တာနက် ဝန်ဆောင်ခ',
  'View Rental Details': 'ငှားရမ်းခြင်း အသေးစိတ် ကြည့်ရန်',
  'Book Rental Kit': 'ငှားရမ်းရန် စာရင်းသွင်းပါ',

  // Why DSLink & Setup
  'Why Choose DSLink & Starlink?': 'အဘယ်ကြောင့် DSLink နှင့် Starlink ကို ရွေးချယ်သင့်သနည်း?',
  'Uninterrupted high-speed connectivity even in remote areas and severe weather conditions.':
    'ဝေးလံခေါင်သီသော နေရာများနှင့် ရာသီဥတု ဆိုးရွားချိန်များတွင်ပင် ပြတ်တောက်မှုမရှိသော အင်တာနက်။',
  'High-Speed Rural & Remote Connectivity': 'ကျေးလက်နှင့် ဝေးလံသော ဒေသများအတွက် မြန်နှုန်းမြင့် အင်တာနက်',
  'Starlink delivers high-speed connectivity to rural and remote locations where cellular networks cannot reach.':
    'မိုဘိုင်းကွန်ရက် မရောက်ရှိနိုင်သော ဒေသများသို့ မြန်နှုန်းမြင့် ဂြိုဟ်တုအင်တာနက်ကို ပေးစွမ်းသည်။',
  'Portable Anywhere You Travel': 'ခရီးသွားလေရာ နေရာတိုင်းတွင် အသုံးပြုနိုင်သည်',
  'Compact Starlink Mini backpack kit is perfect for travel, camping, boating, and fieldwork.':
    'ကျစ်လျစ်သော Starlink Mini Kit သည် ခရီးသွားခြင်းနှင့် ပြင်ပလုပ်ငန်းများအတွက် အထူးသင့်လျော်သည်။',
  'Ultra-Low Latency & 4K Streaming': 'Latency အနည်းဆုံးနှင့် 4K ဗီဒီယို ကြည့်ရှုနိုင်ခြင်း',
  'Seamless 4K streaming, online multiplayer gaming, and remote work across multiple devices simultaneously.':
    'စက်အများအပြားဖြင့် 4K ဗီဒီယိုကြည့်ခြင်း၊ ဂိမ်းကစားခြင်းနှင့် အဝေးမှ အလုပ်လုပ်ခြင်းတို့ကို ချောမွေ့စွာ လုပ်ဆောင်နိုင်သည်။',
  'Simple Self Setup': 'ကိုယ်တိုင် အလွယ်တကူ တပ်ဆင်နိုင်ခြင်း',
  'Plug in. Point at sky. Get online in minutes.': 'ပလပ်ထိုးပါ။ ကောင်းကင်သို့ ချိန်ပါ။ မိနစ်ပိုင်းအတွင်း အင်တာနက် ရရှိပါပြီ။',
  'Automated motorized satellite alignment': 'အလိုအလျောက် ဂြိုဟ်တု ချိန်ညှိစနစ်',
  'High-speed Wi-Fi 6 router connection in 5 minutes': '၅ မိနစ်အတွင်း မြန်နှုန်းမြင့် Wi-Fi 6 ချိတ်ဆက်မှု',
  'Official 1-Year DSLink Bangladesh Local Warranty & Support': 'DSLink ၏ ၁ နှစ် တရားဝင် အာမခံနှင့် ပြည်တွင်း နည်းပညာပံ့ပိုးမှု',
  'Nationwide 64 Districts • Free Home Delivery': 'တစ်နိုင်ငံလုံး အခမဲ့ အိမ်အရောက် ပို့ဆောင်ပေးခြင်း',
  'Get 100% Genuine Starlink from DEVSPARK LINK': 'DEVSPARK LINK မှ ၁၀၀% စစ်မှန်သော Starlink ကို ရယူပါ',
  '100% Genuine Unlocked Kits': '၁၀၀% စစ်မှန်သော Unlocked စက်ပစ္စည်းများ',
  'Free Delivery & On-Site Setup': 'အခမဲ့ ပို့ဆောင်ပေးခြင်းနှင့် တပ်ဆင်ပေးခြင်း',
  '24/7 Dedicated Local Helpdesk': '၂၄/၇ ပြည်တွင်း နည်းပညာ အကူအညီဌာန',
  'Popular Coverage Regions:': 'ဝန်ဆောင်မှုပေးနေသော အဓိက ဒေသများ-',
  'Customer Reviews & Trust': 'ဖောက်သည်များ၏ ယုံကြည်မှုနှင့် သုံးသပ်ချက်များ',
  'What Our Customers Say': 'ဖောက်သည်များ၏ သုံးသပ်ချက်များ',
  'Get Your Starlink Connection Today': 'ယနေ့ပင် Starlink အင်တာနက် ချိတ်ဆက်လိုက်ပါ',
  'Connect with the most reliable high-speed satellite broadband network in Bangladesh.':
    'ယုံကြည်စိတ်ချရဆုံး မြန်နှုန်းမြင့် ဂြိုဟ်တုအင်တာနက် ကွန်ရက်နှင့် ချိတ်ဆက်ပါ။',

  // Packages, Comparison, Shop
  'Authorized Starlink Service Plans in Bangladesh': 'တရားဝင် Starlink ဝန်ဆောင်မှု အစီအစဉ်များ',
  'Starlink Monthly Service Plans': 'Starlink လစဉ် ဝန်ဆောင်မှု အစီအစဉ်များ',
  'Browse Hardware Kits': 'စက်ပစ္စည်းများ ကြည့်ရှုရန်',
  'Product Comparison': 'စက်ပစ္စည်း နှိုင်းယှဉ်ချက်',
  'Starlink Standard vs. Mini': 'Starlink Standard နှင့် Mini နှိုင်းယှဉ်ချက်',
  'Compare key specifications to find the perfect Starlink hardware for your needs.':
    'သင့်လိုအပ်ချက်နှင့် အကိုက်ညီဆုံး စက်ပစ္စည်းကို ရွေးချယ်နိုင်ရန် အချက်အလက်များကို နှိုင်းယှဉ်ကြည့်ပါ။',
  'Feature / Specification': 'အင်္ဂါရပ် / သတ်မှတ်ချက်',
  'Ideal Use Case': 'အသုံးပြုရန် အသင့်လျော်ဆုံး နေရာ',
  'Homes, Resorts, Offices & Fixed Setup': 'နေအိမ်၊ အပန်းဖြေစခန်း၊ ရုံးနှင့် အတည်တကျ တပ်ဆင်ရန်',
  'Travel, Camping & Portable Internet': 'ခရီးသွားခြင်းနှင့် သယ်ဆောင်အသုံးပြုရန်',
  'Max Throughput / Speed': 'အမြင့်ဆုံး မြန်နှုန်း',
  '400+ Mbps (High Throughput)': '400+ Mbps (မြန်နှုန်းမြင့်)',
  '220+ Mbps (Ultra Portable)': '220+ Mbps (သယ်ဆောင်ရလွယ်ကူ)',
  'Portability & Weight': 'အရွယ်အစားနှင့် အလေးချိန်',
  'Medium size with motorized mount': 'အလယ်အလတ် အရွယ်အစား (တပ်ဆင်ခုံပါဝင်သည်)',
  'Ultra-lightweight & backpack friendly (1.1 kg)': 'အလွန်ပေါ့ပါးပြီး ကျောပိုးအိတ်ဖြင့် သယ်နိုင်သည် (1.1 kg)',
  'Power Consumption': 'လျှပ်စစ်ဓာတ်အား သုံးစွဲမှု',
  'Standard AC Power Supply': 'ပုံမှန် AC ပါဝါစနစ်',
  'USB-C & DC Power compatible': 'USB-C နှင့် DC ပါဝါ အသုံးပြုနိုင်သည်',
  'Wi-Fi Coverage': 'Wi-Fi လွှမ်းခြုံနိုင်မှု',
  'Wi-Fi 6 (Best for larger coverage)': 'Wi-Fi 6 (နေရာကျယ်ဝန်းစွာ လွှမ်းခြုံနိုင်သည်)',
  'Built-in Wi-Fi (Compact spaces)': 'Built-in Wi-Fi (နေရာငယ်များအတွက်)',
  'Official Hardware Price': 'တရားဝင် စက်ပစ္စည်း စျေးနှုန်း',
  '৳41,500 (Purchase)': '৳41,500 (အပြီးအပိုင် ဝယ်ယူရန်)',
  '৳21,500 (Purchase)': '৳21,500 (အပြီးအပိုင် ဝယ်ယူရန်)',
  'View All Kits': 'စက်ပစ္စည်းအားလုံး ကြည့်ရန်',
  'Starlink Hardware Shop Bangladesh': 'Starlink စက်ပစ္စည်း အရောင်းဆိုင်',
  'In Stock': 'ပစ္စည်း အသင့်ရှိသည်',
  'Verified Reviews': 'စိစစ်ပြီး သုံးသပ်ချက်များ',
  'Details & Specs': 'အသေးစိတ်နှင့် အချက်အလက်',
  'Need Professional Installation Support?': 'ကျွမ်းကျင် တပ်ဆင်မှု ဝန်ဆောင်မှု လိုအပ်ပါသလား?',
  'Request Installation': 'တပ်ဆင်ပေးရန် တောင်းဆိုပါ',

  // Newsletter, FAQ, Checkout, Tracking
  'Newsletter Alerts': 'သတင်းလွှာ အသိပေးချက်',
  'Get Notified About Hardware Drops & Price Updates': 'စက်ပစ္စည်း အသစ်နှင့် စျေးနှုန်း အပြောင်းအလဲများကို သိရှိပါ',
  'Subscribe with your email to receive exclusive discount coupons and stock alert notifications.':
    'အထူးလျှော့စျေး ကူပွန်များနှင့် ပစ္စည်းလက်ကျန် သတင်းများ ရယူရန် အီးမေးလ်ဖြင့် စာရင်းသွင်းပါ။',
  'Enter your email...': 'သင့်အီးမေးလ်ကို ရိုက်ထည့်ပါ...',
  'Subscribe': 'စာရင်းသွင်းရန်',
  'Subscribing...': 'လုပ်ဆောင်နေသည်...',
  'Successfully subscribed to newsletter!': 'သတင်းလွှာ စာရင်းသွင်းခြင်း အောင်မြင်ပါသည်။',
  'Still have questions?': 'မေးမြန်းလိုသည်များ ရှိပါသေးသလား?',
  'Our dedicated team is ready 24/7 to help you choose the best Starlink solution.':
    'အကောင်းဆုံး Starlink ဝန်ဆောင်မှု ရွေးချယ်နိုင်ရန် ကျွန်ုပ်တို့အဖွဲ့မှ ၂၄/၇ ကူညီပေးရန် အသင့်ရှိပါသည်။',
  'View Shop': 'ဆိုင်သို့ ဝင်ရောက်ကြည့်ရှုရန်',
  'Search for questions, kits, delivery...': 'မေးခွန်းများ၊ စက်ပစ္စည်းများ ရှာဖွေပါ...',
  'Starlink Checkout': 'Starlink မှာယူခြင်း',
  '1. Select Items': '၁။ ပစ္စည်း ရွေးချယ်ရန်',
  '2. Customer Details': '၂။ ဝယ်ယူသူ အချက်အလက်',
  '3. Review & Order': '၃။ စစ်ဆေးပြီး မှာယူရန်',
  'Selected Starlink Kit': 'ရွေးချယ်ထားသော Starlink Kit',
  'In Stock • Ready to Ship': 'ပစ္စည်းရှိသည် • ပို့ဆောင်ရန် အသင့်ဖြစ်သည်',
  'Quantity:': 'အရေအတွက်-',
  'Full Name *': 'အမည် အပြည့်အစုံ *',
  'Mobile Number *': 'ဖုန်းနံပါတ် *',
  'Email Address (For Invoice & Tracking)': 'အီးမေးလ်လိပ်စာ (ပြေစာနှင့် ခြေရာခံရန်)',
  'Complete Delivery Address *': 'ပို့ဆောင်ရမည့် လိပ်စာ အပြည့်အစုံ *',
  'District *': 'မြို့နယ် / ခရိုင် *',
  'Confirm Order': 'မှာယူမှု အတည်ပြုရန်',
  'Placing Order...': 'မှာယူမှု ပေးပို့နေသည်...',
  'Order Summary': 'မှာယူမှု အကျဉ်းချုပ်',
  'Total Payable:': 'စုစုပေါင်း ပေးချေရမည့်ငွေ-',
  'Total Payable Amount:': 'စုစုပေါင်း ပေးချေရမည့် ပမာဏ-',
  'Cash on Delivery': 'ပစ္စည်းရောက်မှ ငွေချေစနစ် (COD)',
  'Cash on Delivery (COD)': 'ပစ္စည်းရောက်မှ ငွေချေစနစ် (COD)',
  'Track Your Shipment': 'သင့်ပစ္စည်း ပို့ဆောင်မှုကို ခြေရာခံပါ',
  'Order Tracking Portal': 'မှာယူမှု ခြေရာခံ စနစ်',
  'Active': 'အသုံးပြုနေဆဲ',
  'Completed': 'ပြီးစီးပြီး',
  'WhatsApp Help': 'WhatsApp အကူအညီ',
  'Article Not Found': 'ဆောင်းပါး ရှာမတွေ့ပါ',
  'Share Article': 'ဆောင်းပါး မျှဝေရန်',
  'Link Copied!': 'လင့်ခ် ကူးယူပြီးပါပြီ!',
  'Rent a Starlink Kit': 'Starlink စက်ပစ္စည်း ငှားရမ်းရန်',
  'Check Availability': 'ရရှိနိုင်မှု စစ်ဆေးရန်',
};

// Lowercase normalized map for resilient lookup
const NORMALIZED_MY_DICT: Record<string, string> = {};
for (const [key, value] of Object.entries(MYANMAR_EXACT_DICT)) {
  NORMALIZED_MY_DICT[key.trim().toLowerCase()] = value;
}

/**
 * Translates an English/Bengali UI string into Burmese (မြန်မာဘာသာ) for Myanmar IP / Users.
 */
export function translateToMyanmar(enText?: string, _bnText?: string): string {
  if (!enText) return '';
  const trimmed = enText.trim();
  if (MYANMAR_EXACT_DICT[trimmed]) {
    return MYANMAR_EXACT_DICT[trimmed];
  }
  const lower = trimmed.toLowerCase();
  if (NORMALIZED_MY_DICT[lower]) {
    return NORMALIZED_MY_DICT[lower];
  }

  // Handle common recurring patterns dynamically
  if (lower.includes('starlink standard 4x')) {
    return trimmed
      .replace(/Starlink Standard 4X Kit Price in BD/i, 'Starlink Standard 4X Kit စျေးနှုန်း')
      .replace(/Starlink Standard 4X Kit/i, 'Starlink Standard 4X စက်ပစ္စည်း');
  }
  if (lower.includes('starlink mini')) {
    return trimmed.replace(/Starlink Mini Portable Satellite Kit/i, 'Starlink Mini သယ်ဆောင်ရလွယ်ကူသော စက်ပစ္စည်း');
  }

  // Clean fallback to clear English when no static translation is matched
  return enText;
}
