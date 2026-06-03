<script lang="ts">
	import { user } from '$lib/stores/user.js';
	const currentUser = $derived($user);
</script>

<footer class="mt-12 sm:mt-20 relative overflow-hidden">
	<div class="absolute inset-0 bg-gradient-to-t from-lavender/10 to-transparent pointer-events-none"></div>
	
	<div class="relative max-w-6xl mx-auto px-4 py-10 sm:py-16">
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
			<!-- Brand -->
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<div class="relative w-8 h-8">
						<div class="absolute inset-0 bg-gradient-to-br from-coral to-lavender rounded-lg rotate-3"></div>
						<div class="absolute inset-0 bg-white rounded-lg flex items-center justify-center">
							<span class="text-sm font-bold text-gradient">G</span>
						</div>
					</div>
					<span class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">GL-Orbit</span>
				</div>
				<p class="text-sm text-plum-light leading-relaxed max-w-xs">
					ศูนย์กลางข้อมูลและตารางฉายสำหรับแฟนคลับซีรีส์ GL
				</p>
				<div class="flex gap-3">
					{#each ['twitter', 'instagram', 'github'] as social}
						<span class="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-white/60 hover:bg-coral/20 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer touch-target">
							<svg class="w-5 h-5 sm:w-4 sm:h-4 text-plum-light" fill="currentColor" viewBox="0 0 24 24">
								{#if social === 'twitter'}
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
								{:else if social === 'instagram'}
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
								{:else}
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
								{/if}
							</svg>
						</span>
					{/each}
				</div>
			</div>

			<!-- Quick Links -->
			<div>
				<h3 class="font-[family-name:var(--font-display)] font-semibold text-plum mb-4">ลิงก์ด่วน</h3>
				<ul class="space-y-3">
					<li><a href="/" class="text-sm text-plum-light hover:text-coral-dark transition-colors touch-target inline-flex items-center">หน้าแรก</a></li>
					<li><a href="/calendar" class="text-sm text-plum-light hover:text-coral-dark transition-colors touch-target inline-flex items-center">ตารางฉาย</a></li>
					<li><a href="/series" class="text-sm text-plum-light hover:text-coral-dark transition-colors touch-target inline-flex items-center">ซีรีส์ทั้งหมด</a></li>
					{#if currentUser}
						<li><a href="/profile" class="text-sm text-plum-light hover:text-coral-dark transition-colors touch-target inline-flex items-center">โปรไฟล์</a></li>
					{:else}
						<li><a href="/login" class="text-sm text-plum-light hover:text-coral-dark transition-colors touch-target inline-flex items-center">เข้าสู่ระบบ</a></li>
						<li><a href="/register" class="text-sm text-plum-light hover:text-coral-dark transition-colors touch-target inline-flex items-center">สมัครสมาชิก</a></li>
					{/if}
				</ul>
			</div>

			<!-- About -->
			<div>
				<h3 class="font-[family-name:var(--font-display)] font-semibold text-plum mb-4">เกี่ยวกับเรา</h3>
				<ul class="space-y-3">
					<li><span class="text-sm text-plum-light">ข้อมูลเวลาฉายแม่นยำ</span></li>
					<li><span class="text-sm text-plum-light">รองรับ Uncut version</span></li>
					<li><span class="text-sm text-plum-light">ออกแบบมาเพื่อติ่งโดยเฉพาะ</span></li>
				</ul>
			</div>
		</div>

		<div class="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-lavender/20 text-center">
			<p class="text-xs text-plum-light/60">
				© 2026 GL-Orbit. สร้างด้วย 💖 สำหรับชุมชนแฟนคลับ GL
			</p>
		</div>
	</div>
</footer>
