# raser.io: Chris Raser's Personal Blog

## Prerequisites
 - homebrew (`brew` utility)
   - Just used for startup process. If you prefer to install nvm/vercel/etc some other way, go for it.
 - node
 - nvm
 

## Getting Started

### My typical flow for setting up an entirely new machine

  - install brew
  - `brew install nvm`
  - `nvm install node`

### Setting up raser.io for local development

  - `npm install`
  - `brew install vercel-cli`
  - `vercel login`
  - `vercel link`
  - `vercel env pull`
  - `npm run dev-prod` (starts local dev pointing to prod back-end API)


## Current State of Things

- Currently in its infancy, still building out some features that were supported by old Java-based site.

## Goals

- replace outdated, expensive-to-host Java/JSP implementation
- personal playground for new ideas/frameworks


## Overview

- Front end (this codebase) on Vercel
- Back end is Spring Boot hosted on Heroku

