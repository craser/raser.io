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
        return true;
    } else {
        const stale = (now - uploaded) > MAX_CACHE_AGE;
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
export async function updateCache(latest) {
    console.log('updating cache with fresh data');
    const results = await list();
    const blobs = results.blobs || [];
    const all = Promise.all([
        ...blobs
            .filter(b => b.pathname === LATEST_PATHNAME)
            .map((b) => del(b.downloadUrl)),
        put(LATEST_PATHNAME, JSON.stringify({ latest }), {
            access: 'public'
        })
    ]).then(() => {
        console.log('cache updated');
    });
    return all;
}

const getFreshValue = (() => {
    let promise;
    return function() {
        if (!promise) {
            promise = PostDao.getPostDao().getEntries()
                .then(fresh => {
                    updateCache(fresh); // promise ignored
                    promise = null;
                    return fresh;
                });
        }
        return promise;
    }
})();

/**
 * - If there is no cached value, retrieve a fresh value and return it, then add that value to the cache.
 * - Else, if the current cached value is less than 5 minutes old, return the cached value.
 * - Else, try to retrieve a fresh value. If that takes longer than 300ms, return the cached value, but refresh the cash
 *   with the value when it arrives.  If retrieving the fresh value happens in less than 300ms, return the fresh value
 *   and then cache it.
 *
 * @returns {Promise<NextResponse<{latest}>>}
 */
export function getLatest() {
    return new Promise((resolve, reject) => {
        console.log('retrieving cashed list of latest entries from edge config');
        getCachedBlob()
            .then(cachedBlob => {
                // if no cached blob exists, we have to wait for a fresh value
                if (!cachedBlob) {
                    // If no cached value is available, fetch the latest and return it.
                    console.log('no cached value found, fetching fresh value');
                    getFreshValue().then(resolve);
                } else if (isStale(cachedBlob)) {
                    // The cache is stale, but we're prioritizing responsiveness here.
                    // So we try to fetch a fresh value, but if it takes too long
                    // we just return the stale cached version.
                    console.log('cache is stale, fetching fresh value');
                    getCachedValue(cachedBlob)
                        .then(cached => setTimeout(() => resolve(cached), MAX_RESPONSE_TIME))
                        .then(() => getFreshValue().then(resolve))
                } else {
                    // The cache is fresh. Pass it along.
                    console.log('returning cached value');
                    getCachedValue(cachedBlob).then(resolve);
                }
            })
            .catch(() => {
                console.log('error fetching cached value, fetching fresh value');
                resolve([]);
            });
    })
        .then(latest => NextResponse.json({ latest }));
}
