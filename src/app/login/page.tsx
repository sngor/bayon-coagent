
'use client';

import { redirect } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useActionState } from 'react';
import { useUser, useAuthMethods } from '@/aws/auth/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, Eye, EyeOff, Sparkles, TrendingUp, Zap, Target, Star, Award, Users, CheckCircle2, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { emailSignInAction, emailSignUpAction } from '@/app/actions';
import { useFormStatus } from 'react-dom';
import { HeroGradientMesh } from '@/components/ui/gradient-mesh';


function AuthButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full h-12 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {children}
        </Button>
    )
}

function SignInForm({ onSwitch, onShowVerify }: { onSwitch: () => void; onShowVerify: () => void }) {
    const [signInState, signInFormAction] = useActionState(emailSignInAction, { message: '', errors: {}, data: null });
    const { signIn } = useAuthMethods();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);

    const handleAuthError = (err: Error) => {
        console.error('Sign in error:', err);
        setError(err.message || 'An unexpected error occurred.');
    }

    useEffect(() => {
        if (signInState.message === 'success' && signInState.data) {
            setError(null);
            console.log('Attempting sign in with:', signInState.data.email);
            signIn(signInState.data.email, signInState.data.password)
                .catch(handleAuthError);
        } else if (signInState.message && signInState.message !== 'success') {
            setError(signInState.message);
        }
    }, [signInState, signIn]);

    const hasEmailError = emailTouched && signInState.errors && 'email' in signInState.errors && signInState.errors.email;
    const hasPasswordError = passwordTouched && signInState.errors && 'password' in signInState.errors && signInState.errors.password;

    return (
        <div className="grid gap-6 animate-fade-in">
            <div className="grid gap-3 text-center">
                <h1 className="text-display-medium text-gradient-primary">Welcome Back</h1>
                <p className="text-heading-3 text-muted-foreground">
                    Sign in to continue your marketing journey
                </p>
            </div>
            <form action={signInFormAction} className="space-y-5">
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email-signin" className="text-sm font-medium">Email Address</Label>
                        <Input
                            id="email-signin"
                            name="email"
                            type="email"
                            placeholder="agent@example.com"
                            required
                            className={`h-11 transition-all duration-300 ${hasEmailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            onBlur={() => setEmailTouched(true)}
                        />
                        {hasEmailError && signInState.errors && 'email' in signInState.errors && (
                            <p className="text-sm text-destructive mt-1 animate-slide-down flex items-center gap-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                {signInState.errors.email![0]}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password-signin" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                            <Input
                                id="password-signin"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                className={`h-11 pr-10 transition-all duration-300 ${hasPasswordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                onBlur={() => setPasswordTouched(true)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                <span className="sr-only">Toggle password visibility</span>
                            </Button>
                        </div>
                        {hasPasswordError && signInState.errors && 'password' in signInState.errors && (
                            <p className="text-sm text-destructive mt-1 animate-slide-down flex items-center gap-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                {signInState.errors.password![0]}
                            </p>
                        )}
                    </div>
                    <AuthButton><span className="text-bold-cta">Sign In</span></AuthButton>
                </div>
            </form>
            {error && (
                <Alert variant="destructive" className="animate-slide-down border-destructive/50 bg-destructive/10">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Authentication Error</AlertTitle>
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
            )}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">New to the platform?</span>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                onClick={onSwitch}
                className="w-full h-11 border-2 hover:bg-primary/5 hover:border-primary transition-all duration-300"
            >
                Create an Account
            </Button>
            <div className="text-center">
                <Button
                    type="button"
                    variant="link"
                    onClick={onShowVerify}
                    className="text-sm text-muted-foreground hover:text-primary"
                >
                    Need to verify your email?
                </Button>
            </div>
        </div>
    )
}

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
    const [signUpState, signUpFormAction] = useActionState(emailSignUpAction, { message: '', errors: {}, data: null });
    const { signUp, confirmSignUp, resendConfirmationCode } = useAuthMethods();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleAuthError = (err: Error) => {
        console.error('Sign up error:', err);
        setError(err.message || 'An unexpected error occurred.');
    }

    useEffect(() => {
        if (signUpState.message === 'success' && signUpState.data) {
            setError(null);
            console.log('Attempting sign up with:', signUpState.data.email);
            setUserEmail(signUpState.data.email);
            signUp(signUpState.data.email, signUpState.data.password)
                .then((result) => {
                    if (!result.userConfirmed) {
                        setNeedsVerification(true);
                        setSuccess('Account created! Please check your email for a verification code.');
                    }
                })
                .catch(handleAuthError);
        } else if (signUpState.message && signUpState.message !== 'success') {
            setError(signUpState.message);
        }
    }, [signUpState, signUp]);

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError(null);

        try {
            await confirmSignUp(userEmail, verificationCode);
            setSuccess('Email verified! You can now sign in.');
            setTimeout(() => {
                onSwitch(); // Switch to sign in form
            }, 2000);
        } catch (err) {
            handleAuthError(err as Error);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        setError(null);

        try {
            await resendConfirmationCode(userEmail);
            setSuccess('Verification code resent! Check your email.');
        } catch (err) {
            handleAuthError(err as Error);
        } finally {
            setIsResending(false);
        }
    };

    const hasEmailError = emailTouched && signUpState.errors && 'email' in signUpState.errors && signUpState.errors.email;
    const hasPasswordError = passwordTouched && signUpState.errors && 'password' in signUpState.errors && signUpState.errors.password;

    // Show verification form if needed
    if (needsVerification) {
        return (
            <div className="grid gap-6 animate-fade-in">
                <div className="grid gap-3 text-center">
                    <h1 className="text-display-medium text-gradient-primary">Verify Your Email</h1>
                    <p className="text-heading-3 text-muted-foreground">
                        We sent a verification code to <span className="font-semibold text-foreground">{userEmail}</span>
                    </p>
                </div>
                <form onSubmit={handleVerification} className="space-y-5">
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="verification-code" className="text-sm font-medium">Verification Code</Label>
                            <Input
                                id="verification-code"
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                className="h-11 text-center text-lg tracking-widest"
                                maxLength={6}
                            />
                        </div>
                        <Button type="submit" disabled={isVerifying} className="w-full h-12">
                            {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            <span className="text-bold-cta">Verify Email</span>
                        </Button>
                    </div>
                </form>
                {success && (
                    <Alert className="animate-slide-down border-green-500/50 bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle className="font-semibold text-green-500">Success</AlertTitle>
                        <AlertDescription className="text-sm">{success}</AlertDescription>
                    </Alert>
                )}
                {error && (
                    <Alert variant="destructive" className="animate-slide-down border-destructive/50 bg-destructive/10">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Verification Error</AlertTitle>
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                )}
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                    <Button
                        type="button"
                        variant="link"
                        onClick={handleResendCode}
                        disabled={isResending}
                        className="text-primary"
                    >
                        {isResending ? 'Sending...' : 'Resend Code'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 animate-fade-in">
            <div className="grid gap-3 text-center">
                <h1 className="text-display-medium text-gradient-primary">Start Your Journey</h1>
                <p className="text-heading-3 text-muted-foreground">
                    Create your account and unlock AI-powered marketing
                </p>
            </div>
            <form action={signUpFormAction} className="space-y-5">
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email-signup" className="text-sm font-medium">Email Address</Label>
                        <Input
                            id="email-signup"
                            name="email"
                            type="email"
                            placeholder="agent@example.com"
                            required
                            className={`h-11 transition-all duration-300 ${hasEmailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            onBlur={() => setEmailTouched(true)}
                        />
                        {hasEmailError && signUpState.errors && 'email' in signUpState.errors && (
                            <p className="text-sm text-destructive mt-1 animate-slide-down flex items-center gap-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                {signUpState.errors.email![0]}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password-signup" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                            <Input
                                id="password-signup"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                className={`h-11 pr-10 transition-all duration-300 ${hasPasswordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                onBlur={() => setPasswordTouched(true)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                <span className="sr-only">Toggle password visibility</span>
                            </Button>
                        </div>
                        {hasPasswordError && signUpState.errors && 'password' in signUpState.errors && (
                            <p className="text-sm text-destructive mt-1 animate-slide-down flex items-center gap-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                {signUpState.errors.password![0]}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Must be at least 8 characters with uppercase, lowercase, and numbers
                        </p>
                    </div>
                    <AuthButton><span className="text-bold-cta">Create Account</span></AuthButton>
                </div>
            </form>
            {error && (
                <Alert variant="destructive" className="animate-slide-down border-destructive/50 bg-destructive/10">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Authentication Error</AlertTitle>
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
            )}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                onClick={onSwitch}
                className="w-full h-11 border-2 hover:bg-primary/5 hover:border-primary transition-all duration-300"
            >
                Sign In Instead
            </Button>
        </div>
    )
}

function VerifyEmailForm({ onBack }: { onBack: () => void }) {
    const { confirmSignUp, resendConfirmationCode } = useAuthMethods();
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [step, setStep] = useState<'email' | 'code'>('email');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsResending(true);
        setError(null);
        setSuccess(null);

        console.log('Sending verification code to:', email);

        try {
            await resendConfirmationCode(email);
            console.log('Verification code sent successfully');
            setSuccess('Verification code sent! Check your email.');
            console.log('Setting step to code');
            setStep('code');
            console.log('Step set to:', 'code');
        } catch (err) {
            console.error('Error sending verification code:', err);
            setError((err as Error).message);
        } finally {
            setIsResending(false);
        }
    };

    console.log('Current step:', step);

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError(null);

        console.log('Verifying email:', email, 'with code:', verificationCode);

        try {
            await confirmSignUp(email, verificationCode);
            console.log('Email verified successfully!');
            setSuccess('Email verified! You can now sign in.');
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (err) {
            console.error('Verification error:', err);
            setError((err as Error).message);
        } finally {
            setIsVerifying(false);
        }
    };

    if (step === 'email') {
        return (
            <div className="grid gap-6 animate-fade-in">
                <div className="grid gap-3 text-center">
                    <h1 className="text-display-medium text-gradient-primary">Verify Your Email</h1>
                    <p className="text-heading-3 text-muted-foreground">
                        Enter your email to receive a verification code
                    </p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-5">
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="verify-email" className="text-sm font-medium">Email Address</Label>
                            <Input
                                id="verify-email"
                                type="email"
                                placeholder="agent@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <Button type="submit" disabled={isResending} className="w-full h-12">
                            {isResending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
                            <span className="text-bold-cta">Send Verification Code</span>
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                console.log('Manual step change');
                                setStep('code');
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            Already have a code? Enter it here
                        </Button>
                    </div>
                </form>
                {success && (
                    <Alert className="animate-slide-down border-green-500/50 bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle className="font-semibold text-green-500">Success</AlertTitle>
                        <AlertDescription className="text-sm">{success}</AlertDescription>
                    </Alert>
                )}
                {error && (
                    <Alert variant="destructive" className="animate-slide-down border-destructive/50 bg-destructive/10">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Error</AlertTitle>
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                )}
                <Button
                    type="button"
                    variant="link"
                    onClick={onBack}
                    className="text-sm text-muted-foreground hover:text-primary"
                >
                    ← Back to Sign In
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-6 animate-fade-in">
            <div className="grid gap-3 text-center">
                <h1 className="text-display-medium text-gradient-primary">Enter Verification Code</h1>
                <p className="text-heading-3 text-muted-foreground">
                    We sent a code to <span className="font-semibold text-foreground">{email}</span>
                </p>
            </div>
            <form onSubmit={handleVerification} className="space-y-5">
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="verification-code-standalone" className="text-sm font-medium">Verification Code</Label>
                        <Input
                            id="verification-code-standalone"
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                            className="h-11 text-center text-lg tracking-widest"
                            maxLength={6}
                        />
                    </div>
                    <Button type="submit" disabled={isVerifying} className="w-full h-12 text-base font-semibold">
                        {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Verify Email
                    </Button>
                </div>
            </form>
            {success && (
                <Alert className="animate-slide-down border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle className="font-semibold text-green-500">Success</AlertTitle>
                    <AlertDescription className="text-sm">{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive" className="animate-slide-down border-destructive/50 bg-destructive/10">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Verification Error</AlertTitle>
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
            )}
            <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                <Button
                    type="button"
                    variant="link"
                    onClick={() => setStep('email')}
                    className="text-primary"
                >
                    Resend Code
                </Button>
            </div>
        </div>
    );
}

export default function LoginPage() {
    const { user, isUserLoading } = useUser();
    const [isSignUp, setIsSignUp] = useState(false);
    const [showVerify, setShowVerify] = useState(false);

    useEffect(() => {
        if (!isUserLoading && user) {
            redirect('/dashboard');
        }
    }, [user, isUserLoading]);

    const handleSwitch = () => {
        setIsSignUp(!isSignUp);
        setShowVerify(false);
    };

    const handleShowVerify = () => {
        setShowVerify(true);
        setIsSignUp(false);
    };

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
            <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
                {/* Left side - Form */}
                <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
                    <div className="w-full max-w-md space-y-8">
                        <div className="flex justify-center mb-8 animate-fade-in">
                            <Logo className="justify-center" />
                        </div>
                        <div className="transition-all duration-500 ease-in-out">
                            {showVerify ? (
                                <VerifyEmailForm onBack={() => setShowVerify(false)} />
                            ) : isSignUp ? (
                                <SignUpForm onSwitch={handleSwitch} />
                            ) : (
                                <SignInForm onSwitch={handleSwitch} onShowVerify={handleShowVerify} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side - Hero */}
                <div className="hidden lg:flex relative overflow-hidden">
                    {/* Gradient Mesh Background */}
                    <HeroGradientMesh>
                        {/* Content */}
                        <div className="flex flex-col justify-center px-12 py-16 space-y-12">
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm uppercase tracking-wide">
                                    <Sparkles className="w-4 h-4" />
                                    AI-Powered Marketing Platform
                                </div>
                                <h1 className="text-display-hero text-gradient-primary">
                                    Transform Your Real Estate Marketing
                                </h1>
                                <p className="text-heading-2 text-muted-foreground leading-relaxed">
                                    Harness the power of AI to build your brand, track your market, and create winning content that converts.
                                </p>
                            </div>

                            {/* Feature highlights */}
                            <div className="space-y-6 animate-fade-in-up animate-delay-200">
                                <div className="flex items-start gap-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                                        <TrendingUp className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-heading-3 text-foreground mb-1">Brand Intelligence</h3>
                                        <p className="text-base text-muted-foreground">
                                            Monitor your online presence and track competitor strategies in real-time.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                                        <Zap className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-heading-3 text-foreground mb-1">Content Generation</h3>
                                        <p className="text-base text-muted-foreground">
                                            Create compelling blog posts, social media content, and marketing materials instantly.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                                        <Target className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-heading-3 text-foreground mb-1">Strategic Planning</h3>
                                        <p className="text-base text-muted-foreground">
                                            Get personalized marketing plans tailored to your market and goals.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Social Proof - Testimonials */}
                            <div className="space-y-6 pt-8 border-t border-border/50 animate-fade-in-up animate-delay-300">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 border-2 border-background flex items-center justify-center text-white text-xs font-semibold">
                                                JD
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-background flex items-center justify-center text-white text-xs font-semibold">
                                                SM
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-primary border-2 border-background flex items-center justify-center text-white text-xs font-semibold">
                                                RK
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                    </div>
                                    <blockquote className="text-sm text-muted-foreground italic leading-relaxed">
                                        "This platform transformed how I approach marketing. The AI-generated content saves me hours every week, and my engagement has tripled."
                                    </blockquote>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm">
                                            <p className="font-semibold text-foreground">Sarah Mitchell</p>
                                            <p className="text-xs text-muted-foreground">Top Producer, Luxury Homes</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Trust Indicators */}
                                <div className="grid grid-cols-3 gap-4 pt-4">
                                    <div className="text-center space-y-1">
                                        <div className="flex justify-center">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                        <p className="text-metric-small text-primary">500+</p>
                                        <p className="text-xs text-muted-foreground font-medium">Active Agents</p>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <div className="flex justify-center">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Award className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                        <p className="text-metric-small text-primary">10K+</p>
                                        <p className="text-xs text-muted-foreground font-medium">Content Created</p>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <div className="flex justify-center">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                        <p className="text-metric-small text-primary">98%</p>
                                        <p className="text-xs text-muted-foreground font-medium">Satisfaction</p>
                                    </div>
                                </div>

                                {/* Additional testimonial */}
                                <div className="space-y-3 pt-4 border-t border-border/30">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <blockquote className="text-sm text-muted-foreground italic leading-relaxed">
                                        "The brand audit feature helped me identify and fix inconsistencies across 15 platforms. My online presence has never been stronger."
                                    </blockquote>
                                    <div className="text-sm">
                                        <p className="font-semibold text-foreground">James Rodriguez</p>
                                        <p className="text-xs text-muted-foreground">Broker Associate</p>
                                    </div>
                                </div>

                                {/* Platform benefits summary */}
                                <div className="pt-4 space-y-2">
                                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Why Agents Choose Us</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                            <span>AI-powered content in seconds</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                            <span>Real-time brand monitoring</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                            <span>Personalized marketing strategies</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </HeroGradientMesh>
                </div>
            </div>
        );
    }

    return null;
}
