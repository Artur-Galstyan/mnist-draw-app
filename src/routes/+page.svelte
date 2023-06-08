<script>
	import DrawingCanvas from "../lib/DrawingCanvas.svelte";

</script>

<svelte:head>
	<title>Guess my Number</title>
	<meta name="description" content="This is a neural network trained on the MNIST dataset. It can guess the number you draw in there." />

</svelte:head>

<div class="text-center text-2xl text-primary my-8">
	Draw a number from 0 to 9 and the model will try to guess it
</div>
<DrawingCanvas />
