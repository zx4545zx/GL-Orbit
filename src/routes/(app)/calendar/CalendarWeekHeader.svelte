<script lang="ts">
	interface Props {
		currentWeek: Date;
		onPrevWeek: () => void;
		onNextWeek: () => void;
		onThisWeek: () => void;
	}

	let { currentWeek, onPrevWeek, onNextWeek, onThisWeek }: Props = $props();

	const thaiMonths = [
		'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
		'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
	];
	const thaiMonthsShort = [
		'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
		'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
	];

	function getStartOfWeek(date: Date): Date {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1);
		return new Date(d.setDate(diff));
	}

	function getEndOfWeek(date: Date): Date {
		const start = getStartOfWeek(date);
		return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
	}

	const weekRangeText = $derived((() => {
		const start = getStartOfWeek(currentWeek);
		const end = getEndOfWeek(currentWeek);
		const startDay = start.getDate();
		const endDay = end.getDate();
		const startMonth = thaiMonths[start.getMonth()];
		const endMonth = thaiMonths[end.getMonth()];
		const startMonthShort = thaiMonthsShort[start.getMonth()];
		const endMonthShort = thaiMonthsShort[end.getMonth()];
		const year = start.getFullYear() + 543;

		if (start.getMonth() === end.getMonth()) {
			return {
				short: `${startDay} - ${endDay} ${startMonthShort} ${year}`,
				full: `${startDay} - ${endDay} ${startMonth} ${year}`
			};
		} else {
			return {
				short: `${startDay} ${startMonthShort} - ${endDay} ${endMonthShort} ${year}`,
				full: `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
			};
		}
	})());
</script>

<div class="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-5 mb-4 sm:mb-6">
	<div class="flex items-center gap-3">
		<button
			aria-label="สัปดาห์ก่อนหน้า"
			onclick={onPrevWeek}
			class="w-11 h-11 rounded-2xl glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:-translate-x-0.5 touch-target flex-shrink-0"
		>
			<svg class="w-5 h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
			</svg>
		</button>

		<div class="flex-1 min-w-0 text-center">
			<div class="text-[11px] sm:text-xs font-bold text-coral-dark uppercase tracking-wide mb-0.5">สัปดาห์ที่กำลังดู</div>
			<h2 class="font-[family-name:var(--font-display)] text-base sm:text-2xl md:text-3xl font-bold text-plum truncate">
				<span class="sm:hidden">{weekRangeText.short}</span>
				<span class="hidden sm:inline">{weekRangeText.full}</span>
			</h2>
		</div>

		<div class="flex items-center gap-2 flex-shrink-0">
			<button
				onclick={onThisWeek}
				aria-label="สัปดาห์นี้"
				class="hidden sm:inline-flex h-11 px-5 rounded-2xl items-center justify-center bg-gradient-to-r from-coral to-coral-dark text-white text-sm font-bold shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:-translate-y-0.5 transition-all touch-target"
			>
				สัปดาห์นี้
			</button>
			<button
				onclick={onThisWeek}
				aria-label="สัปดาห์นี้"
				class="sm:hidden w-11 h-11 rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white flex items-center justify-center shadow-lg shadow-coral/25 touch-target"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</button>
			<button
				aria-label="สัปดาห์ถัดไป"
				onclick={onNextWeek}
				class="w-11 h-11 rounded-2xl glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:translate-x-0.5 touch-target"
			>
				<svg class="w-5 h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
			</button>
		</div>
	</div>
</div>
