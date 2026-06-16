// Proxies GET requests to the Worker (same-origin, avoids mobile blocking)
var WORKER_URL = 'https://ascension-publish.christopher-pani.workers.dev';

export async function onRequest(context) {
    try {
        var response = await fetch(WORKER_URL);
        var data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (err) {
        return new Response('{}', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
