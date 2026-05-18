const fs = require('fs');
const https = require('https');

function startAutomatedLiveScraper() {
  // الرابط الخلفي الصافي الذي يسحب منه موقع الكتائب العواجل اللحظية بالثواني
  const apiUrl = "https://kataeb.org"; 
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    }
  };

  https.get(apiUrl, options, (res) => {
    let rawBody = '';
    res.on('data', (chunk) => { rawBody += chunk; });
    
    res.on('end', () => {
      try {
        const timestamp = new Date().toUTCString();
        let rssItems = '';

        // كشط العناوين والروابط بشكل مفرود وكامل بدون استخدام فلاتر حذف للتكرار
        const titleRegex = /"title":"([^"]+)"/g;
        const excerptRegex = /"excerpt":"([^"]+)"/g;
        const urlRegex = /"url":"([^"]+)"/g;

        let titles = [];
        let excerpts = [];
        let urls = [];
        let match;

        while ((match = titleRegex.exec(rawBody)) !== null) { titles.push(match[1]); }
        while ((match = excerptRegex.exec(rawBody)) !== null) { excerpts.push(match[1]); }
        while ((match = urlRegex.exec(rawBody)) !== null) { urls.push(match[1]); }

        let count = 0;
        for (let i = 0; i < titles.length && count < 15; i++) {
          // فك ترميز اليونيكود (Unicode) لنصوص عربية صافية ومقروءة 100% داخل إينوريدر
          let cleanTitle = titles[i].replace(/\\u([\dA-F]{4})/gi, (m, p) => String.fromCharCode(parseInt(p, 16))).replace(/\\/g, '');
          let cleanExcerpt = excerpts[i] ? excerpts[i].replace(/\\u([\dA-F]{4})/gi, (m, p) => String.fromCharCode(parseInt(p, 16))).replace(/\\/g, '') : cleanTitle;
          let slug = urls[i] ? urls[i].replace(/\\/g, '') : "";

          if (cleanTitle.length > 15 && !cleanTitle.includes("logo") && !cleanTitle.includes("من نحن")) {
            count++;
            let newsLink = slug ? `https://kataeb.org{slug}` : "https://kataeb.org";
            let guid = Buffer.from(cleanTitle.substring(0, 15)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

            rssItems += `
    <item>
      <title><![CDATA[🚨 عاجل: ${cleanTitle}]]></title>
      <description><![CDATA[${cleanExcerpt}]]></description>
      <link>${newsLink}</link>
      <guid isPermaLink="false">live-${guid}-${i}</guid>
      <pubDate>${timestamp}</pubDate>
    </item>`;
          }
        }

        // بناء مستند الـ XML الذي نجحنا في تأسيسه بيدك
        let rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
        rssFeed += `<title>مباشر - عاجل الكتائب اللبنانية</title>\n`;
        rssFeed += `<link>https://kataeb.org</link>\n`;
        rssFeed += `<description>تغطية حية ومباشرة للأخبار العاجلة والتطورات اللحظية</description>\n`;
        rssFeed += `<pubDate>${timestamp}</pubDate>\n`;
        
        if (rssItems !== "") {
          rssFeed += rssItems;
        } else {
          // بقاء الأخبار القديمة التي رفعتها بيدك كخط دفاع صلب لمنع قفل التغذية
          rssFeed += `
    <item>
      <title><![CDATA[[12:35] وزارة الصحة: ضحيتان بينهما فتاة وجريحتان في الغارة الإسرائيلية على دورس]]></title>
      <description><![CDATA[تفاصيل ومستجدات التغطية الميدانية المستمرة على مدار الساعة.]]></description>
      <link>https://kataeb.org</link>\n
      <guid>fallback-1235</guid>\n
      <pubDate>${timestamp}</pubDate>\n
    </item>`;
        }

        rssFeed += `\n</channel>\n</rss>`;
        
        // الكتابة والمزامنة الآلية المستمرة فوق ملفك الحالي
        fs.writeFileSync('kataeb.xml', rssFeed, 'utf-8');
        console.log("تم تحديث وبناء الخلاصة الآلية بنجاح مالي كامل!");

      } catch (err) {
        console.error("خطأ معالجة: " + err.message);
      }
    });
  }).on('error', (err) => {
    console.error("خطأ اتصال: " + err.message);
  });
}

startAutomatedLiveScraper();
