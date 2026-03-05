import apiClient from './client';
import type { SubscriberProfile, UpdateProfileRequest } from './types';

/** Get the current subscriber's profile. */
export async function getProfile(): Promise<SubscriberProfile> {
  const { data } = await apiClient.get<SubscriberProfile>('/me');
  return data;
}

/** Update the current subscriber's profile. */
export async function updateProfile(
  body: UpdateProfileRequest,
): Promise<SubscriberProfile> {
  const { data } = await apiClient.patch<SubscriberProfile>('/me', body);
  return data;
}

/** Soft-delete the current subscriber's account. */
export async function deleteProfile(): Promise<void> {
  await apiClient.delete('/me');
}
