import time
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from feedgen.feed import FeedGenerator

TARGET_URL = "https://kataeb.org" # قمنا بتغيير الرابط ليتوجه لصفحة البث المباشر مباشرة
OUTPUT_FILE = "kataeb.xml"

def fetch_kataeb_live():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] جاري جلب شريط الأخبار العاجلة الحية...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3'
    }
    try:
        response = requests.get(TARGET_URL, headers=headers, timeout=20)
        if response.status_code != 200:
            print(f"⚠️ كود الاستجابة: {response.status_code}")
            return
            
        soup = BeautifulSoup(response.text, 'html.parser')
        fg = FeedGenerator()
        fg.title('موقع الكتائب - بث مباشر')
        fg.link(href=TARGET_URL, rel='alternate')
        fg.description('خلاصة RSS مخصصة لتحديثات موقع الكتائب اللبنانية المباشرة')
        fg.language('ar')
        
        # استهداف الحاويات البرمجية المخصصة لشريط الأخبار المتغيرة بالدقيقة
        # الكود يبحث عن الفئات الشائعة للبث المباشر (live items, live-news, timeline)
        news_items = soup.find_all('div', class_='live-news-item') or \
                     soup.find_all('div', class_='live-box') or \
                     soup.find_all('div', class_='news-item') or \
                     soup.find_all('div', class_='timeline-item')
        
        # إذا لم يجد الفئات المحددة، سيسحب كود احتياطي ذكي يبحث عن أي نصوص مرتبطة بالوقت المباشر
        if not news_items:
            news_items = [li for li in soup.find_all('li') if len(li.get_text(strip=True)) > 20]

        count = 0
        for item in news_items:
            text_content = item.get_text(" ", strip=True)
            
            # تصفية الكلمات العامة والثابتة لضمان جلب الأخبار الحقيقية فقط
            if len(text_content) > 15 and count < 15 and "شريط الأخبار" not in text_content and "التغطيات الشاملة" not in text_content:
                link_tag = item.find('a')
                item_link = link_tag['href'] if link_tag and 'href' in link_tag.attrs else TARGET_URL
                if not item_link.startswith('http'):
                    item_link = "https://kataeb.org" + item_link

                fe = fg.add_entry()
                fe.title(text_content)
                fe.link(href=item_link)
                fe.description(text_content)
                count += 1
                
        if count > 0:
            fg.rss_file(OUTPUT_FILE)
            print(f"✓ تم تحديث الخلاصة بنجاح بالأخبار الفعلية (تم جلب {count} خبر)")
        else:
            print("⚠️ تم الدخول ولكن لم يتم تصفية أخبار حقيقية، جارِ البحث الموسع...")
            # كود طوارئ لسحب أحدث العناوين من الصفحة الرئيسية في حال اختفاء شريط البث
            titles = soup.find_all('h2') or soup.find_all('h3')
            for title in titles:
                text_t = title.get_text(strip=True)
                if len(text_t) > 15 and count < 15:
                    fe = fg.add_entry()
                    fe.title(text_t)
                    fe.link(href=TARGET_URL)
                    fe.description(text_t)
                    count += 1
            fg.rss_file(OUTPUT_FILE)
            
    except Exception as e:
        print(f"❌ خطأ: {e}")

if __name__ == "__main__":
    fetch_kataeb_live()
