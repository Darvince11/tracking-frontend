import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) navigate(result.user?.role === 'ADMIN' ? '/admin' : '/employee');
      else setError(result.message);
    } catch (loginError) {
      console.error('Login redirect error:', loginError);
      setError('We could not complete sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <section className="login-shell">
        <aside className="login-story">
          <img src="/logo.png" className="login-story-logo" alt="Nexoratel Technologies" />
          <div className="login-story-content">
            <span className="login-eyebrow"><Sparkles size={14} /> Operations, connected</span>
            <h1>Your team’s work.<br />One clear command center.</h1>
            <p>Track delivery, protect service commitments, and keep every team moving with confidence.</p>
            <div className="login-benefits">
              <span><CheckCircle2 size={17} /> Live operational visibility</span>
              <span><CheckCircle2 size={17} /> Secure role-based access</span>
              <span><CheckCircle2 size={17} /> Accountable delivery history</span>
            </div>
          </div>
          <div className="login-security"><ShieldCheck size={18} /><span>Protected operations workspace</span></div>
        </aside>

        <section className="login-card">
          <div className="login-mobile-logo"><img src="/logo.png" alt="Nexoratel Technologies" /></div>
          <div className="login-card-heading"><span>Welcome back</span><h2>Sign in to your workspace</h2><p>Enter your company credentials to continue.</p></div>
          {error && <div className="login-error"><ShieldCheck size={18} /><span>{error}</span></div>}
          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Email address</span>
              <div className="login-input"><Mail size={18} /><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@nexoratel.com" /></div>
            </label>
            <label>
              <span>Password</span>
              <div className="login-input"><LockKeyhole size={18} /><input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></div>
            </label>
            <button type="submit" disabled={isSubmitting}><span>{isSubmitting ? 'Authenticating...' : 'Sign in securely'}</span>{!isSubmitting && <ArrowRight size={18} />}</button>
          </form>
          <p className="login-help">Access is restricted to authorized Nexoratel team members.</p>
        </section>
      </section>
    </main>
  );
};

export default Login;
