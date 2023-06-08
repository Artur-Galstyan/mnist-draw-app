<script lang="ts">
	import { onMount } from 'svelte';
	import Swal from 'sweetalert2';
	const Toast = Swal.mixin({
		toast: true,
		position: 'top-end',
		showConfirmButton: false,
		timer: 3000,
		timerProgressBar: true,
		didOpen: (toast) => {
			toast.addEventListener('mouseenter', Swal.stopTimer);
			toast.addEventListener('mouseleave', Swal.resumeTimer);
		}
	});
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;

	const cellSize = 20; // Each cell will be 50x50 pixels
	const grid = 28; // Grid size for MNIST

	let isClicked = false;
	let bestGuess: Promise<{ best_guess: number; second_best_guess: number }>;

	const canvasSize = cellSize * grid; // Total canvas size

	// 2D array to hold our grid state
	let cells = Array(grid)
		.fill(0)
		.map(() => Array(grid).fill(0));

	onMount(() => {
		ctx = canvas.getContext('2d');
	});

	// Function to draw cells
	function drawCells() {
		if (!ctx) return;
		for (let i = 0; i < grid; i++) {
			for (let j = 0; j < grid; j++) {
				const intensity = cells[j][i];
				ctx.fillStyle = `rgb(${255 - intensity}, ${255 - intensity}, ${255 - intensity})`;
				ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
			}
		}
	}

	async function copyPrompt() {
		let data = [];
		for (let i = 0; i < grid; i++) {
			for (let j = 0; j < grid; j++) {
				data.push((cells[j][i] / 255) * 2 - 1);
			}
		}
		let req = await fetch('/api/copy', {
			method: 'POST',
			body: JSON.stringify({ data }),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		let prompt = await req.json();
        prompt = prompt.gpt_string;

		navigator.clipboard.writeText(prompt);
		Toast.fire({
			icon: 'success',
			title: 'Copied to clipboard'
		});
	}

	function clear() {
		cells = Array(grid)
			.fill(0)
			.map(() => Array(grid).fill(0));
		drawCells();
	}

	function handleMouseDown(event: any) {
		isClicked = true;
		handleCellClick(event);
	}

	function handleMouseMove(event: any) {
		if (isClicked) {
			handleCellClick(event);
		}
	}

	function handleMouseUp() {
		isClicked = false;
	}

	// Function to handle cell click
	function handleCellClick(event: any) {
		// check if touch event
		if (event.touches) {
			event.preventDefault();
			event = event.touches[0];
		}

		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const cellX = Math.floor(x / cellSize);
		const cellY = Math.floor(y / cellSize);

		// Set this cell and neighbouring cells
		cells[cellY][cellX] = Math.min(cells[cellY][cellX] + 30, 255);

		if (cellX > 0) {
			cells[cellY][cellX - 1] = Math.min(cells[cellY][cellX - 1] + 20, 255);
		}
		if (cellX < grid - 1) {
			cells[cellY][cellX + 1] = Math.min(cells[cellY][cellX + 1] + 20, 255);
		}
		if (cellY > 0) {
			cells[cellY - 1][cellX] = Math.min(cells[cellY - 1][cellX] + 20, 255);
		}
		if (cellY < grid - 1) {
			cells[cellY + 1][cellX] = Math.min(cells[cellY + 1][cellX] + 20, 255);
		}

		drawCells();
	}

	async function classify() {
		// lerp the data into range -1, 1
		let data = [];
		for (let i = 0; i < grid; i++) {
			for (let j = 0; j < grid; j++) {
				data.push((cells[j][i] / 255) * 2 - 1);
			}
		}
		let req = await fetch('/api/classify', {
			method: 'POST',
			body: JSON.stringify({ data }),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		bestGuess = await req.json();
	}
</script>

<div class="flex justify-center m-8">
	<canvas
		bind:this={canvas}
		width={canvasSize}
		height={canvasSize}
		on:touchstart={handleMouseDown}
		on:touchmove={handleMouseMove}
		on:touchend={handleMouseUp}
		on:mousemove={handleMouseMove}
		on:mousedown={handleMouseDown}
		on:mouseup={handleMouseUp}
		on:mouseout={handleMouseUp}
		on:blur={() => {}}
		style="border:1px solid #000;"
	/>
</div>
<div class="flex justify-center space-x-8">
	<button class="btn btn-primary" on:click={classify}>Classify</button>
	<button class="btn btn-secondary" on:click={clear}> Clear </button>
	<button class="btn btn-accent" on:click={copyPrompt}> Copy Prompt for GPT4 </button>
</div>

{#await bestGuess then bestGuess}
	{#if bestGuess}
		<div class="flex justify-center my-4">
			<div class="w-48">My best guess is:</div>

			<div class="text-accent mx-4 font-bold">{bestGuess.best_guess}</div>
		</div>
		<div class="flex justify-center">
			<div class="w-48">My second best guess is:</div>

			<div class="text-info mx-4 font-bold">{bestGuess.second_best_guess}</div>
		</div>
	{/if}
{/await}
