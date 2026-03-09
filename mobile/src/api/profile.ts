import api from './client';
import type {SubscriberProfile} from './auth';

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
  country?: string;
  language?: string;
}

/** Update subscriber profile (partial update). */
export async function updateProfile(
  fields: UpdateProfileRequest,
): Promise<SubscriberProfile> {
  const {data} = await api.patch<SubscriberProfile>('/me', fields);
  return data;
}

/** Delete subscriber account (soft-delete — sets status to banned). */
export async function deleteAccount(): Promise<void> {
  await api.delete('/me');
}
