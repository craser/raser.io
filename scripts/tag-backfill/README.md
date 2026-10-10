# Tag backfill: entries 3253–3420

**Applied to production on 2026-10-10:** 131 entries, 379 tag links, no new tags. A dry run afterward skipped all 131 as already tagged. Entry 3421, the only newer post, was already tagged by the new publisher.

131 posts from Apr 2016 to Jun 2022 had no tags. Tags 1282–1299 (`kb`, `kettlebells`, `dadlife`, `code`, `nosql`, `garmin`, `setup`, `chinohills`, `santiagooaks`, `selfcoach`, `grips`, `oth`, `repairs`, `technique`, `uci`, `tahoe100`, `tt100`, `strength`) existed but were linked to no post: they were created for these posts, but the links were never saved. These tags use that vocabulary plus the conventions from the posts before the gap.

- `mtb` on mountain-bike posts; `cycling` for bike posts that aren't about trails
- `maps` when the post has a map attachment; `video` when it embeds a video
- `race` on race reports and race prep; `oth` for Over the Hump
- `weigh-in` on posts that report a weekly weight
- At most 4 tags per post, except 3 race posts that hit 5

**No new tags.** Every name below already exists. Unused duplicates left alone: `kb` (used `kettlebells`) and `tt100` (used `tahoe100`).

**Least certain when drafted:** 3351 *Beach Day* (no text, just a photo → `photos`); 3320 *Know Thyself* and 3355 *Daniel Day-Lewis at 60* (light on obvious topics).

How it was applied, from the repo root: a dry run first, then the same command with `--apply`:

```bash
op run --env-file scripts/publish/publish.env -- node scripts/tag-backfill/apply.cjs
```

The script runs as one transaction. It skips any post that already has tags or whose title doesn't match, so it is safe to rerun.

| Entry | Date | Title | Tags |
|---|---|---|---|
| 3253 | 2016-04-06 | Riding the Aliso Course | aliso, maps, mtb, training |
| 3254 | 2016-04-18 | Resting up for Aliso | aliso, maps, mtb, training |
| 3255 | 2016-04-21 | Center of Gravity | mtb, smmt |
| 3256 | 2016-04-25 | Non Dot O.C. Classic #2: Aliso & Wood Canyon | aliso, maps, mtb, race |
| 3293 | 2016-05-03 | Perfect Weather | maps, mtb, smmt |
| 3294 | 2016-05-22 | Been Riding | maps, mtb, training, weights |
| 3295 | 2016-05-30 | Tinkering, Training | maps, mtb, santiagooaks, training |
| 3296 | 2016-06-10 | More Tinkering, Training | maps, mtb, santiagooaks, video |
| 3297 | 2016-06-12 | A Few Small Repairs | gear, mtb, repairs |
| 3298 | 2016-06-27 | New Training Block | kettlebells, training, weights |
| 3299 | 2016-07-12 | Training Progress | training, weights |
| 3300 | 2016-08-01 | The Panic Creeps In... | cycling, training |
| 3301 | 2016-08-03 | Pivoting | mtb, training |
| 3302 | 2016-08-18 | New Drive Train | gear, mtb, repairs |
| 3303 | 2016-09-19 | Race Prep | mtb, race, training |
| 3304 | 2016-09-26 | 2016 Non Dot O.C. Classic #3: Santiago Oaks | mtb, race, santiagooaks |
| 3305 | 2016-10-11 | Bike Lust | bikelust, cycling, gear |
| 3306 | 2016-10-12 | Catching Up | maps, mtb, training |
| 3307 | 2016-10-13 | Fullerton Loop | maps, mtb |
| 3308 | 2016-10-30 | Man Plans, God Laughs | dadlife, maps, mtb |
| 3309 | 2016-10-30 | Laguna Rides | maps, mtb |
| 3310 | 2016-11-15 | Another Bearing Replacement, Fullerton Loop PR* | gear, mtb, repairs |
| 3311 | 2016-11-17 | Kettlebells Make Me Faster | kettlebells, training, video, workouts |
| 3312 | 2016-11-23 | Tour de Tryptophan/24 Hours of the Fullerton Loop | mtb, race |
| 3313 | 2016-12-06 | Current KB | kettlebells, workouts |
| 3314 | 2016-12-11 | Recovering Wrong | cycling, recovery, supplements |
| 3315 | 2016-12-13 | Recovering Right | mtb, recovery, santiagooaks |
| 3316 | 2016-12-13 | We all gotta work together. | mtb, simivalley, trails |
| 3317 | 2016-12-28 | It Ain't Complicated | kettlebells, workouts |
| 3318 | 2017-01-04 | Lunchtime Workouts: Displaying Some Adaptability | workouts |
| 3319 | 2017-01-19 | Parenthood: Week 1 | books, dadlife |
| 3320 | 2017-01-19 | Know Thyself | fitness |
| 3321 | 2017-02-06 | Lunchtime Workouts | dadlife, training, workouts |
| 3322 | 2017-03-14 | Trying Something Crazy | kettlebells, training, workouts |
| 3323 | 2017-03-22 | So Crazy it Just Might Work | cycling, kettlebells, training |
| 3324 | 2017-04-04 | Recognizing Yourself in Someone Else's Painting | 42, strava |
| 3325 | 2017-04-09 | Moderating the Level of Crazy | kettlebells, maps, workouts |
| 3326 | 2017-04-16 | Consistent Training | mtb, training |
| 3327 | 2017-05-06 | Sanity Ride | maps, mtb, santiagooaks |
| 3328 | 2017-05-12 | Sarah Mei: Livable Code | code, programming, video |
| 3329 | 2017-06-02 | Neha Narula on Caching | code, nosql, programming, video |
| 3330 | 2017-06-02 | There's Something I Want | goals, maps, mtb |
| 3331 | 2017-06-06 | Garmin Screens | garmin, gear, setup |
| 3332 | 2017-06-15 | Farther Afield: Glendale & Pasadena | maps, mtb, strava |
| 3333 | 2017-07-10 | More Chino Hills State Park | chinohills, maps, mtb |
| 3334 | 2017-07-10 | Coaching Myself | goals, selfcoach, training |
| 3335 | 2017-07-17 | Barham Ridge Graded | mtb, santiagooaks, trails |
| 3336 | 2017-07-20 | Motivational Self-Talk | diet, selfcoach |
| 3337 | 2017-07-21 | Self-Coaching: Week 1 | selfcoach, training |
| 3338 | 2017-07-28 | Self-Coaching: Week 2 | selfcoach, training |
| 3339 | 2017-08-04 | Self-Coaching: Week 3 | selfcoach, training |
| 3340 | 2017-08-08 | Stop Silicone Grips from Slipping | gear, grips, mtb |
| 3341 | 2017-08-12 | Race Prep | maps, mtb, oth, race |
| 3342 | 2017-08-16 | Over the Hump | maps, mtb, oth, race |
| 3343 | 2017-08-16 | Self-Coaching: Week 4 | selfcoach, training |
| 3344 | 2017-08-21 | Self-Coaching: Week 5 | oth, selfcoach, training |
| 3345 | 2017-08-25 | Self-Coaching: Week 6 | selfcoach, training |
| 3346 | 2017-08-28 | Self-Coaching: Loaded Carries | selfcoach, weights |
| 3347 | 2017-09-04 | Self-Coaching: Week 7 | selfcoach, sleep, training |
| 3348 | 2017-09-07 | Self-Coaching: Week 8 | selfcoach, training |
| 3349 | 2017-09-11 | Self-Coaching: Take-Aways | selfcoach, training |
| 3350 | 2017-10-06 | Just Checking In | kettlebells, weights, workouts |
| 3351 | 2017-10-07 | Beach Day | photos |
| 3352 | 2017-11-06 | Punching the Clock | cycling, training |
| 3353 | 2017-11-09 | The Value of the Experience | mtb, trails, video |
| 3354 | 2017-11-12 | Quick Repairs | gear, mtb, repairs |
| 3355 | 2017-12-02 | Daniel Day-Lewis at 60 | 42, fitness |
| 3356 | 2017-12-11 | Homesick | mtb, trails |
| 3357 | 2017-12-22 | Quick Update | maps, selfcoach, training |
| 3358 | 2018-01-04 | Knowledge is Power | books, maps, mtb, technique |
| 3359 | 2018-01-30 | Learning to Bunny Hop, Busted Saddle | mtb, repairs, technique, video |
| 3360 | 2018-03-08 | Checking In | oth, sick, training |
| 3361 | 2018-03-29 | Deferred Maintenance | gear, mtb, repairs |
| 3362 | 2018-05-26 | Upgraded Motivation | gear, mtb |
| 3363 | 2018-06-20 | Deferred Maintenance: No Longer Deferred | gear, mtb, repairs |
| 3364 | 2018-06-30 | New Dirt Loop, New Fork | gear, maps, mtb |
| 3365 | 2018-07-04 | More Good Stuff | maps, mtb |
| 3366 | 2018-08-16 | Upgrades | gear, mtb |
| 3367 | 2018-08-23 | UCI XCO | mtb, race, uci |
| 3368 | 2018-08-24 | More Racing | goals, mtb, race |
| 3369 | 2018-09-03 | Chino Hills, Recovery | chinohills, maps, mtb |
| 3370 | 2018-09-19 | Tahoe Trail 100 | maps, mtb, race, tahoe100, video |
| 3371 | 2018-10-23 | Tahoe Prep: Week 1 | maps, tahoe100, training, weigh-in |
| 3372 | 2018-10-31 | Tahoe Prep: Week 2 | tahoe100, training, weigh-in |
| 3373 | 2018-11-06 | Tahoe Prep: Week 3 | tahoe100, training, weigh-in |
| 3374 | 2018-11-13 | Tahoe Prep: Week 4 | maps, tahoe100, training, weigh-in |
| 3375 | 2018-11-18 | Tahoe Prep: Week 5 | tahoe100, training, weigh-in |
| 3376 | 2018-11-25 | Tahoe Prep: Week 6 | tahoe100, training, weigh-in |
| 3377 | 2018-12-05 | Tahoe Prep: Week 7 | tahoe100, training, weigh-in |
| 3378 | 2018-12-07 | Tahoe Prep: Week 8 | maps, tahoe100, training, weigh-in |
| 3379 | 2019-01-01 | Tahoe Prep: Week 9 | tahoe100, training, weigh-in |
| 3380 | 2019-01-01 | Tahoe Prep: Week 10 | tahoe100, training |
| 3381 | 2019-01-02 | Tahoe Prep: Week 11 | maps, repairs, tahoe100, training |
| 3382 | 2019-01-04 | Tahoe Prep: Week 12 | maps, tahoe100, training, video |
| 3383 | 2019-01-06 | Weekend Wrenching | gear, mtb, repairs |
| 3384 | 2019-01-14 | Tahoe Prep: Week 13 | sick, tahoe100, training |
| 3385 | 2019-01-20 | Tahoe Prep: Week 14 | tahoe100, training |
| 3386 | 2019-01-28 | Tahoe Prep: Week 15 | repairs, tahoe100, training |
| 3387 | 2019-02-11 | Tahoe Prep: Weeks 16 & 17 | repairs, tahoe100, training |
| 3388 | 2019-02-27 | Tahoe Prep: Week 18 | maps, tahoe100, training, weigh-in |
| 3389 | 2019-03-20 | Tahoe Prep: Weeks 19 - 22 | maps, tahoe100, training, weigh-in |
| 3390 | 2019-04-24 | Training: Weeks 23-27 | maps, tahoe100, training |
| 3391 | 2019-05-01 | Training: Week 28 | mtb, training |
| 3392 | 2019-05-06 | Limestone Canyon Race | maps, mtb, race |
| 3393 | 2019-05-31 | Training Update | maps, strava, training |
| 3394 | 2019-07-24 | Over the Hump #7: 12th (Intermediate, 40-49) | maps, mtb, oth, race |
| 3395 | 2019-08-05 | Over the Hump #8: 7th (Intermediate, 40-49) | maps, mtb, oth, race |
| 3396 | 2019-08-22 | Over the Hump #11: 9th (Intermediate, 40-49) | mtb, oth, race |
| 3397 | 2019-08-29 | Over the Hump #12: 5th (Intermediate, 40-49) | mtb, oth, race |
| 3398 | 2019-09-01 | Take-Aways from Over the Hump 2019 | oth, race, training |
| 3399 | 2019-09-11 | Mass Made Simple | training, weights |
| 3400 | 2019-09-12 | Measurements: Before | weigh-in, weights |
| 3401 | 2019-09-25 | Older & Wiser: Nasty Cough | sick, weights |
| 3402 | 2019-11-27 | Hypertrophy Block Review | training, weights |
| 3403 | 2019-12-10 | Strength Build | kettlebells, strength, weights |
| 3404 | 2019-12-14 | First Attempt at Using The Caja China | cooking, food, recipe |
| 3405 | 2020-01-20 | Strength Block Review | injury, strength, weights |
| 3407 | 2020-02-16 | Trail Saddle Bag 2020 | gear, mtb, tools |
| 3408 | 2020-02-17 | Priority: Fat Loss | diet, training, weightloss |
| 3409 | 2020-06-21 | Training Update: Quarantine | oth, training, video |
| 3410 | 2020-07-06 | A Year of Progress | goals, training, weights |
| 3411 | 2021-01-04 | 2021 Goals, Recovery Methods | goals, oth, recovery, training |
| 3412 | 2021-05-10 | Training Update: Upgrades & Saddle Sores | gear, training |
| 3413 | 2021-07-22 | Over the Hump #1: 9th (Intermediate, 40-49) | maps, mtb, oth, race, video |
| 3414 | 2021-08-16 | 2021 OtH #2-4 (Intermediate, 40-49) | maps, mtb, oth, race, video |
| 3415 | 2021-09-09 | Starting My 2022 Strength Build | strength, weigh-in, weights |
| 3416 | 2021-09-13 | 2021 OtH #4-8, Season Wrap-Up | maps, mtb, oth, race |
| 3417 | 2021-12-23 | Prioritizing Fat Loss | diet, weightloss |
| 3418 | 2022-02-03 | 2022 OtH Winter Series #2 (Int, 40-49): 11th | mtb, oth, race |
| 3419 | 2022-02-25 | Executing on the Fat Loss Plan | diet, weightloss |
| 3420 | 2022-06-22 | Building Cornering Skills | mtb, technique, video |
