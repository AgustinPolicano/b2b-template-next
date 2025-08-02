# Proyecto: B2B Template Next.js

## 🧹 Descripción General

Este proyecto es un template base para aplicaciones **B2B** o **SaaS dashboards**, construido con **Next.js 14 App Router**, **Prisma ORM**, y componentes de **ShadCN UI**. Está diseñado para escalar fácilmente, aplicar autenticación, y construir paneles administrativos modernos con muy buena experiencia de usuario.

Incluye:

* Autenticación con NextAuth.js (credenciales y Google)
* Diseño modular y limpio (componentes desacoplados)
* Persistencia con PostgreSQL + Prisma ORM
* Sistema de notificaciones
* Animaciones con Framer Motion
* Manejo de formularios con validación
* Arquitectura modular ideal para escalar funcionalidades

---

## 🚀 Tecnologías Utilizadas

* **Next.js 14** con App Router
* **React 18** (Client y Server Components)
* **TypeScript**
* **Tailwind CSS** + `tailwindcss-animate`
* **ShadCN UI** (botones, alerts, inputs, skeletons, cards)
* **Lucide Icons**
* **Prisma ORM**
* **PostgreSQL**
* **Zod** (validaciones)
* **React Hook Form**
* **NextAuth.js**
* **Sonner** (notificaciones tipo toast)
* **Framer Motion** (animaciones)
* **ESLint + Prettier**

---

## 📁 Estructura del Proyecto

```
/app
  ├── layout.tsx              → Root layout
  ├── page.tsx                → Landing / login redirect
  ├── /auth                   → Login y registro
  ├── /dashboard              → Área privada con sidebar
  └── /api                    → Endpoints internos

/components
  → Componentes reutilizables (botones, formularios, íconos, modales, etc.)

/lib
  → Archivos utilitarios (prisma.ts, auth.ts, validators, etc.)

/styles
  → Tailwind y estilos globales

/prisma
  → Esquema y migraciones Prisma

/public
  → Archivos estáticos (logos, íconos, etc.)
```

---

## 🔐 Autenticación (NextAuth.js)

Soporta:

* Login con credenciales (email + password)
* Login con Google (OAuth 2.0)

Configuración en `/lib/auth.ts`
Middleware de protección: `middleware.ts`

Incluye helpers como `getCurrentUser()` y `withAuth()` para proteger páginas o APIs.

---

## 🧬 Base de Datos (Prisma)

Modelo principal: `User`

```ts
model User {
  id             String   @id @default(cuid())
  name           String?
  email          String?  @unique
  password       String?
  emailVerified  DateTime?
  image          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  accounts       Account[]
  sessions       Session[]
}
```

Relaciones compatibles con NextAuth: `Account`, `Session`.

---

## ✅ Funcionalidades Incluidas

* Registro/login con validaciones (`Zod + React Hook Form`)
* Layout privado con sidebar
* Hooks reutilizables (`useUser`, `useMounted`, etc.)
* Skeletons y loaders
* Sistema de notificaciones (con Sonner)
* Animaciones suaves (`framer-motion`)
* Dark mode nativo (`theme-provider`)
* Diseño adaptativo (mobile & desktop)

---


## 🧠 Para Gemini CLI

Este archivo proporciona todo el contexto necesario para que Gemini pueda:

* Comprender cómo está estructurado el backend y frontend
* Entender qué tecnologías están en juego y cómo se comunican
* Proponer e implementar nuevas rutas, componentes, endpoints y modelos
* Respetar convenciones actuales de código y arquitectura

> Siempre mantener la coherencia con:
>
> * App Router (no usar Pages)
> * Tipado fuerte con TypeScript
> * Validaciones con Zod
> * Estilo visual consistente con ShadCN UI

---

## 👤 Autor

Desarrollado por [Agustín Policano](https://github.com/AgustinPolicano)
Repositorio: [github.com/AgustinPolicano/b2b-template-next](https://github.com/AgustinPolicano/b2b-template-next)
