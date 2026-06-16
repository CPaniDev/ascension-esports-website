export async function onRequest(context) {
    if (context.request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        var body = await context.request.json();
        var kv = context.env.ASCENSION_KV;
        await kv.put('match_config', JSON.stringify(body));
        return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
