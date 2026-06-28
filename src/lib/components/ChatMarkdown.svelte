<script lang="ts">
	let { content }: { content: string } = $props();

	function escapeHtml(value: string) {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	function inlineMarkdown(value: string) {
		return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
	}

	function isTableSeparator(line: string) {
		return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
	}

	function parseTable(lines: string[], start: number) {
		const header = lines[start];
		const separator = lines[start + 1];
		if (!header?.includes('|') || !isTableSeparator(separator ?? '')) return null;

		const rows: string[][] = [];
		let index = start;
		while (index < lines.length && lines[index].includes('|')) {
			rows.push(lines[index].split('|').map((cell) => cell.trim()).filter(Boolean));
			index += 1;
		}

		if (rows.length < 2) return null;
		const [head, , ...body] = rows;
		const thead = `<thead><tr>${head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead>`;
		const tbody = `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
		return {
			html: `<div class="chat-md-table-wrap"><table>${thead}${tbody}</table></div>`,
			next: index
		};
	}

	function renderMarkdown(value: string) {
		const lines = value.replace(/\r\n/g, '\n').split('\n');
		const html: string[] = [];
		let index = 0;

		while (index < lines.length) {
			const line = lines[index].trim();
			if (!line) {
				index += 1;
				continue;
			}

			const table = parseTable(lines, index);
			if (table) {
				html.push(table.html);
				index = table.next;
				continue;
			}

			if (line.startsWith('## ')) {
				html.push(`<h3>${inlineMarkdown(line.slice(3))}</h3>`);
			} else if (/^\d+\.\s+/.test(line)) {
				const items: string[] = [];
				while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
					items.push(`<li>${inlineMarkdown(lines[index].replace(/^\s*\d+\.\s+/, ''))}</li>`);
					index += 1;
				}
				html.push(`<ol>${items.join('')}</ol>`);
				continue;
			} else if (/^[-*]\s+/.test(line)) {
				const items: string[] = [];
				while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
					items.push(`<li>${inlineMarkdown(lines[index].replace(/^\s*[-*]\s+/, ''))}</li>`);
					index += 1;
				}
				html.push(`<ul>${items.join('')}</ul>`);
				continue;
			} else {
				html.push(`<p>${inlineMarkdown(line)}</p>`);
			}
			index += 1;
		}

		return html.join('');
	}
</script>

<div class="chat-md">
	{@html renderMarkdown(content)}
</div>

<style>
	.chat-md :global(h3) {
		margin: 0 0 0.5rem;
		font-weight: 800;
		color: rgb(45 27 46);
	}

	.chat-md :global(p) {
		margin: 0.35rem 0;
	}

	.chat-md :global(ol),
	.chat-md :global(ul) {
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
	}

	.chat-md :global(li) {
		margin: 0.25rem 0;
	}

	.chat-md :global(strong) {
		color: rgb(45 27 46);
		font-weight: 800;
	}

	.chat-md :global(.chat-md-table-wrap) {
		margin-top: 0.5rem;
		overflow-x: auto;
		border-radius: 0.75rem;
		border: 1px solid rgba(196, 181, 253, 0.35);
	}

	.chat-md :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.chat-md :global(th),
	.chat-md :global(td) {
		padding: 0.625rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid rgba(196, 181, 253, 0.25);
	}

	.chat-md :global(th) {
		background: rgba(196, 181, 253, 0.14);
		color: rgb(45 27 46);
		font-weight: 800;
	}
</style>
