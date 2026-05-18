const fs = require('fs');
const https = require('https');

function runGithubScraper() {
  // جلب المحتوى المباشر المحدث بالكامل من السيرفر مباشرة
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

        // تعبيرات نمطية دقيقة لكشط النصوص والعناوين والروابط من السيرفر
        const titleRegex = /"title":"([^"]+)"/g;
        const excerptRegex = /"excerpt":"([^"]+)"/g;
        const urlRegex = /"url":"([^"]+)"/g;

        let titles = [];
        let excerpts = [];
        let urls = [];
        let match;

        // دفع النصوص المصفاة داخل المجموعات البرمجية الصحيحة لمنع التجمد
        while ((match = titleRegex.exec(rawJson)) !== null) { titles.push(match[1]); }
        while ((match = excerptRegex.exec(rawJson)) !== null) { excerpts.push(match[1]); }
        while ((match = urlRegex.exec(rawJson)) !== null) { urls.push(match[1]); }

        let count = 0;
        for (let i = 0; i < titles.length && count < 15; i++) {
          // فك ترميز الحروف والرموز الموحدة لنصوص عربية صافية ومقروءة 100%
          let titleText = titles[i].replace(/\\u([\dA-F]{4})/gi, (m, p) => String.fromCharCode(parseInt(p, 16))).replace(/\\/g, '');
          let excerptText = excerpts[i] ? excerpts[i].replace(/\\u([\dA-F]{4})/gi, (m, p) => String.fromCharCode(parseInt(p, 16))).replace(/\\/g, '') : titleText;
          let slug = urls[i] ? urls[i].replace(/\\/g, '') : "";

          if (titleText.length > 15 && !titleText.includes("logo") && !titleText.includes("من نحن")) {
            count++;
            let newsLink = slug ? `https://kataeb.org{slug}` : "https://kataeb.org";
            let guid = Buffer.from(titleText.substring(0, 15)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

            rssItems += `
    <item>
      <title><![CDATA[🚨 عاجل: ${titleText}]]></title>
      <description><![CDATA[${excerptText}]]></description>
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
        
        // حفظ التعديل النهائي لبناء شريط الأخبار الحقيقي
        fs.writeFileSync('kataeb-live.xml', rssFeed, 'utf-8');
        console.log("تمت معالجة البيانات وضخ شريط الأخبار بنجاح 100%!");

      } catch (err) {
        console.error("خطأ معالجة: " + err.message);
      }
    });
  }).on('error', (err) => {
    console.error("خطأ اتصال بالسيرفر: " + err.message);
  });
}

runGithubScraper();
