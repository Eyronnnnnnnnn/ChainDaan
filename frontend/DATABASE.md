# Chain Daan database setup

The app uses MongoDB Atlas through Mongoose, with an Express.js API. The API stores:

- `profiles`: business owners and suppliers, including editable profile data
- `products`: supplier catalog items, prices, and stock
- `conversations`: two-person conversations
- `messages`: direct messages between profiles
- `sales`: buyer, supplier, product, quantity, total, status, and sale date

## MongoDB Atlas setup

1. Open MongoDB Atlas and create a free cluster.
2. In Database Access, create a database user. Save the username and password.
3. In Network Access, add your current IP address. For temporary development only, you can use `0.0.0.0/0`; restrict this before production.
4. Select Connect > Drivers > Node.js and copy the connection string.
5. Copy `backend/.env.example` to `backend/.env` and replace the placeholders. URL-encode special characters in the password.

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/chaindaan?retryWrites=true&w=majority
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

1. From the project root, run:

```bash
npm run seed
npm run server
```

The database and collections are created automatically. `npm run seed` clears demo profiles/products and inserts fresh sample data. Do not commit `.env` or share the Atlas URI.

Check the connection at `http://localhost:4000/api/health`. It should return `database: "connected"`.

The Express API is in `backend/server.js`. The current UI still uses demo in-memory values in some screens; the next production step is replacing those arrays with API calls and adding real login/session authentication.
