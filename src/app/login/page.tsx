
'use client';

import { redirect } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useActionState } from 'react';
import { useUser, useAuthMethods } from '@/aws/auth/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { emailSignInAction, emailSignUpAction } from '@/app/actions';
import { useFormStatus } from 'react-dom';


function AuthButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {children}
        </Button>
    )
}

function SignInForm({ onSwitch }: { onSwitch: () => void }) {
    const [signInState, signInFormAction] = useActionState(emailSignInAction, { message: '', errors: {}, data: null });
    const { signIn } = useAuthMethods();
    const [error, setError] = useState<string | null>(null);
    const [isClientAuthLoading, setIsClientAuthLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuthError = (err: Error) => {
        console.error('Sign in error:', err);
        setIsClientAuthLoading(false);
        setError(err.message || 'An unexpected error occurred.');
    }

    useEffect(() => {
        if (signInState.message === 'success' && signInState.data) {
            setIsClientAuthLoading(true);
            setError(null);
            console.log('Attempting sign in with:', signInState.data.email);
            signIn(signInState.data.email, signInState.data.password)
                .catch(handleAuthError)
                .finally(() => setIsClientAuthLoading(false));
        } else if (signInState.message && signInState.message !== 'success') {
            setError(signInState.message);
        }
    }, [signInState, signIn]);

    return (
        <div className="grid gap-6">
            <div className="grid gap-2 text-center animate-fade-in-up">
                <h1 className="text-3xl font-bold font-headline">Sign In</h1>
                <p className="text-balance text-muted-foreground">
                    Enter your credentials to access your account
                </p>
            </div>
            <form action={signInFormAction} className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email-signin">Email</Label>
                        <Input id="email-signin" name="email" type="email" placeholder="m@example.com" required />
                        {'email' in signInState.errors && signInState.errors.email && <p className="text-sm text-destructive mt-1">{signInState.errors.email[0]}</p>}
                    </div>
                    <div className="grid gap-2 relative">
                        <Label htmlFor="password-signin">Password</Label>
                        <Input id="password-signin" name="password" type={showPassword ? 'text' : 'password'} required />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute bottom-1 right-1 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">Toggle password visibility</span>
                        </Button>
                        {'password' in signInState.errors && signInState.errors.password && <p className="text-sm text-destructive mt-1">{signInState.errors.password[0]}</p>}
                    </div>
                    <AuthButton>Sign In</AuthButton>
                </div>
            </form>
            {error && (
                <Alert variant="destructive" className="mt-4 animate-shake">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="mt-4 text-center text-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                Don&apos;t have an account?{" "}
                <button onClick={onSwitch} className="underline">
                    Sign up
                </button>
            </div>
        </div>
    )
}

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
    const [signUpState, signUpFormAction] = useActionState(emailSignUpAction, { message: '', errors: {}, data: null });
    const { signUp } = useAuthMethods();
    const [error, setError] = useState<string | null>(null);
    const [isClientAuthLoading, setIsClientAuthLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuthError = (err: Error) => {
        console.error('Sign up error:', err);
        setIsClientAuthLoading(false);
        setError(err.message || 'An unexpected error occurred.');
    }

    useEffect(() => {
        if (signUpState.message === 'success' && signUpState.data) {
            setIsClientAuthLoading(true);
            setError(null);
            console.log('Attempting sign up with:', signUpState.data.email);
            signUp(signUpState.data.email, signUpState.data.password)
                .catch(handleAuthError)
                .finally(() => setIsClientAuthLoading(false));
        } else if (signUpState.message && signUpState.message !== 'success') {
            setError(signUpState.message);
        }
    }, [signUpState, signUp]);

    return (
        <div className="grid gap-6">
            <div className="grid gap-2 text-center animate-fade-in-up">
                <h1 className="text-3xl font-bold font-headline">Create an account</h1>
                <p className="text-balance text-muted-foreground">
                    Enter your email below to create your account
                </p>
            </div>
            <form action={signUpFormAction} className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email-signup">Email</Label>
                        <Input id="email-signup" name="email" type="email" placeholder="m@example.com" required />
                        {'email' in signUpState.errors && signUpState.errors.email && <p className="text-sm text-destructive mt-1">{signUpState.errors.email[0]}</p>}
                    </div>
                    <div className="grid gap-2 relative">
                        <Label htmlFor="password-signup">Password</Label>
                        <Input id="password-signup" name="password" type={showPassword ? 'text' : 'password'} required />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute bottom-1 right-1 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">Toggle password visibility</span>
                        </Button>
                        {'password' in signUpState.errors && signUpState.errors.password && <p className="text-sm text-destructive mt-1">{signUpState.errors.password[0]}</p>}
                    </div>
                    <AuthButton>Sign Up</AuthButton>
                </div>
            </form>
            {error && (
                <Alert variant="destructive" className="mt-4 animate-shake">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="mt-4 text-center text-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                Already have an account?{" "}
                <button onClick={onSwitch} className="underline">
                    Sign in
                </button>
            </div>
        </div>
    )
}

export default function LoginPage() {
    const { user, isUserLoading } = useUser();
    const [isSignUp, setIsSignUp] = useState(false);

    useEffect(() => {
        if (!isUserLoading && user) {
            redirect('/dashboard');
        }
    }, [user, isUserLoading]);

    if (isUserLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading Session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
                <div className="flex items-center justify-center py-12">
                    <div className="mx-auto grid w-[350px] gap-6">
                        <div className="grid gap-2 text-center mb-4">
                            <Logo className="justify-center" />
                        </div>
                        {isSignUp ? (
                            <SignUpForm onSwitch={() => setIsSignUp(false)} />
                        ) : (
                            <SignInForm onSwitch={() => setIsSignUp(true)} />
                        )}
                    </div>
                </div>
                <div className="hidden bg-muted lg:block">
                    <div
                        className="h-full w-full object-cover dark:brightness-[0.2] relative"
                        style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=2592&auto=format&fit=crop')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white max-w-md p-4 animate-fade-in-up">
                            <h2 className="text-4xl font-headline font-bold">Your AI Co-agent for Success</h2>
                            <p className="mt-4 text-lg">Harness the power of AI to build your brand, track your market, and create winning content.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
