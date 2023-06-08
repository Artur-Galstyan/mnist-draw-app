import type { RequestHandler } from '@sveltejs/kit';
import { PUBLIC_BACKEND_API } from '$env/static/public';
import { json } from '@sveltejs/kit';

export const POST = (async ({ request, fetch }) => {
	let jsonBody = await request.json();

	let req = await fetch(PUBLIC_BACKEND_API, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(jsonBody)
	});

	let res = await req.json();

	return json(res);
}) satisfies RequestHandler;
