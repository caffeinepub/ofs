import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, TransferRecordData, FileMetadata, AIProcessingResult, Variant_imageCompression_fileRecognition } from '../backend';
import { ExternalBlob } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !!identity && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor || !identity) throw new Error('Authentication required');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: (_data, profile) => {
      // Immediately update the cache so the new name is visible everywhere
      queryClient.setQueryData(['currentUserProfile'], profile);
      // Also invalidate to ensure a fresh fetch in the background
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ displayName, avatarUrl }: { displayName: string; avatarUrl: string }) => {
      if (!actor || !identity) throw new Error('Authentication required');
      return actor.updateProfile(displayName, avatarUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserProfile(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !!user && !isFetching,
  });
}

export function useGetMultipleUserProfiles(users: Principal[]) {
  const { actor, isFetching } = useActor();

  return useQuery<Record<string, UserProfile | null>>({
    queryKey: ['userProfiles', users.map(u => u.toString()).sort()],
    queryFn: async () => {
      if (!actor) return {};
      
      const profiles = await Promise.all(
        users.map(async (user) => {
          try {
            const profile = await actor.getUserProfile(user);
            return { principal: user.toString(), profile };
          } catch (error) {
            console.error(`Failed to fetch profile for ${user.toString()}:`, error);
            return { principal: user.toString(), profile: null };
          }
        })
      );

      return profiles.reduce((acc, { principal, profile }) => {
        acc[principal] = profile;
        return acc;
      }, {} as Record<string, UserProfile | null>);
    },
    enabled: !!actor && users.length > 0 && !isFetching,
  });
}

// File Operations
export function useUploadFile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      size,
      fileType,
      blob,
    }: {
      id: string;
      name: string;
      size: bigint;
      fileType: string;
      blob: ExternalBlob;
    }) => {
      if (!actor || !identity) throw new Error('Authentication required');
      return actor.uploadFile(id, name, size, fileType, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useGetFileMetadata(fileId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<FileMetadata>({
    queryKey: ['fileMetadata', fileId],
    queryFn: async () => {
      if (!actor || !fileId) throw new Error('File ID required');
      return actor.getFileMetadata(fileId);
    },
    enabled: !!actor && !!fileId && !isFetching,
  });
}

// Transfer Operations
export function useRecordTransfer() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      sender,
      receiver,
      file,
      duration,
      success,
    }: {
      id: string;
      sender: Principal;
      receiver: Principal;
      file: FileMetadata;
      duration: bigint;
      success: boolean;
    }) => {
      if (!actor || !identity) throw new Error('Authentication required');
      return actor.recordTransfer(id, sender, receiver, file, duration, success);
    },
    onMutate: async (newTransfer) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transferHistory'] });

      // Snapshot previous value
      const previousTransfers = queryClient.getQueryData(['transferHistory', newTransfer.sender.toString()]);

      // Optimistically update to the new value
      queryClient.setQueryData(['transferHistory', newTransfer.sender.toString()], (old: TransferRecordData[] | undefined) => {
        const optimisticTransfer: TransferRecordData = {
          id: newTransfer.id,
          sender: newTransfer.sender,
          receiver: newTransfer.receiver,
          file: newTransfer.file,
          transferTime: BigInt(Date.now()) * BigInt(1000000),
          transferDuration: newTransfer.duration,
          success: newTransfer.success,
        };
        return old ? [...old, optimisticTransfer] : [optimisticTransfer];
      });

      return { previousTransfers };
    },
    onError: (err, newTransfer, context) => {
      // Rollback on error
      if (context?.previousTransfers) {
        queryClient.setQueryData(['transferHistory', newTransfer.sender.toString()], context.previousTransfers);
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['transferHistory', variables.sender.toString()] });
      queryClient.invalidateQueries({ queryKey: ['transferHistory', variables.receiver.toString()] });
    },
  });
}

export function useGetTransferHistory(user: Principal | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TransferRecordData[]>({
    queryKey: ['transferHistory', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getTransferHistory(user);
    },
    enabled: !!actor && !!user && !!identity && !isFetching,
    refetchInterval: 5000,
  });
}

export function useDeleteTransferRecord() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || !identity) throw new Error('Authentication required');
      return actor.deleteTransferRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferHistory'] });
    },
  });
}

// Online Users
export function useSetOnlineStatus() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (online: boolean) => {
      if (!actor || !identity) throw new Error('Authentication required');
      return actor.setOnlineStatus(online);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onlineUsers'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetOnlineUsers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Principal[]>({
    queryKey: ['onlineUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOnlineUsers();
    },
    enabled: !!actor && !!identity && !isFetching,
    refetchInterval: 5000,
  });
}

// AI Features
export function useCompressImage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      image,
      quality,
    }: {
      id: string;
      image: ExternalBlob;
      quality: bigint;
    }) => {
      if (!actor || !identity) throw new Error('Authentication required');
      return actor.compressImage(id, image, quality);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiResults'] });
    },
  });
}

export function useRecordAIProcessing() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      resultType,
      metadata,
      processedFile,
    }: {
      id: string;
      resultType: Variant_imageCompression_fileRecognition;
      metadata: string;
      processedFile: ExternalBlob | null;
    }) => {
      if (!actor || !identity) throw new Error('Authentication required');
      return actor.recordAIProcessing(id, resultType, metadata, processedFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiResults'] });
    },
  });
}

export function useGetAIProcessingResult(id: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AIProcessingResult>({
    queryKey: ['aiResult', id],
    queryFn: async () => {
      if (!actor || !id) throw new Error('Result ID required');
      return actor.getAIProcessingResult(id);
    },
    enabled: !!actor && !!id && !isFetching,
  });
}

export function useGetAllAIProcessingResults() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AIProcessingResult[]>({
    queryKey: ['aiResults'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAIProcessingResults();
    },
    enabled: !!actor && !!identity && !isFetching,
  });
}
