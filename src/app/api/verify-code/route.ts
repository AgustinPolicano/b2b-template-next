import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { verificationTokens } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { code, email } = await request.json();

    if (!code || !email) {
      return NextResponse.json(
        { success: false, message: 'Código y email son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el código tenga 6 dígitos
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, message: 'El código debe tener 6 dígitos' },
        { status: 400 }
      );
    }

    // Verificar el token en DB
    const [verificationToken] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, code),
          gt(verificationTokens.expires, new Date())
        )
      );
    if (!verificationToken) {
      return NextResponse.json(
        { success: false, message: 'Código inválido o expirado' },
        { status: 400 }
      );
    }

    try {
      // Buscar o crear el usuario
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      
      let userId;
      if (existingUser) {
        // Usuario existe, marcar como verificado
        await db.update(users)
          .set({ 
            emailVerified: new Date(),
            updatedAt: new Date()
          })
          .where(eq(users.email, email));
        userId = existingUser.id;
      } else {
        // Crear nuevo usuario
        const [newUser] = await db.insert(users).values({
          email,
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        userId = newUser.id;
      }

      // Después de actualizar o crear usuario
      await db.delete(verificationTokens).where(eq(verificationTokens.token, code));

      return NextResponse.json({
        success: true,
        message: 'Código verificado correctamente',
        userId,
        redirectUrl: '/' // Redirigir a la página principal después de verificar
      });
      
    } catch (dbError) {
      console.error('Error de base de datos:', dbError);
      return NextResponse.json(
        { success: false, message: 'Error verificando el código' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error verificando código:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 