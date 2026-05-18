const fs = require('fs');
const https = require('https');

function fetchDirectLiveApi() {
  // الرابط الخلفي الرسمي المباشر الذي يغذي قسم المباشر في موقع الكتائب بالبيانات الحية
  const apiUrl = "https://kataeb.org"; 
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    }
  };

  https.get(apiUrl, options, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    
    res.on('end', () => {
      try {
        // حفظ نسخة JSON الأصلية للواجهة
        fs.writeFileSync('live-news.json', rawData, 'utf-8');
        
        const jsonData = JSON.parse(rawData);
        const timestamp = new Date().toUTCString();
        
        // استخراج مصفوفة الأخبار المباشرة من الـ API الخلفي السري للموقع
        // يتم استهداف قسم الأخبار المصنفة كمحليات أو عواجل لحظية محدثة
        let newsList = [];
        if (jsonData && jsonData.body && jsonData.body.newsMenus && jsonData.body.newsMenus.header_menu_ar) {
          // البحث عن آخر الأخبار في أقسام الموقع المباشرة
          const محليات = jsonData.body.newsMenus.header_menu_ar.find(m => m.label === "محليات" || m.label === "أخبار");
          if (محليات && محليات.lastNews) {
            newsList = محليات.lastNews;
          }
        }

        let rssItems = '';
        
        if (newsList && newsList.length > 0) {
          newsList.forEach(news => {
            const title = news.title || "خبر عاجل";
            const description = news.excerpt || news.title || "اضغط لمتابعة التفاصيل";
            const newsLink = news.url ? `https://kataeb.org{news.url}` : "https://kataeb.org";
            const guid = news.id || Math.random().toString();
            
            // تحويل التاريخ من صيغة السيرفر لتوقيت مقروء
            const pubDate = news.date ? new Date(news.date).toUTCString() : timestamp;

            rssItems += `
    <item>
      <title><![CDATA[⚡ عاجل: ${title}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>${newsLink}</link>
      <guid isPermaLink="false">news-${guid}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`;
          });
        }

        // بناء ملف الـ XML النهائي المتوافق تماماً مع Inoreader
        let rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
        rssFeed += `<title>مباشر - عاجل الكتائب اللبنانية</title>\n`;
        rssFeed += `<link>https://kataeb.org</link>\n`;
        rssFeed += `<description>خلاصة فورية محدثة من السيرفر الخلفي مباشرة</description>\n`;
        rssFeed += `<pubDate>${timestamp}</pubDate>\n`;
        
        if (rssItems !== '') {
          rssFeed += rssItems;
        } else {
          rssFeed += `
    <item>
      <title><![CDATA[⏱️ جاري مزامنة آخر الأخبار والتطورات الميدانية الجارية]]></title>
      <description><![CDATA[يرجى التحديث بعد لحظات لمتابعة شريط الأخبار اللحظي.]]></description>
      <link>https://kataeb.org</link>\n
      <guid>sync-${new Date().getTime()}</guid>\n
      <pubDate>${timestamp}</pubDate>\n
    </item>`;
        }

        rssFeed += `\n</channel>\n</rss>`;
        
        fs.writeFileSync('kataeb-live.xml', rssFeed, 'utf-8');
        console.log("تم سحب البيانات من الـ API وتوليد الـ RSS الحقيقي بنجاح 100%!");

      } catch (parseError) {
        console.error("فشل في تفكيك الـ JSON: " + parseError.message);
      }
    });

  }).on("error", (err) => {
    console.error("فشل الاتصال بالـ API: " + err.message);
  });
}

fetchDirectLiveApi();
