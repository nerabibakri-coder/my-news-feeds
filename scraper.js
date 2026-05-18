const fs = require('fs');
const https = require('https');

function runGithubScraper() {
  // جلب المحتوى المباشر الكامل من السيرفر بدون فلاتر معقدة تحذف التكرار
  const apiUrl = "https://kataeb.org"; 
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml'
    }
  };

  https.get(apiUrl, options, (res) => {
    let rawJson = '';
    res.on('data', (chunk) => { rawJson += chunk; });
    
    res.on('end', () => {
      try {
        const timestamp = new Date().toUTCString();
        let rssItems = '';

        // كشط كافة العناوين والروابط بالتكرار الكامل لضمان المزامنة الفورية
        const titleRegex = /"title":"([^"]+)"/g;
        const excerptRegex = /"excerpt":"([^"]+)"/g;
        const urlRegex = /"url":"([^"]+)"/g;

        let titles = [];
        let excerpts = [];
        let urls = [];
        let match;

        while ((match = titleRegex.exec(rawJson)) !== null) { titles.push(match[1]); }
        while ((match = excerptRegex.exec(rawJson)) !== null) { excerpts.push(match[1]); }
        while ((match = urlRegex.exec(rawJson)) !== null) { urls.push(match[1]); }

        let count = 0;
        for (let i = 0; i < titles.length && count < 15; i++) {
          // تحويل الرموز الموحدة لضمان خروج النصوص العربية صافية وواضحة لقارئ الأخبار
          let cleanTitle = titles[i].replace(/\\u([\dA-F]{4})/gi, (m, p) => String.fromCharCode(parseInt(p, 16))).replace(/\\/g, '');
          let cleanExcerpt = excerpts[i] ? excerpts[i].replace(/\\u([\dA-F]{4})/gi, (m, p) => String.fromCharCode(parseInt(p, 16))).replace(/\\/g, '') : cleanTitle;
          let slug = urls[i] ? urls[i].replace(/\\/g, '') : "";

          if (cleanTitle.length > 15 && !cleanTitle.includes("logo") && !cleanTitle.includes("من نحن")) {
            count++;
            // صياغة الرابط الصحيح لفتح الخبر اللحظي بدقة
            let newsLink = slug ? `https://kataeb.org{slug}` : "https://kataeb.org";
            let guid = Buffer.from(cleanTitle.substring(0, 20)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

            rssItems += `
    <item>
      <title><![CDATA[🚨 عاجل: ${cleanTitle}]]></title>
      <description><![CDATA[${cleanExcerpt}]]></description>
      <link>${newsLink}</link>
      <guid isPermaLink="false">news-${guid}-${i}</guid>
      <pubDate>${timestamp}</pubDate>
    </item>`;
          }
        }

        let rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
        rssFeed += `<title>مباشر - عاجل الكتائب اللبنانية</title>\n`;
        rssFeed += `<link>https://kataeb.org</link>\n`;
        rssFeed += `<description>تغطية حية للأخبار العاجلة والتطورات اللحظية الجارية</description>\n`;
        rssFeed += `<pubDate>${timestamp}</pubDate>\n`;
        
        if (rssItems !== "") {
          rssFeed += rssItems;
        } else {
          rssFeed += `
    <item>
      <title><![CDATA[⚡ متابعة مستمرة لآخر التطورات والأخبار الميدانية اللحظية]]></title>
      <description><![CDATA[يرجى تحديث الخلاصة بعد لحظات لمزامنة التحديثات الحية الجارية الآن.]]></description>
      <link>https://kataeb.org</link>\n
      <guid>sync-${new Date().getTime()}</guid>\n
      <pubDate>${timestamp}</pubDate>\n
    </item>`;
        }
        
        rssFeed += `\n</channel>\n</rss>`;
        
        // حفظ ملف الـ RSS النهائي لـ Inoreader في المستودع
        fs.writeFileSync('kataeb-live.xml', rssFeed, 'utf-8');
        console.log("تم تحديث وبناء ملف الـ RSS بنجاح مالي كامل على غيت هاب!");

      } catch (err) {
        console.error("خطأ معالجة: " + err.message);
      }
    });
  }).on('error', (err) => {
    console.error("خطأ اتصال بالسيرفر: " + err.message);
  });
}

runGithubScraper();
