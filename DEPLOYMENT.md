# Frontend Docker Compose CI/CD to OVH VPS

This project deploys automatically from GitHub Actions to `https://front.melanis-institute.com` using Docker Compose on the VPS.

## Workflow

- File: `.github/workflows/deploy-ovh-frontend.yml`
- CI runs on:
  - push to `main`
  - pull requests targeting `main`
- CD runs on:
  - push to `main`

Pipeline behavior:
1. Install deps with `npm ci`
2. Run `npm run check` (`lint + test + build`)
3. Build Docker image with production assets
4. Export image to `frontend-<sha>.tar.gz`
5. Copy image tarball and `docker-compose.yml` to OVH VPS via SSH
6. `docker load` image on VPS
7. Run `docker compose up -d --remove-orphans` on VPS with the new image tag
8. Smoke-check `https://front.melanis-institute.com/`

## Required GitHub Secrets

Set these in repository settings:

- `OVH_VPS_HOST`: VPS public IP or DNS
- `OVH_VPS_USER`: SSH user used by Actions
- `OVH_SSH_PRIVATE_KEY`: private key matching a public key installed on VPS
- `OVH_VPS_PORT`: SSH port (optional, defaults to `22`)
- `VITE_API_BASE_URL`: API URL for production build (optional)

## VPS Prerequisites

1. Docker is installed and running.
2. Docker Compose plugin is installed (`docker compose version` works).
3. Deploy user can run Docker commands (`docker ps`, `docker run`, `docker load`, `docker compose up`).
4. Nginx is installed and proxies `front.melanis-institute.com` to the container on `127.0.0.1:3100`.
5. Deployment directory is writable by deploy user:
   - `/opt/melanis/frontend`

Example Nginx server block:

```nginx
server {
    server_name front.melanis-institute.com;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Runtime Details (VPS)

- Container name: `melanis-frontend`
- Host port: `3100` (mapped to container port `80`)
- Restart policy: `unless-stopped`
- App container includes Nginx with SPA fallback (`try_files ... /index.html`)
- Compose file path on VPS: `/opt/melanis/frontend/docker-compose.yml`

## Preflight Checks (VPS)

Run these before adding GitHub secrets:

```bash
docker --version
docker compose version
sudo ss -tlpn | grep -E ':(80|443|3100)\\b'
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

Expected:
- `80` and `443` used by Nginx
- `3100` free (or only used by the target `melanis-frontend` container)
