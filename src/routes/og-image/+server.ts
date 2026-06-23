import type { RequestHandler } from './$types.js';

const SITE_NAME = 'GL-Orbit';
const TAGLINE = 'ศูนย์กลางข้อมูลซีรีส์ Girls\' Love พร้อมตารางฉาย';

function svgTemplate(title: string, subtitle: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
	<defs>
		<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" style="stop-color:#FFF5F7"/>
			<stop offset="50%" style="stop-color:#F5F0FF"/>
			<stop offset="100%" style="stop-color:#F0FFF5"/>
		</linearGradient>
		<linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" style="stop-color:#FF6B9D"/>
			<stop offset="100%" style="stop-color:#C4B5FD"/>
		</linearGradient>
		<linearGradient id="title-grad" x1="0%" y1="0%" x2="100%" y2="0%">
			<stop offset="0%" style="stop-color:#2D1B2E"/>
			<stop offset="100%" style="stop-color:#5B3E5C"/>
		</linearGradient>
	</defs>

	<!-- Background -->
	<rect width="1200" height="630" fill="url(#bg)" rx="0"/>

	<!-- Decorative circles -->
	<circle cx="150" cy="150" r="220" fill="#FF6B9D" opacity="0.08"/>
	<circle cx="1050" cy="480" r="260" fill="#C4B5FD" opacity="0.08"/>
	<circle cx="900" cy="100" r="120" fill="#6EE7B7" opacity="0.06"/>
	<circle cx="300" cy="500" r="150" fill="#FF6B9D" opacity="0.05"/>

	<!-- Orbiting rings -->
	<circle cx="600" cy="315" r="180" fill="none" stroke="#C4B5FD" stroke-width="1" opacity="0.3"/>
	<circle cx="600" cy="315" r="220" fill="none" stroke="#FF6B9D" stroke-width="0.5" opacity="0.15"/>
	<circle cx="600" cy="315" r="140" fill="none" stroke="#6EE7B7" stroke-width="0.5" opacity="0.2"/>

	<!-- Orbiting dots -->
	<circle cx="780" cy="315" r="8" fill="#FF6B9D" opacity="0.4"/>
	<circle cx="382" cy="283" r="5" fill="#C4B5FD" opacity="0.3"/>
	<circle cx="460" cy="455" r="4" fill="#6EE7B7" opacity="0.35"/>

	<!-- Logo icon -->
	<circle cx="100" cy="90" r="45" fill="url(#accent)" opacity="0.15"/>
	<text x="100" y="105" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="url(#accent)" text-anchor="middle">GL</text>

	<!-- Title -->
	<text x="80" y="260" font-family="'Syne', 'Arial Black', Arial, sans-serif" font-size="64" font-weight="800" fill="url(#title-grad)">
		${escapeXml(title)}
	</text>

	<!-- Subtitle / description -->
	<text x="80" y="330" font-family="'DM Sans', Arial, sans-serif" font-size="28" fill="#8B6F8C">
		${escapeXml(subtitle)}
	</text>

	<!-- Divider -->
	<line x1="80" y1="370" x2="450" y2="370" stroke="url(#accent)" stroke-width="3" stroke-linecap="round"/>

	<!-- Tags -->
	<rect x="80" y="410" width="130" height="40" rx="20" fill="#FF6B9D" opacity="0.12"/>
	<text x="145" y="436" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#FF6B9D" text-anchor="middle">GL Series</text>

	<rect x="230" y="410" width="140" height="40" rx="20" fill="#C4B5FD" opacity="0.15"/>
	<text x="300" y="436" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#8B75D0" text-anchor="middle">Schedule</text>

	<rect x="390" y="410" width="130" height="40" rx="20" fill="#6EE7B7" opacity="0.12"/>
	<text x="455" y="436" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#3BA878" text-anchor="middle">Community</text>

	<!-- Site name -->
	<text x="80" y="530" font-family="'Syne', 'Arial Black', Arial, sans-serif" font-size="32" font-weight="700" fill="url(#accent)">
		${escapeXml(SITE_NAME)}
	</text>
</svg>`;
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async ({ url }) => {
	const title = url.searchParams.get('title') || 'ค้นพบซีรีส์ GL ที่คุณรัก';
	const subtitle = url.searchParams.get('subtitle') || TAGLINE;

	const svg = svgTemplate(title, subtitle);

	return new Response(svg, {
		headers: {
			'content-type': 'image/svg+xml; charset=utf-8',
			'cache-control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
};
