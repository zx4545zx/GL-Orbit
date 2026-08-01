export type EpisodeListStatus = 'aired' | 'next' | 'tba';

type EpisodeSchedule = {
	airDateIso: string | null;
};

export function getEpisodeListStatus(
	episode: number,
	schedules: EpisodeSchedule[],
	nextEpisode: number | null,
	now = Date.now()
): EpisodeListStatus {
	if (nextEpisode === episode) return 'next';

	const hasAiredSchedule = schedules.some((schedule) => {
		if (!schedule.airDateIso) return false;
		const airTime = new Date(schedule.airDateIso).getTime();
		return Number.isFinite(airTime) && airTime <= now;
	});

	return hasAiredSchedule ? 'aired' : 'tba';
}
