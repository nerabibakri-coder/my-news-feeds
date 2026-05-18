const fs = require('fs');

async function generateFeed() {
  const siteUrl = "https://kataeb.org";
  const timestamp = new Date().getTime();
  const url = `${siteUrl}/?live_github=${timestamp}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9'
      }
    });
    const html = await response.text();
    
    let rss = '<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>مباشر - الكتائب اللبنانية</title><link>' + siteUrl + '</link><description>شريط النصوص والأخبار العاجلة المباشرة والمضمونة</description>';
    
    // الحل السحري ضد التقلب: ريجكس ذكي يبحث عن الكلاس الذي يبدأ بـ ng-tns-c مهما تغيرت أرقامه اللاحقة
    const parts = html.split(/class=["\'][^"\']*ng-tns-c[^"\']*["\']/i);
    
    let usedTexts = {};
    let count = 0;
    
    for (let i = 1; i < parts.length && count < 25; i++) {
      const closingIdx = parts[i].indexOf('</');
      if (closingIdx !== -1) {
        const elementHtml = parts[i].substring(0, closingIdx);
        const textSnippet = elementHtml.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
        
        // تصفية إضافية صارمة للتأكد من جلب نصوص الشريط الإخباري العاجل فقط وتجنب الروابط الجانبية
        if (textSnippet.length > 15 && 
            !textSnippet.includes("{") && 
            !textSnippet.includes("اتصل") && 
            !textSnippet.includes("حقوق") && 
            !usedTexts[textSnippet]) {
          
          usedTexts[textSnippet] = true;
          count++;
          
          const title = textSnippet.substring(0, 70) + (textSnippet.length > 70 ? "..." : "");
          const fakeLink = `${siteUrl}/#news-ticker-${count}-${timestamp}`;
          const uniqueId = `kataeb-github-ticker-${count}-${timestamp}`;
          
          rss += `<item><title><![CDATA[${title}]]></title><description><![CDATA[${textSnippet}]]></description><link>${fakeLink}</link><guid isPermaLink="false">${uniqueId}</guid></item>`;
        }
      }
    }
    
    if (count === 0) {
      rss += `<item><title><![CDATA[متابعة شريط الأخبار والتغطيات المباشرة عبر موقع الكتائب]]></title><description><![CDATA[تغطية مستمرة للأخبار المحلية والإقليمية على مدار الساعة فور حدوثها.]]></description><link>${siteUrl}</link><guid>fallback-${timestamp}</guid></item>`;
    }
    
    rss += '</channel></rss>';
    fs.writeFileSync('kataeb.xml', rss, 'utf-8');
    console.log(`تم تأمين وجلب ${count} أخبار عاجلة بنظام كسر التقلب الأوتوماتيكي!`);
  } catch (e) {
    console.error("Error: " + e.toString());
  }
}
generateFeed();
