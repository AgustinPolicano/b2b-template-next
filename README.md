# Authentication System Template

A complete Next.js authentication template with NextAuth that supports:

- **Google OAuth** - Sign in with Google
- **GitHub OAuth** - Sign in with GitHub  
- **Email with verification code** - Email verification with 6-digit code

## Features

- ✅ **Next.js 15** with App Router
- ✅ **React 19** with TypeScript
- ✅ **PostgreSQL** with Drizzle ORM
- ✅ **NextAuth** for authentication
- ✅ **Tailwind CSS** for styling
- ✅ **Email verification** with SMTP
- ✅ **OAuth providers** (Google, GitHub)
- ✅ **Database migrations** with Drizzle Kit

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name

# NextAuth Configuration
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Email Configuration (SMTP)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=your_email@gmail.com
```

## Step-by-Step Setup

### 1. Database Setup
- This project uses PostgreSQL with Drizzle ORM
- Make sure PostgreSQL is running on your system
- Create a database and configure the `DB_*` variables accordingly

### 2. NextAuth Configuration
- Generate a random secret for `NEXTAUTH_SECRET`
- Set `NEXTAUTH_URL` to your application URL (http://localhost:3000 for development)

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Configure redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret

### 4. GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Configure:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret

### 5. Email Configuration
To use Gmail as SMTP server:
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password
3. Use that password in `EMAIL_SERVER_PASSWORD`

### 6. Install Dependencies
```bash
npm install
```

### 7. Run Database Migrations
```bash
npx drizzle-kit push
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication Flow

### OAuth (Google/GitHub)
1. User clicks "Continue with Google/GitHub"
2. User is redirected to OAuth provider
3. After authorization, user returns to the application
4. User is created/updated in the database
5. Session is established

### Email with Verification Code
1. User enters their email address
2. A 6-character code is generated
3. An email is sent with:
   - The code for manual entry
   - A direct link to `/verify?code=XXXXXX&email=user@example.com`
4. User can either:
   - Click the link (automatic verification)
   - Go to `/verify` and enter the code manually
5. Code is verified and session is created

## Available Pages

- `/` - Home page (requires authentication)
- `/login` - Login page
- `/verify` - Email verification page (embedded in login flow)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts    # NextAuth handler
│   │   └── verify-code/route.ts           # API for code verification
│   ├── login/page.tsx                     # Login page
│   ├── layout.tsx                         # Layout with SessionProvider
│   ├── providers.tsx                      # SessionProvider component
│   └── page.tsx                           # Main page
├── lib/
│   └── auth.ts                            # NextAuth configuration
└── db/
    ├── index.ts                           # Database configuration
    └── schema.ts                          # Database schema
```

## Customization

### Change the Design
Components use Tailwind CSS. You can customize:
- Colors by modifying `bg-indigo-*`, `text-indigo-*` classes
- Spacing with `p-*`, `m-*`, `gap-*`
- Borders with `rounded-*`, `border-*`

### Add More Providers
In `src/lib/auth.ts`, add more providers to the `providers` array:

```typescript
providers: [
  // ... existing providers
  FacebookProvider({
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  }),
]
```

### Customize Emails
To enable email sending, install nodemailer:

```bash
npm install nodemailer @types/nodemailer
```

Then uncomment and modify the `sendVerificationRequest` function in `src/lib/auth.ts` to change the email design.

## Database Schema

The project includes a custom user schema with additional fields:
- `name` - User's first name
- `lastName` - User's last name
- `gender` - User's gender
- `birthDate` - User's birth date
- `phone` - User's phone number
- `email` - User's email (required, unique)
- `emailVerified` - Email verification timestamp
- `image` - User's profile image URL
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx drizzle-kit push` - Push database schema changes
- `npx drizzle-kit studio` - Open Drizzle Studio

## Troubleshooting

### Error: "Cannot find module 'nodemailer'"
```bash
npm install nodemailer @types/nodemailer
```
Then uncomment the email sending code in `src/lib/auth.ts`.

### Error: "Invalid callback URL"
Make sure the callback URLs in Google/GitHub match your configuration.

### Error: "Email not sending"
- Verify SMTP credentials
- Check that the port is correct (587 for Gmail)
- Make sure to use an app-specific password if using Gmail

### Error: "Database connection failed"
- Verify PostgreSQL is running
- Check the `DB_*` environment variables
- Make sure the database exists
- Run `npx drizzle-kit push` to create tables

### Error: "NextAuth configuration error"
- Check that `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Make sure OAuth provider credentials are correct

## Technologies Used

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **NextAuth** - Authentication
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## License

This project is licensed under the MIT License.
