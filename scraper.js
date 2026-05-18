const fs = require('fs');

async function generateFeed() {
  const siteUrl = "https://kataeb.org";
  const timestamp = new Date().getTime();
  
  // قراءة التغذية البرمجية الشاملة والمباشرة لكل ما ينشر في موقع الكتائب
  const officialFeedUrl = `https://kataeb.org/feed/?nocache=${timestamp}`;
  
  try {
    const response = await fetch(officialFeedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const xmlText = await response.text();
    
    // تصحيح الخطأ: التحقق من المتغير السليم xmlText لضمان قراءة الخلاصة الشاملة
    if (xmlText && (xmlText.includes("<rss") || xmlText.includes("<channel>"))) {
      fs.writeFileSync('kataeb.xml', xmlText, 'utf-8');
      console.log("تم جلب وتحديث كل أخبار ومقالات الموقع بنجاح!");
      return;
    }
    
    rssFallback(siteUrl, timestamp);
    
  } catch (e) {
    rssFallback(siteUrl, timestamp);
  }
}

function rssFallback(siteUrl, timestamp) {
  let rss = '<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>مباشر - ... الكتائب اللبنانية</title><link>' + siteUrl + '</link><description>خلاصة إخبارية شاملة</description>';
  rss += `<item><title><![CDATA[متابعة آخر الأخبار والتغطيات الشاملة عبر موقع الكتائب]]></title><description><![CDATA[تغطية شاملة لكل ما ينشر على مدار الساعة.]]></description><link>${siteUrl}</link><guid>fallback-${timestamp}</guid></item>`;
  rss += '</channel></rss>';
  fs.writeFileSync('kataeb.xml', rss, 'utf-8');
  console.log("تم تشغيل خط الدفاع البديل السليم.");
}

generateFeed();
