import { useState, useEffect, useCallback } from 'react';
import { ContractTemplate } from '../../../types/contracts';
import { contractTemplateService } from '../../../services/contractTemplateService';

export function useContractTemplates() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contractTemplateService.getAllTemplates();
      setTemplates(data);
    } catch (err: any) {
      console.error('Error fetching contract templates:', err);
      setError(err.message || 'Erro ao carregar modelos de contrato');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (data: Partial<ContractTemplate>) => {
    const created = await contractTemplateService.createTemplate(data);
    await fetchTemplates();
    return created;
  };

  const updateTemplate = async (id: string, data: Partial<ContractTemplate>) => {
    const updated = await contractTemplateService.updateTemplate(id, data);
    await fetchTemplates();
    return updated;
  };

  const archiveTemplate = async (id: string) => {
    const archived = await contractTemplateService.archiveTemplate(id);
    await fetchTemplates();
    return archived;
  };

  const deleteTemplate = async (id: string) => {
    const res = await contractTemplateService.deleteTemplate(id);
    await fetchTemplates();
    return res;
  };

  return {
    templates,
    loading,
    error,
    refresh: fetchTemplates,
    createTemplate,
    updateTemplate,
    archiveTemplate,
    deleteTemplate,
  };
}
