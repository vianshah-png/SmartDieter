'use server';

import { Client } from '../../types';
import { fetchClientProfile } from '../../lib/services/api-service';

/**
 * Dashboard-compatible client fetching action
 * Delegates to the new API service layer and maps ClientProfile to legacy Client type
 */
export async function getClientDetails(clientId: string): Promise<Client | null> {
    console.log(`[Client Action] Fetching client details for ID: ${clientId}`);

    try {
        // Use the new API service
        const profile = await fetchClientProfile(clientId);

        console.log(`[Client Action] Successfully fetched client: ${profile.first_name} ${profile.last_name}`);

        // Map ClientProfile to Client type for dashboard compatibility
        const client: Client = {
            id: profile.user_id,
            name: `${profile.first_name} ${profile.last_name}`.trim(),
            email: profile.email,
            phone: profile.mobile_number,
            address: '', // Not in new API response
            gender: profile.gender,
            age: profile.age,
            foodPreference: profile.diet_preference,
            allergies: profile.allergies,
            aversions: profile.food_aversions,
            medicalIssues: profile.medical_conditions,
            lastKeyInsight: '',
            status: 'ACTIVE',
            isVeg: profile.diet_preference === 'Veg' || profile.diet_preference === 'Vegan',
            platform: 'Android',
            weightHistory: [],
            stats: {
                assessStWt: profile.assessment_start_weight,
                prgStWt: profile.program_start_weight,
                goalWt: profile.target_weight,
                currentWt: profile.current_weight,
            }
        };

        console.log(`[Client Action] Mapped client data:`, {
            id: client.id,
            name: client.name,
            allergies: client.allergies,
            aversions: client.aversions,
            medicalIssues: client.medicalIssues,
            foodPreference: client.foodPreference
        });

        return client;

    } catch (error) {
        console.error('[Client Action] Failed to fetch client:', error);
        return null;
    }
}
