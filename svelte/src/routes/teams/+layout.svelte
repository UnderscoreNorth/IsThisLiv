<script>
	import { page } from '$app/stores';
	const links = [
		'3',
		'a',
		'aco',
		'adv',
		'an',
		'asp',
		'b',
		'bant',
		'biz',
		'c',
		'cgl',
		'ck',
		'cm',
		'co',
		'd',
		'diy',
		'e',
		'f',
		'fa',
		'fit',
		'g',
		'gd',
		'gif',
		'h',
		'his',
		'hm',
		'hr',
		'i',
		'ic',
		'int',
		'jp',
		'k',
		'lgbt',
		'lit',
		'm',
		'mlp',
		'mu',
		'n',
		'o',
		'out',
		'p',
		'po',
		'pol',
		'pw',
		'r9k',
		's',
		's4s',
		'sci',
		'soc',
		'sp',
		't',
		'tg',
		'toy',
		'trv',
		'tv',
		'u',
		'v',
		'vg',
		'vm',
		'vmg',
		'vp',
		'vr',
		'vrpg',
		'vst',
		'vt',
		'w',
		'wg',
		'wsg',
		'x',
		'xs',
		'y'
	];
	console.log($page.url.pathname);
</script>

<div id="container">
	<vertNav class="c-1">
		<div id="navTeams">
			{#each links as link}
				<a href="/teams/{link}" class="fuckyou">
					<div class={$page.url.pathname == '/teams/' + link ? 'selectedPage' : 'unselectedPage'}>
						/{link}/
					</div>
				</a>
			{/each}
		</div>
	</vertNav>
	<div id="slotContainer">
		<slot />
	</div>
</div>

<style>
	#slotContainer {
		height: calc(100vh - 2.5rem);
		display: flex;
		flex-direction: column;
		overflow-y: hidden;
	}
	#container {
		display: grid;
		grid-template-columns: 10rem 1fr;
		position: relative;
		height: 100%;
	}
	.selectedPage {
		background: rgba(0, 0, 0, 0.5);
		font-weight: bold;
		padding: 0.25rem 0;
		margin-right: -1rem;
		margin-left: -0.25rem;
		padding-left: 0.25rem;
		padding-right: 1rem;
	}
	#navTeams {
		overflow-x: hidden;
		overflow-y: scroll;
		margin-right: -1rem;
	}
	#navTeams {
		height: calc(100vh - 3.5rem);
		margin-top: -1rem;
		margin-bottom: -1rem;
		padding: 0.5rem 0rem;
	}
	.fuckyou {
		display: inline-block;
		width: 100%;
	}
</style>
