import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Group, DashboardSummary, VisitorGroupAccess } from '../types';

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => apiService.getGroups(),
  });
};

export const useGroupDetails = (groupId: string | null) => {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupId ? apiService.getGroupDetails(groupId) : null,
    enabled: !!groupId,
  });
};

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => apiService.getDashboardSummary(),
  });
};

export const useLibraryPhotos = () => {
  return useQuery({
    queryKey: ['libraryPhotos'],
    queryFn: () => apiService.getAllPhotos(),
  });
};

export const useVisitorLogs = () => {
  return useQuery({
    queryKey: ['visitorLogs'],
    queryFn: () => apiService.getVisitorLogs(),
    refetchInterval: 30_000, // auto-refresh every 30s
  });
};

