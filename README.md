# Korpusi (MUSCO)

This is the repository hosting the source code for the Music Corpora of Slovenia Online (MUSCO) platform.
The live version of the platform is accessible at [this link](https://korpusi.muzikolofijaff.si).

The platform aims to be a central repository for sheet music and audio files for Slovenian language
works. It enables the user to search by various filters such as full-text search on the metadata,
song duration, ambitus and various other musicological properties.

## Project structure

This repository is made up of two parts: the pipeline and the web app. The pipeline handles all
the preprocessing and musical analysis of the raw files and prepares them for insertion into the
database. You can read more about the process in the README of the `pipeline` folder. The web app
is the user-facing platform allowing the public to browse the database and use the various filters
to narrow down their search for works with specific properties or histories.

## Deployment

For deployment we use Docker Compose. The process is straightforward:

- Copy `.env.example` to `.env` and change the `ELASTIC_PASSWORD`, `KIBANA_PASSWORD`, `HOSTNAME` and `ENCRYPTION_KEY` keys.
- Copy `web-app/.env.example` to `web-app/.env` and change the the `ELASTIC_PASSWORD` to what you set it to before.
- Run `docker compose up -d`. This will spin up the DB, Kibana, frontend and the reverse proxy. The reverse proxy will be listening on ports `80` and `443` and redirects all traffic to `https` by default.
