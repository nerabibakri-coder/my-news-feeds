const fs = require('fs');
const https = require('https');

function updateKataebLiveFeed() {
  // الرابط الخلفي السري البديل والفعال حالياً على الموقع
  const apiUrl = "https://kataeb.org"; 
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  };

  https.get(apiUrl, options, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    
    res.on('end', () => {
      try {
        const timestamp = new Date().toUTCString();
        let rssItems = '';

        // تفكيك الكلمات العربية الصافية والعناوين مباشرة من ملف الـ JSON الجديد
        const titleRegex = /"title":"([^"]+)"/g;
        const excerptRegex = /"excerpt":"([^"]+)"/g;
        const urlRegex = /"url":"([^"]+)"/g;

        let titles = [], excerpts = [], urls = [], match;

        while ((match = titleRegex.exec(rawData)) !== null) { titles.push(match); }
        while ((match = excerptRegex.exec(rawData)) !== null) { excerpts.push(match); }
        while ((match = urlRegex.exec(rawData)) !== null) { urls.push(match); }

        let count = 0;
        for (let i = 0; i < titles.length && count < 25; i++) {
          // فك ترميز اليونيكود (Unicode) لضمان قراءة نصوص عربية سليمة ومفصولة مئة بالمئة داخل إينوريدر
          let cleanTitle = titles[i].replace(/\\u([\dA-F]{4})/gi, (m, p) => String.fromCharCode(parseInt(p, 16))).replace(/\\/g, '');
          let cleanExcerpt = excerpts[i] ? excerpts[i].replace(/\\u([\dA-F]{4})/gi, (m, p) => String.fromCharCode(parseInt(p, 16))).replace(/\\/g, '') : cleanTitle;
          let slug = urls[i] ? urls[i].replace(/\\/g, '') : "";

          if (cleanTitle.length > 10 && !cleanTitle.includes("logo") && !cleanTitle.includes("من نحن")) {
            count++;
            let newsLink = slug ? `https://kataeb.org{slug}` : `https://kataeb.org{i}`;
            let guid = Buffer.from(cleanTitle.substring(0, 15)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

            // ضخ الأخبار في عناصر مستقلة تماماً ليفصلها إينوريدر كمنشورات منفصلة ونظيفة
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

        let rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
        rssFeed += `<title>مباشر - عاجل الكتائب اللبنانية</title>\n`;
        rssFeed += `<link>https://kataeb.org</link>\n`;
        rssFeed += `<description>تغطية حية للأخبار العاجلة والتطورات اللحظية دقيقة بدقيقة</description>\n`;
        rssFeed += `<pubDate>${timestamp}</pubDate>\n`;
        rssFeed += rssItems;
        rssFeed += `\n</channel>\n</rss>`;
        
        // الكتابة التلقائية المباشرة فوق ملفك الحالي المعتمد والمقروء في إينوريدر لإنهاء التعليق
        fs.writeFileSync('kataeb.xml', rssFeed, 'utf-8');
        console.log("تمت المزامنة وحقن العواجل بنجاح كامل!");

      } catch (err) {
        console.error("خطأ معالجة: " + err.message);
      }
    });
  }).on('error', (err) => {
    console.error("خطأ اتصال: " + err.message);
  });
}

updateKataebLiveFeed();
