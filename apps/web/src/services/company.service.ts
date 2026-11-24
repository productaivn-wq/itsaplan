import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type UpdateCompanySettingsPatch,
  getCompanySettings,
  updateCompanySettings,
} from '@/lib/api/endpoints/company';
import { qk } from '@/services/queryKeys';

export function useCompanySettingsQuery() {
  return useQuery({
    queryKey: qk.companySettings,
    queryFn: () => getCompanySettings(),
  });
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCompanySettingsPatch) => updateCompanySettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.companySettings });
      qc.invalidateQueries({ queryKey: qk.teams });
    },
  });
}
