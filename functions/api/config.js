export async function onRequest(context) {
    var kv = context.env.ASCENSION_KV;

    if (context.request.method === 'POST') {
        try {
            var body = await context.request.json();
            var token = body.token || '';

            var session = await kv.get('session_' + token);
            if (!session) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            delete body.token;
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

    try {
        var data = await kv.get('match_config');
        if (data) {
            return new Response(data, {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
    } catch (_) {}

    return new Response('{}', {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
}
