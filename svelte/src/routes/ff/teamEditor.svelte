<script lang="ts">
	import { api } from '$lib/helper';
	import TeamIcon from '$lib/teamIcon.svelte';
	import { ffStore } from './fantasyFootballStore';
	import PlayerRow from './playerRow.svelte';
	type Player = {
		name: string;
		team: string;
		playerID: number;
		medal: '' | 'Gold' | 'Silver';
		regPos: string;
	};
	type Data = {
		players: Record<string, Player>;
		teams: string[];
		pos: string[];
		medals: string[];
		posOrder: Record<string, 'GK' | 'DEF' | 'MID' | 'FWD'>;
	};
	let data: Data;
	let req = api('/ff/getData', { cupID: $ffStore.cupID }).then((r) => {
		data = r;
		checkErrors();
		return r;
	}) as Promise<Data>;

	let filters = {
		team: new Set(),
		medals: new Set(),
		pos: new Set()
	} as const;
	let addMode: 'starting' | 'bench' = 'starting';
	let types = ['starting', 'bench'] as const;
	let errors = '';
	function toggleFilter(type: keyof typeof filters, value: string) {
		if (value == 'All') {
			filters[type].clear();
		} else if (filters[type].has(value)) {
			filters[type].delete(value);
		} else {
			filters[type].add(value);
		}
		filters = filters;
	}
	function checkFiltered(players: Record<string, Player>) {
		return Object.values(players)
			.filter((p) => {
				if (filters.medals.size && !filters.medals.has(p.medal)) return false;
				if (filters.team.size && !filters.team.has(p.team)) return false;
				if (filters.pos.size && !filters.pos.has(p.regPos)) return false;
				return true;
			})
			.sort((a, b) => {
				if (a.team > b.team) return 1;
				if (a.team < b.team) return -1;
				if (a.name > b.name) return 1;
				return -1;
			});
	}
	function addPlayer(player: Player) {
		$ffStore[addMode].add(player.playerID);
		$ffStore = $ffStore;
	}
	function removePlayer(type: 'starting' | 'bench', playerID: number) {
		$ffStore[type].delete(playerID);
		if ($ffStore.cap == playerID) $ffStore.cap = 0;
		if ($ffStore.vice == playerID) $ffStore.vice = 0;
		$ffStore = $ffStore;
	}
	ffStore.subscribe(() => {
		if (data) checkErrors();
	});
	const rosterLimits = {
		starting: {
			GK: [1, 1],
			DEF: [3, 5],
			MID: [3, 6],
			FWD: [1, 3],
			Silver: [2, 2],
			Gold: [2, 2],
			LB: [0, 1],
			RB: [0, 1],
			LMF: [0, 1],
			RMF: [0, 1],
			CMF: [0, 3],
			DMF: [0, 3],
			AMF: [0, 3],
			LWF: [0, 1],
			RWF: [0, 1]
		},
		bench: {
			GK: [1, 1],
			DEF: [2, 2],
			MID: [2, 2],
			FWD: [1, 1],
			Silver: [0, 1],
			Gold: [0, 1]
		}
	};
	function checkErrors() {
		let errorsArr: string[] = [];
		let roster = {
			starting: {
				GK: 0,
				DEF: 0,
				MID: 0,
				FWD: 0,
				Silver: 0,
				Gold: 0
			},
			bench: {
				GK: 0,
				DEF: 0,
				MID: 0,
				FWD: 0,
				Silver: 0,
				Gold: 0
			}
		};
		let DMFCMF = 0;
		let benchMedal = 0;
		let counts = {
			starting: 0,
			bench: 0
		};
		for (let type of ['starting', 'bench'] as const) {
			for (let playerID of Array.from($ffStore[type])) {
				const { regPos, medal } = data.players[playerID];
				roster[type][data.posOrder[regPos]]++;
				if (medal !== '') roster[type][medal]++;
				if (roster[type][regPos] == undefined) roster[type][regPos] = 0;
				roster[type][regPos]++;
				if (type == 'starting' && ['CMF', 'DMF'].includes(regPos)) DMFCMF++;
				if (type == 'bench' && medal !== '') benchMedal++;
				counts[type]++;
			}
		}
		for (let pos in $ffStore.groupsFormation) {
			let num = $ffStore.groupsFormation[pos];
			//if (num > 0 && roster.starting[pos as 'DEF' | 'MID' | 'FWD'] !== num)
			//	errorsArr.push(`You need to have exactly ${num} ${pos}`);
		}
		for (const type in rosterLimits) {
			for (let pos in rosterLimits[type]) {
				let current = roster[type][pos] ?? 0;
				let limits = rosterLimits[type][pos];
				//if (current < limits[0])
				//	errorsArr.push(`Need at least ${limits[0] - current} more ${type} ${pos}`);
			}
		}
		if (DMFCMF == 0) errorsArr.push(`Need at least 1 starting DMF/CMF`);
		if (benchMedal == 0) errorsArr.push(`Need at least 1 bench medal`);
		if (counts.starting < 11)
			errorsArr.push(`Need at least ${11 - counts.starting} more starting players`);
		if (counts.bench < 6) errorsArr.push(`Need at least ${6 - counts.bench} more bench players`);
		if ($ffStore.cap == 0) errorsArr.push('Need a captain');
		if ($ffStore.vice == 0) errorsArr.push('Need a vice captain');
		for (const required of $ffStore.required) {
			if (!($ffStore.starting.has(required) || $ffStore.bench.has(required))) {
				/*errorsArr.push(
					`Need to have /${data.players[required].team}/ - ${data.players[required].name} in your roster`
				);*/
			}
		}
		errors = errorsArr.join(', ');
	}
	function checkLimits(player: Player) {
		return true;
		if ($ffStore.starting.has(player.playerID) || $ffStore.bench.has(player.playerID)) return false;
		const teamCount: Record<string, number> = {};
		let roster = {
			starting: {
				GK: 0,
				DEF: 0,
				MID: 0,
				FWD: 0,
				Silver: 0,
				Gold: 0
			},
			bench: {
				GK: 0,
				DEF: 0,
				MID: 0,
				FWD: 0,
				Silver: 0,
				Gold: 0
			}
		};
		let typeCount = 0;
		let benchMedal = false;
		for (let type of ['starting', 'bench'] as const) {
			for (let playerID of Array.from($ffStore[type])) {
				const { team, regPos, medal } = data.players[playerID];
				if (teamCount[team] == undefined) teamCount[team] = 0;
				teamCount[team]++;
				roster[type][data.posOrder[regPos]]++;
				if (medal !== '') roster[type][medal]++;
				if (type == addMode) typeCount++;
				if (roster[type][regPos] == undefined) roster[type][regPos] = 0;
				roster[type][regPos]++;
				if (type == 'bench' && medal !== '') benchMedal = true;
			}
		}
		if (addMode == 'bench' && player.medal !== '' && benchMedal) return false;
		if (
			rosterLimits[addMode][player.regPos] !== undefined &&
			roster[addMode][player.regPos] >= rosterLimits[addMode][player.regPos][1]
		)
			return false;
		if ((typeCount >= 6 && addMode == 'bench') || (typeCount >= 11 && addMode == 'starting'))
			return false;
		if (
			player.medal !== '' &&
			roster[addMode][player.medal] >= rosterLimits[addMode][player.medal][1]
		)
			return false;
		if (
			roster[addMode][data.posOrder[player.regPos]] >=
			rosterLimits[addMode][data.posOrder[player.regPos]][1]
		)
			return false;
		if (teamCount[player.team] >= 3) return false;
		return true;
	}
	function sortTable(set: Set<number>) {
		return Array.from(set).sort((a, b) => {
			let playerA = data.players[a];
			let playerB = data.players[b];
			if (data.pos.indexOf(playerA.regPos) > data.pos.indexOf(playerB.regPos)) return 1;
			if (data.pos.indexOf(playerA.regPos) < data.pos.indexOf(playerB.regPos)) return -1;
			return 0;
		});
	}
	let saving = false;
	let saveErrors = '';
	async function save() {
		saveErrors = '';
		saving = true;
		let sendData = JSON.parse(JSON.stringify($ffStore));
		sendData.starting = Array.from($ffStore.starting);
		sendData.bench = Array.from($ffStore.bench);
		await api('/ff/saveTeam', sendData)
			.then((r) => {
				if (r.error) {
					saveErrors = 'Error: ' + r.error;
				} else {
					saveErrors = 'Saved';
				}
			})
			.catch(() => {
				saveErrors = 'Error: Something wrong happened';
			});
		saving = false;
	}
	function formatPlayerExportRow(x: number) {
		return `/${data.players[x].team}/ ${data.players[x].regPos} ${data.players[x].name} ${$ffStore.cap == x ? '(C)' : ''}${$ffStore.vice == x ? '(V)' : ''}`;
	}
	function getString() {
		let arr = [...Array.from($ffStore.starting), 'b', ...Array.from($ffStore.bench)];
		for (let i in arr) {
			if (arr[i] == $ffStore.cap) arr[i] = 'c' + arr[i];
			if (arr[i] == $ffStore.vice) arr[i] = 'v' + arr[i];
		}
		return arr.join(',');
	}
</script>

{#await req}
	Loading...
{:then data}
	<parent>
		<div id="containers">
			<div>
				<h3>{$ffStore.name}</h3>
				<div id="teamContainer">
					{#each types as type}
						<container>
							<b
								class={addMode == type ? '' : 'click'}
								on:click={() => {
									addMode = type;
								}}
								>{type == 'starting' ? 'Starting' : 'Bench'}{addMode == type
									? ' - Selected'
									: ''}</b
							>
							<hr />
							<table>
								<tr><th>Board</th><th>Pos</th><th>Medal</th><th>Player</th></tr>
								{#each sortTable($ffStore[type]) as playerID}
									<PlayerRow
										player={data.players[playerID]}
										classes={'click'}
										onClick={() => {
											removePlayer(type, playerID);
										}}
									/>
								{/each}
							</table>
						</container>
					{/each}
				</div>
				Captain<select bind:value={$ffStore.cap}>
					{#each [...Array.from($ffStore.starting), ...Array.from($ffStore.bench)].filter((x) => x != $ffStore.vice) as playerID}
						<option value={playerID}>{data.players[playerID].name}</option>
					{/each}
				</select>
				Vice
				<select bind:value={$ffStore.vice}>
					{#each [...Array.from($ffStore.starting), ...Array.from($ffStore.bench)].filter((x) => x != $ffStore.cap) as playerID}
						<option value={playerID}>{data.players[playerID].name}</option>
					{/each}
				</select>
				{#if errors.length}
					<container id="errors">{errors}</container>
				{/if}
			</div>
			{#if errors.length}
				<container>
					<b>Teams</b>
					<hr />
					<div>
						<div
							class="click"
							on:click={() => {
								toggleFilter('team', 'All');
							}}
						>
							Select All
						</div>
						{#each data.teams as team}
							<div
								on:click={() => {
									toggleFilter('team', team);
								}}
								class={(filters.team.size && !filters.team.has(team) ? 'disabled' : '') + ' click'}
							>
								<TeamIcon {team} />/{team}/
							</div>
						{/each}
					</div>
				</container>
				<container>
					<b>Medals</b>
					<hr />
					<div>
						<div
							class="click"
							on:click={() => {
								toggleFilter('medals', 'All');
							}}
						>
							Select All
						</div>
						{#each data.medals as medal}
							<div
								on:click={() => {
									toggleFilter('medals', medal);
								}}
								class={(filters.medals.size && !filters.medals.has(medal) ? 'disabled' : '') +
									' click'}
							>
								{medal.length ? medal : 'Regular'}
							</div>
						{/each}
					</div>
				</container>
				<container>
					<b>Pos</b>
					<hr />
					<div>
						<div
							class="click"
							on:click={() => {
								toggleFilter('pos', 'All');
							}}
						>
							Select All
						</div>
						{#each data.pos as pos}
							<div
								on:click={() => {
									toggleFilter('pos', pos);
								}}
								class={(filters.pos.size && !filters.pos.has(pos) ? 'disabled' : '') + ' click'}
							>
								{pos}
							</div>
						{/each}
					</div>
				</container>
			{/if}
		</div>
		{#if errors.length}
			<div id="playerList">
				<table>
					<thead><tr><th>Board</th><th>Pos</th><th>Medal</th><th>Player</th><th>Pts</th></tr></thead
					>
					{#key [$ffStore, filters, addMode]}
						{#each checkFiltered(data.players) as player}
							<PlayerRow
								{player}
								classes={checkLimits(player) ? 'click' : 'disabled'}
								onClick={checkLimits(player)
									? () => {
											addPlayer(player);
										}
									: () => {}}
								showPt={true}
							/>
						{/each}
					{/key}
				</table>
			</div>
		{:else}
			<div>
				<container>
					<textarea rows="25">
						{$ffStore.name}
						Starting
						{sortTable($ffStore.starting)
							.map((x) => formatPlayerExportRow(x))
							.join('\n')}
						Bench
						{sortTable($ffStore.bench)
							.map((x) => formatPlayerExportRow(x))
							.join('\n')}

						string: {getString()}
					</textarea><br />
					<button
						disabled={saving}
						on:click={() => {
							save();
						}}>Save</button
					>
					{saveErrors}
				</container>
			</div>
		{/if}
	</parent>
{/await}

<style>
	parent {
		display: flex;
		width: calc(100vw - 1rem);
		padding-left: 1rem;
		height: calc(100vh - 2.5rem);
		overflow-x: auto;
		font-size: small;
	}
	:global(.click) {
		cursor: pointer;
		padding: 3px;
	}
	:global(.click:hover) {
		background: #2e51a2;
	}
	:global(.disabled) {
		text-decoration: solid;
		color: grey;
	}
	#teamContainer {
		display: flex;
		flex-wrap: nowrap;
	}
	#containers {
		flex-grow: 0;
		flex-shrink: 1;
	}
	#playerList {
		overflow-y: scroll;
		flex-grow: 1;
		flex-shrink: 0;
	}
	container {
		background: var(--bg-c1);
		display: block;
		margin: 5px;
		padding: 5px;
		max-width: 40rem;
	}
	container div {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	#playerList thead {
		position: sticky;
		top: 0;
		background: var(--bg-color);
		z-index: 1;
	}
	:global(.teamIcon) {
		padding-right: 0 !important;
	}
	:global(td) {
		text-align: left;
	}
	textarea {
		background: none;
		color: var(--fg-color);
		resize: none;
		width: 30rem;
	}
</style>
