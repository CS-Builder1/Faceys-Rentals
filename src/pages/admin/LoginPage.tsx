import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, ArrowRight, User, Phone } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { UserRole } from '../../types';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/admin');
      } else {
        if (!displayName || !phone) {
          throw new Error('Please fill in all fields');
        }
        // Signup logic
        const userCredential = await signup(email, password);
        const fbUser = userCredential.user;

        // 1. Create User Document
        const userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: displayName,
          role: 'CLIENT' as UserRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', fbUser.uid), userData);

        // 2. Create Customer Document
        const customerData = {
          id: fbUser.uid,
          contactName: displayName,
          email: fbUser.email,
          phone: phone,
          lifetimeValue: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          billingAddress: '',
        };
        await setDoc(doc(db, 'customers', fbUser.uid), customerData);

        navigate('/admin');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-black text-ocean-deep tracking-tighter">
              FACEY'S <span className="text-primary italic">CMS</span>
            </h1>
          </Link>
          <p className="text-slate-500 font-medium">
            {isLogin ? 'Welcome back! Please enter your details.' : 'Create your account to start booking.'}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-ocean-deep/5 border border-slate-100">
          <div className="flex bg-slate-50 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isLogin ? 'bg-white shadow-sm text-ocean-deep' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                !isLogin ? 'bg-white shadow-sm text-ocean-deep' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl font-medium">
                {error}
              </div>
            )}

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-ocean-deep placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-ocean-deep placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      placeholder="(555) 000-0000"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-ocean-deep placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-ocean-deep placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-400 font-medium">
          Protected by industry standard encryption.
        </p>
      </div>
    </div>
  );
}
