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

<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6">
	<div class="flex flex-wrap items-center justify-center gap-2 md:flex-nowrap md:justify-between">
		<button
			aria-label="สัปดาห์ก่อนหน้า"
			onclick={onPrevWeek}
			class="order-2 md:order-1 w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:scale-110 touch-target"
		>
			<svg class="w-4 h-4 sm:w-5 sm:h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
			</svg>
		</button>
		<h2 class="w-full text-center order-1 md:w-auto md:order-2 font-[family-name:var(--font-display)] text-base sm:text-2xl md:text-3xl font-bold text-plum">
			<span class="sm:hidden">{weekRangeText.short}</span>
			<span class="hidden sm:inline">{weekRangeText.full}</span>
		</h2>
		<div class="flex items-center gap-2 order-2 md:order-3">
			<button
				onclick={onThisWeek}
				aria-label="สัปดาห์นี้"
				class="w-9 h-9 sm:h-10 sm:w-auto sm:px-5 rounded-xl flex items-center justify-center bg-gradient-to-r from-coral to-coral-dark text-white text-xs sm:text-sm font-bold shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:scale-110 transition-all touch-target"
			>
				<span class="sm:hidden">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</span>
				<span class="hidden sm:inline">สัปดาห์นี้</span>
			</button>
			<button
				aria-label="สัปดาห์ถัดไป"
				onclick={onNextWeek}
				class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-card-strong flex items-center justify-center hover:bg-white/90 transition-all hover:scale-110 touch-target"
			>
				<svg class="w-4 h-4 sm:w-5 sm:h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
			</button>
		</div>
	</div>
</div>
