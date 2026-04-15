# UM Tech TrackSuite "Asset Manager" (Vertical Slice)

TrackSuite Asset Manager is a clean, production-ready SaaS-style asset operations dashboard for managing company inventory with speed and clarity.

## Live Demo

Frontend: https://tracksuite-asset-manager.vercel.app

API: https://um-tracksuite-api-production.up.railway.app

## Features

- Asset management (CRUD)
- Search and filtering
- Dashboard analytics
- Authentication (JWT)
- Role-based access (User, Admin, Super Admin)
- Multi-tenant company isolation
- Stripe subscription billing (PRO / ENTERPRISE)
- Stripe customer billing portal
- Webhook-driven subscription and invoice state updates
- Admin revenue analytics (MRR + active subscriptions + plan mix)

## Tech Stack

Frontend:

- React / Next.js conventions (implemented with React + Vite)
- Tailwind CSS

Backend:

- Node.js
- Express

Database:

- SQLite

Deployment:

- Vercel (frontend)
- Railway (backend)

## Demo Account

Email: demo@tracksuite.com

Password: 123456

## Screenshots

Add screenshots to the repository for best presentation:

- Dashboard overview
- Add asset form
- Asset table with filters
- Mobile responsive sidebar menu

Suggested folder:

```bash
docs/screenshots/
```

## Installation

1. Clone the repository.

```bash
git clone https://github.com/your-username/tracksuite-asset-manager.git
cd tracksuite-asset-manager
```

2. Install backend dependencies.

```bash
cd backend
npm install
```

3. Run backend server.

```bash
npm run dev
```

4. Install frontend dependencies.

```bash
cd ../frontend
npm install
```

5. Run frontend app.

```bash
npm run dev
```

## Environment Variables

Create a .env file in frontend and configure the API URL:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Optional compatibility variable:

```bash
VITE_API_URL=http://localhost:5000
```

Production values:

```bash
NEXT_PUBLIC_API_URL=https://um-tracksuite-api-production.up.railway.app
VITE_API_URL=https://um-tracksuite-api-production.up.railway.app
```

Create a .env file in backend (or copy backend/.env.example) and configure Stripe:

```bash
PORT=5000
APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO=price_pro_xxx
STRIPE_PRICE_ENTERPRISE=price_enterprise_xxx
```

Stripe webhook endpoint:

```bash
POST /api/billing/webhook
```

Example local Stripe CLI forwarding:

```bash
stripe listen --forward-to localhost:5000/api/billing/webhook
```

## Future Improvements

- Multi-tenant support
- File uploads
- Audit logs

## License

MIT
