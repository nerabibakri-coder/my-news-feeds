const fs = require('fs');

async function generateFeed() {
  const siteUrl = "https://kataeb.org";
  const timestamp = new Date().getTime();
  const url = `${siteUrl}/?live_github=${timestamp}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9'
      }
    });
    const html = await response.text();
    
    let rss = '<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>مباشر - الكتائب اللبنانية</title><link>' + siteUrl + '</link><description>شريط النصوص والأخبار العاجلة المباشرة والمضمونة</description>';
    
    let usedTexts = {};
    let count = 0;
    
    // ريجكس عبقري يلتقط كل النصوص العربية الإخبارية الطويلة الواقعة داخل أوسام العرض النصية للموقع مباشرة
    const tickerRegex = />([^<]{22,120})<\/a>/g; 
    let match;
    
    while ((match = tickerRegex.exec(html)) !== null && count < 25) {
      let textSnippet = match[1].replace(/\s+/g, " ").trim();
      
      // تصفية المحتوى لضمان استخراج متن الأخبار العاجلة الحية فقط والابتعاد عن الكلمات العامة
      if (textSnippet.length > 22 && 
          !textSnippet.includes("{") && 
          !textSnippet.includes("}") && 
          !textSnippet.includes("اتصل") && 
          !textSnippet.includes("شروط") && 
          !textSnippet.includes("خصوصية") && 
          !textSnippet.includes("حقوق") && 
          !textSnippet.includes("الرئيسية") && 
          !usedTexts[textSnippet]) {
        
        usedTexts[textSnippet] = true;
        count++;
        
        const title = textSnippet.substring(0, 70) + (textSnippet.length > 70 ? "..." : "");
        const fakeLink = `${siteUrl}/#news-ticker-${count}-${timestamp}`;
        const uniqueId = `kataeb-secure-text-${count}-${timestamp}`;
        
        rss += `<item><title><![CDATA[${title}]]></title><description><![CDATA[${textSnippet}]]></description><link>${fakeLink}</link><guid isPermaLink="false">${uniqueId}</guid></item>`;
      }
    }
    
    if (count === 0) {
      rss += `<item><title><![CDATA[متابعة شريط الأخبار والتغطيات المباشرة عبر موقع الكتائب]]></title><description><![CDATA[تغطية مستمرة للأخبار المحلية والإقليمية على مدار الساعة فور حدوثها.]]></description><link>${siteUrl}</link><guid>fallback-${timestamp}</guid></item>`;
    }
    
    rss += '</channel></rss>';
    fs.writeFileSync('kataeb.xml', rss, 'utf-8');
    console.log(`تم بنجاح قنص ${count} خبراً عاجلاً طازجاً!`);
  } catch (e) {
    console.error("Error: " + e.toString());
  }
}
generateFeed();
