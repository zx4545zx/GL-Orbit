#!/usr/bin/env python3
"""Task 5 (calendar main page): translate remaining Thai strings."""
import json
from pathlib import Path

ROOT = Path('/Users/syaco/workspace/private/.worktrees/feature/i18n-phase2-public-pages')
MESSAGES_DIR = ROOT / 'messages'
PAGE = ROOT / 'src/routes/[lang=lang]/(app)/calendar/+page.svelte'

MESSAGES = {
    'calendar_breadcrumb': {'th': 'ตารางฉาย', 'en': 'Schedule'},
    'calendar_title_plain': {'th': 'ตารางฉาย', 'en': 'Schedule'},
    'calendar_subtitle': {'th': 'เปิดมาปุ๊บรู้ทันทีว่าวันนี้และสัปดาห์นี้มีเรื่องไหนฉาย กี่โมง และดูได้ที่แพลตฟอร์มไหน', 'en': 'See at a glance which series air today and this week, what time, and on which platform'},
    'calendar_today_label': {'th': 'วันนี้', 'en': 'Today'},
    'calendar_today_count_label': {'th': 'รายการฉาย', 'en': 'airings'},
    'calendar_week_label': {'th': 'สัปดาห์นี้', 'en': 'This week'},
    'calendar_week_count_label': {'th': 'รายการทั้งหมด', 'en': 'total'},
    'calendar_featured_label': {'th': 'ไฮไลต์ถัดไป', 'en': 'Next highlight'},
    'calendar_featured_empty': {'th': 'ยังไม่มีคิวฉาย', 'en': 'No upcoming airings'},
    'calendar_featured_empty_sub': {'th': 'ลองดูสัปดาห์ถัดไป', 'en': 'Check next week'},
    'calendar_this_week_cta': {'th': 'ดูสัปดาห์นี้', 'en': 'View this week'},
    'calendar_view_week': {'th': 'สัปดาห์', 'en': 'Week'},
    'calendar_view_list': {'th': 'ลิสต์', 'en': 'List'},
    'calendar_view_month_calendar': {'th': 'ปฏิทินเดือน', 'en': 'Month Calendar'},
    'calendar_view_month_grid': {'th': 'ตารางเดือน', 'en': 'Month Grid'},
    'calendar_month_prev_aria': {'th': 'เดือนก่อนหน้า', 'en': 'Previous month'},
    'calendar_month_next_aria': {'th': 'เดือนถัดไป', 'en': 'Next month'},
    'calendar_month_today_aria': {'th': 'เดือนนี้', 'en': 'This month'},
    'calendar_month_today_text': {'th': 'เดือนนี้', 'en': 'This month'},
    'calendar_grid_series_header': {'th': 'ซีรีส์', 'en': 'Series'},
    'calendar_legend_has_event': {'th': 'มีซีรีส์ฉาย', 'en': 'Has airing'},
    'calendar_today_badge': {'th': 'วันนี้', 'en': 'Today'},
    'calendar_selected_count': {'th': 'มี {count} รายการ', 'en': '{count} items'},
    'calendar_selected_empty': {'th': 'ไม่มีซีรีส์ฉายในวันนี้', 'en': 'No series airing today'},
    'calendar_selected_hint': {'th': 'เลือกวันที่มีจุดสีชมพู\nเพื่อดูรายละเอียด', 'en': 'Select a day with a pink dot\nto see details'},
    'calendar_detail_link': {'th': 'ดูรายละเอียด', 'en': 'View details'},
    'calendar_list_detail_aria': {'th': 'ดูรายละเอียด', 'en': 'View details'},
    'calendar_countdown_cta_title': {'th': 'นับถอยหลัง · ซีรีส์ใกล้ฉาย', 'en': 'Countdown · Airing soon'},
    'calendar_countdown_cta_desc': {'th': 'ติดตามซีรีส์ที่กำลังจะออกอากาศภายใน 7 วันนี้', 'en': 'Track series airing within the next 7 days'},
    'calendar_notes_title': {'th': 'หมายเหตุ', 'en': 'Note'},
    'calendar_notes_body': {'th': 'เวลาฉายแสดงตามเวลาในประเทศไทย หากมีการเปลี่ยนแปลงตารางฉาย ระบบจะอัปเดตให้โดยอัตโนมัติ ติ่งทุกคนสามารถตรวจสอบเวลาฉาย Uncut version ได้จากป้ายกำกับ', 'en': 'Air times are shown in Thailand timezone. If the schedule changes, the system will update automatically. Fans can check Uncut version air times from the badge.'},
}


def add_messages():
    for fname in ('th.json', 'en.json'):
        path = MESSAGES_DIR / fname
        data = json.loads(path.read_text(encoding='utf-8'))
        for key, vals in MESSAGES.items():
            data[key] = vals[fname.split('.')[0]]
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def apply_replacements():
    content = PAGE.read_text(encoding='utf-8')

    # Breadcrumb
    content = content.replace(
        "{ label: 'หน้าแรก', path: '/' },\n\t\t{ label: 'ตารางฉาย', path: '/calendar' }",
        "{ label: m.nav_home(), path: '/' },\n\t\t{ label: m.calendar_breadcrumb(), path: '/calendar' }"
    )

    # View buttons
    content = content.replace(
        """\tconst viewButtons = [
\t\t{ id: 'card' as const, label: 'สัปดาห์', short: 'สัปดาห์', group: 'primary', icon: '<path d=\"M2 6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm10.5 0a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V6zM2 16a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6zm10.5 0a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-6z\"/>' },
\t\t{ id: 'list' as const, label: 'ลิสต์', short: 'ลิสต์', group: 'primary', icon: '<path d=\"M4 6h16M4 12h16M4 18h16\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' },
\t\t{ id: 'calendar' as const, label: 'ปฏิทินเดือน', short: 'เดือน', group: 'monthly', icon: '<path d=\"M8 2V6M16 2V6M3 10H21M5 6H19a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' },
\t\t{ id: 'grid' as const, label: 'ตารางเดือน', short: 'ตาราง', group: 'monthly', icon: '<path d=\"M9 17V7M3 17V7M15 17V7M21 17V7M3 12h18M3 7h18M3 17h18\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' }
\t];""",
        """\tconst viewButtons = [
\t\t{ id: 'card' as const, label: m.calendar_view_week(), short: m.calendar_view_week(), group: 'primary', icon: '<path d=\"M2 6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm10.5 0a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V6zM2 16a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6zm10.5 0a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-6z\"/>' },
\t\t{ id: 'list' as const, label: m.calendar_view_list(), short: m.calendar_view_list(), group: 'primary', icon: '<path d=\"M4 6h16M4 12h16M4 18h16\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' },
\t\t{ id: 'calendar' as const, label: m.calendar_view_month_calendar(), short: m.calendar_view_month_calendar(), group: 'monthly', icon: '<path d=\"M8 2V6M16 2V6M3 10H21M5 6H19a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' },
\t\t{ id: 'grid' as const, label: m.calendar_view_month_grid(), short: m.calendar_view_month_grid(), group: 'monthly', icon: '<path d=\"M9 17V7M3 17V7M15 17V7M21 17V7M3 12h18M3 7h18M3 17h18\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>' }
\t];"""
    )

    # Month header labels
    content = content.replace(
        "\t\t\t\t\t<div class=\"text-[11px] sm:text-xs font-bold text-coral-dark uppercase tracking-wide mb-0.5\">\n\t\t\t\t\t\t{viewMode === 'grid' ? 'ตารางเดือน' : 'ปฏิทินเดือน'}\n\t\t\t\t\t</div>",
        "\t\t\t\t\t<div class=\"text-[11px] sm:text-xs font-bold text-coral-dark uppercase tracking-wide mb-0.5\">\n\t\t\t\t\t\t{viewMode === 'grid' ? m.calendar_month_header_grid() : m.calendar_month_header_calendar()}\n\t\t\t\t\t</div>"
    )

    # Month navigation aria labels
    content = content.replace(
        'aria-label="เดือนก่อนหน้า"',
        'aria-label={m.calendar_month_prev_aria()}'
    )
    content = content.replace(
        'aria-label="เดือนนี้"\n\t\t\t\t\tclass="hidden sm:inline-flex',
        'aria-label={m.calendar_month_today_aria()}\n\t\t\t\t\tclass="hidden sm:inline-flex'
    )
    content = content.replace(
        'aria-label="เดือนนี้"\n\t\t\t\t\tclass="sm:hidden',
        'aria-label={m.calendar_month_today_aria()}\n\t\t\t\t\tclass="sm:hidden'
    )
    content = content.replace(
        'aria-label="เดือนถัดไป"',
        'aria-label={m.calendar_month_next_aria()}'
    )
    content = content.replace(
        "เดือนนี้\n\t\t\t\t</button>",
        "{m.calendar_month_today_text()}\n\t\t\t\t</button>"
    )

    # Hero title/subtitle
    content = content.replace(
        "ตารางฉาย<span class=\"text-coral\"> GL</span>",
        "{m.calendar_title_plain()}<span class=\"text-coral\"> GL</span>"
    )
    content = content.replace(
        "เปิดมาปุ๊บรู้ทันทีว่าวันนี้และสัปดาห์นี้มีเรื่องไหนฉาย กี่โมง และดูได้ที่แพลตฟอร์มไหน",
        "{m.calendar_subtitle()}"
    )

    # Hero stats
    content = content.replace(
        "<div class=\"text-xs font-medium text-plum-light mb-1\">วันนี้</div>",
        "<div class=\"text-xs font-medium text-plum-light mb-1\">{m.calendar_today_label()}</div>"
    )
    content = content.replace(
        "<div class=\"text-[11px] text-plum-light\">รายการฉาย</div>",
        "<div class=\"text-[11px] text-plum-light\">{m.calendar_today_count_label()}</div>"
    )
    content = content.replace(
        "<div class=\"text-xs font-medium text-plum-light mb-1\">สัปดาห์นี้</div>",
        "<div class=\"text-xs font-medium text-plum-light mb-1\">{m.calendar_week_label()}</div>"
    )
    content = content.replace(
        "<div class=\"text-[11px] text-plum-light\">รายการทั้งหมด</div>",
        "<div class=\"text-[11px] text-plum-light\">{m.calendar_week_count_label()}</div>"
    )
    content = content.replace(
        "<div class=\"text-xs font-medium text-plum-light mb-1\">ไฮไลต์ถัดไป</div>",
        "<div class=\"text-xs font-medium text-plum-light mb-1\">{m.calendar_featured_label()}</div>"
    )
    content = content.replace(
        "<div class=\"text-sm font-bold text-plum\">ยังไม่มีคิวฉาย</div>",
        "<div class=\"text-sm font-bold text-plum\">{m.calendar_featured_empty()}</div>"
    )
    content = content.replace(
        "<div class=\"text-xs text-plum-light mt-1\">ลองดูสัปดาห์ถัดไป</div>",
        "<div class=\"text-xs text-plum-light mt-1\">{m.calendar_featured_empty_sub()}</div>"
    )
    content = content.replace(
        "ดูสัปดาห์นี้\n\t\t\t\t\t</button>",
        "{m.calendar_this_week_cta()}\n\t\t\t\t\t</button>"
    )

    # Grid series header and day short names
    content = content.replace(
        "<div class=\"flex-1 text-center text-xs font-medium text-plum-light\">ซีรีส์</div>",
        "<div class=\"flex-1 text-center text-xs font-medium text-plum-light\">{m.calendar_grid_series_header()}</div>"
    )
    content = content.replace(
        """{#if dayOfWeek === 0}อา
\t\t\t\t\t\t\t{:else if dayOfWeek === 1}จ
\t\t\t\t\t\t\t{:else if dayOfWeek === 2}อ
\t\t\t\t\t\t\t{:else if dayOfWeek === 3}พ
\t\t\t\t\t\t\t{:else if dayOfWeek === 4}พฤ
\t\t\t\t\t\t\t{:else if dayOfWeek === 5}ศ
\t\t\t\t\t\t\t{:else}ส
\t\t\t\t\t\t\t{/if}""",
        "{weekDays[dayOfWeek]}"
    )

    # Today badge in calendar
    content = content.replace(
        '">วันนี้</span>',
        '">{m.calendar_today_badge()}</span>'
    )

    # Legend
    content = content.replace(
        "<span>มีซีรีส์ฉาย</span>",
        "<span>{m.calendar_legend_has_event()}</span>"
    )
    content = content.replace(
        "<span>วันนี้</span>",
        "<span>{m.calendar_today_badge()}</span>"
    )

    # Selected detail panel
    content = content.replace(
        "<p class=\"text-sm text-plum-light mb-4 sm:mb-5\">มี {selectedEvents.length} รายการ</p>",
        "<p class=\"text-sm text-plum-light mb-4 sm:mb-5\">{m.calendar_selected_count({ count: selectedEvents.length })}</p>"
    )
    content = content.replace(
        "<p class=\"text-base sm:text-lg font-bold text-plum mb-1\">ไม่มีซีรีส์ฉายในวันนี้</p>",
        "<p class=\"text-base sm:text-lg font-bold text-plum mb-1\">{m.calendar_selected_empty()}</p>"
    )
    content = content.replace(
        "เลือกวันที่มีจุดสีชมพู<br/>เพื่อดูรายละเอียด",
        "{@html m.calendar_selected_hint().replace('\\n', '<br/>')}"
    )
    content = content.replace(
        "class=\"inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-coral text-white text-sm font-bold hover:bg-coral-dark transition-colors\">\n\t\t\t\t\t\t\t\t\t\t\tดูรายละเอียด",
        "class=\"inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-coral text-white text-sm font-bold hover:bg-coral-dark transition-colors\">\n\t\t\t\t\t\t\t\t\t\t\t{m.calendar_detail_link()}"
    )

    # List detail aria label
    content = content.replace(
        'aria-label="ดูรายละเอียด"',
        'aria-label={m.calendar_list_detail_aria()}'
    )

    # Countdown CTA
    content = content.replace(
        "<h3 class=\"font-[family-name:var(--font-display)] text-base sm:text-lg font-bold text-plum\">นับถอยหลัง · ซีรีส์ใกล้ฉาย</h3>",
        "<h3 class=\"font-[family-name:var(--font-display)] text-base sm:text-lg font-bold text-plum\">{m.calendar_countdown_cta_title()}</h3>"
    )
    content = content.replace(
        "<p class=\"text-sm text-plum-light\">ติดตามซีรีส์ที่กำลังจะออกอากาศภายใน 7 วันนี้</p>",
        "<p class=\"text-sm text-plum-light\">{m.calendar_countdown_cta_desc()}</p>"
    )

    # Notes
    content = content.replace(
        "<h3 class=\"font-[family-name:var(--font-display)] text-base\">หมายเหตุ</h3>",
        "<h3 class=\"font-[family-name:var(--font-display)] text-base\">{m.calendar_notes_title()}</h3>"
    )
    content = content.replace(
        "<p class=\"text-sm text-plum-light leading-relaxed\">เวลาฉายแสดงตามเวลาในประเทศไทย หากมีการเปลี่ยนแปลงตารางฉาย ระบบจะอัปเดตให้โดยอัตโนมัติ ติ่งทุกคนสามารถตรวจสอบเวลาฉาย Uncut version ได้จากป้ายกำกับ</p>",
        "<p class=\"text-sm text-plum-light leading-relaxed\">{m.calendar_notes_body()}</p>"
    )

    PAGE.write_text(content, encoding='utf-8')


if __name__ == '__main__':
    add_messages()
    apply_replacements()
    print('Calendar main page replacements applied.')
