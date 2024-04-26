This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Big Picture

- This app is the Next.js/React front end, which is hosted on Vercel.
- The back end (database & attachment files) is a SpringBoot app hosted on Heroku. 


## Installation

```bash
npm install -g vercel # install needed vercel script
vercel link # log in with github, link to "craser's projects" scope
npm install
```


## Running Locally

(Note that you'll need to either point this instance at the _production_ back end API (see: 
[siteconfig.json](./siteconfig.json)), or run the back end locally.)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

