export const WHATSAPP_CONFIG = {
  number: '+8801326370218',
  cleanNumber: '8801326370218',
  displayNumber: '+880 1326-370218',
  helpline: '09638010101',
  helplineDisplay: '09638-010101',
  extraLink: 'https://wa.me/8801862109990',
  extraDisplayNumber: '+880 1862-109990',
  email: 'sales@devsparksoft.com.bd',
  defaultMessages: {
    general: 'Assalamu Alaikum DEVSPARK LINK, I want to know about Starlink Kits and ordering in Bangladesh.',
    generalBn: 'আসসালামু আলাইকুম, DEVSPARK LINK, আমি স্টারলিংক কিট ও অর্ডার সংক্রান্ত বিষয়ে তথ্য জানতে চাই।',
    order: 'আসসালামু আলাইকুম, আমি স্টারলিংক কিট অর্ডার করতে চাই।',
    support: 'আসসালামু আলাইকুম, আমার স্টারলিংক সংযোগ ও টেকনিক্যাল সহায়তা প্রয়োজন।'
  },
  supportLines: [
    {
      id: 'line1',
      name: 'Sales & Order Desk',
      nameBn: 'সেলস ও অর্ডার হেল্পলাইন (Line 1)',
      number: '+8801326370218',
      cleanNumber: '8801326370218',
      displayNumber: '+880 1326-370218',
      label: 'Sales & New Orders'
    },
    {
      id: 'line2',
      name: 'Billing & Technical Support',
      nameBn: 'পেমেন্ট ও টেকনিক্যাল সাপোর্ট (Line 2)',
      number: '+8801862109990',
      cleanNumber: '8801862109990',
      displayNumber: '+880 1862-109990',
      label: 'Payment & Technical Support'
    }
  ]
};

export const getWhatsAppUrl = (
  message: string = WHATSAPP_CONFIG.defaultMessages.generalBn,
  number: string = WHATSAPP_CONFIG.cleanNumber
) => {
  const clean = number.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encodedMessage}`;
};
