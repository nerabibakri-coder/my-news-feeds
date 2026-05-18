const fs = require('fs');

function runLocalScraper() {
  const liveUrl = "https://kataeb.org/live";
  const timestamp = new Date().toUTCString();
  
  // المحتوى النصي الخام الذي قمت بنسخه يدوياً من سورس صفحة المباشر
  const rawHtml = `
    غارة على بلدة معركة 13:03
    غارة إسرائيلية استهدفت بلدة دبعال 13:02
    الرئيس الإيراني: لن نخضع لأي قوة ولن نستسلم أمام أي جهة 13:03
    الخارجية التركية: ندين اعتراض أسطول الصمود باعتباره عمل قرصنة 12:58
    بلومبرغ: رصد نحو 23 ناقلة نفط قرب جزيرة خارك 12:58
    أحمد الشرع: التزمنا وطنياً ببطء صفحة المخيمات بحلول عام 12:55
    كركي: دعم الأطباء والمستشفيات مستمر، 2443 مليار ل.ل. 12:54
  `;

  let rssItems = '';
  
  // البحث عن التوقيت الرقمي بالدقائق (مثل 13:03) لتقسيم السطور
  const timeMatches = rawHtml.match(/\d{2}:\d{2}/g);
  
  if (timeMatches && timeMatches.length > 0) {
    let lines = rawHtml.split('\n');
    let count = 0;

    lines.forEach(line => {
      let cleanLine = line.trim();
      let matchTime = cleanLine.match(/\d{2}:\d{2}/);

      if (matchTime && cleanLine.length > 15 && count < 20) {
        count++;
        let time = matchTime[0];
        // عزل نص الخبر الصافي ومسح التوقيت من نهاية السطر لجمالية العرض
        let newsText = cleanLine.replace(time, '').trim(); 
        let uniqueGuid = Buffer.from(time + newsText.substring(0, 10)).toString('base64').replace(/[^a-zA-Z0-9]/g, '');

        rssItems += `
    <item>
      <title><![CDATA[[${time}] ${newsText}]]></title>
      <description><![CDATA[تغطية حية ومباشرة للأخبار اللحظية؛ اضغط لمتابعة تفاصيل الخبر من المصدر الرسمي.]]></description>
      <link>${liveUrl}#news-${uniqueGuid}</link>
      <guid isPermaLink="false">live-${uniqueGuid}</guid>
      <pubDate>${timestamp}</pubDate>
    </item>`;
      }
    });
  }

  // بناء مستند الـ XML الشرعي والكامل الذي تشترطه منصات القراءة
  let rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
  rssFeed += `<title>مباشر - عاجل الكتائب اللبنانية</title>\n`;
  rssFeed += `<link>${liveUrl}</link>\n`;
  rssFeed += `<description>شريط التغطية اللحظية للأخبار المباشرة دقيقة بدقيقة</description>\n`;
  rssFeed += `<pubDate>${timestamp}</pubDate>\n`;
  rssFeed += rssItems;
  rssFeed += `\n</channel>\n</rss>`;

  // حفظ ملف الـ XML النهائي الموجه مباشرة لـ Inoreader
  fs.writeFileSync('kataeb-live.xml', rssFeed, 'utf-8');
  console.log("تم تحديث وبناء ملف الـ RSS بنجاح كامل على غيت هاب!");
}

runLocalScraper();
