import React, { useState } from 'react';
import { X } from 'lucide-react';
import { signInWithEmail, signInWithGoogle, signUp } from '../../lib/supabase';
import { useAppContext } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const AuthModal: React.FC = () => {
  const { t } = useTranslation();
  const { showAuthModal, setShowAuthModal } = useAppContext();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success(t('success.checkEmail'));
      } else {
        await signInWithEmail(email, password);
        toast.success(t('success.signInSuccess'));
        setShowAuthModal(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.authenticationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.googleSignInFailed'));
    }
  };

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowAuthModal(false)} />
        
        <div className="relative w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <button
            onClick={() => setShowAuthModal(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>

          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
          </h2>

          <button
            onClick={handleGoogleSignIn}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="h-5 w-5"
            />
            {t('auth.continueWithGoogle')}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">{t('auth.orContinueWith')}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? t('common.loading') : isSignUp ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isSignUp ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;