const fs = require('fs');

async function generateFeed() {
  const siteUrl = "https://kataeb.org";
  const timestamp = new Date().getTime();
  const url = `${siteUrl}/?live_github=${timestamp}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await response.text();
    
    let rss = '<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>مباشر - الكتائب اللبنانية</title><link>' + siteUrl + '</link><description>شريط النصوص والأخبار العاجلة المباشرة والمضمونة</description>';
    
    // التقطيع النصي بناءً على كلاس الأنجولار الأصلي
    const parts = html.split(/class=["\'][^"\']*ng-tns-c48-0[^"\']*["\']/i);
    let count = 0;
    let usedTexts = {};
    
    for (let i = 1; i < parts.length && count < 25; i++) {
      const closingIdx = parts[i].indexOf('</');
      if (closingIdx !== -1) {
        const elementHtml = parts[i].substring(0, closingIdx);
        const textSnippet = elementHtml.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
        
        if (textSnippet.length > 12 && !textSnippet.includes("{") && !usedTexts[textSnippet]) {
          usedTexts[textSnippet] = true;
          count++;
          
          const title = textSnippet.substring(0, 70) + (textSnippet.length > 70 ? "..." : "");
          const fakeLink = `${siteUrl}/#news-ticker-${count}-${timestamp}`;
          const uniqueId = `kataeb-github-${count}-${timestamp}`;
          
          rss += '<item><title><![CDATA[' + title + ']]></title><description><![CDATA[' + textSnippet + ']]></description><link>' + fakeLink + '</link><guid isPermaLink="false">' + uniqueId + '</guid></item>';
        }
      }
    }
    
    if (count === 0) {
      rss += '<item><title><![CDATA[متابعة شريط الأخبار والتغطيات المباشرة عبر موقع الكتائب]]></title><description><![CDATA[تغطية مستمرة للأخبار.]]></description><link>' + siteUrl + '</link><guid>fallback-' + timestamp + '</guid></item>';
    }
    
    rss += '</channel></rss>';
    fs.writeFileSync('kataeb.xml', rss, 'utf-8');
    console.log("Done!");
  } catch (e) {
    console.error("Error: " + e.toString());
  }
}
generateFeed();
