import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { and, eq, gt, desc } from 'drizzle-orm';
import { verificationTokens } from '@/db/schema';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { code, email } = await request.json();

    const codeString = String(code);  // Asegurar que code sea string

    console.log('Código recibido:', codeString); // Log del código recibido

    if (!codeString || !email) {
      return NextResponse.json(
        { success: false, message: 'Código y email son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el código tenga 6 dígitos
    if (!/^\d{6}$/.test(codeString)) {
      return NextResponse.json(
        { success: false, message: 'El código debe tener 6 dígitos' },
        { status: 400 }
      );
    }

    // Buscar tokens no expirados para el email
    const [verificationToken] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          gt(verificationTokens.expires, new Date())
        )
      )
      .orderBy(desc(verificationTokens.expires))
      .limit(1);

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, message: 'Código inválido o expirado' },
        { status: 400 }
      );
    }

    console.log('Código plano a verificar:', codeString); // Log del código plano
    console.log('Hash almacenado en DB:', verificationToken.token); // Log del hash

    // Verificar el código usando bcrypt
    const isValidCode = await bcrypt.compare(codeString, verificationToken.token);
    
    console.log('¿Código válido?:', isValidCode); // Log del resultado de la comparación

    if (!isValidCode) {
      return NextResponse.json(
        { success: false, message: 'Código inválido' },
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
      await db.delete(verificationTokens).where(eq(verificationTokens.token, verificationToken.token));

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