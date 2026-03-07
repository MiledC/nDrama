import {useQuery} from '@tanstack/react-query';
import {getHomeSections} from '../api';
import type {HomeSection} from '../types/api';

/** Hook to fetch home page sections with content. */
export function useHomeSections() {
  return useQuery<HomeSection[], Error>({
    queryKey: ['home', 'sections'],
    queryFn: getHomeSections,
  });
}