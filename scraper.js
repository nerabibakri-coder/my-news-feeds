const fs = require('fs');
const https = require('https');

function fetchLiveSystem() {
  const apiUrl = "https://kataeb.org";
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    }
  };

  https.get(apiUrl, options, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    
    res.on('end', () => {
      try {
        fs.writeFileSync('live-news.json', rawData, 'utf-8');
        const timestamp = new Date().toUTCString();
        let rssItems = '';

        // كشف وتحليل أوتوماتيكي ذكي لجميع النصوص العاجلة والمحدثة داخل مستند الـ JSON
        // نبحث عن أي نصوص برمجية تحتوي على أخبار عاجلة أو تحديثات ميدانية لحظية
        const titleRegex = /"title":"([^"]+)"/g;
        const excerptRegex = /"excerpt":"([^"]+)"/g;
        const urlRegex = /"url":"([^"]+)"/g;

        let titles = [];
        let excerpts = [];
        let urls = [];
        let match;

        while ((match = titleRegex.exec(rawData)) !== null) { titles.push(match[1]); }
        while ((match = excerptRegex.exec(rawData)) !== null) { excerpts.push(match[1]); }
        while ((match = urlRegex.exec(rawData)) !== null) { urls.push(match[1]); }

        let count = 0;
        for (let i = 0; i < titles.length; i++) {
          let title = titles[i].replace(/\\u[\dA-F]{4}/gi, match => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));
          let excerpt = excerpts[i] ? excerpts[i].replace(/\\u[\dA-F]{4}/gi, match => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))) : title;
          let slug = urls[i] || "";

          // الفلترة الذكية لحماية جودة المحتوى وعرض أول 10 أخبار ساخنة وعاجلة فوراً
          if (title.length > 10 && count < 10 && !title.includes("logo") && !title.includes("من نحن")) {
            count++;
            let newsLink = slug ? `https://kataeb.org{slug}` : "https://kataeb.org";
            let guid = Buffer.from(title.substring(0,20)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

            rssItems += `
    <item>
      <title><![CDATA[🚨 عاجل: ${title}]]></title>
      <description><![CDATA[${excerpt.replace(/<[^>]*>/g, '')}]]></description>
      <link>${newsLink}</link>
      <guid isPermaLink="false">live-${guid}</guid>
      <pubDate>${timestamp}</pubDate>
    </item>`;
          }
        }

        // صياغة مستند الـ XML الرسمي لـ Inoreader
        let rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
        rssFeed += `<title>مباشر - عاجل الكتائب اللبنانية</title>\n`;
        rssFeed += `<link>https://kataeb.org</link>\n`;
        rssFeed += `<description>تغطية حية للأخبار العاجلة والتطورات اللحظية</description>\n`;
        rssFeed += `<pubDate>${timestamp}</pubDate>\n`;
        
        if (rssItems !== '') {
          rssFeed += rssItems;
        } else {
          // خط دفاع احتياطي لمنع ظهور التغذية فارغة في التطبيق
          rssFeed += `
    <item>
      <title><![CDATA[⚡ متابعة مستمرة للتطورات الميدانية والسياسية اللحظية الجارية]]></title>
      <description><![CDATA[اضغط على تفاصيل المصدر لمتابعة البث الحي المباشر دقيقة بدقيقة.]]></description>
      <link>https://kataeb.org</link>\n
      <guid>fallback-${new Date().getTime()}</guid>\n
      <pubDate>${timestamp}</pubDate>\n
    </item>`;
        }

        rssFeed += `\n</channel>\n</rss>`;
        
        fs.writeFileSync('kataeb-live.xml', rssFeed, 'utf-8');
        console.log("تم تحديث خلاصة الـ RSS بنجاح مالي كامل!");

      } catch (e) {
        console.error("خطأ معالجة: " + e.message);
      }
    });

  }).on("error", (err) => {
    console.error("خطأ اتصال: " + err.message);
  });
}

fetchLiveSystem();
