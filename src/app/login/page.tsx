'use client';

import { signIn, getSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User, Mail, Github, CheckCircle, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState('');
  
  // Estados para verificación
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [code, setCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  useEffect(() => {
    // Verificar si ya está autenticado
    const checkAuth = async () => {
      const session = await getSession();
      if (session) {
        router.push(callbackUrl);
      }
    };
    checkAuth();
  }, [router, callbackUrl]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', {
        callbackUrl,
        redirect: false,
      });
    } catch (error) {
      console.error('Error en el login:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading(true);
    try {
      await signIn('github', {
        callbackUrl,
        redirect: false,
      });
    } catch (error) {
      console.error('Error en el login:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    
    try {
      const verifiedResult = await signIn('verified-email', {
        email,
        redirect: false,
        callbackUrl,
      });
      if (verifiedResult?.ok) {
        router.push(verifiedResult.url || callbackUrl);
        setEmailLoading(false);
        return;
      }
      // No verificado, enviar código
      const emailResult = await signIn('email', {
        email,
        callbackUrl,
        redirect: false,
      });
      if (emailResult?.error) {
        console.error('Error en el login:', emailResult.error);
      } else {
        setShowVerifyForm(true);
      }
    } catch (error) {
      console.error('Error en el login:', error);
    } finally {
      setEmailLoading(false);
    }
  };

  const verifyCode = async (verificationCode: string, email: string) => {
    setVerifyLoading(true);
    setVerifyError('');
    
    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
          email: email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        const signInResult = await signIn('verified-email', {
          email,
          redirect: false,
          callbackUrl,
        });
        setTimeout(() => {
          router.push(signInResult?.url || callbackUrl);
        }, 2000);
      } else {
        setVerifyError(data.message || 'Código de verificación inválido');
      }
    } catch (error) {
      setVerifyError('Error al verificar el código. Inténtalo de nuevo.');
      console.error('Error verificando código:', error);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setVerifyError('Por favor ingresa el código de verificación');
      return;
    }

    if (!email) {
      setVerifyError('Email no encontrado. Por favor inicia el proceso de login nuevamente.');
      return;
    }

    await verifyCode(code, email);
  };

  const resendCode = async () => {
    if (!email) {
      setVerifyError('Email no encontrado. Por favor inicia el proceso de login nuevamente.');
      return;
    }

    setVerifyLoading(true);
    try {
      await signIn('email', {
        email: email,
        callbackUrl,
        redirect: false,
      });
      
      setVerifyError('');
      // Mostrar mensaje de éxito
      alert('Código reenviado exitosamente. Revisa tu email.');
    } catch (error) {
      setVerifyError('Error al reenviar el código');
      console.error('Error reenviando código:', error);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowVerifyForm(false);
    setCode('');
    setVerifyError('');
    setSuccess(false);
  };

  // Pantalla de éxito
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Verificación exitosa!</h1>
            <p className="text-gray-600 mb-6">
              Tu cuenta ha sido verificada correctamente. Serás redirigido automáticamente...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de verificación
  if (showVerifyForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Verificar cuenta</h1>
            <p className="text-gray-600 mt-2">
              Ingresa el código enviado a <strong>{email}</strong>
            </p>
          </div>

          {/* Card de Verificación */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {verifyError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-red-600 text-sm">{verifyError}</p>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de verificación
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg font-mono tracking-wider"
                  placeholder="XXXXXX"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  El código debe tener 6 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {verifyLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verificando...
                  </div>
                ) : (
                  'Verificar código'
                )}
              </button>
            </form>

            {/* Acciones adicionales */}
            <div className="mt-6 text-center space-y-3">
              <button
                onClick={resendCode}
                disabled={verifyLoading}
                className="text-indigo-600 hover:text-indigo-500 font-medium text-sm disabled:opacity-50"
              >
                ¿No recibiste el código? Reenviar
              </button>
              
              <div className="text-sm text-gray-500">
                <button
                  onClick={handleBackToLogin}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Volver al login
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2024 Tu Empresa. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido</h1>
          <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">
                {error === 'OAuthSignin' && 'Error al iniciar sesión'}
                {error === 'OAuthCallback' && 'Error en el callback'}
                {error === 'OAuthCreateAccount' && 'Error al crear la cuenta'}
                {error === 'EmailCreateAccount' && 'Error al crear la cuenta con email'}
                {error === 'Callback' && 'Error en el callback'}
                {error === 'OAuthAccountNotLinked' && 'Esta cuenta ya está asociada a otro método de login'}
                {error === 'EmailSignin' && 'Error al enviar el email de verificación'}
                {error === 'CredentialsSignin' && 'Credenciales incorrectas'}
                {error === 'default' && 'Error desconocido'}
              </p>
            </div>
          )}

          {/* Botones de OAuth */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>

            <button
              onClick={handleGitHubSignIn}
              disabled={loading}
              className="w-full bg-gray-900 text-white rounded-lg px-6 py-3 font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Github className="h-5 w-5" />
                  Continuar con GitHub
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O continúa con email</span>
            </div>
          </div>

          {/* Formulario de Email */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="tu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {emailLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando código...
                </div>
              ) : (
                'Enviar código de verificación'
              )}
            </button>
          </form>

          {/* Enlaces adicionales */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Al continuar, aceptas nuestros{' '}
              <a href="/terms" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Términos de Servicio
              </a>{' '}
              y{' '}
              <a href="/privacy" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Política de Privacidad
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 Tu Empresa. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
} 