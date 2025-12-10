'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileFormSchema, specialtyOptions, usStates, type ProfileFormData } from '@/lib/schemas/profile-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ProfileForm Component
 * 
 * Form for collecting essential user profile information during onboarding.
 * 
 * Features:
 * - Zod schema validation with field-level error messages
 * - Required and optional fields
 * - Multi-select for specialties
 * - State dropdown
 * - Phone and email format validation
 * - URL validation for website
 * - Mobile-responsive layout
 * - Touch-optimized inputs
 * 
 * Requirements: 2.1, 2.2, 2.3, 7.1, 7.4
 */

interface ProfileFormProps {
    /** Initial form values (for editing) */
    initialValues?: Partial<ProfileFormData>;
    /** Callback when form is submitted successfully */
    onSubmit: (data: ProfileFormData) => Promise<void>;
    /** Whether the form is currently submitting */
    isSubmitting?: boolean;
    /** Pre-filled email from Cognito */
    userEmail?: string;
}

export function ProfileForm({
    initialValues,
    onSubmit,
    isSubmitting = false,
    userEmail,
}: ProfileFormProps) {
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
        initialValues?.specialties || []
    );

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            firstName: initialValues?.firstName || '',
            lastName: initialValues?.lastName || '',
            email: initialValues?.email || userEmail || '',
            phone: initialValues?.phone || '',
            brokerage: initialValues?.brokerage || '',
            licenseNumber: initialValues?.licenseNumber || '',
            location: {
                city: initialValues?.location?.city || '',
                state: initialValues?.location?.state || '',
                zipCode: initialValues?.location?.zipCode || '',
            },
            specialties: initialValues?.specialties || [],
            yearsExperience: initialValues?.yearsExperience,
            website: initialValues?.website || '',
        },
    });

    const selectedState = watch('location.state');

    /**
     * Handle specialty checkbox toggle
     */
    const handleSpecialtyToggle = (specialty: string) => {
        const updated = selectedSpecialties.includes(specialty)
            ? selectedSpecialties.filter((s) => s !== specialty)
            : [...selectedSpecialties, specialty];

        setSelectedSpecialties(updated);
        setValue('specialties', updated, { shouldValidate: true });
    };

    /**
     * Handle form submission
     */
    const handleFormSubmit = async (data: ProfileFormData) => {
        try {
            await onSubmit(data);
        } catch (error) {
            console.error('[PROFILE_FORM] Submission error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <Card className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className="required">
                            First Name
                        </Label>
                        <Input
                            id="firstName"
                            {...register('firstName')}
                            placeholder="John"
                            aria-invalid={!!errors.firstName}
                            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                            className={cn(
                                'min-h-[44px]', // Touch-optimized height
                                errors.firstName && 'border-destructive'
                            )}
                        />
                        {errors.firstName && (
                            <p id="firstName-error" className="text-sm text-destructive" role="alert">
                                {errors.firstName.message}
                            </p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                        <Label htmlFor="lastName" className="required">
                            Last Name
                        </Label>
                        <Input
                            id="lastName"
                            {...register('lastName')}
                            placeholder="Doe"
                            aria-invalid={!!errors.lastName}
                            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                            className={cn(
                                'min-h-[44px]',
                                errors.lastName && 'border-destructive'
                            )}
                        />
                        {errors.lastName && (
                            <p id="lastName-error" className="text-sm text-destructive" role="alert">
                                {errors.lastName.message}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="john@example.com"
                            disabled={!!userEmail}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? 'email-error' : undefined}
                            className={cn(
                                'min-h-[44px]',
                                errors.email && 'border-destructive'
                            )}
                        />
                        {errors.email && (
                            <p id="email-error" className="text-sm text-destructive" role="alert">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            {...register('phone')}
                            placeholder="(555) 123-4567"
                            aria-invalid={!!errors.phone}
                            aria-describedby={errors.phone ? 'phone-error' : undefined}
                            className={cn(
                                'min-h-[44px]',
                                errors.phone && 'border-destructive'
                            )}
                        />
                        {errors.phone && (
                            <p id="phone-error" className="text-sm text-destructive" role="alert">
                                {errors.phone.message}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Professional Information Section */}
            <Card className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                <div className="space-y-4">
                    {/* Brokerage */}
                    <div className="space-y-2">
                        <Label htmlFor="brokerage" className="required">
                            Brokerage
                        </Label>
                        <Input
                            id="brokerage"
                            type="text"
                            {...register('brokerage')}
                            placeholder="ABC Realty"
                            aria-invalid={!!errors.brokerage}
                            aria-describedby={errors.brokerage ? 'brokerage-error' : undefined}
                            className={cn(
                                'min-h-[44px]',
                                errors.brokerage && 'border-destructive'
                            )}
                        />
                        {errors.brokerage && (
                            <p id="brokerage-error" className="text-sm text-destructive" role="alert">
                                {errors.brokerage.message}
                            </p>
                        )}
                    </div>

                    {/* License Number */}
                    <div className="space-y-2">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                            id="licenseNumber"
                            {...register('licenseNumber')}
                            placeholder="CA-DRE-12345678"
                            aria-invalid={!!errors.licenseNumber}
                            aria-describedby={errors.licenseNumber ? 'licenseNumber-error' : undefined}
                            className="min-h-[44px]"
                        />
                        {errors.licenseNumber && (
                            <p id="licenseNumber-error" className="text-sm text-destructive" role="alert">
                                {errors.licenseNumber.message}
                            </p>
                        )}
                    </div>

                    {/* Years of Experience */}
                    <div className="space-y-2">
                        <Label htmlFor="yearsExperience">Years of Experience</Label>
                        <Input
                            id="yearsExperience"
                            type="number"
                            {...register('yearsExperience', { valueAsNumber: true })}
                            placeholder="5"
                            min="0"
                            max="100"
                            aria-invalid={!!errors.yearsExperience}
                            aria-describedby={errors.yearsExperience ? 'yearsExperience-error' : undefined}
                            className="min-h-[44px]"
                        />
                        {errors.yearsExperience && (
                            <p id="yearsExperience-error" className="text-sm text-destructive" role="alert">
                                {errors.yearsExperience.message}
                            </p>
                        )}
                    </div>

                    {/* Website */}
                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            {...register('website')}
                            placeholder="https://www.example.com"
                            aria-invalid={!!errors.website}
                            aria-describedby={errors.website ? 'website-error' : undefined}
                            className="min-h-[44px]"
                        />
                        {errors.website && (
                            <p id="website-error" className="text-sm text-destructive" role="alert">
                                {errors.website.message}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Location Section */}
            <Card className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* City */}
                    <div className="space-y-2">
                        <Label htmlFor="city" className="required">
                            City
                        </Label>
                        <Input
                            id="city"
                            {...register('location.city')}
                            placeholder="Los Angeles"
                            aria-invalid={!!errors.location?.city}
                            aria-describedby={errors.location?.city ? 'city-error' : undefined}
                            className={cn(
                                'min-h-[44px]',
                                errors.location?.city && 'border-destructive'
                            )}
                        />
                        {errors.location?.city && (
                            <p id="city-error" className="text-sm text-destructive" role="alert">
                                {errors.location.city.message}
                            </p>
                        )}
                    </div>

                    {/* State */}
                    <div className="space-y-2">
                        <Label htmlFor="state" className="required">
                            State
                        </Label>
                        <Select
                            value={selectedState}
                            onValueChange={(value) => setValue('location.state', value, { shouldValidate: true })}
                        >
                            <SelectTrigger
                                id="state"
                                aria-invalid={!!errors.location?.state}
                                aria-describedby={errors.location?.state ? 'state-error' : undefined}
                                className={cn(
                                    'min-h-[44px]',
                                    errors.location?.state && 'border-destructive'
                                )}
                            >
                                <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                                {usStates.map((state) => (
                                    <SelectItem key={state.value} value={state.value}>
                                        {state.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.location?.state && (
                            <p id="state-error" className="text-sm text-destructive" role="alert">
                                {errors.location.state.message}
                            </p>
                        )}
                    </div>

                    {/* ZIP Code */}
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="zipCode" className="required">
                            ZIP Code
                        </Label>
                        <Input
                            id="zipCode"
                            {...register('location.zipCode')}
                            placeholder="90001"
                            aria-invalid={!!errors.location?.zipCode}
                            aria-describedby={errors.location?.zipCode ? 'zipCode-error' : undefined}
                            className={cn(
                                'min-h-[44px]',
                                errors.location?.zipCode && 'border-destructive'
                            )}
                        />
                        {errors.location?.zipCode && (
                            <p id="zipCode-error" className="text-sm text-destructive" role="alert">
                                {errors.location.zipCode.message}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Specialties Section */}
            <Card className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-2">Specialties</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Select at least one specialty (you can select multiple)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specialtyOptions.map((specialty) => (
                        <div key={specialty} className="flex items-center space-x-2">
                            <Checkbox
                                id={`specialty-${specialty}`}
                                checked={selectedSpecialties.includes(specialty)}
                                onCheckedChange={() => handleSpecialtyToggle(specialty)}
                                aria-describedby={errors.specialties ? 'specialties-error' : undefined}
                                className="min-h-[24px] min-w-[24px]" // Touch-optimized size
                            />
                            <Label
                                htmlFor={`specialty-${specialty}`}
                                className="text-sm font-normal cursor-pointer"
                            >
                                {specialty}
                            </Label>
                        </div>
                    ))}
                </div>
                {errors.specialties && (
                    <p id="specialties-error" className="text-sm text-destructive mt-2" role="alert">
                        {errors.specialties.message}
                    </p>
                )}
            </Card>

            {/* Submit Button - Hidden, controlled by parent */}
            <button type="submit" className="hidden" aria-hidden="true" />
        </form>
    );
}
