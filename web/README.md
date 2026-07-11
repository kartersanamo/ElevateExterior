# Elevate Exterior Cleaning — Website

Next.js marketing site with online booking, contact forms, and admin dashboard for [Elevate Exterior Cleaning](https://elevateexterior.org).

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

## Deployment (`elevateexterior.org`)

1. Copy `.env.example` to `.env` and fill in production values.
2. Run `./deploy.sh` — builds Docker image and starts on **port 8006**.
3. Add Cloudflare tunnel ingress rules in `/etc/cloudflared/config.yml`:

```yaml
  - hostname: elevateexterior.org
    service: http://localhost:8006
  - hostname: www.elevateexterior.org
    service: http://localhost:8006
```

4. Restart tunnel: `sudo systemctl restart cloudflared`

### Email (Mailgun)

Outbound mail sends from `noreply@elevateexterior.org`. Customer replies go directly to
the owner's Gmail via the `Reply-To` header (`MAILGUN_REPLY_TO` in `.env`) — Kyle
does not need a separate inbox on the domain.

Add the DNS records in `mailgun-dns-elevateexterior.org.txt` at your registrar
(SPF, DKIM, CNAME). The domain is registered in Mailgun; verify after DNS propagates.

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
