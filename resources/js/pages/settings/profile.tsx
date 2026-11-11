import { type SharedData } from '@/types';
import AdminLayout from '@/layouts/admin/admin-layout';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { User, ShieldCheck } from 'lucide-react';

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const {
        data: passwordData,
        setData: setPasswordData,
        errors: passwordErrors,
        put: passwordPut,
        processing: passwordProcessing,
        recentlySuccessful: passwordSaved,
        reset: passwordReset,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordPut(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordReset(),
            onError: (errors) => {
                if (errors.password) {
                    passwordReset('password', 'password_confirmation');
                }
                if (errors.current_password) {
                    passwordReset('current_password');
                }
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Profile settings" />

            <div className="px-6 py-8 space-y-8 max-w-4xl mx-auto">
                <HeadingSmall title="Profile" description="Manage your account information and security settings." />

                {/* Account overview card */}
                <Card className="border-t-4 border-t-primary">
                    <CardHeader className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-14 w-14 bg-primary/10 text-primary">
                                <AvatarImage src={user.avatar ?? ''} />
                                <AvatarFallback>
                                    <User className="h-8 w-8" />
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="text-xs capitalize">
                                        {typeof user.role === 'string' ? user.role : 'user'}
                                    </Badge>
                                    {user.email_verified_at && (
                                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3" /> Verified
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                            Update your personal information and keep your account secure.
                        </p>
                    </CardContent>
                </Card>

                {/* Profile information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Profile information</CardTitle>
                        <CardDescription>Update your name and email address.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                    <InputError className="mt-1" message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                    <InputError className="mt-1" message={errors.email} />
                                </div>
                            </div>

                            {mustVerifyEmail && user.email_verified_at === null && (
                                <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4 text-yellow-800 text-sm">
                                    Your email address is unverified.
                                    <br />
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="mt-2 inline-block rounded-md text-sm underline underline-offset-4 hover:text-yellow-700 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                                    >
                                        Click here to re-send the verification email.
                                    </Link>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-green-600">
                                            A new verification link has been sent to your email address.
                                        </div>
                                    )}
                                </div>
                            )}

                            <CardFooter className="flex items-center gap-4 pt-6 border-t">
                                <Button type="submit" disabled={processing}>
                                    Save changes
                                </Button>
                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out duration-300"
                                    enterFrom="opacity-0 translate-y-1"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in-out duration-300"
                                    leaveFrom="opacity-100 translate-y-0"
                                    leaveTo="opacity-0 translate-y-1"
                                >
                                    <p className="text-sm text-primary-foreground font-medium flex items-center gap-2">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Saved
                                    </p>
                                </Transition>
                            </CardFooter>
                        </form>
                    </CardContent>
                </Card>

                {/* Password */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Password</CardTitle>
                        <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={updatePassword} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="current_password">Current password</Label>
                                <Input
                                    id="current_password"
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData('current_password', e.target.value)}
                                    autoComplete="current-password"
                                    placeholder="Current password"
                                />
                                <InputError message={passwordErrors.current_password} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={passwordData.password}
                                    onChange={(e) => setPasswordData('password', e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="New password"
                                />
                                <InputError message={passwordErrors.password} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm new password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={passwordData.password_confirmation}
                                    onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Confirm new password"
                                />
                                <InputError message={passwordErrors.password_confirmation} />
                            </div>

                            <CardFooter className="flex items-center gap-4 pt-6 border-t">
                                <Button type="submit" disabled={passwordProcessing}>
                                    Save password
                                </Button>
                                <Transition
                                    show={passwordSaved}
                                    enter="transition ease-in-out duration-300"
                                    enterFrom="opacity-0 translate-y-1"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in-out duration-300"
                                    leaveFrom="opacity-100 translate-y-0"
                                    leaveTo="opacity-0 translate-y-1"
                                >
                                    <p className="text-sm text-primary-foreground font-medium flex items-center gap-2">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Saved
                                    </p>
                                </Transition>
                            </CardFooter>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
