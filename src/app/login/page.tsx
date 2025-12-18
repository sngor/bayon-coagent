'use client';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { SessionLoading } from '@/components/session-loading';
import { useEffect, useState, useActionState } from 'react';
import { useUser, useAuthMethods } from '@/aws/auth/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, Eye, EyeOff, Sparkles, TrendingUp, Zap, Target, CheckCircle2, Mail, LayoutDashboard, Bot, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { emailSignInAction, emailSignUpAction, acceptInvitationByTokenAction, joinOrganizationByTokenAction } from '@/app/actions';
import { useFormStatus } from 'react-dom';
import { HeroGradientMesh, SubtleGradientMesh, GradientMesh } from '@/components/ui/gradient-mesh';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { StripePricing } from '@/components/stripe-pricing';
import { StripePaymentForm } from '@/components/stripe-payment-form';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/constants/stripe-config';


function AuthButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            disabled={pending}
            variant="premium"
            size="lg"
            className="w-full text-base font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-primary/25"
        >
            {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {children}
        </Button>
    )
}

function SignInForm({ onSwitch, onShowVerify }: { onSwitch: () => void; onShowVerify: () => void }) {
    const [signInState, signInFormAction] = useActionState(emailSignInAction, { message: '', errors: {}, data: null });
    const { signIn } = useAuthMethods();
    const { toast } = useToast();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get('invite');

    const handleAuthError = (err: Error) => {
        console.error('Sign in error:', err);
        const errorMessage = err.message || 'An unexpected error occurred.';
        setError(errorMessage);
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: errorMessage,
        });
    }

    useEffect(() => {
        if (signInState.message === 'success' && signInState.data) {
            setError(null);

            signIn(signInState.data.email, signInState.data.password)
                .then(async () => {
                    // Check for invite token and accept if present
                    if (inviteToken) {
                        try {
                            const result = await joinOrganizationByTokenAction(inviteToken);
                            if (result.message === 'success') {
                                toast({
                                    variant: "success",
                                    title: "Invitation Accepted",
                                    description: "You have successfully joined the organization.",
                                });
                            } else {
                                toast({
                                    variant: "destructive",
                                    title: "Invitation Failed",
                                    description: result.message || "Failed to accept invitation.",
                                });
                            }
                        } catch (err) {
                            console.error("Error accepting invitation:", err);
                        }
                    }

                    toast({
                        variant: "success",
                        title: "Welcome back!",
                        description: "You have successfully signed in.",
                    });
                })
                .catch(handleAuthError);
        } else if (signInState.message && signInState.message !== 'success') {
            setError(signInState.message);
            toast({
                variant: "destructive",
                title: "Sign in failed",
                description: signInState.message,
            });
        }
    }, [signInState, signIn, toast]);

    const hasEmailError = emailTouched && signInState.errors && 'email' in signInState.errors && signInState.errors.email;
    const hasPasswordError = passwordTouched && signInState.errors && 'password' in signInState.errors && signInState.errors.password;

    return (
        <div className="grid gap-8 animate-fade-in p-10 rounded-3xl glass-effect-sm border border-border/50 shadow-2xl bg-card/50 backdrop-blur-2xl">
            <div className="grid gap-4 text-center">
                <h1 className="font-display text-5xl font-bold text-gradient-primary tracking-tight">Welcome Back</h1>
                <p className="text-xl text-muted-foreground font-light">
                    Continue working smarter with your AI-powered workspace
                </p>
            </div>
            <form action={signInFormAction} className="space-y-6">
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email-signin" className="text-base font-semibold ml-1">Email Address</Label>
                        <Input
                            id="email-signin"
                            name="email"
                            type="email"
                            placeholder="agent@example.com"
                            required
                            className={`h-14 text-base bg-muted/40 border border-border/30 focus:bg-background/80 focus:border-primary/60 transition-all duration-300 rounded-xl shadow-sm hover:border-border/50 ${hasEmailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            onBlur={() => setEmailTouched(true)}
                        />
                        {hasEmailError && signInState.errors && 'email' in signInState.errors && (
                            <p className="text-sm text-destructive mt-1 animate-slide-down flex items-center gap-1 ml-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                {signInState.errors.email![0]}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password-signin" className="text-base font-semibold ml-1">Password</Label>
                        <div className="relative group">
                            <Input
                                id="password-signin"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                className={`h-14 text-base pr-12 bg-muted/40 border border-border/30 focus:bg-background/80 focus:border-primary/60 transition-all duration-300 rounded-xl shadow-sm hover:border-border/50 ${hasPasswordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                onBlur={() => setPasswordTouched(true)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1/2 right-2 -translate-y-1/2 h-10 w-10 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">Toggle password visibility</span>
                            </Button>
                        </div>
                        <div className="flex justify-end mt-1">
                            <Button
                                type="button"
                                variant="link"
                                onClick={onShowVerify}
                                className="text-xs text-muted-foreground hover:text-primary h-auto p-0"
                            >
                                Forgot password?
                            </Button>
                        </div>
                        {hasPasswordError && signInState.errors && 'password' in signInState.errors && (
                            <p className="text-sm text-destructive mt-1 animate-slide-down flex items-center gap-1 ml-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                {signInState.errors.password![0]}
                            </p>
                        )}
                    </div>
                    <AuthButton>Sign In</AuthButton>
                </div>
            </form>
            {error && (
                <Alert variant="destructive" className="animate-slide-down border-destructive/50 bg-destructive/10">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Authentication Error</AlertTitle>
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background/50 backdrop-blur-sm px-3 text-muted-foreground font-medium">New to the platform?</span>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onSwitch}
                    className="w-full h-14 text-base border-2 hover:bg-primary/5 hover:border-primary/50 font-semibold transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
                >
                    Create an Account
                </Button>
            </div>
        </div>
    )
}

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
    const [signUpState, signUpFormAction] = useActionState(emailSignUpAction, { message: '', errors: {}, data: null });
    const { signUp, confirmSignUp, resendConfirmationCode, signIn } = useAuthMethods();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const inviteToken = searchParams.get('invite');

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [invitationData, setInvitationData] = useState<{ organizationName: string; organizationId: string } | null>(null);
    const [signupStep, setSignupStep] = useState<'account' | 'plan' | 'payment' | 'verify'>('account');
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | undefined>();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Validate invitation token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (inviteToken) {
                const result = await acceptInvitationByTokenAction(inviteToken);
                if (result.message === 'success' && result.data) {
                    setInvitationData(result.data);
                    toast({
                        title: "Invitation Found",
                        description: `You've been invited to join ${result.data.organizationName}. Create an account to accept.`,
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Invalid Invitation",
                        description: result.message || "The invitation link is invalid or expired.",
                    });
                }
            }
        };
        validateToken();
    }, [inviteToken, toast]);

    const handleAuthError = (err: Error) => {
        console.error('Sign up error:', err);
        const errorMessage = err.message || 'An unexpected error occurred.';
        setError(errorMessage);
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: errorMessage,
        });
    }

    useEffect(() => {
        console.log('🔍 DEBUG: useEffect triggered with signUpState:', {
            message: signUpState.message,
            hasData: !!signUpState.data,
            data: signUpState.data,
            currentSignupStep: signupStep
        });
        
        // Only process if we're in the account step and have success data
        // This prevents the useEffect from running when signUpState resets after we've moved to verify step
        if (signUpState.message === 'success' && signUpState.data && signupStep === 'account') {
            console.log('🔍 DEBUG: signUpState success condition met, proceeding with signUp');
            setError(null);

            setUserEmail(signUpState.data.email);
            setUserPassword(signUpState.data.password);
            console.log('🔍 DEBUG: About to call signUp with:', {
                email: signUpState.data.email,
                hasPassword: !!signUpState.data.password,
                givenName: signUpState.data.givenName,
                familyName: signUpState.data.familyName
            });
            signUp(
                signUpState.data.email,
                signUpState.data.password,
                signUpState.data.givenName,
                signUpState.data.familyName
            )
                .then((result) => {
                    console.log('🔍 DEBUG: signUp promise resolved with result:', result);
                    setUserId(result.userSub);

                    if (result.userConfirmed) {
                        // User is auto-confirmed (Cognito setting), proceed to plan selection
                        setSignupStep('plan');
                        toast({
                            title: "Account created",
                            description: "Now choose your plan to continue.",
                        });
                    } else {
                        // User needs email verification, show verification step
                        console.log('🔍 DEBUG: Setting signupStep to verify, userConfirmed:', result.userConfirmed);
                        setSignupStep('verify');
                        setNeedsVerification(true);
                        console.log('🔍 DEBUG: signupStep should now be verify');
                        toast({
                            title: "Account created",
                            description: "Please check your email for a verification code.",
                        });
                    }
                })
                .catch((error) => {
                    console.log('🔍 DEBUG: signUp promise rejected with error:', error);
                    handleAuthError(error);
                });
        } else if (signUpState.message && signUpState.message !== 'success') {
            setError(signUpState.message);
            toast({
                variant: "destructive",
                title: "Sign up failed",
                description: signUpState.message,
            });
        }
    }, [signUpState, signUp, toast, signupStep]);

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError(null);

        try {
            await confirmSignUp(userEmail, verificationCode);

            // Bootstrap user with appropriate role (first user gets SuperAdmin)
            if (userId) {
                try {
                    const { bootstrapFirstUserAction } = await import('@/app/actions');
                    const bootstrapResult = await bootstrapFirstUserAction(
                        userId,
                        userEmail,
                        signUpState.data?.givenName,
                        signUpState.data?.familyName
                    );

                    if (bootstrapResult.message === 'success' && bootstrapResult.data?.isFirstUser) {
                        toast({
                            variant: "success",
                            title: "Welcome, SuperAdmin!",
                            description: "You're the first user and have been granted SuperAdmin privileges.",
                        });
                    }
                } catch (bootstrapError) {
                    console.error('Failed to bootstrap user:', bootstrapError);
                    // Don't block the signup flow if bootstrap fails
                }
            }

            setSuccess('Account verified successfully! Redirecting to dashboard...');
            toast({
                variant: "success",
                title: "Email verified",
                description: "Your account is now active!",
            });

            // Auto sign in after verification
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } catch (err) {
            handleAuthError(err as Error);
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePlanSelection = async (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setError(null);

        // Skip payment in development mode
        if (process.env.NODE_ENV === 'development') {
            toast({
                title: "Plan selected",
                description: `${SUBSCRIPTION_PLANS[plan].name} plan selected. Payment skipped in development.`,
            });

            // Bootstrap user with appropriate role before sign in
            if (userId) {
                try {
                    const { bootstrapFirstUserAction } = await import('@/app/actions');
                    const bootstrapResult = await bootstrapFirstUserAction(
                        userId,
                        userEmail,
                        signUpState.data?.givenName,
                        signUpState.data?.familyName
                    );

                    if (bootstrapResult.message === 'success' && bootstrapResult.data?.isFirstUser) {
                        toast({
                            variant: "success",
                            title: "Welcome, SuperAdmin!",
                            description: "You're the first user and have been granted SuperAdmin privileges.",
                        });
                    }
                } catch (bootstrapError) {
                    console.error('Failed to bootstrap user:', bootstrapError);
                    // Don't block the signup flow if bootstrap fails
                }
            }

            // In development, skip to verification or auto-sign in
            if (userEmail && userPassword) {
                try {
                    await signIn(userEmail, userPassword);
                    toast({
                        variant: "success",
                        title: "Welcome!",
                        description: "Your account is ready.",
                    });
                    window.location.href = '/dashboard';
                } catch (err) {
                    // If auto-sign in fails, show verification step
                    setSignupStep('verify');
                }
            } else {
                setSignupStep('verify');
            }
            return;
        }

        // Production: proceed with payment
        try {
            const response = await fetch('/api/stripe/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    priceId: SUBSCRIPTION_PLANS[plan].priceId,
                    userId: userId,
                }),
            });

            const data = await response.json();

            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setSignupStep('payment');
            } else {
                throw new Error('Failed to create subscription');
            }
        } catch (err) {
            handleAuthError(err as Error);
        }
    };

    const handlePaymentSuccess = () => {
        setSignupStep('verify');
        setSuccess('Payment successful! Please verify your email to complete signup.');
        toast({
            title: "Payment successful",
            description: "Check your email for a verification code.",
        });
    };

    const handleResendCode = async () => {
        setIsResending(true);
        setError(null);

        try {
            await resendConfirmationCode(userEmail);
            setSuccess('Verification code resent! Check your email.');
            toast({
                title: "Code resent",
                description: "Check your email for the verification code.",
            });
        } catch (err) {
            handleAuthError(err as Error);
        } finally {
            setIsResending(false);
        }
    };

    const hasEmailError = emailTouched && signUpState.errors && 'email' in signUpState.errors && signUpState.errors.email;
    const hasPasswordError = passwordTouched && signUpState.errors && 'password' in signUpState.errors && signUpState.errors.password;

    // Show plan selection
    if (signupStep === 'plan') {
        return (
            <div className="grid gap-8 animate-fade-in p-8 rounded-2xl glass-effect-sm border-border/50 shadow-xl bg-card/40 backdrop-blur-xl">
                <div className="grid gap-3 text-center">
                    <h1 className="font-display text-4xl font-bold text-gradient-primary tracking-tight">Choose Your Plan</h1>
                    <p className="text-lg text-muted-foreground font-light">
                        Select the plan that fits your needs
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            Development Mode: Payment will be skipped
                        </p>
                    )}
                </div>
                <StripePricing onSelectPlan={handlePlanSelection} selectedPlan={selectedPlan} />
                {error && (
                    <Alert variant="destructive" className="animate-slide-down border-destructive/50 bg-destructive/10">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Error</AlertTitle>
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                )}
            </div>
        );
    }

    // Show payment form
    if (signupStep === 'payment' && clientSecret) {
        return (
            <div className="grid gap-8 animate-fade-in p-8 rounded-2xl glass-effect-sm border-border/50 shadow-xl bg-card/40 backdrop-blur-xl">
                <div className="grid gap-3 text-center">
                    <h1 className="font-display text-4xl font-bold text-gradient-primary tracking-tight">Complete Payment</h1>
                    <p className="text-lg text-muted-foreground font-light">
                        Enter your payment details to activate your subscription
                    </p>
                </div>
                <StripePaymentForm
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setSignupStep('plan')}
                />
            </div>
        );
    }

    // Show verification form if needed
    console.log('🔍 DEBUG: Current signupStep:', signupStep, 'needsVerification:', needsVerification);
    if (signupStep === 'verify') {
        console.log('🔍 DEBUG: Rendering verification form');
        return (
            <div className="grid gap-8 animate-fade-in p-8 rounded-2xl glass-effect-sm border-border/50 shadow-xl bg-card/40 backdrop-blur-xl">
                <div className="grid gap-3 text-center">
                    <h1 className="font-display text-4xl font-bold text-gradient-primary tracking-tight">Check Your Email</h1>
                    <p className="text-lg text-muted-foreground font-light">
                        We sent a code to <span className="font-semibold text-foreground">{userEmail}</span>
                    </p>
                </div>
                <form onSubmit={handleVerification} className="space-y-6">
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="verification-code" className="text-sm font-medium ml-1">Verification Code</Label>
                            <Input
                                id="verification-code"
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 transition-all duration-300"
                                maxLength={6}
                            />
                        </div>
                        <Button type="submit" disabled={isVerifying} variant="premium" size="lg" className="w-full shadow-lg hover:shadow-primary/25">
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
                        onClick={handleResendCode}
                        disabled={isResending}
                        className="text-primary hover:text-primary-hover"
                    >
                        {isResending ? 'Sending...' : 'Resend Code'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-8 animate-fade-in p-10 rounded-3xl glass-effect-sm border border-border/50 shadow-2xl bg-card/50 backdrop-blur-2xl">
            <div className="grid gap-4 text-center">
                <h1 className="font-display text-5xl font-bold text-gradient-primary tracking-tight">Work Smarter with AI</h1>
                <p className="text-xl text-muted-foreground font-light">
                    Join professionals who amplify their capabilities with intelligent AI assistance
                </p>
            </div>
            <form action={signUpFormAction} className="space-y-6">
                <div className="grid gap-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="givenName-signup" className="text-base font-semibold ml-1">First Name</Label>
                            <Input
                                id="givenName-signup"
                                name="givenName"
                                type="text"
                                placeholder="John"
                                required
                                className="h-14 text-base bg-muted/40 border border-border/30 focus:bg-background/80 focus:border-primary/60 transition-all duration-300 rounded-xl shadow-sm hover:border-border/50"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="familyName-signup" className="text-base font-semibold ml-1">Last Name</Label>
                            <Input
                                id="familyName-signup"
                                name="familyName"
                                type="text"
                                placeholder="Doe"
                                required
                                className="h-14 text-base bg-muted/40 border border-border/30 focus:bg-background/80 focus:border-primary/60 transition-all duration-300 rounded-xl shadow-sm hover:border-border/50"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email-signup" className="text-base font-semibold ml-1">Email Address</Label>
                        <Input
                            id="email-signup"
                            name="email"
                            type="email"
                            placeholder="agent@example.com"
                            required
                            className={`h-14 text-base bg-muted/40 border border-border/30 focus:bg-background/80 focus:border-primary/60 transition-all duration-300 rounded-xl shadow-sm hover:border-border/50 ${hasEmailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            onBlur={() => setEmailTouched(true)}
                            onChange={(e) => setUserEmail(e.target.value)}
                        />
                        {hasEmailError && signUpState.errors && 'email' in signUpState.errors && (
                            <p className="text-sm text-destructive mt-1 animate-slide-down flex items-center gap-1 ml-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                {signUpState.errors.email![0]}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password-signup" className="text-base font-semibold ml-1">Password</Label>
                        <div className="relative group">
                            <Input
                                id="password-signup"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                className={`h-14 text-base pr-12 bg-muted/40 border border-border/30 focus:bg-background/80 focus:border-primary/60 transition-all duration-300 rounded-xl shadow-sm hover:border-border/50 ${hasPasswordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                onBlur={() => setPasswordTouched(true)}
                                onChange={(e) => setUserPassword(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1/2 right-2 -translate-y-1/2 h-10 w-10 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">Toggle password visibility</span>
                            </Button>
                        </div>
                        {hasPasswordError && signUpState.errors && 'password' in signUpState.errors && (
                            <p className="text-sm text-destructive mt-1 animate-slide-down flex items-center gap-1 ml-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-destructive"></span>
                                {signUpState.errors.password![0]}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 ml-1">
                            Must be at least 8 characters with uppercase, lowercase, and numbers
                        </p>
                    </div>
                    <div className="text-xs text-muted-foreground text-center px-4">
                        By creating an account, you agree to our{' '}
                        <Link href="/terms" className="text-primary hover:underline font-medium">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-primary hover:underline font-medium">
                            Privacy Policy
                        </Link>
                    </div>
                    <AuthButton>
                        {invitationData ? 'Join Organization' : 'Create Account'}
                    </AuthButton>
                </div>
                {/* Hidden input to pass invite token to server action if we update it to handle invites directly */}
                {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
            </form>
            {error && (
                <Alert variant="destructive" className="animate-slide-down border-destructive/50 bg-destructive/10">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Authentication Error</AlertTitle>
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background/50 backdrop-blur-sm px-3 text-muted-foreground font-medium">Already have an account?</span>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onSwitch}
                    className="w-full h-12 border-2 hover:bg-primary/5 hover:border-primary/50 text-base font-medium transition-all duration-300"
                >
                    Sign In Instead
                </Button>
            </div>
        </div>
    )
}

function VerifyEmailForm({ onBack }: { onBack: () => void }) {
    const { confirmSignUp, resendConfirmationCode } = useAuthMethods();
    const { toast } = useToast();
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

        try {
            await resendConfirmationCode(email);

            setSuccess('Verification code sent! Check your email.');
            toast({
                title: "Code sent",
                description: "Check your email for the verification code.",
            });

            setStep('code');

        } catch (err) {
            console.error('Error sending verification code:', err);
            setError((err as Error).message);
        } finally {
            setIsResending(false);
        }
    };

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError(null);

        try {
            await confirmSignUp(email, verificationCode);

            setSuccess('Email verified! You can now sign in.');
            toast({
                variant: "success",
                title: "Email verified",
                description: "You can now sign in.",
            });
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
            <div className="grid gap-8 animate-fade-in p-8 rounded-2xl glass-effect-sm border-border/50 shadow-xl bg-card/40 backdrop-blur-xl">
                <div className="grid gap-3 text-center">
                    <h1 className="font-display text-4xl font-bold text-gradient-primary tracking-tight">Verify Your Email</h1>
                    <p className="text-lg text-muted-foreground font-light">
                        Enter your email to receive a verification code
                    </p>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="verify-email" className="text-sm font-medium ml-1">Email Address</Label>
                            <Input
                                id="verify-email"
                                type="email"
                                placeholder="agent@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 transition-all duration-300"
                            />
                        </div>
                        <Button type="submit" disabled={isResending} variant="premium" size="lg" className="w-full shadow-lg hover:shadow-primary/25">
                            {isResending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
                            Send Verification Code
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setStep('code');
                            }}
                            variant="outline"
                            className="w-full h-12 border-2 hover:bg-primary/5 hover:border-primary/50 text-base font-medium transition-all duration-300"
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
        <div className="grid gap-8 animate-fade-in p-8 rounded-2xl glass-effect-sm border-border/50 shadow-xl bg-card/40 backdrop-blur-xl">
            <div className="grid gap-3 text-center">
                <h1 className="font-display text-4xl font-bold text-gradient-primary tracking-tight">Enter Verification Code</h1>
                <p className="text-lg text-muted-foreground font-light">
                    We sent a code to <span className="font-semibold text-foreground">{email}</span>
                </p>
            </div>
            <form onSubmit={handleVerification} className="space-y-6">
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="verification-code-standalone" className="text-sm font-medium ml-1">Verification Code</Label>
                        <Input
                            id="verification-code-standalone"
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                            className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 transition-all duration-300"
                            maxLength={6}
                        />
                    </div>
                    <Button type="submit" disabled={isVerifying} variant="premium" size="lg" className="w-full shadow-lg hover:shadow-primary/25">
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
                    className="text-primary hover:text-primary-hover"
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
        return <SessionLoading />;
    }

    if (!user) {
        return (
            <div className="w-full min-h-screen lg:flex">
                {/* Left side - Form */}
                <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-1/2 lg:overflow-y-auto relative overflow-hidden">
                    {/* Gradient Mesh Background */}
                    <GradientMesh
                        containerClassName="w-full h-full absolute inset-0"
                        orbs={[
                            {
                                id: 'login-1',
                                color: 'hsl(var(--primary))',
                                size: 800,
                                x: 20,
                                y: 20,
                                blur: 100,
                                opacity: 0.2,
                                animationDuration: 45,
                            },
                            {
                                id: 'login-2',
                                color: 'hsl(var(--accent-start))',
                                size: 700,
                                x: 80,
                                y: 80,
                                blur: 100,
                                opacity: 0.15,
                                animationDuration: 50,
                            },
                            {
                                id: 'login-3',
                                color: 'hsl(var(--accent-mid))',
                                size: 600,
                                x: 50,
                                y: 50,
                                blur: 120,
                                opacity: 0.1,
                                animationDuration: 60,
                            },
                        ]}
                        blur="2xl"
                        animate
                    />

                    {/* Background Pattern */}
                    <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                    {/* Centered Login Container */}
                    <div className="w-full max-w-2xl space-y-8 relative z-10">
                        <div className="flex justify-center mb-8 animate-fade-in">
                            <Logo className="justify-center scale-110" />
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
                <div className="hidden lg:flex relative overflow-y-auto lg:ml-auto lg:w-1/2">
                    {/* Gradient Mesh Background */}
                    <HeroGradientMesh>
                        {/* Content */}
                        <div className="flex flex-col justify-center px-12 py-16 space-y-12">
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm uppercase tracking-wide">
                                    <Sparkles className="w-4 h-4" />
                                    Your AI Coagent
                                </div>
                                <h1 className="font-headline text-display-hero bg-gradient-to-r from-primary via-indigo-500 to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">
                                    Your Intelligent Workspace.
                                </h1>
                                <p className="text-heading-2 text-muted-foreground leading-relaxed">
                                    The AI-powered platform that augments your capabilities with intelligent insights, analysis, and assistance.
                                </p>
                            </div>

                            {/* Feature highlights */}
                            <div className="space-y-4 animate-fade-in-up animate-delay-200">
                                <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 hover:backdrop-blur-sm border border-transparent hover:border-white/10 group cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <TrendingUp className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-headline text-heading-3 text-foreground mb-1 group-hover:text-primary transition-colors">Intelligent Monitoring</h3>
                                        <p className="text-base text-muted-foreground leading-relaxed">
                                            AI-powered tracking and analysis that keeps you informed and ahead of changes in real-time.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 hover:backdrop-blur-sm border border-transparent hover:border-white/10 group cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <Zap className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-headline text-heading-3 text-foreground mb-1 group-hover:text-primary transition-colors">AI Content Creation</h3>
                                        <p className="text-base text-muted-foreground leading-relaxed">
                                            Generate high-quality content, documents, and creative assets instantly with advanced AI models.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 hover:backdrop-blur-sm border border-transparent hover:border-white/10 group cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <Target className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-headline text-heading-3 text-foreground mb-1 group-hover:text-primary transition-colors">Strategic Insights</h3>
                                        <p className="text-base text-muted-foreground leading-relaxed">
                                            Get data-driven recommendations and strategic guidance powered by advanced AI intelligence.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 hover:backdrop-blur-sm border border-transparent hover:border-white/10 group cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <LayoutDashboard className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-headline text-heading-3 text-foreground mb-1 group-hover:text-primary transition-colors">Data Visualization</h3>
                                        <p className="text-base text-muted-foreground leading-relaxed">
                                            Transform complex data into stunning, interactive dashboards with AI-powered analytics and insights.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 hover:backdrop-blur-sm border border-transparent hover:border-white/10 group cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <Bot className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-headline text-heading-3 text-foreground mb-1 group-hover:text-primary transition-colors">Conversational AI</h3>
                                        <p className="text-base text-muted-foreground leading-relaxed">
                                            Interact naturally with advanced AI that understands context and provides intelligent assistance 24/7.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 hover:backdrop-blur-sm border border-transparent hover:border-white/10 group cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <BarChart3 className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-headline text-heading-3 text-foreground mb-1 group-hover:text-primary transition-colors">Predictive Analytics</h3>
                                        <p className="text-base text-muted-foreground leading-relaxed">
                                            Uncover patterns and opportunities with AI-powered predictive analytics and trend forecasting.
                                        </p>
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
