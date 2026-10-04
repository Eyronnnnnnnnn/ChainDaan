# Chain Daan frontend

Run `npm.cmd --prefix frontend run dev` from the project root. Run the API separately with `npm.cmd --prefix backend start` after configuring `backend/.env`.

Copy `frontend/.env.example` to `frontend/.env` if needed. Local API requests use the Vite proxy on port 4000. For deployment, set `VITE_API_URL` to the backend's public HTTPS origin and include the frontend origin in the backend's `CLIENT_ORIGIN` allowlist. Restart Vite after changing environment variables. Database, Cloudinary, SMTP, and OAuth secrets belong only in the backend environment.

Checks:

- `npm.cmd --prefix frontend run lint`
- `npm.cmd --prefix frontend run build`
- `npm.cmd --prefix backend test`

Order confirmation and cancellation use MongoDB transactions, supported by Atlas and replica sets. See `../PAYMENTS.md` for the manual GCash payment workflow and `DATABASE.md` for database setup.
