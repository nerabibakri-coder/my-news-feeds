const fs = require('fs');
const https = require('https');

function parseKataebLive() {
  const liveUrl = "https://kataeb.org/live";
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ar,en;q=0.5'
    }
  };

  https.get(liveUrl, options, (res) => {
    let htmlContent = '';
    res.on('data', (chunk) => { htmlContent += chunk; });
    
    res.on('end', () => {
      try {
        const timestamp = new Date().toUTCString();
        let rssItems = '';

        // تعبير نمطي برمي دقيق يبحث عن الكلاس المحدد ng-tns-c48-0 ويستخرج النصوص من داخله مباشرة
        const classRegex = /class="[^"]*ng-tns-c48-0[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
        let match;
        let count = 0;

        // ضخ كافة السطور التي تحمل اسم الكلاس بالتكرار الكامل دون حذف
        while ((match = classRegex.exec(htmlContent)) !== null && count < 20) {
          let blockText = match[1]
            .replace(/<[^>]*>/g, '') // تنظيف وسوم HTML الداخلية فقط
            .replace(/\s+/g, ' ')    // تنظيف المسافات العشوائية
            .trim();

          if (blockText.length > 10) {
            count++;
            let guidId = Buffer.from(blockText.substring(0, 30)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
            
            rssItems += `
    <item>
      <title><![CDATA[⚡ مباشر: ${blockText.substring(0, 90)}...]]></title>
      <description><![CDATA[${blockText}]]></description>
      <link>${liveUrl}#${guidId}</link>
      <guid isPermaLink="false">item-${guidId}</guid>
      <pubDate>${timestamp}</pubDate>
    </item>`;
          }
        }

        // في حال لم تكتمل قراءة الـ DOM الثابت بسبب حماية الموقع، نستخدم التجميع اللفظي المباشر كخط دفاع احتياطي للمحتوى الحقيقي
        if (rssItems === '' && (htmlContent.includes('وزارة الصحة') || htmlContent.includes('قصف') || htmlContent.includes('عاجل'))) {
          const timeMatches = htmlContent.match(/\d{2}:\d{2}/g);
          if (timeMatches) {
            let parts = htmlContent.split(/\d{2}:\d{2}/);
            for (let i = 0; i < timeMatches.length && i < 15; i++) {
              let cleanNews = parts[i + 1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
              if (cleanNews.length > 15) {
                let fallbackGuid = Buffer.from(timeMatches[i] + cleanNews.substring(0,10)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
                rssItems += `
    <item>
      <title><![CDATA[[${timeMatches[i]}] ${cleanNews.substring(0, 80)}...]]></title>
      <description><![CDATA[${cleanNews}]]></description>
      <link>${liveUrl}</link>
      <guid isPermaLink="false">fb-${fallbackGuid}</guid>
      <pubDate>${timestamp}</pubDate>
    </item>`;
              }
            }
          }
        }

        // صياغة ملف الـ XML النهائي الموجه لتطبيق Inoreader
        let rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
        rssFeed += `<title>عاجل الكتائب - مباشر</title>\n`;
        rssFeed += `<link>${liveUrl}</link>\n`;
        rssFeed += `<description>تغطية حية مأخوذة من الكلاس البرمجي مباشرة</description>\n`;
        rssFeed += `<pubDate>${timestamp}</pubDate>\n`;
        
        if (rssItems !== '') {
          rssFeed += rssItems;
        } else {
          // لمنع تجمد أو تفريغ التغذية داخل التطبيق تحت أي ظرف أمني للموقع
          rssFeed += `
    <item>
      <title><![CDATA[⏱️ جاري تحديث نبض التغطية الميدانية والسياسية اللحظية]]></title>
      <description><![CDATA[يرجى التحديث لمتابعة مستجدات شريط مباشر الكتائب اللبنانية.]]></description>
      <link>${liveUrl}</link>\n
      <guid>refresh-${new Date().getTime()}</guid>\n
      <pubDate>${timestamp}</pubDate>\n
    </item>`;
        }

        rssFeed += `\n</channel>\n</rss>`;
        
        fs.writeFileSync('kataeb-live.xml', rssFeed, 'utf-8');
        console.log("تم سحب الكلاس وتوليد الـ RSS بنجاح كامل!");

      } catch (err) {
        console.error("خطأ معالجة: " + err.message);
      }
    });
  }).on('error', (err) => {
    console.error("خطأ اتصال بالسيرفر: " + err.message);
  });
}

parseKataebLive();
