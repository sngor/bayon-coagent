'use server';

import { runRentalPotentialAnalysis, type RentalPotentialOutput } from '@/aws/bedrock/flows/rental-potential';

export interface RentalPotentialState {
    message: string;
    data: RentalPotentialOutput | null;
    errors: Record<string, string[]>;
}

export async function generateRentalPotential(
    prevState: RentalPotentialState,
    formData: FormData
): Promise<RentalPotentialState> {
    try {
        const address = formData.get('address') as string;
        const beds = formData.get('beds') as string;
        const baths = formData.get('baths') as string;
        const propertyType = formData.get('propertyType') as string;
        const specialFeatures = formData.get('specialFeatures') as string;

        if (!address) {
            return {
                message: 'error',
                data: null,
                errors: { address: ['Address is required'] },
            };
        }

        const propertyDescription = `
Property Address: ${address}
Bedrooms: ${beds}
Bathrooms: ${baths}
Property Type: ${propertyType}
${specialFeatures ? `Special Features: ${specialFeatures}` : ''}
        `.trim();

        const result = await runRentalPotentialAnalysis({ propertyDescription });

        return {
            message: 'success',
            data: result,
            errors: {},
        };
    } catch (error) {
        console.error('Error generating rental potential:', error);
        return {
            message: 'error',
            data: null,
            errors: { form: ['Failed to generate rental potential analysis'] },
        };
    }
}
