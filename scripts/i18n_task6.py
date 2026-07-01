#!/usr/bin/env python3
"""Task 6: translate login, register, and notifications pages."""
import json
from pathlib import Path

ROOT = Path('/Users/syaco/workspace/private/.worktrees/feature/i18n-phase2-public-pages')
MESSAGES_DIR = ROOT / 'messages'
LOGIN = ROOT / 'src/routes/[lang=lang]/(app)/login/+page.svelte'
REGISTER = ROOT / 'src/routes/[lang=lang]/(app)/register/+page.svelte'
NOTIFICATIONS = ROOT / 'src/routes/[lang=lang]/(app)/notifications/+page.svelte'

MESSAGES = {
    'login_seo_title': {
        'th': 'เข้าสู่ระบบ | GL-Orbit',
        'en': 'Login | GL-Orbit',
    },
    'login_seo_description': {
        'th': 'เข้าสู่ระบบ GL-Orbit เพื่อจัดการโปรไฟล์ บันทึกซีรีส์ที่ชอบ และรับการแจ้งเตือนตารางฉาย',
        'en': 'Log in to GL-Orbit to manage your profile, save favorite series, and receive schedule notifications',
    },
    'login_title': {'th': 'เข้าสู่ระบบ', 'en': 'Login'},
    'login_subtitle': {'th': 'ยินดีต้อนรับกลับมา! 👋', 'en': 'Welcome back! 👋'},
    'login_error_default': {'th': 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง', 'en': 'Login failed. Please try again.'},
    'login_label_identifier': {'th': 'ชื่อผู้ใช้ หรือ อีเมล', 'en': 'Username or email'},
    'login_placeholder_identifier': {'th': 'ชื่อผู้ใช้ หรือ your@email.com', 'en': 'Username or your@email.com'},
    'login_submit_loading': {'th': 'กำลังเข้าสู่ระบบ...', 'en': 'Logging in...'},
    'login_submit': {'th': 'เข้าสู่ระบบ', 'en': 'Log in'},
    'login_no_account': {'th': 'ยังไม่มีบัญชี?', 'en': "Don't have an account?"},
    'login_register_link': {'th': 'สมัครสมาชิก', 'en': 'Register'},

    'register_seo_title': {
        'th': 'สมัครสมาชิก | GL-Orbit',
        'en': 'Register | GL-Orbit',
    },
    'register_seo_description': {
        'th': 'สมัครสมาชิก GL-Orbit เพื่อติดตามซีรีส์ GL ที่คุณชื่นชอบ รับการแจ้งเตือนตอนใหม่ และจัดการตารางฉายส่วนตัว',
        'en': 'Register for GL-Orbit to follow your favorite GL series, get new episode alerts, and manage your personal schedule',
    },
    'register_title': {'th': 'สมัครสมาชิก', 'en': 'Register'},
    'register_subtitle': {'th': 'มาเป็นส่วนหนึ่งของชุมชน GL-Orbit 🌸', 'en': 'Join the GL-Orbit community 🌸'},
    'register_error_default': {'th': 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง', 'en': 'Registration failed. Please try again.'},
    'register_label_username': {'th': 'ชื่อผู้ใช้', 'en': 'Username'},
    'register_label_display_name': {'th': 'ชื่อที่แสดง', 'en': 'Display name'},
    'register_optional_note': {'th': '(ไม่บังคับ)', 'en': '(optional)'},
    'register_placeholder_display_name': {'th': 'ชื่อของคุณ', 'en': 'Your name'},
    'register_label_email': {'th': 'อีเมล', 'en': 'Email'},
    'register_password_label': {'th': 'รหัสผ่าน', 'en': 'Password'},
    'register_password_placeholder': {'th': 'อย่างน้อย 6 ตัวอักษร', 'en': 'At least 6 characters'},
    'register_confirm_password_label': {'th': 'ยืนยันรหัสผ่าน', 'en': 'Confirm password'},
    'register_submit_loading': {'th': 'กำลังสมัครสมาชิก...', 'en': 'Registering...'},
    'register_submit': {'th': 'สมัครสมาชิก', 'en': 'Register'},
    'register_have_account': {'th': 'มีบัญชีแล้ว?', 'en': 'Already have an account?'},
    'register_login_link': {'th': 'เข้าสู่ระบบ', 'en': 'Log in'},

    'notifications_seo_title': {
        'th': 'การแจ้งเตือน | GL-Orbit',
        'en': 'Notifications | GL-Orbit',
    },
    'notifications_seo_description': {
        'th': 'การแจ้งเตือน GL-Orbit — ติดตามตอนใหม่ของซีรีส์ GL ที่คุณชื่นชอบได้ที่นี่',
        'en': 'GL-Orbit notifications — follow new episodes of your favorite GL series here',
    },
    'notifications_title': {'th': 'การแจ้งเตือน', 'en': 'Notifications'},
    'notifications_mark_all_loading': {'th': 'กำลังดำเนินการ...', 'en': 'Processing...'},
    'notifications_mark_all': {'th': 'อ่านทั้งหมด', 'en': 'Mark all as read'},
    'notifications_load_error': {'th': 'ไม่สามารถโหลดการแจ้งเตือนได้', 'en': 'Unable to load notifications'},
    'notifications_empty': {'th': 'ไม่มีการแจ้งเตือน', 'en': 'No notifications'},
    'notifications_load_more_loading': {'th': 'กำลังโหลด...', 'en': 'Loading...'},
    'notifications_load_more': {'th': 'โหลดเพิ่ม', 'en': 'Load more'},
    'notifications_count': {'th': 'แสดง {count} รายการ', 'en': 'Showing {count} items'},
    'notifications_retry': {'th': 'ลองอีกครั้ง', 'en': 'Try again'},
}


def add_messages():
    for fname in ('th.json', 'en.json'):
        path = MESSAGES_DIR / fname
        data = json.loads(path.read_text(encoding='utf-8'))
        for key, vals in MESSAGES.items():
            data[key] = vals[fname.split('.')[0]]
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def add_import(path: Path) -> None:
    content = path.read_text(encoding='utf-8')
    if "import { m } from '$lib/i18n/paraglide.js'" in content:
        return
    # Insert after the last import statement before the first blank line in <script>
    lines = content.splitlines()
    insert_idx = None
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            insert_idx = i + 1
    if insert_idx is not None:
        lines.insert(insert_idx, "\timport { m } from '$lib/i18n/paraglide.js';")
    else:
        # fallback: insert after <script>
        for i, line in enumerate(lines):
            if line.strip().startswith('<script'):
                lines.insert(i + 1, "\timport { m } from '$lib/i18n/paraglide.js';")
                break
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def translate_login():
    content = LOGIN.read_text(encoding='utf-8')

    content = content.replace(
        "\t<title>เข้าสู่ระบบ | GL-Orbit</title>",
        "\t<title>{m.login_seo_title()}</title>"
    )
    content = content.replace(
        '\t<meta name="description" content="เข้าสู่ระบบ GL-Orbit เพื่อจัดการโปรไฟล์ บันทึกซีรีส์ที่ชอบ และรับการแจ้งเตือนตารางฉาย" />',
        '\t<meta name="description" content={m.login_seo_description()} />'
    )
    content = content.replace(
        "\t\t\t<h1 class=\"font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-2\">เข้าสู่ระบบ</h1>",
        "\t\t\t<h1 class=\"font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-2\">{m.login_title()}</h1>"
    )
    content = content.replace(
        "\t\t\t<p class=\"text-sm sm:text-base text-plum-light\">ยินดีต้อนรับกลับมา! 👋</p>",
        "\t\t\t<p class=\"text-sm sm:text-base text-plum-light\">{m.login_subtitle()}</p>"
    )
    content = content.replace(
        "\t\t\t\terrorMessage = data.error || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง';",
        "\t\t\t\terrorMessage = data.error || m.login_error_default();"
    )
    content = content.replace(
        "\t\t\t\terrorMessage = 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง';",
        "\t\t\t\terrorMessage = m.login_error_default();"
    )
    content = content.replace(
        "\t\t\t\t<label for=\"identifier\" class=\"block text-sm font-medium text-plum mb-1.5 sm:mb-2\">ชื่อผู้ใช้ หรือ อีเมล</label>",
        "\t\t\t\t<label for=\"identifier\" class=\"block text-sm font-medium text-plum mb-1.5 sm:mb-2\">{m.login_label_identifier()}</label>"
    )
    content = content.replace(
        'placeholder="ชื่อผู้ใช้ หรือ your@email.com"',
        'placeholder={m.login_placeholder_identifier()}'
    )
    content = content.replace(
        "\t\t\t\t\t\t\t<span>กำลังเข้าสู่ระบบ...</span>",
        "\t\t\t\t\t\t\t<span>{m.login_submit_loading()}</span>"
    )
    content = content.replace(
        "\t\t\t\t\t{:else}\n\t\t\t\t\t\tเข้าสู่ระบบ\n\t\t\t\t\t{/if}",
        "\t\t\t\t\t{:else}\n\t\t\t\t\t\t{m.login_submit()}\n\t\t\t\t\t{/if}"
    )
    content = content.replace(
        "\t\t\t<p class=\"text-sm text-plum-light\">\n\t\t\t\t\t\tยังไม่มีบัญชี?\n\t\t\t\t\t\t<a href=\"/{page.data.lang}/register\" class=\"text-coral-dark font-medium hover:underline\">สมัครสมาชิก</a>\n\t\t\t\t\t</p>",
        "\t\t\t<p class=\"text-sm text-plum-light\">\n\t\t\t\t\t\t{m.login_no_account()}\n\t\t\t\t\t\t<a href=\"/{page.data.lang}/register\" class=\"text-coral-dark font-medium hover:underline\">{m.login_register_link()}</a>\n\t\t\t\t\t</p>"
    )
    LOGIN.write_text(content, encoding='utf-8')


def translate_register():
    content = REGISTER.read_text(encoding='utf-8')

    content = content.replace(
        "\t<title>สมัครสมาชิก | GL-Orbit</title>",
        "\t<title>{m.register_seo_title()}</title>"
    )
    content = content.replace(
        '\t<meta name="description" content="สมัครสมาชิก GL-Orbit เพื่อติดตามซีรีส์ GL ที่คุณชื่นชอบ รับการแจ้งเตือนตอนใหม่ และจัดการตารางฉายส่วนตัว" />',
        '\t<meta name="description" content={m.register_seo_description()} />'
    )
    content = content.replace(
        "\t\t\t<h1 class=\"font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-2\">สมัครสมาชิก</h1>",
        "\t\t\t<h1 class=\"font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-2\">{m.register_title()}</h1>"
    )
    content = content.replace(
        "\t\t\t<p class=\"text-sm sm:text-base text-plum-light\">มาเป็นส่วนหนึ่งของชุมชน GL-Orbit 🌸</p>",
        "\t\t\t<p class=\"text-sm sm:text-base text-plum-light\">{m.register_subtitle()}</p>"
    )
    content = content.replace(
        "\t\t\t\terrorMessage = data.error || 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง';",
        "\t\t\t\terrorMessage = data.error || m.register_error_default();"
    )
    content = content.replace(
        "\t\t\t\terrorMessage = 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง';",
        "\t\t\t\terrorMessage = m.register_error_default();"
    )
    content = content.replace(
        "\t\t\t\t<label for=\"username\" class=\"block text-sm font-medium text-plum mb-1.5 sm:mb-2\">ชื่อผู้ใช้</label>",
        "\t\t\t\t<label for=\"username\" class=\"block text-sm font-medium text-plum mb-1.5 sm:mb-2\">{m.register_label_username()}</label>"
    )
    content = content.replace(
        "\t\t\t\t<label for=\"displayName\" class=\"block text-sm font-medium text-plum mb-1.5 sm:mb-2\">ชื่อที่แสดง <span class=\"text-plum-light/60 font-normal\">(ไม่บังคับ)</span></label>",
        "\t\t\t\t<label for=\"displayName\" class=\"block text-sm font-medium text-plum mb-1.5 sm:mb-2\">{m.register_label_display_name()} <span class=\"text-plum-light/60 font-normal\">{m.register_optional_note()}</span></label>"
    )
    content = content.replace(
        'placeholder="ชื่อของคุณ"',
        'placeholder={m.register_placeholder_display_name()}'
    )
    content = content.replace(
        "\t\t\t\t<label for=\"email\" class=\"block text-sm font-medium text-plum mb-1.5 sm:mb-2\">อีเมล</label>",
        "\t\t\t\t<label for=\"email\" class=\"block text-sm font-medium text-plum mb-1.5 sm:mb-2\">{m.register_label_email()}</label>"
    )
    content = content.replace(
        "label=\"รหัสผ่าน\"",
        "label={m.register_password_label()}"
    )
    content = content.replace(
        'placeholder="อย่างน้อย 6 ตัวอักษร"',
        'placeholder={m.register_password_placeholder()}'
    )
    content = content.replace(
        "label=\"ยืนยันรหัสผ่าน\"",
        "label={m.register_confirm_password_label()}"
    )
    content = content.replace(
        "\t\t\t\t\t\t\t<span>กำลังสมัครสมาชิก...</span>",
        "\t\t\t\t\t\t\t<span>{m.register_submit_loading()}</span>"
    )
    content = content.replace(
        "\t\t\t\t\t{:else}\n\t\t\t\t\t\tสมัครสมาชิก\n\t\t\t\t\t{/if}",
        "\t\t\t\t\t{:else}\n\t\t\t\t\t\t{m.register_submit()}\n\t\t\t\t\t{/if}"
    )
    content = content.replace(
        "\t\t\t<p class=\"text-sm text-plum-light\">\n\t\t\t\t\t\tมีบัญชีแล้ว?\n\t\t\t\t\t\t<a href=\"/{page.data.lang}/login\" class=\"text-coral-dark font-medium hover:underline\">เข้าสู่ระบบ</a>\n\t\t\t\t\t</p>",
        "\t\t\t<p class=\"text-sm text-plum-light\">\n\t\t\t\t\t\t{m.register_have_account()}\n\t\t\t\t\t\t<a href=\"/{page.data.lang}/login\" class=\"text-coral-dark font-medium hover:underline\">{m.register_login_link()}</a>\n\t\t\t\t\t</p>"
    )
    REGISTER.write_text(content, encoding='utf-8')


def translate_notifications():
    content = NOTIFICATIONS.read_text(encoding='utf-8')

    # Add page import if missing (needed for locale-aware formatting)
    if "import { page } from '$app/state';" not in content:
        lines = content.splitlines()
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                lines.insert(i + 1, "\timport { page } from '$app/state';")
                break
        content = '\n'.join(lines) + '\n'

    content = content.replace(
        "\t<title>การแจ้งเตือน | GL-Orbit</title>",
        "\t<title>{m.notifications_seo_title()}</title>"
    )
    content = content.replace(
        '\t<meta name="description" content="การแจ้งเตือน GL-Orbit — ติดตามตอนใหม่ของซีรีส์ GL ที่คุณชื่นชอบได้ที่นี่" />',
        '\t<meta name="description" content={m.notifications_seo_description()} />'
    )
    content = content.replace(
        "\t\t<h1 class=\"text-2xl font-bold text-plum font-[family-name:var(--font-display)]\">\n\t\t\tการแจ้งเตือน\n\t\t</h1>",
        "\t\t<h1 class=\"text-2xl font-bold text-plum font-[family-name:var(--font-display)]\">\n\t\t\t{m.notifications_title()}\n\t\t</h1>"
    )
    content = content.replace(
        "\t\t\t{markingAll ? 'กำลังดำเนินการ...' : 'อ่านทั้งหมด'}",
        "\t\t\t{markingAll ? m.notifications_mark_all_loading() : m.notifications_mark_all()}"
    )
    content = content.replace(
        "\t\t\t\tif (!res.ok) throw new Error('ไม่สามารถโหลดการแจ้งเตือนได้');",
        "\t\t\t\tif (!res.ok) throw new Error(m.notifications_load_error());"
    )
    content = content.replace(
        "\t\t\t\tloadError = 'ไม่สามารถโหลดการแจ้งเตือนได้';",
        "\t\t\t\tloadError = m.notifications_load_error();"
    )
    content = content.replace(
        "\t\t\t<p class=\"text-plum-light/60 text-base\">ไม่มีการแจ้งเตือน</p>",
        "\t\t\t<p class=\"text-plum-light/60 text-base\">{m.notifications_empty()}</p>"
    )
    content = content.replace(
        "\t\t\t\t\t\t\t\t\tกำลังโหลด...\n\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t{:else}\n\t\t\t\t\t\t\t\tโหลดเพิ่ม",
        "\t\t\t\t\t\t\t\t\t{m.notifications_load_more_loading()}\n\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t{:else}\n\t\t\t\t\t\t\t\t{m.notifications_load_more()}"
    )
    content = content.replace(
        "\t\t\t\t\t\t\t\t\tลองอีกครั้ง\n\t\t\t\t\t\t\t\t</button>",
        "\t\t\t\t\t\t\t\t\t{m.notifications_retry()}\n\t\t\t\t\t\t\t\t</button>"
    )
    content = content.replace(
        "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tแสดง {notifications.length} รายการ\n\t\t</p>",
        "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{m.notifications_count({ count: notifications.length })}\n\t\t</p>"
    )

    # Replace formatRelativeTime with locale-aware version
    content = content.replace(
        """\tfunction formatRelativeTime(dateStr: string): string {
\t\tconst now = Date.now();
\t\tconst date = new Date(dateStr).getTime();
\t\tconst diffMs = now - date;
\t\tconst diffSeconds = Math.floor(diffMs / 1000);
\t\tconst diffMinutes = Math.floor(diffSeconds / 60);
\t\tconst diffHours = Math.floor(diffMinutes / 60);
\t\tconst diffDays = Math.floor(diffHours / 24);

\t\tif (diffSeconds < 60) return 'เมื่อสักครู่';
\t\tif (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
\t\tif (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
\t\tif (diffDays < 7) return `${diffDays} วันที่แล้ว`;
\t\treturn new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
\t}""",
        """\tfunction formatRelativeTime(dateStr: string): string {
\t\tconst now = new Date().getTime();
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
\t\treturn new Intl.DateTimeFormat(page.data.lang, { day: 'numeric', month: 'short' }).format(new Date(dateStr));
\t}"""
    )

    NOTIFICATIONS.write_text(content, encoding='utf-8')


if __name__ == '__main__':
    add_messages()
    add_import(LOGIN)
    add_import(REGISTER)
    add_import(NOTIFICATIONS)
    translate_login()
    translate_register()
    translate_notifications()
    print('Task 6 replacements applied.')
