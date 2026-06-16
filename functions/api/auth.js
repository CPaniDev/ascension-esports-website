export async function onRequest(context) {
    if (context.request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        var body = await context.request.json();
        var action = body.action;
        var kv = context.env.ASCENSION_KV;

        if (action === 'login') {
            var password = body.password || '';
            var adminPassword = context.env.ADMIN_PASSWORD;

            if (!adminPassword) {
                return new Response(JSON.stringify({ ok: false, error: 'Server not configured' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (password !== adminPassword) {
                return new Response(JSON.stringify({ ok: false, error: 'Invalid password' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            var token = crypto.randomUUID();
            await kv.put('session_' + token, JSON.stringify({ createdAt: Date.now() }), { expirationTtl: 3600 });

            return new Response(JSON.stringify({ ok: true, token: token }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        if (action === 'verify') {
            var token = body.token || '';
            var session = await kv.get('session_' + token);
            if (!session) {
                return new Response(JSON.stringify({ ok: false }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            return new Response(JSON.stringify({ ok: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (action === 'logout') {
            var token = body.token || '';
            await kv.delete('session_' + token);
            return new Response(JSON.stringify({ ok: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ ok: false, error: 'Unknown action' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
