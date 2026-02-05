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
    onSuccess: () => {
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

// Online Status
export function useSetOnlineStatus() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (online: boolean) => {
      if (!actor || !identity) return;
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
    refetchInterval: (query) => (query.state.data ? 10000 : false),
    retry: false,
  });
}

export function useGetUserProfile(userPrincipal: Principal | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getUserProfile(userPrincipal);
    },
    enabled: !!actor && !!identity && !isFetching && !!userPrincipal,
    retry: false,
  });
}

export function useGetMultipleUserProfiles(principals: Principal[]) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Record<string, UserProfile | null>>({
    queryKey: ['multipleUserProfiles', principals.map(p => p.toString()).sort().join(',')],
    queryFn: async () => {
      if (!actor || principals.length === 0) return {};
      
      const profilePromises = principals.map(async (principal) => {
        try {
          const profile = await actor.getUserProfile(principal);
          return { principal: principal.toString(), profile };
        } catch (error) {
          console.error(`Failed to fetch profile for ${principal.toString()}:`, error);
          return { principal: principal.toString(), profile: null };
        }
      });

      const results = await Promise.all(profilePromises);
      
      const profileMap: Record<string, UserProfile | null> = {};
      results.forEach(({ principal, profile }) => {
        profileMap[principal] = profile;
      });
      
      return profileMap;
    },
    enabled: !!actor && !!identity && !isFetching && principals.length > 0,
    retry: false,
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
      queryClient.invalidateQueries({ queryKey: ['transferHistory'] });
    },
  });
}

export function useGetFileMetadata(fileId: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<FileMetadata | null>({
    queryKey: ['fileMetadata', fileId],
    queryFn: async () => {
      if (!actor || !fileId) return null;
      return actor.getFileMetadata(fileId);
    },
    enabled: !!actor && !!identity && !isFetching && !!fileId,
    retry: false,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferHistory'] });
    },
  });
}

export function useGetTransferHistory(userPrincipal: Principal | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<TransferRecordData[]>({
    queryKey: ['transferHistory', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      return actor.getTransferHistory(userPrincipal);
    },
    enabled: !!actor && !!identity && !isFetching && !!userPrincipal,
    refetchInterval: (query) => (query.state.data && identity ? 5000 : false),
    retry: false,
  });
}

// AI Features
export function useCompressImage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ image, quality }: { image: ExternalBlob; quality: bigint }) => {
      if (!actor || !identity) throw new Error('Authentication required');
      const id = `img-${Date.now()}`;
      return actor.compressImage(id, image, quality);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProcessingResults'] });
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
      queryClient.invalidateQueries({ queryKey: ['aiProcessingResults'] });
    },
  });
}

export function useGetAIProcessingResult(id: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AIProcessingResult | null>({
    queryKey: ['aiProcessingResult', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getAIProcessingResult(id);
    },
    enabled: !!actor && !!identity && !isFetching && !!id,
    retry: false,
  });
}

export function useGetAllAIProcessingResults() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AIProcessingResult[]>({
    queryKey: ['aiProcessingResults'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAIProcessingResults();
    },
    enabled: !!actor && !!identity && !isFetching,
    retry: false,
  });
}
