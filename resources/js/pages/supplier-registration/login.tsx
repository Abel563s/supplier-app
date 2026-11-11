import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const spotlightRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const mouseRef = useRef({ x: 50, y: 50 });
    const currentRef = useRef({ x: 50, y: 50 });

    const handleMouseMove = useCallback((e: MouseEvent) => {
        mouseRef.current.x = (e.clientX / window.innerWidth) * 100;
        mouseRef.current.y = (e.clientY / window.innerHeight) * 100;
    }, []);

    useEffect(() => {
        const isTouchDevice = 'ontouchstart' in window;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isTouchDevice || prefersReducedMotion) return;

        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            currentRef.current.x += (mouseRef.current.x - currentRef.current.x) * 0.15;
            currentRef.current.y += (mouseRef.current.y - currentRef.current.y) * 0.15;
            if (spotlightRef.current) {
                spotlightRef.current.style.left = `${currentRef.current.x}%`;
                spotlightRef.current.style.top = `${currentRef.current.y}%`;
            }
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [handleMouseMove]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <main
            className="relative isolate min-h-screen flex items-center justify-center overflow-hidden px-4 py-10 sm:px-6 bg-[#F4F8F7]"
        >
            <Head title="Supplier Login" />

            {/* Animated Interactive Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                {/* Subtle grid background */}
                <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0, 81, 95, 0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 81, 95, 0.06) 1px, transparent 1px)
                        `,
                        backgroundSize: '44px 44px',
                    }}
                />

                {/* Mouse-following spotlight */}
                <div
                    ref={spotlightRef}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[100px] pointer-events-none"
                    style={{
                        left: '50%',
                        top: '50%',
                        background: 'radial-gradient(circle, rgba(0, 173, 197, 0.18) 0%, rgba(0, 173, 197, 0.02) 45%, transparent 70%)',
                        transition: 'left 0.4s ease-out, top 0.4s ease-out',
                    }}
                />

                {/* Large blurred light orbs */}
                <div className="absolute top-1/5 left-1/12 w-[360px] h-[360px] bg-[rgba(0,173,197,0.10)] rounded-full blur-[140px] pointer-events-none animate-[admin-login-pulse-slow_6s_ease-in-out_infinite]" />
                <div className="absolute bottom-1/4 right-1/8 w-[480px] h-[480px] bg-[rgba(0,81,95,0.07)] rounded-full blur-[140px] pointer-events-none animate-[admin-login-pulse-slow_7s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/3 right-1/6 w-[260px] h-[260px] bg-[rgba(0,173,197,0.08)] rounded-full blur-[90px] pointer-events-none animate-[admin-login-pulse-slow_5s_ease-in-out_infinite]" style={{ animationDelay: '4s' }} />
            </div>

            {/* Login Content */}
            <div className="relative z-10 w-full max-w-md">
                <div className="mb-8 flex justify-center">
                    <img
                        src="/logo/EEC-logo.jpg"
                        alt="EEC"
                        className="h-16 w-auto object-contain sm:h-20"
                        style={{ opacity: 0, animation: 'admin-login-logo-entrance 0.8s ease-out forwards' }}
                    />
                </div>

                <div className="relative rounded-2xl border border-white/70 bg-white/80 p-8 shadow-[0_20px_50px_rgba(13,59,57,0.10)] backdrop-blur-md" style={{ opacity: 0, animation: 'admin-login-card-entrance 0.9s ease-out forwards' }}>
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Supplier Login</h1>
                        <p className="mt-2 text-sm text-gray-600">Enter your email and password to access your supplier account</p>
                    </div>

                    <form className="flex flex-col gap-6" onSubmit={submit}>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="email@example.com"
                                        className="pl-10"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink href={route('password.request')} className="text-xs" tabIndex={7}>
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Password"
                                        className="pl-10 pr-11"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={3}
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute inset-y-0 right-1 flex items-center px-2 text-gray-500 hover:text-[#00515F] focus:outline-hidden transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="rounded border-gray-300 text-[#00515F] focus:ring-[#00515F] h-4 w-4"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    tabIndex={4}
                                />
                                <Label htmlFor="remember" className="text-sm text-gray-700">Remember me</Label>
                            </div>

                            <Button type="submit" className="mt-4 w-full bg-[#00515F] text-white hover:bg-[#00ADC5] shadow-lg hover:shadow-[0_0_24px_rgba(0,173,197,0.35)] transition-all duration-300" tabIndex={5} disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Log in
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <TextLink href="/supplier-registration/register" tabIndex={6}>
                            Register as a supplier
                        </TextLink>
                    </div>
                </div>
            </div>
        </main>
    );
}
