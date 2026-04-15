import React, { useMemo, useState } from 'react';
import ToastContainer from '../components/ToastContainer';

const initialLoginState = {
  email: '',
  password: '',
};

const initialSignupState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const AuthHome = ({ onAuthenticated }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [signupForm, setSignupForm] = useState(initialSignupState);
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loginErrors = useMemo(() => {
    return {
      email: /\S+@\S+\.\S+/.test(loginForm.email) ? '' : 'Valid email is required',
      password: loginForm.password.length >= 6 ? '' : 'Password must be at least 6 characters',
    };
  }, [loginForm]);

  const signupErrors = useMemo(() => {
    return {
      name: signupForm.name.trim() ? '' : 'Name is required',
      email: /\S+@\S+\.\S+/.test(signupForm.email) ? '' : 'Valid email is required',
      password: signupForm.password.length >= 6 ? '' : 'Password must be at least 6 characters',
      confirmPassword:
        signupForm.confirmPassword === signupForm.password && signupForm.confirmPassword
          ? ''
          : 'Passwords do not match',
    };
  }, [signupForm]);

  const isLoginValid = Object.values(loginErrors).every((value) => !value);
  const isSignupValid = Object.values(signupErrors).every((value) => !value);

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onChangeLogin = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const onChangeSignup = (event) => {
    const { name, value } = event.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setTouched({ loginEmail: true, loginPassword: true });

    if (!isLoginValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      const companyKey = (loginForm.email.split('@')[1] || 'demo-company').replace(/[^a-z0-9.-]/gi, '-').toLowerCase();
      onAuthenticated({
        id: `user-${loginForm.email.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
        name: loginForm.email === 'demo@tracksuite.com' ? 'Demo Admin' : 'TrackSuite User',
        role: 'ADMIN',
        email: loginForm.email,
        companyId: companyKey,
      });
      addToast('Signed in successfully', 'success');
    } catch {
      addToast('Something went wrong', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setTouched({
      signupName: true,
      signupEmail: true,
      signupPassword: true,
      signupConfirmPassword: true,
    });

    if (!isSignupValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      const companyKey = (signupForm.email.split('@')[1] || 'demo-company').replace(/[^a-z0-9.-]/gi, '-').toLowerCase();
      onAuthenticated({
        id: `user-${signupForm.email.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
        name: signupForm.name,
        role: 'ADMIN',
        email: signupForm.email,
        companyId: companyKey,
      });
      addToast('Account created successfully', 'success');
    } catch {
      addToast('Something went wrong', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200';
  const errorInputClasses =
    'mt-1 block w-full rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-slate-100" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-slate-100/80" />
          <div className="relative space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">TrackSuite</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Asset operations with startup-grade clarity.</h1>
            <p className="max-w-md text-sm text-slate-600 sm:text-base">
              Sign in or create an account to access your dashboard, track every asset, and keep operations aligned across teams.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Demo login: <span className="font-semibold">demo@tracksuite.com</span> / <span className="font-semibold">123456</span>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:mt-0 lg:self-center">
          <div className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setTouched({});
              }}
              className={`w-1/2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setTouched({});
              }}
              className={`w-1/2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {activeTab === 'login' ? (
            <form className="mt-6 space-y-4" onSubmit={handleLogin} noValidate>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={onChangeLogin}
                  onBlur={() => markTouched('loginEmail')}
                  className={touched.loginEmail && loginErrors.email ? errorInputClasses : inputClasses}
                  placeholder="you@company.com"
                  required
                />
                {touched.loginEmail && loginErrors.email && <p className="mt-1 text-xs text-rose-600">{loginErrors.email}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={onChangeLogin}
                  onBlur={() => markTouched('loginPassword')}
                  className={touched.loginPassword && loginErrors.password ? errorInputClasses : inputClasses}
                  placeholder="Minimum 6 characters"
                  required
                />
                {touched.loginPassword && loginErrors.password && (
                  <p className="mt-1 text-xs text-rose-600">{loginErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isLoginValid}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSignup} noValidate>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={signupForm.name}
                  onChange={onChangeSignup}
                  onBlur={() => markTouched('signupName')}
                  className={touched.signupName && signupErrors.name ? errorInputClasses : inputClasses}
                  placeholder="Jane Doe"
                  required
                />
                {touched.signupName && signupErrors.name && <p className="mt-1 text-xs text-rose-600">{signupErrors.name}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={signupForm.email}
                  onChange={onChangeSignup}
                  onBlur={() => markTouched('signupEmail')}
                  className={touched.signupEmail && signupErrors.email ? errorInputClasses : inputClasses}
                  placeholder="you@company.com"
                  required
                />
                {touched.signupEmail && signupErrors.email && <p className="mt-1 text-xs text-rose-600">{signupErrors.email}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={signupForm.password}
                  onChange={onChangeSignup}
                  onBlur={() => markTouched('signupPassword')}
                  className={touched.signupPassword && signupErrors.password ? errorInputClasses : inputClasses}
                  placeholder="Minimum 6 characters"
                  required
                />
                {touched.signupPassword && signupErrors.password && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.password}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={signupForm.confirmPassword}
                  onChange={onChangeSignup}
                  onBlur={() => markTouched('signupConfirmPassword')}
                  className={touched.signupConfirmPassword && signupErrors.confirmPassword ? errorInputClasses : inputClasses}
                  placeholder="Repeat your password"
                  required
                />
                {touched.signupConfirmPassword && signupErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600">{signupErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isSignupValid}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default AuthHome;
