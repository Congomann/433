import React, { useState, useEffect } from 'react';
import { CrmLogoIcon } from './icons';
import { User, UserRole } from '../types';

interface RegisterProps {
  onRegister: (userData: Omit<User, 'id' | 'title' | 'avatar'>) => Promise<void>;
  onNavigateToLogin: () => void;
}

const PasswordRequirement: React.FC<{ isValid: boolean; text: string }> = ({ isValid, text }) => (
    <li className={`flex items-center text-sm ${isValid ? 'text-emerald-600' : 'text-slate-500'} transition-colors`}>
        {isValid ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )}
        <span>{text}</span>
    </li>
);

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole.AGENT | UserRole.SUB_ADMIN>(UserRole.AGENT);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const [passwordValidity, setPasswordValidity] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    setPasswordValidity({ minLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar });
  }, [password]);

  const isPasswordValid = Object.values(passwordValidity).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
        setError("Password does not meet the requirements.");
        return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setIsLoading(true);
    
    await onRegister({ name, email, password, role });
    // Don't set loading to false, as the parent component will switch views
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <CrmLogoIcon className="w-auto h-12 mx-auto" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Create a new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
              <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(password.length > 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
                />
            </div>

            {passwordFocused && (
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                    <ul className="space-y-1">
                        <PasswordRequirement isValid={passwordValidity.minLength} text="At least 8 characters" />
                        <PasswordRequirement isValid={passwordValidity.hasLowercase} text="A lowercase letter (a-z)" />
                        <PasswordRequirement isValid={passwordValidity.hasUppercase} text="An uppercase letter (A-Z)" />
                        <PasswordRequirement isValid={passwordValidity.hasNumber} text="A number (0-9)" />
                        <PasswordRequirement isValid={passwordValidity.hasSpecialChar} text="A special character (!@#$...)" />
                    </ul>
                </div>
            )}

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700">I am signing up as a...</label>
              {/* FIX: Correctly cast the value from the select element to match the state's specific type. */}
              <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as UserRole.AGENT | UserRole.SUB_ADMIN)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                <option value={UserRole.AGENT}>Agent</option>
                <option value={UserRole.SUB_ADMIN}>Sub-Admin</option>
              </select>
            </div>
            
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-400 p-4">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <div>
              <button type="submit" disabled={isLoading || !isPasswordValid || password !== confirmPassword} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed">
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
           <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <button onClick={onNavigateToLogin} className="font-medium text-primary-600 hover:text-primary-500">
                    Sign in
                </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;