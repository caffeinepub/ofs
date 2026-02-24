import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export function useRequestIndicator() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  return {
    isLoading: isFetching > 0 || isMutating > 0,
  };
}
