import { useState, useEffect, useCallback } from 'react';
import {
  Contract,
  ContractDocument,
  ContractEvent,
  ContractItem,
  ContractParty,
  ContractTemplate,
} from '../../../types/contracts';
import { contractService } from '../../../services/contractService';
import { useAuth } from '../../../context/AuthContext';

export function useContractDetail(contractId?: string) {
  const { user } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [items, setItems] = useState<ContractItem[]>([]);
  const [parties, setParties] = useState<ContractParty[]>([]);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [document, setDocument] = useState<ContractDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await contractService.getContractFullDetails(contractId);
      if (!data) {
        setError('Contrato não encontrado');
        return;
      }
      setContract(data.contract);
      setItems(data.items);
      setParties(data.parties);
      setEvents(data.events);
      setTemplate(data.template);
      setDocument(data.document);
    } catch (err: any) {
      console.error('Error fetching contract details:', err);
      setError(err.message || 'Erro ao carregar detalhes do contrato');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Workflow actions
  const submitForApproval = async () => {
    if (!contractId) return;
    try {
      setActionLoading(true);
      await contractService.submitForApproval(
        contractId,
        user?.name || 'Operador Nexora'
      );
      await fetchDetails();
    } finally {
      setActionLoading(false);
    }
  };

  const approveContract = async () => {
    if (!contractId) return;
    try {
      setActionLoading(true);
      await contractService.approveContract(
        contractId,
        user?.name || 'Diretoria Nexora'
      );
      await fetchDetails();
    } finally {
      setActionLoading(false);
    }
  };

  const requestSignature = async (partyIds?: string[]) => {
    if (!contractId) return;
    try {
      setActionLoading(true);
      await contractService.requestDigitalSignature(contractId, partyIds);
      await fetchDetails();
    } finally {
      setActionLoading(false);
    }
  };

  const simulateSign = async (partyId: string) => {
    if (!contractId) return;
    try {
      setActionLoading(true);
      await contractService.simulateSignature(contractId, partyId);
      await fetchDetails();
    } finally {
      setActionLoading(false);
    }
  };

  const activateContract = async () => {
    if (!contractId) return;
    try {
      setActionLoading(true);
      await contractService.activateContract(
        contractId,
        user?.name || 'Administrador Nexora'
      );
      await fetchDetails();
    } finally {
      setActionLoading(false);
    }
  };

  const cancelContract = async (reason: string) => {
    if (!contractId) return;
    try {
      setActionLoading(true);
      await contractService.cancelContract(
        contractId,
        reason,
        user?.name || 'Administrador Nexora'
      );
      await fetchDetails();
    } finally {
      setActionLoading(false);
    }
  };

  const generateDocument = async () => {
    if (!contractId) return;
    try {
      setActionLoading(true);
      const newDoc = await contractService.generateDocument(contractId);
      setDocument(newDoc);
      await fetchDetails();
    } finally {
      setActionLoading(false);
    }
  };

  const duplicateContract = async () => {
    if (!contractId) return null;
    try {
      setActionLoading(true);
      const copy = await contractService.duplicateContract(
        contractId,
        user?.name || 'Administrador Nexora'
      );
      return copy;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    contract,
    items,
    parties,
    events,
    template,
    document,
    loading,
    actionLoading,
    error,
    refresh: fetchDetails,
    submitForApproval,
    approveContract,
    requestSignature,
    simulateSign,
    activateContract,
    cancelContract,
    generateDocument,
    duplicateContract,
  };
}
