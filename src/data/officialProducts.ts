import { Product, Package } from '../types';

export const officialStarlinkProducts: Product[] = [
  {
    id: 'starlink-rental-kit',
    name: 'Starlink Rental Kit (One-Time Charge)',
    price: 3000,
    description: 'Starlink Standard 4X বা Mini Rental Kit — এককালীন মাত্র ৩,০০০ টাকা চার্জ। কিটের মালিকানা ক্রেতার কাছে হস্তান্তর হয় না এবং মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
    features: [
      'এককালীন চার্জ মাত্র ৳৩,০০০ টাকা (One-Time Charge)',
      'Standard 4X অথবা Mini রেন্টাল কিট নির্বাচনের সুবিধা',
      'মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য',
      'bKash, Nagad, Rocket বা ব্যাংক Bangla QR পেমেন্ট সাপোর্টেড',
      '২৪/৭ DSLink টেকনিক্যাল সাপোর্ট'
    ],
    specifications: {
      'Charge Type': 'One-Time Charge (৳3,000 BDT)',
      'Ownership': 'Rental Only (Ownership Not Transferred)',
      'Monthly Subscription': 'Billed Separately (Residential / Lite)',
      'Supported Payment': 'Bangla QR (bKash, Nagad, Rocket, Any Bank)'
    },
    images: [
      '/assets/aistudio/image_04b54f7a.png'
    ],
    stock: 50,
    active: true
  },
  {
    id: 'starlink-standard-4x',
    name: 'Starlink Standard Kit 4X (Purchase)',
    price: 41500,
    description: 'বাসা, অফিস এবং কর্পোরেট ব্যবহারের জন্য সর্বাধুনিক স্টারলিংক স্ট্যান্ডার্ড ৪X (Gen 3) স্যাটেলাইট কিট। বাংলাদেশসহ বিশ্বব্যাপী ডেলিভারি ও প্রযোজ্য এলাকায় COD সুবিধা। মাসিক সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
    features: [
      '১৫০ - ৩৫০+ Mbps হাই-স্পিড আনলিমিটেড ডাউনলোড',
      'Gen 3 ট্রাই-ব্যান্ড Wi-Fi 6 রাউটার (২টি গিগাবিট ল্যান পোর্টসহ)',
      'IP67 ওয়াটার ও ডাস্ট রেজিস্ট্যান্ট অ্যানটেনা ডিশ',
      'Global Delivery Available — বিশ্বব্যাপী কিট ডেলিভারি সুবিধা',
      'প্রযোজ্য এলাকায় (বাংলাদেশের ৬৪ জেলায়) ক্যাশ অন ডেলিভারি (COD) সুবিধা'
    ],
    specifications: {
      'Antenna Type': 'Electronic Phased Array (Gen 3 Standard 4X)',
      'Field of View': '110° Wide Angle Coverage',
      'Wi-Fi Technology': '802.11a/b/g/n/ac/ax (Wi-Fi 6 Tri-Band)',
      'Ethernet Ports': '2x Latching Gigabit Ethernet LAN Ports',
      'Environmental Rating': 'IP67 Type 4 Waterproof & Monsoon Ready',
      'Power Consumption': '75 - 100W Average',
      'Cable Length': '15m (50 ft) Shielded Starlink Cable Included'
    },
    images: [
      '/assets/aistudio/image_04b54f7a.png',
      '/assets/aistudio/image_141981d5.png'
    ],
    stock: 35,
    active: true
  },
  {
    id: 'starlink-mini-kit',
    name: 'Starlink Mini Kit (Purchase)',
    price: 21500,
    description: 'সহজে ব্যাকপ্যাকে বহনযোগ্য আল্ট্রা-পোর্টেবল স্টারলিংক মিনি কিট। ডিশের ভেতরেই বিল্ট-ইন ওয়াই-ফাই রাউটার এবং মাত্র ২৫ ওয়াট পাওয়ার কনজাম্পশন। বাংলাদেশসহ বিশ্বব্যাপী ডেলিভারি ও প্রযোজ্য এলাকায় COD সুবিধা। মাসিক সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
    features: [
      '১০০ - ২০০+ Mbps পোর্টেবল স্যাটেলাইট ইন্টারনেট',
      'ডিশের ভেতরেই বিল্ট-ইন Wi-Fi রাউটার (আলাদা রাউটার লাগে না)',
      '১০০W USB-C PD পাওয়ার ব্যাংক বা সোলার দিয়েও চলে',
      'Global Delivery Available — বিশ্বব্যাপী কিট ডেলিভারি সুবিধা',
      'প্রযোজ্য এলাকায় (বাংলাদেশের ৬৪ জেলায়) ক্যাশ অন ডেলিভারি (COD) সুবিধা'
    ],
    specifications: {
      'Antenna Type': 'Compact Electronic Phased Array with Integrated Wi-Fi',
      'Weight': '1.10 kg (2.43 lbs) with Kickstand',
      'Dimensions': '298.5 x 259 x 38.5 mm',
      'Power Input': '12-48V DC (25-40W avg) / 100W USB-C PD Supported',
      'Environmental Rating': 'IP67 Waterproof',
      'Coverage': 'Up to 128 m² (1,400 sq ft)'
    },
    images: [
      '/assets/aistudio/image_15947ec0.png',
      '/assets/aistudio/image_2166da21.png'
    ],
    stock: 25,
    active: true
  },
  {
    id: 'starlink-flat-high-performance',
    name: 'Starlink Flat High Performance Enterprise Kit',
    price: 145000,
    description: 'কর্পোরেট প্রতিষ্ঠান, আইএসপি ব্যাকহল, জাহাজ ও চলমান যানবাহনে ব্যবহারের জন্য হেভি-ডিউটি ফ্ল্যাট হাই-পারফরম্যান্স স্টারলিংক কিট। প্রতিকূল আবহাওয়ায় সর্বোচ্চ থ্রুপুট ও ডেডিকেটেড পাবলিক আইপি সাপোর্ট।',
    features: [
      '২৫০ - ৪০০+ Mbps এন্টারপ্রাইজ গ্রেড থ্রুপুট',
      '১৪০ ডিগ্রি ওয়াইড ফিল্ড অব ভিউ ও জিপিএস ট্র্যাকিং',
      'ইন-মোশন (জাহাজ ও গাড়ি) এবং আইএসপি কোর নেটওয়ার্কের উপযোগী',
      'ওয়েজ মাউন্ট ও ডেডিকেটেড পাওয়ার সাপ্লাই ইউনিট অন্তর্ভুক্ত',
      '২৪/৭ কর্পোরেট প্রাওরিটি ইঞ্জিনিয়ারিং সাপোর্ট'
    ],
    specifications: {
      'Antenna Type': 'High-Performance Electronic Phased Array',
      'Field of View': '140° Wide Horizon Lock',
      'Environmental Rating': 'IP56 Weatherproof Industrial Grade',
      'Wind Rating': 'Survivable: 280 kph+ (174 mph+)',
      'Power Consumption': '110 - 150W Average',
      'Mount Included': 'Heavy-Duty Wedge Mount Kit'
    },
    images: [
      '/assets/aistudio/image_257a9e66.png'
    ],
    stock: 8,
    active: true
  },
  {
    id: 'starlink-roof-mount-bundle',
    name: 'Starlink Heavy-Duty Rooftop Pivot Mount & 45m Cable Bundle',
    price: 12500,
    description: 'বহুতল ভবনের ছাদ বা কংক্রিট পিলারে স্টারলিংক ডিশ ঝড়-বৃষ্টি থেকে নিরাপদে স্থাপনের জন্য অরিজিনাল পিভট মাউন্ট এবং ৪৫ মিটার (১৫০ ফুট) এক্সটেন্ডেড শিল্ডেড কেবল বান্ডেল।',
    features: [
      'হেভি-ডিউটি গ্যালভানাইজড স্টিল রুফটপ মাউন্ট',
      '৪৫ মিটার (১৫০ ফুট) অরিজিনাল ওয়েদারপ্রুফ ক্যাট-৬এ শিল্ডেড কেবল',
      'ঝড় ও প্রবল বাতাসে ডিশের অ্যালাইনমেন্ট অটুট রাখে',
      'স্ট্যান্ডার্ড ৪X এবং মিনি উভয় কিটের সাথে সামঞ্জস্যপূর্ণ'
    ],
    specifications: {
      'Material': 'Powder-Coated Galvanized Steel & Aluminum',
      'Cable Length': '45m (150 ft) Outdoor Shielded RJ45',
      'Compatibility': 'Starlink Standard Gen 3 / 4X & Mini'
    },
    images: [
      '/assets/aistudio/image_26b5930f.png'
    ],
    stock: 40,
    active: true
  }
];

export const officialStarlinkPackages: Package[] = [
  {
    id: 'residential-standard',
    name: 'Residential Standard Plan (বাসা ও অফিস)',
    price: 4200,
    dataAllowance: 'আনলিমিটেড হাই-স্পিড ডেটা',
    description: 'বাসাবাড়ি ও ছোট অফিসের জন্য আনলিমিটেড হাই-স্পিড স্যাটেলাইট ব্রডব্যান্ড প্ল্যান।',
    features: [
      '১৫০ - ২৫০+ Mbps ডাউনলোড স্পিড',
      '২০ - ৩৫ ms লো-ল্যাটেন্সি গেমিং ও জুম কল',
      'কোনো ফেয়ার ইউসেজ লিমিট (FUP) নেই — সম্পূর্ণ আনলিমিটেড',
      'স্থানীয় ইনভয়েস ও ২৪/৭ টেকনিক্যাল সাপোর্ট সুবিধা'
    ],
    terms: 'মাসিক বিলিং। যেকোনো সময় পজ বা রিজিউম করা যায়।',
    active: true
  },
  {
    id: 'roam-unlimited',
    name: 'Roam Regional Plan (ভ্রমণ ও ফিল্ড প্রজেক্ট)',
    price: 6000,
    dataAllowance: 'আনলিমিটেড পোর্টেবল ডেটা (সারাদেশে)',
    description: 'স্টারলিংক মিনি বা স্ট্যান্ডার্ড কিট নিয়ে বাংলাদেশের যেকোনো প্রান্তে ভ্রমণ ও আউটডোর কাজের জন্য।',
    features: [
      'বাংলাদেশের ৬৪ জেলায় যেকোনো স্থানে তাৎক্ষণিক কানেক্টিভিটি',
      '১০০ - ২২০ Mbps পোর্টেবল ডাউনলোড স্পিড',
      'ইন-মোশন (গাড়ি ও নৌযানে) ব্যবহারের সুবিধা',
      'ব্যবহার না করলে যেকোনো মাসে বিলিং পজ করার সুবিধা'
    ],
    terms: 'পোর্টেবল রোমিং সার্ভিস। তাৎক্ষণিক সেলফ-অ্যাক্টিভেশন।',
    active: true
  },
  {
    id: 'business-priority-1tb',
    name: 'Business Priority Plan (কর্পোরেট ও আইএসপি)',
    price: 12500,
    dataAllowance: '১ টিবি প্রাওরিটি + আনলিমিটেড স্ট্যান্ডার্ড',
    description: 'ব্যাংক, হাসপাতাল, আইএসপি, ফ্যাক্টরি ও বড় প্রতিষ্ঠানের জন্য রাউন্ড-দ্য-ক্লক প্রাওরিটি ব্যান্ডউইথ ও পাবলিক আইপি।',
    features: [
      '২২০ - ৩৫০+ Mbps ডেডিকেটেড প্রাওরিটি স্পিড',
      'পাবলিক রাউটেবল IPv4 / IPv6 অ্যাড্রেস সুবিধা',
      'নেটওয়ার্ক পিক আওয়ারে সর্বোচ্চ প্রাওরিটি ট্রাফিক',
      '২৪/৭ ডেডিকেটেড এন্টারপ্রাইজ সাপোর্ট ও SLA গ্যারান্টি'
    ],
    terms: 'কর্পোরেট ভ্যাট ইনভয়েস ও ব্যাংক ওয়্যার ট্রান্সফার সাপোর্টেড।',
    active: true
  }
];
