import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { verificationTokens, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Declaración temporal de tipos para nodemailer (eliminar cuando se instale @types/nodemailer)
declare module 'nodemailer' {
  interface NodemailerTransportOptions {
    host?: string;
    port?: number;
    auth?: {
      user: string;
      pass: string;
    };
  }
  
  interface NodemailerSendMailOptions {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
  }
  
  interface NodemailerSendMailResult {
    rejected: string[];
    pending: string[];
  }
  
  interface NodemailerTransport {
    sendMail(options: NodemailerSendMailOptions): Promise<NodemailerSendMailResult>;
  }
  
  function createTransport(options: NodemailerTransportOptions): NodemailerTransport;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        // Generar código de verificación de 6 dígitos
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        await db.insert(verificationTokens).values({
          identifier: email,
          token: verificationCode,
          expires: new Date(Date.now() + 15 * 60 * 1000),
        });
        
        try {
          const { host } = new URL(url);
          // Importar nodemailer dinámicamente para evitar errores de tipos
          const nodemailer = await import('nodemailer').catch(() => {
            throw new Error('nodemailer no está instalado. Ejecuta: npm install nodemailer @types/nodemailer');
          });
          const transport = nodemailer.createTransport(provider.server);
          
          const result = await transport.sendMail({
            to: email,
            from: provider.from,
            subject: `Código de verificación para ${host}`,
            text: `Tu código de verificación es: ${verificationCode}\n\nEste código es válido por 15 minutos.\n\nSi no solicitaste este código, puedes ignorar este email.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #4f46e5; margin: 0;">Código de verificación</h1>
                </div>
                
                <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; text-align: center;">
                  <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">
                    Hola,
                  </p>
                  <p style="color: #334155; font-size: 16px; margin-bottom: 30px;">
                    Tu código de verificación es:
                  </p>
                  
                  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 2px solid #e2e8f0; margin: 20px 0;">
                    <h2 style="color: #4f46e5; font-size: 36px; margin: 0; letter-spacing: 8px; font-weight: bold;">
                      ${verificationCode}
                    </h2>
                  </div>
                  
                  <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                    Este código es válido por <strong>15 minutos</strong>.
                  </p>
                  
                  <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                    Si no solicitaste este código, puedes ignorar este email.
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #94a3b8; font-size: 12px;">
                    Este es un email automático, por favor no respondas.
                  </p>
                </div>
              </div>
            `,
          });
          
          const failed = result.rejected.concat(result.pending).filter(Boolean);
          if (failed.length) {
            throw new Error(`Email(s) (${failed.join(', ')}) could not be sent`);
          }
          
          console.log('Email enviado exitosamente a:', email);
          console.log('Código de verificación generado:', verificationCode);
          
        } catch (error) {
          console.error('Error enviando email:', error);
          throw new Error('No se pudo enviar el email de verificación');
        }
      },
    }),
    CredentialsProvider({
      id: "verified-email",
      name: "Verified Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const [user] = await db.select().from(users).where(eq(users.email, credentials.email));
        if (user && user.emailVerified) {
          return { id: user.id.toString(), email: user.email };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-request",
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    }
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Si la URL es relativa, agregar el baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Si la URL es del mismo dominio, permitirla
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Por defecto, redirigir a la página principal
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

// Extender tipos de NextAuth para incluir id en session.user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
} 