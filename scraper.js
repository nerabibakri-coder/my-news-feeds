import time
import random
from datetime import datetime
import cloudscraper
from bs4 import BeautifulSoup
from feedgen.feed import FeedGenerator

TARGET_URL = "https://kataeb.org"
OUTPUT_FILE = "kataeb_feed.xml"

def fetch_kataeb_live():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] جاري تخطي حظر السيرفر وسحب الأخبار...")
    
    # استخدام محاكي مخصص لكسر حماية المواقع
    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'windows',
            'desktop': True
        }
    )
    
    try:
        response = scraper.get(TARGET_URL, timeout=20)
        if response.status_code != 200:
            print(f"⚠️ فشل تخطي الحماية، كود الاستجابة: {response.status_code}")
            return
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        fg = FeedGenerator()
        fg.title('موقع الكتائب - بث مباشر')
        fg.link(href=TARGET_URL, rel='alternate')
        fg.description('خلاصة RSS مخصصة لتحديثات موقع الكتائب اللبنانية المباشرة')
        fg.language('ar')
        
        # جلب شريط الأخبار العاجلة بناءً على الهيكل النصي المباشر
        news_items = soup.find_all('div', class_='live-box') or soup.find_all('li')
        count = 0
        
        for item in news_items:
            text_content = item.get_text(strip=True)
            if len(text_content) > 15 and count < 15:
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
            print(f"✓ تم بنجاح جلب {count} خبر وحفظ ملف RSS.")
        else:
            print("⚠️ تم الدخول للموقع ولكن الفئات تحتاج لمطابقة محددة.")
            
    except Exception as e:
        print(f"❌ حدث خطأ غير متوقع: {e}")

if __name__ == "__main__":
    fetch_kataeb_live()
