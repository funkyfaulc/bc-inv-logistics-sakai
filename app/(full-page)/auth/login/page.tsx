'use client';

import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { auth } from '../../../firebase'; // Make sure the Firebase import path is correct
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import signInWithEmailAndPassword


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();

    const containerClassName = classNames(
        'surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden',
        { 'p-input-filled': layoutConfig.inputStyle === 'filled' }
    );

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/'); // Redirect to the home/dashboard page after successful login
        } catch (error) {
            console.error('Login error:', error); // Log the error for debugging
            setError('Login failed. Please check your credentials and try again.');
        }
    };
    

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img
                    src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`}
                    alt="Sakai logo"
                    className="mb-5 w-6rem flex-shrink-0"
                />
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)',
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src="/demo/images/login/avatar.png" alt="Avatar" height="50" className="mb-3" />
                            <div className="text-900 text-3xl font-medium mb-3">Welcome!</div>
                            <span className="text-600 font-medium">Sign in to continue</span>
                        </div>

                        {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}

                        <div>
                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                                Email
                            </label>
                            <InputText
                                id="email"
                                type="text"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full mb-5"
                                style={{ padding: '1rem' }}
                            />

                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Password
                            </label>
                            <Password
                                inputId="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                toggleMask
                                className="w-full mb-5"
                            />

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <Checkbox
                                        inputId="rememberme"
                                        checked={checked}
                                        onChange={(e) => setChecked(e.checked ?? false)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="rememberme">Remember me</label>
                                </div>
                                <a
                                    className="font-medium no-underline ml-2 text-right cursor-pointer"
                                    style={{ color: 'var(--primary-color)' }}
                                >
                                    Forgot password?
                                </a>
                            </div>

                            <Button label="Sign In" className="w-full p-3 text-xl" onClick={handleLogin} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;