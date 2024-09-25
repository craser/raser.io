import { list, put, del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import PostDao from "@/model/PostDao";

export const LATEST_PATHNAME = "cache/latest.json";
export const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minute timeout
export const MAX_RESPONSE_TIME = 300; // Respond with *something* within 300ms

function isStale(blob) {
    const now = new Date().getTime();
    const uploaded = new Date(blob.uploadedAt).getTime();
    if (!blob) {
        console.log('stale: true');
        return true;
    } else {
        const stale = (now - uploaded) > MAX_CACHE_AGE;
        console.log('stale: ', stale);
        return stale
    }
}

async function getCachedBlob() {
    const results = await list();
    const blobs = results.blobs;
    const cachedBlob = blobs.find(b => b.pathname === LATEST_PATHNAME);
    return cachedBlob;
}

async function getCachedValue(blob) {
    const response = await fetch(blob.downloadUrl);
    if (response.ok) {
        let cached = await response.json();
        return cached.latest;
    } else {
        throw new Error('Failure fetching blob value');
    }
}

// Function to asynchronously update the cache with fresh data
async function updateCache(latest) {
    // Delete the old cache value (if it exists)
    await del(LATEST_PATHNAME);

    // Update the cache with the latest data from the API
    await put(LATEST_PATHNAME, JSON.stringify({ latest }), {
        access: 'public'
    });
}

/**
 * - If there is no cached value, retrieve a fresh value and return it, then add that value to the cache.
 * - Else, if the current cached value is less than 5 minutes old, return the cached value.
 * - Else, try to retrieve a fresh value. If that takes longer than 300ms, return the cached value, but refresh the cash
 *   with the value when it arrives.  If retrieving the fresh value happens in less than 300ms, return the fresh value
 *   and then cache it.
 *
 * @param request
 * @returns {Promise<NextResponse<{latest}>>}
  */
export function GET(request) {
    return new Promise((resolve, reject) => {
        getCachedBlob()
            .then(cachedBlob => {
                // if no cached blob exists, we have to wait for a fresh value
                if (!cachedBlob) {
                    // If no cached value is available, fetch the latest and return it.
                    PostDao.getPostDao().getEntries().then(resolve);
                } else if (isStale(cachedBlob)) {
                    // FIXME: Add timeouts, error handling, defaults
                    console.log('blob is stale, getting new value from PostDao');
                    let token;
                    getCachedValue(cachedBlob)
                        .then(cached => {
                            console.log('setting max delay')
                            token = setTimeout(() => resolve(cached), MAX_RESPONSE_TIME);
                        })
                        .then(() => {
                            console.log('trying to get latest from dao...')
                            PostDao.getPostDao().getEntries()
                                .then(fresh => {
                                    console.log('got latest from dao', fresh);
                                    resolve(fresh);
                                    updateCache(fresh); // promise ignored
                                });
                        })
                } else {
                    // cache is fresh. pass it along
                    getCachedValue(cachedBlob).then(resolve);
                }
            });
    })
        .then(latest => NextResponse.json({ latest }));
}
