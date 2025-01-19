<script>
	const urls = Object.keys(import.meta.glob('../../../../static/**/*'));
	for (let i = 0; i < urls.length; i++) {
		urls[i] = urls[i].replace('../../../../static', '');
	}
	urls.sort();
</script>

<div id="groupContainer">
	{#each ['/icons/cups/', '/icons/cups-small', '/icons/team-small'] as group}
		<div class="group">
			{#each urls.filter((x) => x.indexOf(group) == 0) as url}
				<div>
					<img src={url} alt={url} />
					{url}
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	#groupContainer {
		display: flex;
		gap: 1rem;
	}
	.group {
		display: flex;
		flex-direction: column;
	}
	img {
		max-height: 100px;
		max-width: 100px;
	}
</style>
