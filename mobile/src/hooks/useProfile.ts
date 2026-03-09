import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {getMe, SubscriberProfile} from '../api/auth';
import {updateProfile, UpdateProfileRequest} from '../api/profile';
import {useAuthStore} from '../stores/authStore';

/** Hook to fetch the current subscriber profile. */
export function useProfile() {
  return useQuery<SubscriberProfile, Error>({
    queryKey: ['profile'],
    queryFn: getMe,
  });
}

/** Mutation to update the subscriber profile with optimistic update. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const refreshProfile = useAuthStore(s => s.refreshProfile);

  return useMutation<
    SubscriberProfile,
    Error,
    UpdateProfileRequest,
    {previous: SubscriberProfile | undefined}
  >({
    mutationFn: (fields) => updateProfile(fields),
    onMutate: async (fields) => {
      await queryClient.cancelQueries({queryKey: ['profile']});
      const previous = queryClient.getQueryData<SubscriberProfile>(['profile']);
      if (previous) {
        queryClient.setQueryData<SubscriberProfile>(['profile'], {
          ...previous,
          ...fields,
        });
      }
      return {previous};
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['profile'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['profile']});
      // Also sync Zustand auth store
      refreshProfile();
    },
  });
}
