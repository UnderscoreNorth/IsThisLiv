<script lang="ts">
	import BracketMatch from './bracketMatch.svelte';

	type Round = {
		name: string;
		matches: Array<{
			home: string;
			homeg: string;
			winner: string;
			away: string;
			awayg: string;
			roundOrder: number;
		}>;
	};
	export let data2: {
		matches: {
			kos: Array<Round>;
		};
	};
	let data: {
		matches: {
			kos: Array<Round>;
		};
	} = JSON.parse(JSON.stringify(data2));
	if (data.matches.kos.length > 0) {
		for (let i = data.matches.kos.length - 1; i >= 0; i--) {
			if (['Boss', 'Wooden Spoon'].includes(data.matches.kos[i].name)) {
				data.matches.kos.splice(i);
			}
		}
	}

	for (let i in data.matches.kos) {
		if (data.matches.kos[i].name == '3rd Place') {
			if (data.matches.kos[parseInt(i) + 1]) {
				// new check here
				data.matches.kos[parseInt(i) + 1].matches.push(data.matches.kos[i].matches[0]);
			}
			data.matches.kos.splice(parseInt(i), 1);
			break;
		}
	}
	console.log(data.matches.kos);
	let type = 'single';
	let double: Record<string, Round> = {};
	if (data.matches.kos.map((x) => x.name).includes('Grand Final')) {
		for (const round of data.matches.kos) {
			double[round.name] = round;
		}
		type = 'double';
	}
</script>

{#await data}
	Loading...
{:then data}
	<bracket>
		{#if type == 'single'}
			{#each data.matches.kos as round, i}
				{#if i !== 0}
					<div class="bracketGapperParent">
						<div class="bracketName" style:visibility={'hidden'}></div>
						{#each data.matches.kos.length == i + 1 ? [1] : round.matches as match}
							<div class="bracketMatchContainer">
								<div
									style:height={Math.pow(2, i - 1) * 2.25 + (Math.pow(2, i - 1) - 1) * 0.5 + 'rem'}
								/>
								<div class="gapMiddle">
									<div class="gapLeft" />
									<div class="gapTop" />
								</div>
								<div
									style:height={Math.pow(2, i - 1) * 2.25 + (Math.pow(2, i - 1) - 1) * 0.5 + 'rem'}
								/>
							</div>
						{/each}
					</div>
				{/if}
				<div class="bracketRound">
					<div class="bracketName">{round.name}</div>
					{#if data.matches.kos.length == i + 1}
						<div class="bracketMatchContainer">
							<div class="bracketMatch"></div>
						</div>
					{/if}
					{#each round.matches as match}
						<div class="bracketMatchContainer">
							{#if match.roundOrder == 10}
								<div>3rd Place</div>
							{/if}
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
			{/each}
		{:else}
			<div class="doubleRound">
				<div class="bracketRound">
					<div class="bracketName">First Round</div>
					{#each double['Round of 16'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
				<div class="bracketRound">
					<div class="bracketName">Losers' Round 1</div>
					{#each double['Losers 1'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="doubleRound">
				<div class="bracketGapperParent">
					<div class="bracketName" style:visibility={'hidden'}></div>
					{#each Array(4) as i}
						<div class="bracketMatchContainer">
							<div style:height={'2.25rem'} />
							<div class="gapMiddle">
								<div class="gapLeft" />
								<div class="gapTop" />
							</div>
							<div style:height={'2.25rem'} />
						</div>
					{/each}
				</div>
				<div></div>
			</div>

			<div class="doubleRound">
				<div class="bracketRound">
					<div class="bracketName">Quarter Finals</div>
					{#each double['Quarter'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
				<div class="bracketRound">
					<div class="bracketName">Losers' Round 2</div>
					{#each double['Losers 2'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="doubleRound">
				<div class="bracketRound"></div>
				<div class="bracketRound">
					<div class="bracketName">Losers' Round 3</div>
					{#each double['Losers 3'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="doubleRound">
				<div class="bracketRound">
					<div class="bracketName">Semi Finals</div>
					{#each double['Semifinal'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
				<div class="bracketRound">
					<div class="bracketName">Losers' Round 4</div>
					{#each double['Losers 4'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="doubleRound">
				<div class="bracketRound"></div>
				<div class="bracketRound">
					<div class="bracketName">Losers' Round 5</div>
					{#each double['Losers 5'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="doubleRound">
				<div class="bracketRound">
					<div class="bracketName">Winners Finals</div>
					{#each double['Final'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
				<div class="bracketRound">
					<div class="bracketName">Losers' Final</div>
					{#each double['Losers Final'].matches as match}
						<div class="bracketMatchContainer">
							<div class="bracketMatch">
								<BracketMatch {match} />
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="bracketRound">
				<div class="bracketName">Grand Finals</div>
				<div class="bracketMatchContainer">
					{#if double['Grand Final'].matches.length == 2}
						<div class="bracketGrandFinal">
							<div
								style:font-weight={double['Grand Final'].matches[1].home ==
								double['Grand Final'].matches[1].winner
									? 'bold'
									: 'normal'}
							>
								/{double['Grand Final'].matches[1].home}/
							</div>
							<div
								style:font-weight={double['Grand Final'].matches[1].home ==
								double['Grand Final'].matches[1].winner
									? 'bold'
									: 'normal'}
							>
								{double['Grand Final'].matches[0].homeg}
							</div>
							<div
								style:font-weight={double['Grand Final'].matches[1].home ==
								double['Grand Final'].matches[1].winner
									? 'bold'
									: 'normal'}
							>
								{double['Grand Final'].matches[1].homeg}
							</div>
							<div
								style:font-weight={double['Grand Final'].matches[1].away ==
								double['Grand Final'].matches[1].winner
									? 'bold'
									: 'normal'}
							>
								/{double['Grand Final'].matches[1].away}/
							</div>
							<div
								style:font-weight={double['Grand Final'].matches[1].away ==
								double['Grand Final'].matches[1].winner
									? 'bold'
									: 'normal'}
							>
								{double['Grand Final'].matches[0].awayg}
							</div>
							<div
								style:font-weight={double['Grand Final'].matches[1].away ==
								double['Grand Final'].matches[1].winner
									? 'bold'
									: 'normal'}
							>
								{double['Grand Final'].matches[1].awayg}
							</div>
						</div>
					{:else}
						<div class="bracketMatch">
							<BracketMatch match={double['Grand Final'].matches[0]} />
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</bracket>
{/await}

<style>
	bracket {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
	}
	.gapMiddle {
		flex-grow: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
	}
	.gapTop {
		border-bottom: solid 1px var(--fg-color);
	}
	.gapLeft {
		border-top: solid 1px var(--fg-color);
		border-right: solid 1px var(--fg-color);
		border-bottom: solid 1px var(--fg-color);
		grid-row: span 2;
	}
	.bracketGapperParent {
		display: grid;
		grid-template-rows: 2rem auto;
		gap: 1rem;
	}
	.bracketRound {
		display: grid;
		grid-template-rows: 2rem;
		grid-auto-rows: 1fr;
		gap: 1rem;
		flex-grow: 1;
		max-width: 20rem;
	}
	.doubleRound {
		display: grid;
		grid-template-rows: 2fr 1fr;
		gap: 1rem;
		flex-grow: 1;
		max-width: 20rem;
	}
	.bracketName {
		font-weight: bold;
		border: solid 1px var(--bg-c2);
		background: var(--bg-c1);
		padding: 0.5rem;
		border: solid 1px var(--fg-color);
		height: 1rem;
	}
	.bracketMatchContainer {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.bracketMatch {
		display: grid;
		grid-template-columns: 1fr 2rem;
		grid-template-rows: repeat(2, 1fr);
		grid-column-gap: 0px;
		grid-row-gap: 0px;
		height: 4.5rem;
	}
	.bracketGrandFinal {
		display: grid;
		grid-template-columns: 1fr 2rem 2rem;
		grid-template-rows: repeat(2, 1fr);
		grid-column-gap: 0px;
		grid-row-gap: 0px;
		height: 4.5rem;
	}
	.bracketGrandFinal div {
		border: solid 1px var(--fg-color);
		padding: 0.5rem;
		background: var(--bg-c1);
	}
</style>
