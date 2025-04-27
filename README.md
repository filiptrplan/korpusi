## Deployment

For deployment we use Docker Compose. The process is straightforward:

- Copy `.env.example` to `.env` and change the `ELASTIC_PASSWORD`, `KIBANA_PASSWORD` and `ENCRYPTION_KEY` keys.
- Copy `web-app/.env.example` to `web-app/.env` and change the the `ELASTIC_PASSWORD` to what you set it to before.
- Run `docker compose up -d`. This will spin up the DB, Kibana, frontend and the reverse proxy. The reverse proxy will be listening on ports `80` and `443` and redirects all traffic to `https` by default.

### Workaround for educational filter

This is an ugly workaround for the educational filter. Execute the following query in Kibana Dev Tools:

```
PUT songs/_mapping
{
  "properties": {
    "rhythm.rhythm_string": {
      "type":     "text",
      "fielddata": true
    }
  }
}
```
