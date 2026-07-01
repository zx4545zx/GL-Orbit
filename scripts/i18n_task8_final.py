#!/usr/bin/env python3
"""Task 8 final audit: translate remaining Thai UI strings in public pages and components."""
import json
from pathlib import Path
from collections import OrderedDict

ROOT = Path(__file__).resolve().parents[1]

def load_messages(path: Path) -> OrderedDict:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def save_messages(path: Path, data: OrderedDict) -> None:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

def add_import_m(content: str) -> str:
    if "import { m } from '$lib/i18n/paraglide.js'" in content:
        return content
    if '<script lang="ts">' in content:
        return content.replace('<script lang="ts">', '<script lang="ts">\n\timport { m } from \'$lib/i18n/paraglide.js\';', 1)
    return content

# ---------------------------------------------------------------------------
# 1. Add message keys
# ---------------------------------------------------------------------------

def add_keys():
    th = load_messages(ROOT / 'messages' / 'th.json')
    en = load_messages(ROOT / 'messages' / 'en.json')

    new_pairs = {
        # landing page leftovers
        'home_countdown_badge': ('Live Countdown', 'Live Countdown'),
        'home_schedule_badge': ('Upcoming', 'Upcoming'),
        'home_section_status_ongoing': ('กำลังฉาย', 'Now Airing'),
        'home_featured_see_all': ('ดูทั้งหมด', 'See all'),

        # explore
        'explore_subtitle': ('ค้นหาซีรีส์และนักแสดง GL ที่คุณชื่นชอบ', 'Find GL series and artists you love'),
        'explore_series_seo_title': ('สำรวจซีรีส์ GL | GL-Orbit', 'Explore GL Series | GL-Orbit'),
        'explore_series_seo_description': ('สำรวจซีรีส์ Girls\' Love ทั้งหมด พร้อมตารางฉายและข้อมูลครบถ้วน', 'Explore all Girls\' Love series with schedules and full details'),
        'explore_artists_seo_title': ('สำรวจนักแสดง GL | GL-Orbit', 'Explore GL Artists | GL-Orbit'),
        'explore_artists_seo_description': ('สำรวจนักแสดงซีรีส์ Girls\' Love พร้อมผลงานและโซเชียลมีเดีย', 'Explore Girls\' Love series artists with works and social media'),
        'load_more_error': ('โหลดเพิ่มไม่สำเร็จ ลองอีกครั้ง', 'Failed to load more. Please try again.'),
        'artist_filter_heart': ('หัวใจ', 'Heart'),
        'artist_filter_star': ('ดาว', 'Star'),
        'artist_filter_sparkle': ('ประกาย', 'Sparkle'),
        'artist_works_count': ('{count} ผลงาน', '{count} works'),
        'artist_view_profile': ('ดูโปรไฟล์', 'View profile'),

        # profile
        'profile_seo_title': ('โปรไฟล์ของฉัน | GL-Orbit', 'My Profile | GL-Orbit'),
        'profile_seo_description': ('จัดการโปรไฟล์ GL-Orbit ของคุณ — ดูรายการซีรีส์ที่ชอบและรับชม เปลี่ยนรหัสผ่าน และแก้ไขข้อมูลส่วนตัว', 'Manage your GL-Orbit profile — favorites, watch history, password, and personal info'),
        'profile_update_error': ('ไม่สามารถอัปเดตโปรไฟล์ได้', 'Failed to update profile'),
        'profile_password_error': ('ไม่สามารถเปลี่ยนรหัสผ่านได้', 'Failed to change password'),
        'profile_view_all_series': ('ไปดูซีรีส์ทั้งหมด', 'View all series'),
        'profile_retry': ('ลองอีกครั้ง', 'Try again'),
        'profile_edit': ('แก้ไขโปรไฟล์', 'Edit profile'),
        'profile_unknown_studio': ('ไม่ระบุสตูดิโอ', 'Unknown studio'),
        'profile_admin_badge': ('ผู้ดูแลระบบ', 'Admin'),

        # series detail
        'series_detail_not_found': ('ไม่พบซีรีส์นี้', 'Series not found'),
        'common_full_page': ('ดูหน้าเต็ม', 'Full page'),
        'artist_detail_not_found': ('ไม่พบข้อมูลนักแสดง', 'Artist not found'),
        'common_open_external': ('เปิดลิงก์ภายนอก', 'Open external link'),
        'artist_works_role': ('รับบท: {role}', 'Role: {role}'),

        # watched / favorite
        'watched_loading_aria': ('กำลังโหลด', 'Loading'),
        'watched_unmark_aria': ('เลิก mark ดูแล้ว', 'Unmark watched'),
        'watched_mark_aria': ('mark ว่าดูแล้ว', 'Mark as watched'),
        'watched_loading_label': ('กำลังเช็ก', 'Checking'),
        'watched_watched_label': ('ดูแล้ว', 'Watched'),
        'watched_unwatched_label': ('มาร์กว่าดูแล้ว', 'Mark as watched'),
        'favorite_loading_aria': ('กำลังโหลด', 'Loading'),
        'favorite_unmark_aria': ('เลิก Favorite', 'Unfavorite'),
        'favorite_mark_aria': ('เพิ่ม Favorite', 'Add to favorites'),
        'favorite_loading_label': ('กำลังเช็ก', 'Checking'),
        'favorite_favorited_label': ('อยู่ในลิสต์', 'In list'),
        'favorite_unfavorited_label': ('เก็บเข้าลิสต์', 'Add to list'),

        # notification badge
        'notifications_badge_aria': ('การแจ้งเตือน {count} รายการ', '{count} notifications'),

        # schedule context panel
        'schedule_context_title': ('ตารางฉายที่เกี่ยวข้อง', 'Related schedule'),
        'schedule_context_summary': ('{events} รอบฉาย • {series} เรื่อง', '{events} airings • {series} series'),
        'schedule_context_full': ('ดูเต็ม', 'Full view'),
        'schedule_context_empty': ('ยังไม่พบตารางฉายของข้อมูลนี้', 'No related schedule found'),
        'schedule_context_rounds': ('รอบ', 'airings'),
        'schedule_context_series': ('เรื่อง', 'series'),
        'schedule_context_day': ('วัน{day}', '{day}'),

        # about page UI
        'about_hero_badge': ('About GL-Orbit', 'About GL-Orbit'),
        'about_hero_title': ('คู่มือติดตามซีรีส์ GL', 'Your guide to GL series'),
        'about_hero_subtitle': ('รู้จักแนวคิดของ GL-Orbit วิธีใช้ตารางฉาย ข้อมูล Girls\' Love series แพลตฟอร์มรับชม และคำถามที่แฟนคลับ GL มักอยากรู้ก่อนเริ่มติดตามเรื่องใหม่', 'Learn about GL-Orbit\'s approach to schedules, Girls\' Love series info, streaming platforms, and questions new fans often ask.'),
        'about_last_updated': ('อัปเดตล่าสุด: {date}', 'Last updated: {date}'),
        'about_cta_schedule': ('ดูตารางฉาย', 'View schedule'),
        'about_cta_home': ('กลับหน้าแรก', 'Back to home'),
        'about_ai_section_badge': ('AI Search Answers', 'AI Search Answers'),
        'about_ai_section_title': ('คำตอบสั้นที่ AI ดึงไปอ้างอิงได้ง่าย', 'Quick answers for AI search'),
        'about_ai_section_desc': ('สรุปประเด็นสำคัญเกี่ยวกับ GL-Orbit ในรูปแบบคำถาม-คำตอบที่อ่านเข้าใจได้ทันที เหมาะกับทั้งผู้ใช้ใหม่และระบบค้นหาที่ต้องการคำตอบแบบ self-contained', 'Self-contained Q&A summaries about GL-Orbit, easy for users and search engines.'),
        'about_guide_badge': ('Guide', 'Guide'),
        'about_guide_title': ('GL-Orbit คืออะไร', 'What is GL-Orbit'),
        'about_howto_badge': ('How to use', 'How to use'),
        'about_howto_title': ('เริ่มใช้งานอย่างไร', 'How to start'),
        'about_gl101_badge': ('GL 101', 'GL 101'),
        'about_gl101_title': ('ทำความรู้จักซีรีส์ GL', 'GL series 101'),
        'about_lead': ('สำหรับผู้ชมใหม่และแฟนคลับที่อยากเข้าใจจักรวาลซีรีส์ Girls\' Love ให้ลึกซึ้งยิ่งขึ้น GL-Orbit สรุปประเด็นสำคัญที่ช่วยให้เริ่มต้นติดตามซีรีส์ GL ได้ง่ายและไม่พลาดบริบทของแต่ละเรื่อง', 'For new viewers and fans who want to understand the Girls\' Love universe more deeply, GL-Orbit summarizes the key points to start following GL series easily.'),
        'about_streaming_badge': ('Streaming', 'Streaming'),
        'about_streaming_title': ('รับชมได้ที่ไหน', 'Where to watch'),
        'about_faq_badge': ('FAQ', 'FAQ'),
        'about_faq_title': ('คำถามที่พบบ่อย', 'Frequently asked questions'),
        'about_breadcrumb_home': ('หน้าแรก', 'Home'),
        'about_breadcrumb_about': ('เกี่ยวกับ GL-Orbit', 'About GL-Orbit'),
    }

    for key, (th_val, en_val) in new_pairs.items():
        if key not in th:
            th[key] = th_val
        if key not in en:
            en[key] = en_val

    save_messages(ROOT / 'messages' / 'th.json', th)
    save_messages(ROOT / 'messages' / 'en.json', en)

# ---------------------------------------------------------------------------
# 2. Component / page transformations
# ---------------------------------------------------------------------------

def apply_replacements(path: Path, replacements: list[tuple[str, str]]) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    for old, new in replacements:
        content = content.replace(old, new)
    path.write_text(content, encoding='utf-8')

def transform_landing():
    p = ROOT / 'src/routes/[lang=lang]/(app)/+page.svelte'
    apply_replacements(p, [
        ('<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">Live Countdown</span>', '<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">{m.home_countdown_badge()}</span>'),
        ('<p class="text-sm sm:text-base text-plum-light mt-1">นับถอยหลังสู่ตอนใหม่ · ภายใน 24 ชั่วโมง</p>', '<p class="text-sm sm:text-base text-plum-light mt-1">{m.home_countdown_subtitle()}</p>'),
        ('<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">กำลังฉาย</span>', '<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">{m.home_section_status_ongoing()}</span>'),
        ('<p class="text-sm sm:text-base text-plum-light">ซีรีส์ GL ที่น่าติดตามในตอนนี้</p>', '<p class="text-sm sm:text-base text-plum-light">{m.home_featured_subtitle()}</p>'),
        ('<a href="/{page.data.lang}/series" class="flex items-center gap-2 text-coral-dark font-medium hover:gap-3 transition-all text-sm touch-target">\n\t\t\t\tดูทั้งหมด', '<a href="/{page.data.lang}/series" class="flex items-center gap-2 text-coral-dark font-medium hover:gap-3 transition-all text-sm touch-target">\n\t\t\t\t{m.home_featured_see_all()}'),
        ('<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">Upcoming</span>', '<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">{m.home_schedule_badge()}</span>'),
        ('<h2 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold text-plum mb-2">\n\t\t\t\tตารางฉาย<span class="text-coral">เร็วๆ นี้</span>\n\t\t\t</h2>', '<h2 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold text-plum mb-2">\n\t\t\t\t{m.home_schedule_title_plain()}<span class="text-coral">{m.home_schedule_title_accent()}</span>\n\t\t\t</h2>'),
        ('<p class="text-sm sm:text-base text-plum-light">ไม่พลาดทุกตอนสำคัญ</p>', '<p class="text-sm sm:text-base text-plum-light">{m.home_schedule_subtitle()}</p>'),
    ])

def transform_series_poster_card():
    p = ROOT / 'src/lib/components/SeriesPosterCard.svelte'
    apply_replacements(p, [
        ("ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' }", "ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' }"),
        ("UPCOMING: { text: 'เร็วๆ นี้', class: 'bg-lavender/20 text-lavender-dark' }", "UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' }"),
        ("ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }", "ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }"),
    ])

def transform_series_detail_panel():
    p = ROOT / 'src/lib/components/SeriesDetailPanel.svelte'
    apply_replacements(p, [
        ("ONGOING: { text: 'กำลังฉาย', class: 'text-mint-dark', bg: 'bg-mint/20' }", "ONGOING: { text: m.status_ongoing(), class: 'text-mint-dark', bg: 'bg-mint/20' }"),
        ("UPCOMING: { text: ' upcoming', class: 'text-lavender-dark', bg: 'bg-lavender/20' }", "UPCOMING: { text: m.status_upcoming(), class: 'text-lavender-dark', bg: 'bg-lavender/20' }"),
        ("ENDED: { text: 'จบแล้ว', class: 'text-coral-dark', bg: 'bg-coral/10' }", "ENDED: { text: m.status_ended(), class: 'text-coral-dark', bg: 'bg-coral/10' }"),
        ("return `${valid.length} แพลตฟอร์ม`;", "return m.series_platform_count({ count: valid.length });"),
        ('<a href={`/series/${detail.id}`} class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">\n\t\t\tดูหน้าเต็ม\n\t\t</a>', '<a href={`/series/${detail.id}`} class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">\n\t\t\t{m.common_full_page()}\n\t\t</a>'),
        ('<div class="text-[10px] font-bold uppercase tracking-wide text-plum-light">ตอน</div>', '<div class="text-[10px] font-bold uppercase tracking-wide text-plum-light">{m.common_episodes()}</div>'),
        ('<div class="text-[10px] font-bold uppercase tracking-wide text-plum-light">ปีฉาย</div>', '<div class="text-[10px] font-bold uppercase tracking-wide text-plum-light">{m.common_year()}</div>'),
        ('<div class="text-[10px] font-bold uppercase tracking-wide text-plum-light">นักแสดง</div>', '<div class="text-[10px] font-bold uppercase tracking-wide text-plum-light">{m.common_cast()}</div>'),
        ('<h3 class="mb-3 text-base font-bold text-plum">นักแสดง</h3>', '<h3 class="mb-3 text-base font-bold text-plum">{m.common_cast()}</h3>'),
        ('<h3 class="text-base font-bold text-plum">ตารางฉาย</h3>', '<h3 class="text-base font-bold text-plum">{m.common_schedule()}</h3>'),
        ("{allExpanded ? 'ย่อทั้งหมด' : 'ขยายทั้งหมด'}", "{allExpanded ? m.common_collapse_all() : m.common_expand_all()}"),
        ('<span class="px-1.5 py-0.5 rounded-full bg-coral/15 text-coral-dark text-[9px] font-bold">วันนี้</span>', '<span class="px-1.5 py-0.5 rounded-full bg-coral/15 text-coral-dark text-[9px] font-bold">{m.common_today()}</span>'),
        ('alt={`EP ${item.episode}`}', 'alt={m.series_episode_cover_alt({ episode: item.episode })}'),
        ('>ดูเลย\n', '>{m.series_watch_now()}\n'),
    ])

def transform_series_detail_page():
    p = ROOT / 'src/routes/[lang=lang]/(app)/series/[id]/+page.svelte'
    apply_replacements(p, [
        ('<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-plum-light sm:text-xs">นักแสดง</div>', '<div class="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-plum-light sm:text-xs">{m.common_cast()}</div>'),
        ('>เปิด Trailer</a>', '>{m.series_trailer_open()}</a>'),
        ('>ดูเลย\n', '>{m.series_watch_now()}\n'),
    ])
    ps = ROOT / 'src/routes/[lang=lang]/(app)/series/[id]/+page.server.ts'
    apply_replacements(ps, [
        ("throw error(404, 'ไม่พบซีรีส์นี้');", "throw error(404, m.series_detail_not_found());"),
    ])

def transform_artist_detail_panel():
    p = ROOT / 'src/lib/components/ArtistDetailPanel.svelte'
    apply_replacements(p, [
        ('<a href={`/artists/${detail.id}`} class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">\n\t\t\t\tดูหน้าเต็ม\n\t\t\t</a>', '<a href={`/artists/${detail.id}`} class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">\n\t\t\t\t{m.common_full_page()}\n\t\t\t</a>'),
        ('<span class="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-bold text-lavender-dark">{detail.series.length} ผลงาน</span>', '<span class="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-bold text-lavender-dark">{m.artist_works_count_label({ count: detail.series.length })}</span>'),
        ('<span class="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-bold text-mint-dark">{detail.socials.length} ช่องทาง</span>', '<span class="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-bold text-mint-dark">{m.artist_socials_label({ count: detail.socials.length })}</span>'),
        ('<h3 class="mb-3 text-base font-bold text-plum">โซเชียลมีเดีย</h3>', '<h3 class="mb-3 text-base font-bold text-plum">{m.artist_socials_heading()}</h3>'),
        ('<span class="block truncate text-xs text-plum-light">เปิดลิงก์ภายนอก</span>', '<span class="block truncate text-xs text-plum-light">{m.common_open_external()}</span>'),
        ('<h3 class="mb-3 text-base font-bold text-plum">ผลงานซีรีส์</h3>', '<h3 class="mb-3 text-base font-bold text-plum">{m.artist_works_heading()}</h3>'),
        ('<p class="px-1 text-xs font-medium text-plum-light">รับบท: {work.roleName}</p>', '<p class="px-1 text-xs font-medium text-plum-light">{m.artist_works_role({ role: work.roleName })}</p>'),
    ])

def transform_artist_detail_page():
    p = ROOT / 'src/routes/[lang=lang]/(app)/artists/[id]/+page.server.ts'
    apply_replacements(p, [
        ("throw error(404, 'ไม่พบข้อมูลนักแสดง');", "throw error(404, m.artist_detail_not_found());"),
    ])

def transform_schedule_context_panel():
    p = ROOT / 'src/lib/components/ScheduleContextPanel.svelte'
    apply_replacements(p, [
        ('<h2 class="truncate text-sm font-bold text-plum">ตารางฉายที่เกี่ยวข้อง</h2>', '<h2 class="truncate text-sm font-bold text-plum">{m.schedule_context_title()}</h2>'),
        ('<p class="mt-0.5 text-xs text-plum-light">{totalEvents} รอบฉาย • {calendar.allSeries.length} เรื่อง</p>', '<p class="mt-0.5 text-xs text-plum-light">{@html m.schedule_context_summary({ events: totalEvents, series: calendar.allSeries.length })}</p>'),
        ('<a href="/{page.data.lang}/calendar" class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">ดูเต็ม</a>', '<a href="/{page.data.lang}/calendar" class="shrink-0 rounded-full border border-lavender/30 bg-white px-3 py-1.5 text-xs font-bold text-plum transition hover:bg-lavender/10">{m.schedule_context_full()}</a>'),
        ('<p class="text-sm text-plum-light">ยังไม่พบตารางฉายของข้อมูลนี้</p>', '<p class="text-sm text-plum-light">{m.schedule_context_empty()}</p>'),
        ('<span class="rounded-full bg-coral/10 px-2 py-1 text-[10px] font-bold text-coral-dark">{items.length} รอบ</span>', '<span class="rounded-full bg-coral/10 px-2 py-1 text-[10px] font-bold text-coral-dark">{m.schedule_context_rounds()}</span>'),
        ('<span class="rounded-full bg-coral/10 px-2 py-1 text-[10px] font-bold text-coral-dark">{day.items.length} รอบ</span>', '<span class="rounded-full bg-coral/10 px-2 py-1 text-[10px] font-bold text-coral-dark">{m.schedule_context_rounds()}</span>'),
        ('<h3 class="text-sm font-bold text-plum">วัน{day.day}</h3>', '<h3 class="text-sm font-bold text-plum">{m.schedule_context_day({ day: day.day })}</h3>'),
    ])

def transform_watched_button():
    p = ROOT / 'src/lib/components/WatchedButton.svelte'
    apply_replacements(p, [
        ("aria-label={isLoading ? 'กำลังโหลด' : watched ? 'เลิก mark ดูแล้ว' : 'mark ว่าดูแล้ว'}", "aria-label={isLoading ? m.watched_loading_aria() : watched ? m.watched_unmark_aria() : m.watched_mark_aria()}"),
        ("{isLoading ? 'กำลังเช็ก' : watched ? 'ดูแล้ว' : 'มาร์กว่าดูแล้ว'}", "{isLoading ? m.watched_loading_label() : watched ? m.watched_watched_label() : m.watched_unwatched_label()}"),
    ])

def transform_favorite_button():
    p = ROOT / 'src/lib/components/FavoriteButton.svelte'
    apply_replacements(p, [
        ("aria-label={isLoading ? 'กำลังโหลด' : favorited ? 'เลิก Favorite' : 'เพิ่ม Favorite'}", "aria-label={isLoading ? m.favorite_loading_aria() : favorited ? m.favorite_unmark_aria() : m.favorite_mark_aria()}"),
        ("{isLoading ? 'กำลังเช็ก' : favorited ? 'อยู่ในลิสต์' : 'เก็บเข้าลิสต์'}", "{isLoading ? m.favorite_loading_label() : favorited ? m.favorite_favorited_label() : m.favorite_unfavorited_label()}"),
    ])

def transform_notification_badge():
    p = ROOT / 'src/lib/components/NotificationBadge.svelte'
    apply_replacements(p, [
        ('aria-label="การแจ้งเตือน {count} รายการ"', 'aria-label={m.notifications_badge_aria({ count })}'),
    ])

def transform_profile():
    p = ROOT / 'src/routes/[lang=lang]/(app)/profile/+page.svelte'
    apply_replacements(p, [
        ("errorMessage = data.error || 'ไม่สามารถอัปเดตโปรไฟล์ได้';", "errorMessage = data.error || m.profile_update_error();"),
        ("errorMessage = 'ไม่สามารถอัปเดตโปรไฟล์ได้';", "errorMessage = m.profile_update_error();"),
        ("errorMessage = data.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้';", "errorMessage = data.error || m.profile_password_error();"),
        ("errorMessage = 'ไม่สามารถเปลี่ยนรหัสผ่านได้';", "errorMessage = m.profile_password_error();"),
        ('<title>โปรไฟล์ของฉัน | GL-Orbit</title>', '<title>{m.profile_seo_title()}</title>'),
        ('<meta name="description" content="จัดการโปรไฟล์ GL-Orbit ของคุณ — ดูรายการซีรีส์ที่ชอบและรับชม เปลี่ยนรหัสผ่าน และแก้ไขข้อมูลส่วนตัว" />', '<meta name="description" content={m.profile_seo_description()} />'),
        ("{s.status === 'ONGOING' ? 'กำลังฉาย' : s.status === 'UPCOMING' ? 'เร็วๆ นี้' : 'จบแล้ว'}", "{s.status === 'ONGOING' ? m.status_ongoing() : s.status === 'UPCOMING' ? m.status_upcoming() : m.status_ended()}"),
        ('>ไปดูซีรีส์ทั้งหมด\n', '>{m.profile_view_all_series()}\n'),
        ('>ลองอีกครั้ง\n', '>{m.profile_retry()}\n'),
        ('>แก้ไขโปรไฟล์\n', '>{m.profile_edit()}\n'),
        ('title="ผู้ดูแลระบบ"', 'title={m.profile_admin_badge()}'),
    ])
    ps = ROOT / 'src/routes/[lang=lang]/(app)/profile/+page.server.ts'
    apply_replacements(ps, [
        ("studio: s.studioName ?? 'ไม่ระบุสตูดิโอ'", "studio: s.studioName ?? m.profile_unknown_studio()"),
    ])

def transform_explore():
    # layout
    pl = ROOT / 'src/routes/[lang=lang]/(app)/explore/+layout.svelte'
    apply_replacements(pl, [
        ("{ id: 'series', href: '/explore/series', label: 'ซีรีส์', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4' }", "{ id: 'series', href: '/explore/series', label: m.nav_series(), icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4' }"),
        ("{ id: 'artists', href: '/explore/artists', label: 'นักแสดง', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }", "{ id: 'artists', href: '/explore/artists', label: m.nav_artists(), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }"),
        ('<span class="text-gradient">สำรวจ</span>', '<span class="text-gradient">{m.nav_explore()}</span>'),
        ('<p class="text-sm sm:text-base text-plum-light">ค้นหาซีรีส์และนักแสดง GL ที่คุณชื่นชอบ</p>', '<p class="text-sm sm:text-base text-plum-light">{m.explore_subtitle()}</p>'),
    ])

    # series
    ps = ROOT / 'src/routes/[lang=lang]/(app)/explore/series/+page.svelte'
    apply_replacements(ps, [
        ("ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' }", "ONGOING: { text: m.status_ongoing(), class: 'bg-mint/20 text-mint-dark' }"),
        ("UPCOMING: { text: 'เร็วๆ นี้', class: 'bg-lavender/20 text-lavender-dark' }", "UPCOMING: { text: m.status_upcoming(), class: 'bg-lavender/20 text-lavender-dark' }"),
        ("ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }", "ENDED: { text: m.status_ended(), class: 'bg-coral/10 text-coral-dark' }"),
        ("{ key: 'ALL', label: 'ทั้งหมด' }", "{ key: 'ALL', label: m.filter_all() }"),
        ("{ key: 'ONGOING', label: 'กำลังฉาย' }", "{ key: 'ONGOING', label: m.status_ongoing() }"),
        ("{ key: 'UPCOMING', label: 'เร็วๆ นี้' }", "{ key: 'UPCOMING', label: m.status_upcoming() }"),
        ("{ key: 'ENDED', label: 'จบแล้ว' }", "{ key: 'ENDED', label: m.status_ended() }"),
        ("loadMoreError = 'โหลดเพิ่มไม่สำเร็จ ลองอีกครั้ง';", "loadMoreError = m.load_more_error();"),
        ('<title>สำรวจซีรีส์ GL | GL-Orbit</title>', '<title>{m.explore_series_seo_title()}</title>'),
        ('<meta name="description" content="สำรวจซีรีส์ Girls\' Love ทั้งหมด พร้อมตารางฉายและข้อมูลครบถ้วน" />', '<meta name="description" content={m.explore_series_seo_description()} />'),
        ('placeholder="ค้นหาชื่อซีรีส์..." aria-label="ค้นหาซีรีส์"', 'placeholder={m.series_search_placeholder()} aria-label={m.series_search_label()}'),
        ('aria-label="ล้างการค้นหา"', 'aria-label={m.common_search_clear()}'),
        ('>กำลังโหลด...\n', '>{m.common_loading()}\n'),
        ('>ดูเพิ่มเติม\n', '>{m.common_load_more()}\n'),
        ('<h3 class="font-semibold text-plum mb-1">ไม่พบซีรีส์</h3>', '<h3 class="font-semibold text-plum mb-1">{m.series_empty_title()}</h3>'),
        ('>ลองค้นหาด้วยคำอื่น หรือ <button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">ล้างการค้นหา</button>', '>{m.series_empty_search_prompt()}<button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">{m.common_search_clear()}</button>'),
        ('>ไม่พบซีรีส์ในหมวดหมู่นี้<', '>{m.series_empty_category()}<'),
    ])

    # artists
    pa = ROOT / 'src/routes/[lang=lang]/(app)/explore/artists/+page.svelte'
    apply_replacements(pa, [
        ("{ label: 'หัวใจ', path: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 4.876 9.623 3.75 7.688 3.75 5.099 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' }", "{ label: m.artist_filter_heart(), path: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 4.876 9.623 3.75 7.688 3.75 5.099 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' }"),
        ("{ label: 'ดาว', path: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557L3.04 10.385a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z' }", "{ label: m.artist_filter_star(), path: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557L3.04 10.385a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z' }"),
        ("{ label: 'ประกาย', path: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.091-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.091L9 5.25l.813 2.846a4.5 4.5 0 003.091 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.091zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z' }", "{ label: m.artist_filter_sparkle(), path: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.091-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.091L9 5.25l.813 2.846a4.5 4.5 0 003.091 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.091zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 002.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z' }"),
        ("loadMoreError = 'โหลดเพิ่มไม่สำเร็จ ลองอีกครั้ง';", "loadMoreError = m.load_more_error();"),
        ('<title>สำรวจนักแสดง GL | GL-Orbit</title>', '<title>{m.explore_artists_seo_title()}</title>'),
        ('<meta name="description" content="สำรวจนักแสดงซีรีส์ Girls\' Love พร้อมผลงานและโซเชียลมีเดีย" />', '<meta name="description" content={m.explore_artists_seo_description()} />'),
        ('placeholder="ค้นหาชื่อนักแสดง..." aria-label="ค้นหานักแสดง"', 'placeholder={m.artist_search_placeholder()} aria-label={m.artist_search_label()}'),
        ('aria-label="ล้างการค้นหา"', 'aria-label={m.common_search_clear()}'),
        ('>กำลังโหลด...\n', '>{m.common_loading()}\n'),
        ('>ดูเพิ่มเติม\n', '>{m.common_load_more()}\n'),
        ('>{a.seriesCount} ผลงาน</span>', '>{m.artist_works_count({ count: a.seriesCount })}</span>'),
        ('>ยังไม่มีผลงาน</span>', '>{m.artist_no_works()}</span>'),
        ('>ดูโปรไฟล์</span>', '>{m.artist_view_profile()}</span>'),
        ('<h3 class="font-semibold text-plum mb-1">ไม่พบนักแสดง</h3>', '<h3 class="font-semibold text-plum mb-1">{m.artist_list_empty_title()}</h3>'),
        ('>ลองค้นหาด้วยคำอื่น หรือ <button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">ล้างการค้นหา</button>', '>{m.artist_list_empty_search_prompt()}<button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">{m.common_search_clear()}</button>'),
        ('>ยังไม่มีนักแสดงในระบบ<', '>{m.artist_list_empty_category()}<'),
    ])

def transform_about():
    p = ROOT / 'src/routes/[lang=lang]/(app)/about/+page.svelte'
    apply_replacements(p, [
        ('const ABOUT_SEO_TITLE = \'เกี่ยวกับ GL-Orbit | คู่มือติดตามซีรีส์ GL สำหรับแฟนคลับ\';', 'const ABOUT_SEO_TITLE = m.about_hero_title();'),
        ('const ABOUT_SEO_DESCRIPTION = \'รู้จัก GL-Orbit ศูนย์รวมตารางฉายซีรีส์ Girls\' Love ข้อมูลนักแสดง แพลตฟอร์มรับชม เวอร์ชัน Uncut และคำแนะนำสำหรับแฟนคลับ GL\';', "const ABOUT_SEO_DESCRIPTION = m.about_hero_subtitle();"),
        ('<title>{ABOUT_SEO_TITLE}</title>', '<title>{m.about_hero_title()}</title>'),
        ('<meta name="description" content={ABOUT_SEO_DESCRIPTION} />', '<meta name="description" content={m.about_hero_subtitle()} />'),
        ('<span class="h-2 w-2 rounded-full bg-coral"></span>\n\t\t\tAbout GL-Orbit', '<span class="h-2 w-2 rounded-full bg-coral"></span>\n\t\t\t{m.about_hero_badge()}'),
        ('<h1 class="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-plum sm:text-6xl">\n\t\t\tคู่มือติดตาม<span class="text-gradient">ซีรีส์ GL</span>\n\t\t</h1>', '<h1 class="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-plum sm:text-6xl">\n\t\t\t{m.about_hero_title()}\n\t\t</h1>'),
        ('<p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-plum-light sm:text-lg">\n\t\t\tรู้จักแนวคิดของ GL-Orbit วิธีใช้ตารางฉาย ข้อมูล Girls\' Love series แพลตฟอร์มรับชม และคำถามที่แฟนคลับ GL มักอยากรู้ก่อนเริ่มติดตามเรื่องใหม่\n\t\t</p>', '<p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-plum-light sm:text-lg">\n\t\t\t{m.about_hero_subtitle()}\n\t\t</p>'),
        ('<p class="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum-light/70">\n\t\t\tอัปเดตล่าสุด: {LAST_UPDATED_LABEL}\n\t\t</p>', '<p class="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum-light/70">\n\t\t\t{m.about_last_updated({ date: LAST_UPDATED_LABEL })}\n\t\t</p>'),
        ('>ดูตารางฉาย\n', '>{m.about_cta_schedule()}\n'),
        ('>กลับหน้าแรก\n', '>{m.about_cta_home()}\n'),
        ('AI Search Answers', '{m.about_ai_section_badge()}'),
        ('คำตอบสั้นที่ AI ดึงไปอ้างอิงได้ง่าย', '{m.about_ai_section_title()}'),
        ('สรุปประเด็นสำคัญเกี่ยวกับ GL-Orbit ในรูปแบบคำถาม-คำตอบที่อ่านเข้าใจได้ทันที เหมาะกับทั้งผู้ใช้ใหม่และระบบค้นหาที่ต้องการคำตอบแบบ self-contained', '{m.about_ai_section_desc()}'),
        ('§ 01 · Guide', '§ 01 · {m.about_guide_badge()}'),
        ('GL-Orbit คืออะไร', '{m.about_guide_title()}'),
        ('§ 02 · How to use', '§ 02 · {m.about_howto_badge()}'),
        ('เริ่มใช้งาน<span class="text-coral">อย่างไร</span>', '{m.about_howto_title()}'),
        ('§ 03 · GL 101', '§ 03 · {m.about_gl101_badge()}'),
        ('ทำความรู้จัก<span class="text-coral">ซีรีส์ GL</span>', '{m.about_gl101_title()}'),
        ('สำหรับผู้ชมใหม่และแฟนคลับที่อยากเข้าใจจักรวาลซีรีส์ Girls\' Love ให้ลึกซึ้งยิ่งขึ้น GL-Orbit สรุปประเด็นสำคัญที่ช่วยให้เริ่มต้นติดตามซีรีส์ GL ได้ง่ายและไม่พลาดบริบทของแต่ละเรื่อง', '{m.about_lead()}'),
        ('§ 04 · Streaming', '§ 04 · {m.about_streaming_badge()}'),
        ('รับชมได้<span class="text-coral">ที่ไหน</span>', '{m.about_streaming_title()}'),
        ('§ 05 · FAQ', '§ 05 · {m.about_faq_badge()}'),
        ('คำถามที่พบบ่อย', '{m.about_faq_title()}'),
        ('{ name: \'หน้าแรก\', path: \'/\' }', '{ name: m.about_breadcrumb_home(), path: \'/\' }'),
        ('{ name: \'เกี่ยวกับ GL-Orbit\', path: \'/about\' }', '{ name: m.about_breadcrumb_about(), path: \'/about\' }'),
    ])

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    add_keys()
    transform_landing()
    transform_series_poster_card()
    transform_series_detail_panel()
    transform_series_detail_page()
    transform_artist_detail_panel()
    transform_artist_detail_page()
    transform_schedule_context_panel()
    transform_watched_button()
    transform_favorite_button()
    transform_notification_badge()
    transform_profile()
    transform_explore()
    transform_about()
    print('Task 8 final audit translations applied.')

if __name__ == '__main__':
    main()
