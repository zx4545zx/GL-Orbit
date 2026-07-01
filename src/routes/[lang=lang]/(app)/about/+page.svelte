<script lang="ts">

	import { page } from '$app/state';	import { DEFAULT_OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, SITE_NAME, absoluteUrl, buildBreadcrumbJsonLd, buildWebPageJsonLd, jsonLdScript, safeJsonLd } from '$lib/seo.js';

	const ABOUT_SEO_TITLE = 'เกี่ยวกับ GL-Orbit | คู่มือติดตามซีรีส์ GL สำหรับแฟนคลับ';
	const ABOUT_SEO_DESCRIPTION = 'รู้จัก GL-Orbit ศูนย์รวมตารางฉายซีรีส์ Girls\' Love ข้อมูลนักแสดง แพลตฟอร์มรับชม เวอร์ชัน Uncut และคำแนะนำสำหรับแฟนคลับ GL';

	const homepageGuideCards = [
		{
			title: 'ติดตามตารางฉาย GL แบบไม่พลาดตอนใหม่',
			description:
				'GL-Orbit รวมตารางฉายซีรีส์ GL และ Girls\' Love series ไว้ในที่เดียว พร้อมข้อมูลวัน เวลา แพลตฟอร์ม และสถานะ Uncut เพื่อช่วยให้แฟนคลับวางแผนดูตอนใหม่ได้ง่ายขึ้น'
		},
		{
			title: 'ค้นหาซีรีส์ นักแสดง และสตูดิโอที่เกี่ยวข้อง',
			description:
				'หน้าแรกเชื่อมต่อไปยังฐานข้อมูลซีรีส์ รายชื่อนักแสดง และรายละเอียดผลงาน เพื่อให้ผู้ใช้สำรวจจักรวาล GL ได้ต่อเนื่องจากเรื่องที่กำลังฉายไปจนถึงเรื่องที่กำลังจะมา'
		},
		{
			title: 'เช็กลิงก์รับชม แพลตฟอร์ม และเวอร์ชัน Uncut',
			description:
				'ข้อมูลของแต่ละตอนออกแบบให้ช่วยตอบคำถามสำคัญของผู้ชม เช่น ฉายที่ไหน เวลาใด มีเวอร์ชัน Uncut หรือไม่ และควรกลับมาเช็กตารางอีกครั้งเมื่อไร'
		}
	] as const;

	const homepageFaqs = [
		{
			question: 'GL-Orbit เหมาะกับใคร?',
			answer:
				'เหมาะกับแฟนซีรีส์ Girls\' Love ทั้งคนที่ติดตามอยู่แล้วและผู้ชมใหม่ที่อยากเริ่มสำรวจซีรีส์ GL ผ่านตารางฉาย รายชื่อซีรีส์ นักแสดง สตูดิโอ และแพลตฟอร์มสตรีมมิ่งที่เกี่ยวข้อง'
		},
		{
			question: 'ตารางฉายใน GL-Orbit ช่วยอะไร?',
			answer:
				'ตารางฉายช่วยรวมข้อมูลตอนใหม่ไว้ในรูปแบบที่อ่านง่าย ผู้ใช้สามารถดูซีรีส์ที่กำลังจะออกอากาศ รายการที่ใกล้ฉาย และรายละเอียดเวลาออกอากาศโดยไม่ต้องค้นหาจากหลายแหล่งพร้อมกัน'
		},
		{
			question: 'คำว่า Uncut บนเว็บไซต์หมายถึงอะไร?',
			answer:
				'ป้าย Uncut ใช้บอกว่าตอนหรือรอบฉายนั้นมีเวอร์ชันที่ไม่ตัดทอน ซึ่งเป็นข้อมูลที่แฟนซีรีส์ GL มักต้องการตรวจสอบก่อนเลือกช่องทางรับชมบน streaming platform ต่าง ๆ'
		},
		{
			question: 'ทำไมควรกลับมาเช็ก GL-Orbit เป็นประจำ?',
			answer:
				'ตารางฉายและข้อมูลแพลตฟอร์มอาจเปลี่ยนได้ตามประกาศของผู้ผลิตหรือผู้ให้บริการสตรีมมิ่ง การกลับมาเช็ก GL-Orbit ช่วยให้ผู้ชมเห็นข้อมูลล่าสุดและไม่พลาดตอนสำคัญ'
		},
		{
			question: 'เว็บไซต์นี้ต่างจากรายการแนะนำซีรีส์ทั่วไปอย่างไร?',
			answer:
				'GL-Orbit ไม่ได้เป็นแค่ลิสต์แนะนำ แต่ทำหน้าที่เป็นศูนย์กลางข้อมูลสำหรับการติดตามซีรีส์ GL ทั้งตารางฉาย countdown รายชื่อนักแสดง ลิงก์รับชม และบริบทของแต่ละเรื่องในชุมชนแฟนคลับ'
		},
		{
			question: 'ซีรีส์ GL ไทยกับต่างประเทศต่างกันอย่างไร?',
			answer:
				'ซีรีส์ GL ไทยมักมีจังหวะเล่าเรื่องและสไตล์การนำเสนอเฉพาะตัว ขณะที่ซีรีส์จากเกาหลี จีน หรือญี่ปุ่นมีรูปแบบและความยาวตอนที่แตกต่างกัน GL-Orbit รวบรวมซีรีส์ GL จากหลายประเทศไว้ด้วยกันเพื่อให้ผู้ชมเลือกติดตามได้ตามความชอบ'
		},
		{
			question: 'ใช้งาน GL-Orbit ฟรีหรือไม่?',
			answer:
				'การดูตารางฉาย รายชื่อซีรีส์ และข้อมูลนักแสดงบน GL-Orbit ไม่มีค่าใช้จ่าย ส่วนการรับชมตอนจริงขึ้นอยู่กับนโยบายของแพลตฟอร์มสตรีมมิ่งแต่ละแห่ง ซึ่งอาจมีทั้งช่องทางฟรีและแบบสมัครสมาชิก'
		}
	] as const;

	const glKnowledgeCards = [
		{
			title: 'ซีรีส์ GL คืออะไร',
			description:
				'GL หรือ Girls\' Love คือซีรีส์ที่เล่าเรื่องความสัมพันธ์ระหว่างผู้หญิงด้วยกัน มีต้นกำเนิดจากวัฒนธรรมมังงะและอนิเมะ Yuri ของญี่ปุ่น ก่อนขยายมาสู่ละครและซีรีส์คนแสดงในหลายประเทศ ทั้งไทย เกาหลี จีน ญี่ปุ่น และไต้หวัน ทำให้แฟนคลับมีซีรีส์ GL ให้ติดตามตลอดทั้งปี'
		},
		{
			title: 'ทำไมซีรีส์ GL จึงได้รับความนิยม',
			description:
				'ความนิยมของซีรีส์ GL เติบโตขึ้นจากการเล่าเรื่องที่หลากหลาย ความเคมีของนักแสดง และชุมชนแฟนคลับที่แข็งแกร่งบนโซเชียลมีเดีย ซีรีส์หลายเรื่องกลายเป็นปรากฏการณ์ที่มีผู้พูดคุยและแชร์ต่ออย่างกว้างขวาง จนสตูดิโอและแพลตฟอร์มสตรีมมิ่งให้ความสำคัญกับคอนเทนต์ประเภทนี้มากขึ้นอย่างต่อเนื่อง'
		},
		{
			title: 'ซีรีส์ GL ไทยที่โดดเด่น',
			description:
				'ประเทศไทยเป็นหนึ่งในตลาดที่ผลิตซีรีส์ GL ที่ได้รับความนิยมในระดับสากล โดยมีสตูดิโอและค่ายหนังไทยหลายรายที่สร้างผลงานคุณภาพ ดึงดูดผู้ชมทั้งในประเทศและต่างประเทศ GL-Orbit รวบรวมข้อมูลของซีรีส์ GL ทั้งไทยและนานาชาติไว้ในที่เดียว เพื่อให้ผู้ชมตามเรื่องโปรดได้สะดวกยิ่งขึ้น'
		},
		{
			title: 'GL กับ Yuri ต่างกันอย่างไร',
			description:
				'Yuri เป็นคำที่นิยมใช้ในวงการมังงะและอนิเมะเพื่อเล่าเรื่องความสัมพันธ์เดียวกัน ส่วน GL (Girls\' Love) เป็นคำที่ใช้กว้างขวางในวงการซีรีส์คนแสดง แม้ความหมายจะใกล้เคียงกัน แต่ในบริบทของการติดตามซีรีส์บน GL-Orbit จะเน้นที่ละครและซีรีส์คนแสดงเป็นหลัก'
		}
	] as const;

	const platformCards = [
		{
			name: 'YouTube',
			description:
				'แหล่งรับชมซีรีส์ GL ที่เข้าถึงง่ายที่สุด หลายสตูดิโอเผยแพร่ตอนอย่างเป็นทางการผ่านช่อง YouTube ของตนเอง พร้อมคำบรรยายหลายภาษา GL-Orbit ช่วยระบุเวลาลงตอนใหม่เพื่อให้แฟนคลับไม่พลาด'
		},
		{
			name: 'iQIYI',
			description:
				'แพลตฟอร์มสตรีมมิ่งระดับสากลที่มีคลังซีรีส์ GL และซีรีส์เอเชียจำนวนมาก มักมีเวอร์ชันพิเศษและคุณภาพรับชมที่สูง ผู้ชมสามารถใช้ GL-Orbit เช็กสถานะและตารางฉายของซีรีส์ที่อยู่บน iQIYI'
		},
		{
			name: 'GagaOOLala',
			description:
				'แพลตฟอร์มที่เน้นคอนเทนต์ LGBTQ+ และ Boys\' Love / Girls\' Love โดยเฉพาะ เป็นหนึ่งในจุดหมายสำคัญสำหรับแฟนซีรีส์ GL ที่ต้องการความหลากหลายของเรื่องจากหลายประเทศ'
		},
		{
			name: 'WeTV',
			description:
				'แพลตฟอร์มสตรีมมิ่งที่มีซีรีส์เอเชียและซีรีส์ไทยจำนวนมาก รวมถึงผลงานซีรีส์ GL ที่ผลิตร่วมกับสตูดิโอไทย ผู้ชมสามารถตรวจสอบตอนใหม่และเวลาฉายผ่านตารางของ GL-Orbit'
		},
		{
			name: 'ช่องทางทางการของสตูดิโอ',
			description:
				'นอกจากแพลตฟอร์มหลักแล้ว ซีรีส์ GL บางเรื่องเผยแพร่ผ่านเว็บไซต์หรือแอปของสตูดิโอโดยตรง GL-Orbit รวบรวมข้อมูลแพลตฟอร์มเหล่านี้ไว้เพื่อให้ผู้ชมเข้าถึงลิงก์รับชมที่ถูกต้องและเป็นปัจจุบัน'
		}
	] as const;


	const LAST_UPDATED = '2026-06-30';
	const LAST_UPDATED_LABEL = '30 มิถุนายน 2026';

	const aiAnswerBlocks = [
		{
			question: 'GL-Orbit คืออะไร?',
			answer:
				'GL-Orbit คือเว็บศูนย์กลางสำหรับแฟนซีรีส์ Girls\' Love ที่รวมตารางฉาย ข้อมูลซีรีส์ นักแสดง สตูดิโอ แพลตฟอร์มรับชม และสถานะ Uncut ไว้ในที่เดียว เพื่อช่วยให้ผู้ชมติดตามตอนใหม่และค้นพบซีรีส์ GL เรื่องถัดไปได้ง่ายขึ้น'
		},
		{
			question: 'GL-Orbit ช่วยติดตามตารางฉายซีรีส์ GL อย่างไร?',
			answer:
				'GL-Orbit แสดงข้อมูลตอนใหม่ของซีรีส์ GL ในรูปแบบที่อ่านง่าย เช่น วันฉาย เวลาออกอากาศ แพลตฟอร์มรับชม และป้าย Uncut ผู้ใช้จึงสามารถเช็กเรื่องที่กำลังจะฉาย วางแผนดูตอนใหม่ และกลับมาตรวจสอบตารางได้จากจุดเดียว'
		},
		{
			question: 'ดูซีรีส์ GL ได้ที่ไหน?',
			answer:
				'ซีรีส์ GL มักเผยแพร่บนแพลตฟอร์มทางการ เช่น YouTube, iQIYI, GagaOOLala, WeTV และช่องทางของสตูดิโอผู้ผลิตโดยตรง GL-Orbit ช่วยรวบรวมข้อมูลแพลตฟอร์มเหล่านี้ เพื่อให้แฟนคลับเลือกช่องทางรับชมที่ถูกต้องและเป็นปัจจุบัน'
		},
		{
			question: 'Uncut ในซีรีส์ GL หมายถึงอะไร?',
			answer:
				'Uncut หมายถึงเวอร์ชันของตอนหรือรอบฉายที่ไม่ตัดทอนเนื้อหา ป้ายนี้ช่วยให้แฟนซีรีส์ GL ตรวจสอบก่อนรับชมว่าแพลตฟอร์มนั้นมีเวอร์ชันเต็มหรือไม่ โดยเฉพาะเมื่อแต่ละช่องทางอาจเผยแพร่เวอร์ชันต่างกัน'
		}
	] as const;

	const howToSteps = [
		{
			name: 'เช็กตอนที่ใกล้ฉาย',
			text: 'เริ่มจาก Live Countdown เพื่อดูว่ามีตอนใหม่ของซีรีส์ GL เรื่องใดกำลังจะออกอากาศใน 24 ชั่วโมงข้างหน้า',
			path: '/countdown'
		},
		{
			name: 'เปิดตารางฉาย',
			text: 'ไปที่หน้าปฏิทินเพื่อดูภาพรวมรายวัน รายสัปดาห์ และรายการที่มีป้าย Uncut ก่อนเลือกช่องทางรับชม',
			path: '/calendar'
		},
		{
			name: 'สำรวจเรื่องที่น่าสนใจ',
			text: 'ใช้หน้าซีรีส์เพื่อค้นหาเรื่องกำลังฉาย เรื่องที่กำลังจะมา และเรื่องที่จบแล้ว พร้อมข้อมูลนักแสดงและสตูดิโอ',
			path: '/series'
		},
		{
			name: 'กลับมาอัปเดตซ้ำ',
			text: 'ตาราง streaming platform และเวลาเผยแพร่อาจเปลี่ยนตามประกาศล่าสุด การ bookmark หน้าแรกช่วยให้ตรวจสอบข้อมูลได้เร็วขึ้น',
			path: '/'
		}
	] as const;

	const canonicalUrl = $derived(absoluteUrl(page.url.origin, '/about'));
	const aboutJsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, '/about', ABOUT_SEO_TITLE, ABOUT_SEO_DESCRIPTION),
		{
			'@context': 'https://schema.org',
			'@type': 'AboutPage',
			name: ABOUT_SEO_TITLE,
			description: ABOUT_SEO_DESCRIPTION,
			url: canonicalUrl,
			inLanguage: 'th-TH',
			isPartOf: {
				'@type': 'WebSite',
				name: SITE_NAME,
				url: absoluteUrl(page.url.origin, '/')
			},
			about: {
				'@type': 'Thing',
				name: 'Girls\' Love series'
			}
		},
		{
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: homepageFaqs.map((faq) => ({
				'@type': 'Question',
				name: faq.question,
				acceptedAnswer: {
					'@type': 'Answer',
					text: faq.answer
				}
			}))
		},
		{
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: ABOUT_SEO_TITLE,
			description: ABOUT_SEO_DESCRIPTION,
			datePublished: LAST_UPDATED,
			dateModified: LAST_UPDATED,
			inLanguage: 'th-TH',
			mainEntityOfPage: canonicalUrl,
			image: absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE),
			author: {
				'@type': 'Organization',
				name: SITE_NAME,
				url: absoluteUrl(page.url.origin, '/')
			},
			publisher: {
				'@type': 'Organization',
				name: SITE_NAME,
				url: absoluteUrl(page.url.origin, '/'),
				logo: {
					'@type': 'ImageObject',
					url: absoluteUrl(page.url.origin, '/icons/gl-orbit-icon.png')
				}
			},
			articleSection: ['Girls\' Love series', 'ตารางฉายซีรีส์ GL', 'แพลตฟอร์มสตรีมมิ่ง', 'FAQ'],
			keywords: ['ซีรีส์ GL', 'Girls\' Love', 'ตารางฉายซีรีส์ GL', 'ดูซีรีส์ GL ที่ไหน', 'Uncut GL']
		},
		{
			'@context': 'https://schema.org',
			'@type': 'HowTo',
			name: 'วิธีใช้ GL-Orbit เพื่อติดตามซีรีส์ GL',
			description: 'ขั้นตอนเริ่มต้นสำหรับใช้ GL-Orbit เพื่อตรวจตารางฉาย ค้นหาซีรีส์ และกลับมาเช็กข้อมูลล่าสุด',
			totalTime: 'PT5M',
			step: howToSteps.map((step, index) => ({
				'@type': 'HowToStep',
				position: index + 1,
				name: step.name,
				text: step.text,
				url: absoluteUrl(page.url.origin, step.path)
			}))
		},
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: 'หน้าแรก', path: '/' },
			{ name: 'เกี่ยวกับ GL-Orbit', path: '/about' }
		])
	]));
</script>

<svelte:head>
	<title>{ABOUT_SEO_TITLE}</title>
	<meta name="description" content={ABOUT_SEO_DESCRIPTION} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={ABOUT_SEO_TITLE} />
	<meta property="og:description" content={ABOUT_SEO_DESCRIPTION} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:title" content={ABOUT_SEO_TITLE} />
	<meta name="twitter:description" content={ABOUT_SEO_DESCRIPTION} />
	{@html jsonLdScript(aboutJsonLd)}
</svelte:head>

<!-- About page hero -->
<section class="relative -mx-4 overflow-hidden px-4 py-16 sm:py-24">
	<div class="absolute inset-0 bg-gradient-mesh pointer-events-none"></div>
	<div class="absolute -top-16 right-[-6rem] h-72 w-72 rounded-full bg-coral/15 blur-[80px] pointer-events-none"></div>
	<div class="absolute bottom-0 left-[-6rem] h-72 w-72 rounded-full bg-mint/15 blur-[80px] pointer-events-none"></div>

	<div class="relative mx-auto max-w-4xl text-center">
		<div class="inline-flex items-center gap-2 rounded-full border border-lavender/20 bg-white/65 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-coral-dark backdrop-blur-md">
			<span class="h-2 w-2 rounded-full bg-coral"></span>
			About GL-Orbit
		</div>
		<h1 class="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-plum sm:text-6xl">
			คู่มือติดตาม<span class="text-gradient">ซีรีส์ GL</span>
		</h1>
		<p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-plum-light sm:text-lg">
			รู้จักแนวคิดของ GL-Orbit วิธีใช้ตารางฉาย ข้อมูล Girls' Love series แพลตฟอร์มรับชม และคำถามที่แฟนคลับ GL มักอยากรู้ก่อนเริ่มติดตามเรื่องใหม่
		</p>
		<p class="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum-light/70">
			อัปเดตล่าสุด: {LAST_UPDATED_LABEL}
		</p>
		<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
			<a href="/{page.data.lang}/calendar" class="touch-target inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-coral to-coral-dark px-6 py-3 font-semibold text-white shadow-xl shadow-coral/20 transition hover:scale-105">
				ดูตารางฉาย
			</a>
			<a href="/{page.data.lang}/" class="touch-target inline-flex items-center justify-center rounded-2xl glass-card-strong px-6 py-3 font-semibold text-plum transition hover:scale-105">
				กลับหน้าแรก
			</a>
		</div>
	</div>
</section>

<!-- Extractable answer blocks for AI search -->
<section class="relative -mx-4 px-4 py-12 sm:py-16 content-visibility-auto">
	<div class="mx-auto max-w-5xl">
		<div class="mb-7 max-w-2xl">
			<div class="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">
				<span class="h-2 w-2 rounded-full bg-coral"></span>
				AI Search Answers
			</div>
			<h2 class="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-plum sm:text-3xl">
				คำตอบสั้นที่ AI ดึงไปอ้างอิงได้ง่าย
			</h2>
			<p class="mt-3 text-sm leading-7 text-plum-light sm:text-base">
				สรุปประเด็นสำคัญเกี่ยวกับ GL-Orbit ในรูปแบบคำถาม-คำตอบที่อ่านเข้าใจได้ทันที เหมาะกับทั้งผู้ใช้ใหม่และระบบค้นหาที่ต้องการคำตอบแบบ self-contained
			</p>
		</div>
		<div class="grid gap-4 md:grid-cols-2">
			{#each aiAnswerBlocks as block}
				<article class="rounded-3xl border border-lavender/20 bg-white/70 p-5 shadow-sm shadow-lavender/10 backdrop-blur-sm">
					<h3 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">{block.question}</h3>
					<p class="mt-2 text-sm leading-7 text-plum-light">{block.answer}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- Editorial: The GL-Orbit Guide (unified magazine feature) -->
<section class="relative -mx-4 px-4 py-16 sm:py-24 content-visibility-auto overflow-hidden">
	<!-- single soft atmosphere (replaces 3 stacked gradients) -->
	<div class="absolute inset-0 bg-gradient-to-b from-cream via-white to-lavender/5 pointer-events-none"></div>
	<div class="absolute top-[12%] -right-24 w-72 h-72 sm:w-96 sm:h-96 bg-coral/8 rounded-full blur-[90px] animate-float pointer-events-none"></div>
	<div class="absolute bottom-[18%] -left-24 w-72 h-72 sm:w-96 sm:h-96 bg-mint/8 rounded-full blur-[90px] animate-float-delayed pointer-events-none"></div>

	<div class="relative mx-auto max-w-5xl">

		<!-- §01 — Lede: what is GL-Orbit -->
		<header class="edi-head">
			<span class="edi-eyebrow"><span class="edi-dot bg-coral"></span>§ 01 · Guide</span>
			<h2 class="edi-title">GL-Orbit คืออะไร</h2>
		</header>
		<div class="edi-lede">
			<p class="edi-prose dropcap">
				GL-Orbit คือเว็บศูนย์กลางสำหรับแฟนซีรีส์ Girls' Love หรือ GL series ที่ต้องการติดตามข่าวสารแบบเป็นระบบ ตั้งแต่ตารางฉายตอนใหม่ รายละเอียดซีรีส์ นักแสดง สตูดิโอ ไปจนถึงช่องทางรับชมบน streaming platform ต่าง ๆ จุดตั้งต้นของเว็บคือการทำให้การตามซีรีส์ GL ง่ายขึ้นสำหรับผู้ชมไทยและแฟนต่างประเทศที่อยากรู้ว่าเรื่องไหนกำลังฉาย เรื่องไหนกำลังจะมา และควรดูตอนใหม่เมื่อไร
			</p>
			<blockquote class="edi-pullquote">
				เริ่มจากตารางฉาย ไปจนถึงเรื่องที่กำลังจะมา — ทุกอย่างของจักรวาล GL รวมอยู่ในที่เดียว
			</blockquote>
			<p class="edi-prose">
				หน้าแรกของ GL-Orbit ออกแบบให้เป็นแผงควบคุมของจักรวาล GL ผู้ใช้สามารถเริ่มจากตารางฉายประจำวัน ดู countdown ของตอนที่ใกล้ออกอากาศ สำรวจซีรีส์แนะนำ แล้วคลิกต่อไปยังหน้ารายละเอียดเพื่อดูข้อมูลเพิ่มเติม เช่น สถานะเรื่อง จำนวนตอน แพลตฟอร์มรับชม และป้าย Uncut ที่ช่วยบอกว่ารอบนั้นมีเวอร์ชันไม่ตัดทอนหรือไม่
			</p>
			<p class="edi-prose">
				เราให้ความสำคัญกับข้อมูลที่อ่านง่ายและเป็นประโยชน์จริง ไม่ใช่แค่รายชื่อเรื่องแบบสั้น ๆ เพราะแฟนคลับมักต้องการบริบทมากกว่านั้น ทั้งชื่อไทย ชื่ออังกฤษ ศิลปินที่เกี่ยวข้อง และเวลาฉายที่สัมพันธ์กับ timezone ของผู้ชม การกลับมาเช็ก GL-Orbit เป็นประจำจึงช่วยลดโอกาสพลาดตอนสำคัญและช่วยให้ค้นพบซีรีส์ GL เรื่องใหม่ได้ต่อเนื่อง
			</p>
			<p class="edi-prose">
				สำหรับผู้ชมที่ติดตามหลายเรื่องพร้อมกัน GL-Orbit ช่วยลดความสับสนจากประกาศที่กระจายอยู่บนหลายแพลตฟอร์ม ไม่ว่าจะเป็น YouTube, iQIYI, GagaOOLala, WeTV หรือช่องทางทางการของสตูดิโอ ผู้ใช้สามารถใช้หน้าแรกเป็นจุดเริ่มต้นเพื่อดูภาพรวม แล้วค่อยเจาะลึกไปยังรายละเอียดของแต่ละซีรีส์เมื่อต้องการตรวจสอบวันฉาย รายชื่อตอน นักแสดง หรือสถานะของเรื่องนั้น ๆ
			</p>
		</div>

		<!-- pillars (3 things GL-Orbit does) -->
		<div class="edi-pillars">
			{#each homepageGuideCards as card, i}
				<article class="edi-pillar">
					<span class="edi-pillar-num">{('0' + (i + 1)).slice(-2)}</span>
					<h3>{card.title}</h3>
					<p>{card.description}</p>
				</article>
			{/each}
		</div>

		<!-- §02 — How to use (stepper) -->
		<header class="edi-head edi-spacer">
			<span class="edi-eyebrow"><span class="edi-dot bg-lavender-dark"></span>§ 02 · How to use</span>
			<h2 class="edi-title">เริ่มใช้งาน<span class="text-coral">อย่างไร</span></h2>
		</header>
		<ol class="edi-steps">
			{#each howToSteps as step, i}
				<li class="edi-step">
					<span class="edi-step-num">{i + 1}</span>
					<div>
						<h3>{step.name}</h3>
						<p>{step.text}</p>
					</div>
				</li>
			{/each}
		</ol>

		<!-- §03 — GL 101 (numbered entries) -->
		<header class="edi-head edi-spacer">
			<span class="edi-eyebrow"><span class="edi-dot bg-mint"></span>§ 03 · GL 101</span>
			<h2 class="edi-title">ทำความรู้จัก<span class="text-coral">ซีรีส์ GL</span></h2>
		</header>
		<p class="edi-lead">
			สำหรับผู้ชมใหม่และแฟนคลับที่อยากเข้าใจจักรวาลซีรีส์ Girls' Love ให้ลึกซึ้งยิ่งขึ้น GL-Orbit สรุปประเด็นสำคัญที่ช่วยให้เริ่มต้นติดตามซีรีส์ GL ได้ง่ายและไม่พลาดบริบทของแต่ละเรื่อง
		</p>
		<div class="edi-know">
			{#each glKnowledgeCards as card, i}
				<article class="edi-know-item">
					<span class="edi-know-num">{('0' + (i + 1)).slice(-2)}</span>
					<h3>{card.title}</h3>
					<p>{card.description}</p>
				</article>
			{/each}
		</div>

		<!-- §04 — Where to watch (directory list) -->
		<header class="edi-head edi-spacer">
			<span class="edi-eyebrow"><span class="edi-dot bg-coral"></span>§ 04 · Streaming</span>
			<h2 class="edi-title">รับชมได้<span class="text-coral">ที่ไหน</span></h2>
		</header>
		<ul class="edi-dir">
			{#each platformCards as card}
				<li class="edi-dir-row">
					<h3 class="edi-dir-name">{card.name}</h3>
					<p class="edi-dir-desc">{card.description}</p>
				</li>
			{/each}
		</ul>

		<!-- §05 — FAQ (Q&A editorial) -->
		<header class="edi-head edi-spacer">
			<span class="edi-eyebrow"><span class="edi-dot bg-lavender-dark"></span>§ 05 · FAQ</span>
			<h2 class="edi-title">คำถามที่พบบ่อย</h2>
		</header>
		<div class="edi-faq">
			{#each homepageFaqs as faq}
				<article class="edi-qa">
					<h3 class="edi-qa-q"><span class="edi-qa-mark">Q</span>{faq.question}</h3>
					<p class="edi-qa-a">{faq.answer}</p>
				</article>
			{/each}
		</div>

	</div>
</section>

<style>
	/* Editorial magazine language — scoped to this homepage */
	.edi-head {
		padding-bottom: 1rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-lavender) 22%, transparent);
		margin-bottom: 1.75rem;
	}
	.edi-head.edi-spacer { margin-top: 4.5rem; }
	@media (min-width: 640px) { .edi-head.edi-spacer { margin-top: 6rem; } }
	.edi-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.25em;
		color: var(--color-coral-dark);
	}
	.edi-dot { width: 6px; height: 6px; border-radius: 9999px; display: inline-block; }
	.edi-title {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--color-plum);
		font-size: clamp(1.75rem, 4.5vw, 2.75rem);
		line-height: 1.1;
		margin-top: 0.6rem;
	}
	.edi-lede { max-width: 42rem; }
	.edi-prose {
		font-family: var(--font-body);
		color: var(--color-plum-light);
		font-size: 1rem;
		line-height: 1.9;
		margin-top: 1.1rem;
	}
	.edi-prose.dropcap::first-letter {
		font-family: var(--font-display);
		color: var(--color-coral);
		font-weight: 700;
		font-size: 3.4em;
		line-height: 0.78;
		float: left;
		margin: 0.08em 0.14em 0 -0.04em;
	}
	.edi-pullquote {
		font-family: var(--font-thai);
		color: var(--color-coral-dark);
		font-weight: 600;
		font-size: clamp(1.15rem, 2.6vw, 1.6rem);
		line-height: 1.5;
		border-left: 3px solid var(--color-coral);
		padding: 0.4rem 0 0.4rem 1.25rem;
		margin: 1.75rem 0 0.25rem;
	}
	.edi-pillars {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		margin-top: 2.5rem;
	}
	@media (min-width: 640px) { .edi-pillars { grid-template-columns: repeat(3, 1fr); gap: 2rem; } }
	.edi-pillar { border-top: 2px solid color-mix(in srgb, var(--color-coral) 35%, transparent); padding-top: 0.85rem; }
	.edi-pillar-num {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--color-coral);
		font-size: 0.8rem;
		letter-spacing: 0.18em;
	}
	.edi-pillar h3 { font-family: var(--font-display); font-weight: 700; color: var(--color-plum); margin-top: 0.35rem; font-size: 1.05rem; line-height: 1.35; }
	.edi-pillar p { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.75; margin-top: 0.5rem; }
	.edi-steps { display: grid; grid-template-columns: 1fr; gap: 1.5rem 2.5rem; }
	@media (min-width: 640px) { .edi-steps { grid-template-columns: 1fr 1fr; } }
	.edi-step { display: flex; gap: 1rem; }
	.edi-step-num {
		font-family: var(--font-display);
		font-weight: 700;
		color: color-mix(in srgb, var(--color-lavender-dark) 45%, transparent);
		font-size: 2.5rem;
		line-height: 0.8;
		flex-shrink: 0;
	}
	.edi-step h3 { font-family: var(--font-display); font-weight: 700; color: var(--color-plum); font-size: 1.05rem; }
	.edi-step p { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.75; margin-top: 0.35rem; }
	.edi-lead { font-family: var(--font-body); color: var(--color-plum-light); font-size: 1rem; line-height: 1.85; max-width: 42rem; margin-bottom: 2rem; }
	.edi-know { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
	@media (min-width: 640px) { .edi-know { grid-template-columns: 1fr 1fr; gap: 1.75rem 3rem; } }
	.edi-know-item { border-top: 1px solid color-mix(in srgb, var(--color-lavender) 25%, transparent); padding-top: 0.9rem; }
	.edi-know-num { font-family: var(--font-display); font-weight: 700; color: var(--color-coral); font-size: 1.25rem; }
	.edi-know-item h3 { font-family: var(--font-display); font-weight: 700; color: var(--color-plum); margin-top: 0.2rem; font-size: 1.1rem; }
	.edi-know-item p { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.78; margin-top: 0.45rem; }
	.edi-dir { margin-top: 0.25rem; }
	.edi-dir-row { display: grid; grid-template-columns: 1fr; gap: 0.35rem; padding: 1rem 0; border-top: 1px solid color-mix(in srgb, var(--color-lavender) 20%, transparent); }
	.edi-dir-row:last-child { border-bottom: 1px solid color-mix(in srgb, var(--color-lavender) 20%, transparent); }
	@media (min-width: 640px) { .edi-dir-row { grid-template-columns: 11rem 1fr; gap: 1.5rem; align-items: baseline; } }
	.edi-dir-name { font-family: var(--font-display); font-weight: 700; color: var(--color-plum); font-size: 1.05rem; }
	.edi-dir-desc { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.75; }
	.edi-faq { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
	@media (min-width: 768px) { .edi-faq { grid-template-columns: 1fr 1fr; gap: 1.5rem 3rem; } }
	.edi-qa-q { display: flex; align-items: flex-start; gap: 0.65rem; font-family: var(--font-display); font-weight: 600; color: var(--color-plum); font-size: 1rem; line-height: 1.5; }
	.edi-qa-mark { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 1.65rem; height: 1.65rem; border-radius: 9999px; background: color-mix(in srgb, var(--color-coral) 12%, transparent); color: var(--color-coral-dark); font-size: 0.8rem; font-weight: 700; }
	.edi-qa-a { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.78; margin-top: 0.55rem; padding-left: 2.3rem; }
</style>
