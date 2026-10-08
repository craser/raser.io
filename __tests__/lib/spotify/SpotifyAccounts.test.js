/**
 * ABOUTME: Tests for the Spotify Accounts token request shared by the site and the auth script.
 * ABOUTME: Injects a fake fetch; no network.
 *
 * @jest-environment node
 */

import { requestToken, TOKEN_URL } from '@/lib/spotify/SpotifyAccounts';

const fetchReturns = (status, body) => jest.fn().mockResolvedValue(new Response(body, { status }));

describe('requestToken', () => {
    test('posts the form parameters with Basic client credentials', async () => {
        const fetch = fetchReturns(200, JSON.stringify({ access_token: 'access' }));

        await requestToken({ clientId: 'id', clientSecret: 'secret', params: { grant_type: 'refresh_token', refresh_token: 'rt' }, fetch });

        expect(fetch).toHaveBeenCalledWith(TOKEN_URL, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from('id:secret').toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=refresh_token&refresh_token=rt',
            cache: 'no-store'
        });
    });

    test('resolves to the token response', async () => {
        const fetch = fetchReturns(200, JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }));

        const token = await requestToken({ clientId: 'id', clientSecret: 'secret', params: {}, fetch });

        expect(token).toEqual({ access_token: 'access', refresh_token: 'refresh' });
    });

    test('a refused request rejects with the status and Spotify\'s explanation', async () => {
        const fetch = fetchReturns(400, '{"error":"invalid_client"}');

        await expect(requestToken({ clientId: 'undefined', clientSecret: 'undefined', params: {}, fetch }))
            .rejects.toThrow('Spotify token request failed: HTTP 400 {"error":"invalid_client"}');
    });
});
