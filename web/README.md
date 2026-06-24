# Elevate Exterior Cleaning — Website

Next.js marketing site with online booking, contact forms, and admin dashboard for [Elevate Exterior Cleaning](https://elevate.kartersanamo.com).

## Stack

- Next.js 15, React 19, Tailwind CSS v4
- Prisma + SQLite (booking scheduler)
- Auth.js (admin login)
- Mailgun (contact + booking emails)
- Docker standalone deployment

## Local development

```bash
cd web
cp .env.example .env
# Set AUTH_SECRET, ADMIN_PASSWORD, and optional Mailgun keys

mkdir -p data
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin (login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

## Deployment (`elevate.kartersanamo.com`)

1. Copy `.env.example` to `.env` and fill in production values.
2. Run `./deploy.sh` — builds Docker image and starts on **port 8006**.
3. Add Cloudflare tunnel ingress rule in `/etc/cloudflared/config.yml`:

```yaml
  - hostname: elevate.kartersanamo.com
    service: http://localhost:8006
```

4. Restart tunnel: `sudo systemctl restart cloudflared`

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/services` | Service catalog (no pricing) |
| `/gallery` | Before/after gallery |
| `/about` | About the business |
| `/contact` | Contact form + quick actions |
| `/book` | Multi-step booking wizard |
| `/admin` | Dashboard (protected) |
| `/admin/bookings` | Manage bookings |
| `/admin/availability` | Weekly hours + blackout dates |

## Booking flow

1. Client selects services, date, and time slot
2. Booking created as `PENDING` (slot held)
3. Kyle receives email notification
4. Admin confirms → customer gets confirmation email
5. Admin can cancel or mark complete
