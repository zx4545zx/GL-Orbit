#!/usr/bin/env python3
"""Task 7: Translate shared public components (Thai -> Paraglide)."""
import json
import re
from pathlib import Path
from collections import OrderedDict

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src' / 'lib' / 'components'

def load_messages(path: Path) -> OrderedDict:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def save_messages(path: Path, data: OrderedDict) -> None:
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

def add_import_m(content: str) -> str:
    """Insert `import { m } from '$lib/i18n/paraglide.js';` if not present."""
    if "import { m } from '$lib/i18n/paraglide.js'" in content:
        return content
    # Insert after the first <script lang="ts"> block or other imports
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
        # nav
        'nav_explore': ('สำรวจ', 'Explore'),
        'nav_chat': ('AI Chat', 'AI Chat'),
        'nav_admin': ('จัดการ', 'Manage'),
        'nav_profile': ('โปรไฟล์', 'Profile'),
        'nav_notifications': ('แจ้งเตือน', 'Notifications'),
        'nav_register': ('สมัครสมาชิก', 'Register'),

        # footer
        'footer_tagline': ('ศูนย์กลางข้อมูลและตารางฉายสำหรับแฟนคลับซีรีส์ GL', 'The central hub and schedule board for GL series fans'),
        'footer_quick_links': ('ลิงก์ด่วน', 'Quick links'),
        'footer_about': ('เกี่ยวกับเรา', 'About us'),
        'footer_about_1': ('ข้อมูลเวลาฉายแม่นยำ', 'Accurate air time data'),
        'footer_about_2': ('รองรับ Uncut version', 'Supports Uncut version'),
        'footer_about_3': ('ออกแบบมาเพื่อติ่งโดยเฉพาะ', 'Designed for fans'),
        'footer_made_with': ('สร้างด้วย 💖 สำหรับชุมชนแฟนคลับ GL', 'Created with 💖 for the GL fan community'),
        'footer_all_series': ('ซีรีส์ทั้งหมด', 'All series'),

        # share
        'share_aria_label': ('แชร์', 'Share'),
        'share_command_title': ('ส่งต่อให้เพื่อน', 'Share with friends'),
        'share_menu_label': ('ตัวเลือกแชร์', 'Share options'),
        'share_to': ('แชร์ไปยัง', 'Share to'),
        'share_copy': ('คัดลอกลิงก์', 'Copy link'),
        'share_copied': ('คัดลอกลิงก์แล้ว', 'Link copied'),

        # confirm dialog
        'confirm_default_title': ('ยืนยันการลบ', 'Confirm deletion'),
        'confirm_default_message': ('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้', 'Are you sure you want to delete this item? This action cannot be undone.'),
        'confirm_default_confirm': ('ลบ', 'Delete'),
        'confirm_default_cancel': ('ยกเลิก', 'Cancel'),

        # common close
        'common_close': ('ปิด', 'Close'),

        # pagination
        'pagination_showing': ('แสดง <span class="font-medium text-plum">{start}</span> – <span class="font-medium text-plum">{end}</span> จาก <span class="font-medium text-plum">{total}</span> รายการ', 'Showing <span class="font-medium text-plum">{start}</span> – <span class="font-medium text-plum">{end}</span> of <span class="font-medium text-plum">{total}</span> items'),
        'pagination_prev_aria': ('หน้าก่อนหน้า', 'Previous page'),
        'pagination_next_aria': ('หน้าถัดไป', 'Next page'),

        # back to top
        'back_to_top_aria': ('กลับขึ้นบนสุด', 'Back to top'),

        # password input
        'password_input_default_label': ('รหัสผ่าน', 'Password'),
        'password_input_show_aria': ('แสดงรหัสผ่าน', 'Show password'),
        'password_input_hide_aria': ('ซ่อนรหัสผ่าน', 'Hide password'),

        # notification dropdown
        'notifications_view_more': ('ดูเพิ่มเติม', 'View more'),
        'notifications_aria_label': ('การแจ้งเตือน', 'Notifications'),
    }

    for key, (th_val, en_val) in new_pairs.items():
        if key not in th:
            th[key] = th_val
        if key not in en:
            en[key] = en_val

    save_messages(ROOT / 'messages' / 'th.json', th)
    save_messages(ROOT / 'messages' / 'en.json', en)

# ---------------------------------------------------------------------------
# 2. Component transformations
# ---------------------------------------------------------------------------

def update_footer(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    # tagline
    content = content.replace(
        'ศูนย์กลางข้อมูลและตารางฉายสำหรับแฟนคลับซีรีส์ GL',
        '{m.footer_tagline()}',
    )
    # quick links heading
    content = content.replace('>ลิงก์ด่วน<', '>{m.footer_quick_links()}<')
    # link labels
    content = content.replace('>หน้าแรก<', '>{m.nav_home()}<')
    content = content.replace('>ตารางฉาย<', '>{m.nav_calendar()}<')
    content = content.replace('>ซีรีส์ทั้งหมด<', '>{m.footer_all_series()}<')
    content = content.replace('>โปรไฟล์<', '>{m.nav_profile()}<')
    content = content.replace('>เข้าสู่ระบบ<', '>{m.nav_login()}<')
    content = content.replace('>สมัครสมาชิก<', '>{m.nav_register()}<')
    # about heading
    content = content.replace('>เกี่ยวกับเรา<', '>{m.footer_about()}<')
    # about items
    content = content.replace('>ข้อมูลเวลาฉายแม่นยำ<', '>{m.footer_about_1()}<')
    content = content.replace('>รองรับ Uncut version<', '>{m.footer_about_2()}<')
    content = content.replace('>ออกแบบมาเพื่อติ่งโดยเฉพาะ<', '>{m.footer_about_3()}<')
    # copyright
    content = content.replace(
        '<p class="text-xs text-plum-light/60">\n\t\t\t\t© 2026 GL-Orbit. สร้างด้วย 💖 สำหรับชุมชนแฟนคลับ GL\n\t\t\t</p>',
        '<p class="text-xs text-plum-light/60">\n\t\t\t\t{m.footer_copyright({ year: new Date().getFullYear() })} {m.footer_made_with()}\n\t\t\t</p>',
    )
    path.write_text(content, encoding='utf-8')

def update_notification_dropdown(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    # Replace Thai error strings
    content = content.replace(
        "throw new Error('ไม่สามารถโหลดการแจ้งเตือนได้')",
        "throw new Error(m.notifications_load_error())",
    )
    content = content.replace(
        "error = 'ไม่สามารถโหลดการแจ้งเตือนได้'",
        "error = m.notifications_load_error()",
    )
    # Replace formatRelativeTime function with localized version
    old_func = re.search(r'\tfunction formatRelativeTime\(dateStr: string\): string \{[^}]+\}\n', content, re.DOTALL)
    if old_func:
        new_func = '''\tfunction formatRelativeTime(dateStr: string): string {
\t\tconst now = Date.now();
\t\tconst date = new Date(dateStr).getTime();
\t\tconst diffMs = now - date;
\t\tconst diffSeconds = Math.floor(diffMs / 1000);
\t\tconst diffMinutes = Math.floor(diffSeconds / 60);
\t\tconst diffHours = Math.floor(diffMinutes / 60);
\t\tconst diffDays = Math.floor(diffHours / 24);
\t\tconst rtf = new Intl.RelativeTimeFormat(page.data.lang, { numeric: 'auto' });
\t\tif (diffSeconds < 60) return rtf.format(-diffSeconds, 'second');
\t\tif (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute');
\t\tif (diffHours < 24) return rtf.format(-diffHours, 'hour');
\t\tif (diffDays < 7) return rtf.format(-diffDays, 'day');
\t\treturn new Date(dateStr).toLocaleDateString(page.data.lang, { day: 'numeric', month: 'short' });
\t}\n'''
        content = content.replace(old_func.group(), new_func)
    # aria-label
    content = content.replace('aria-label="การแจ้งเตือน"', 'aria-label={m.notifications_aria_label()}')
    # header title
    content = content.replace('>การแจ้งเตือน<', '>{m.notifications_title()}<')
    # mark all
    content = content.replace('>อ่านทั้งหมด<', '>{m.notifications_mark_all()}<')
    # empty
    content = content.replace('>ไม่มีการแจ้งเตือน<', '>{m.notifications_empty()}<')
    # view more
    content = content.replace('>ดูเพิ่มเติม<', '>{m.notifications_view_more()}<')
    path.write_text(content, encoding='utf-8')

def update_share_button(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    # default ariaLabel
    content = content.replace("ariaLabel = 'แชร์'", "ariaLabel = m.share_aria_label()")
    # command title
    content = content.replace('>ส่งต่อให้เพื่อน<', '>{m.share_command_title()}<')
    # compact label
    content = content.replace('>แชร์</span>', '>{m.share_aria_label()}</span>')
    # menu label
    content = content.replace('aria-label="ตัวเลือกแชร์"', 'aria-label={m.share_menu_label()}')
    # share to heading
    content = content.replace('>แชร์ไปยัง<', '>{m.share_to()}<')
    # copy labels
    content = content.replace("'คัดลอกลิงก์แล้ว'", "m.share_copied()")
    content = content.replace("'คัดลอกลิงก์'", "m.share_copy()")
    path.write_text(content, encoding='utf-8')

def update_confirm_dialog(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    # default prop values
    content = content.replace(
        "title = 'ยืนยันการลบ'",
        "title = m.confirm_default_title()",
    )
    content = content.replace(
        "message = 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้'",
        "message = m.confirm_default_message()",
    )
    content = content.replace(
        "confirmLabel = 'ลบ'",
        "confirmLabel = m.confirm_default_confirm()",
    )
    content = content.replace(
        "cancelLabel = 'ยกเลิก'",
        "cancelLabel = m.confirm_default_cancel()",
    )
    # close aria-label
    content = content.replace('aria-label="ปิด"', 'aria-label={m.common_close()}')
    path.write_text(content, encoding='utf-8')

def update_pagination(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    # showing text
    content = content.replace(
        '<p class="text-sm text-plum-light">\n\t\tแสดง <span class="font-medium text-plum">{startItem}</span> – <span class="font-medium text-plum">{endItem}</span>\n\t\tจาก <span class="font-medium text-plum">{total}</span> รายการ\n\t</p>',
        '<p class="text-sm text-plum-light">\n\t\t{@html m.pagination_showing({ start: startItem, end: endItem, total })}\n\t</p>',
    )
    # aria-labels
    content = content.replace('aria-label="หน้าก่อนหน้า"', 'aria-label={m.pagination_prev_aria()}')
    content = content.replace('aria-label="หน้าถัดไป"', 'aria-label={m.pagination_next_aria()}')
    path.write_text(content, encoding='utf-8')

def update_back_to_top(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    content = content.replace('aria-label="กลับขึ้นบนสุด"', 'aria-label={m.back_to_top_aria()}')
    path.write_text(content, encoding='utf-8')

def update_password_input(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    # default label
    content = content.replace("label = 'รหัสผ่าน'", "label = m.password_input_default_label()")
    # aria-labels
    content = content.replace(
        "aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}",
        "aria-label={show ? m.password_input_hide_aria() : m.password_input_show_aria()}",
    )
    path.write_text(content, encoding='utf-8')

def update_navigation(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    # nav link labels
    content = content.replace("label: 'หน้าแรก'", "label: m.nav_home()")
    content = content.replace("label: 'ตารางฉาย'", "label: m.nav_calendar()")
    content = content.replace("label: 'สำรวจ'", "label: m.nav_explore()")
    # Chat already English but use key for consistency
    content = content.replace("label: 'AI Chat'", "label: m.nav_chat()")
    # admin
    content = content.replace("aria-label=\"จัดการ\"", "aria-label={m.nav_admin()}")
    content = content.replace("title=\"จัดการ\"", "title={m.nav_admin()}")
    content = content.replace('>จัดการ</span>', '>{m.nav_admin()}</span>')
    # login/register
    content = content.replace('>เข้าสู่ระบบ<', '>{m.nav_login()}<')
    content = content.replace('>สมัครสมาชิก<', '>{m.nav_register()}<')
    # Thai comments are not user-facing, leave them
    path.write_text(content, encoding='utf-8')

def update_bottom_nav(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    content = add_import_m(content)
    # home
    content = content.replace("label: 'หน้าแรก'", "label: m.nav_home()")
    # calendar
    content = content.replace("label: 'ตารางฉาย'", "label: m.nav_calendar()")
    # explore
    content = content.replace("label: 'สำรวจ'", "label: m.nav_explore()")
    # auth item profile
    content = content.replace("label: 'โปรไฟล์'", "label: m.nav_profile()")
    # auth item login
    content = content.replace("label: 'เข้าสู่ระบบ'", "label: m.nav_login()")
    # notifications
    content = content.replace("label: 'แจ้งเตือน'", "label: m.nav_notifications()")
    path.write_text(content, encoding='utf-8')

def main():
    add_keys()
    update_footer(SRC / 'Footer.svelte')
    update_notification_dropdown(SRC / 'NotificationDropdown.svelte')
    update_share_button(SRC / 'ShareButton.svelte')
    update_confirm_dialog(SRC / 'ConfirmDialog.svelte')
    update_pagination(SRC / 'Pagination.svelte')
    update_back_to_top(SRC / 'BackToTopButton.svelte')
    update_password_input(SRC / 'PasswordInput.svelte')
    update_navigation(SRC / 'Navigation.svelte')
    update_bottom_nav(SRC / 'BottomNav.svelte')
    print('Task 7 translations applied.')

if __name__ == '__main__':
    main()
