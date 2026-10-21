import { ISignatureProvider, SignatureStatus } from '../types/contracts';
import { contractPartyRepository } from '../repositories/contractPartyRepository';
import { contractRepository } from '../repositories/contractRepository';
import { contractEventRepository } from '../repositories/contractEventRepository';

/**
 * Mock Digital Signature Provider
 * Prepared for future integration with Autentika / DocuSign / Adobe Sign / Angolan Digital Signature legal frameworks
 */
export class MockSignatureProvider implements ISignatureProvider {
  async requestSignature(
    contractId: string,
    partyIds: string[]
  ): Promise<{ success: boolean; trackingId: string; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 40));

    const trackingId = `NX-SIG-${Math.floor(100000 + Math.random() * 900000)}`;

    for (const partyId of partyIds) {
      await contractPartyRepository.update(partyId, {
        signatureStatus: 'PENDING',
        signatureTrackingId: trackingId,
      });
    }

    await contractRepository.updateStatus(
      contractId,
      'PENDING_SIGNATURE',
      'Provedor de Assinatura Digital',
      `Convite de assinatura digital disparado para ${partyIds.length} partes. ID: ${trackingId}`
    );

    return {
      success: true,
      trackingId,
      message: `Solicitação de assinatura enviada com sucesso para ${partyIds.length} signatários.`,
    };
  }

  async getSignatureStatus(
    contractId: string
  ): Promise<{
    contractId: string;
    status: SignatureStatus;
    parties: { partyId: string; status: SignatureStatus; signedAt?: string }[];
  }> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const parties = await contractPartyRepository.getByContractId(contractId);

    const partyStatuses = parties.map((p) => ({
      partyId: p.id,
      status: p.signatureStatus,
      signedAt: p.signedAt,
    }));

    const allSigned = parties.length > 0 && parties.every((p) => p.signatureStatus === 'SIGNED');
    const hasDeclined = parties.some((p) => p.signatureStatus === 'DECLINED');

    let overallStatus: SignatureStatus = 'PENDING';
    if (allSigned) overallStatus = 'SIGNED';
    else if (hasDeclined) overallStatus = 'DECLINED';
    else if (parties.length === 0) overallStatus = 'NOT_REQUIRED';

    return {
      contractId,
      status: overallStatus,
      parties: partyStatuses,
    };
  }

  async cancelSignatureRequest(
    contractId: string
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const parties = await contractPartyRepository.getByContractId(contractId);
    for (const p of parties) {
      if (p.signatureStatus === 'PENDING') {
        await contractPartyRepository.update(p.id, {
          signatureStatus: 'NOT_REQUIRED',
        });
      }
    }

    await contractEventRepository.logEvent(
      contractId,
      'UPDATED',
      'Solicitação de assinatura digital cancelada pelo operador.',
      'Provedor de Assinatura'
    );

    return {
      success: true,
      message: 'Solicitação de assinatura cancelada com sucesso.',
    };
  }

  async simulateSign(
    contractId: string,
    partyId: string
  ): Promise<{ success: boolean; message: string; signedAt: string }> {
    await new Promise((resolve) => setTimeout(resolve, 40));

    const signedAt = new Date().toISOString();
    const party = await contractPartyRepository.getById(partyId);

    if (!party) {
      throw new Error(`Party with id ${partyId} not found`);
    }

    await contractPartyRepository.updateSignatureStatus(
      partyId,
      'SIGNED',
      signedAt,
      '197.234.12.99'
    );

    await contractEventRepository.logEvent(
      contractId,
      'SIGNED',
      `Assinatura eletrônica confirmada por ${party.representativeName} (${party.legalName}).`,
      party.representativeName
    );

    // Check if all parties signed
    const allParties = await contractPartyRepository.getByContractId(contractId);
    const requiredParties = allParties.filter((p) => p.signatureStatus !== 'NOT_REQUIRED');
    const allDone = requiredParties.length > 0 && requiredParties.every((p) => p.signatureStatus === 'SIGNED');

    if (allDone) {
      await contractRepository.updateStatus(
        contractId,
        'SIGNED',
        'Sistema Nexora Core',
        'Todas as partes signatárias concluíram a assinatura digital.'
      );
    } else {
      await contractRepository.updateStatus(
        contractId,
        'PARTIALLY_SIGNED',
        'Sistema Nexora Core',
        `Assinatura registrada para ${party.legalName}. Aguardando demais outorgantes.`
      );
    }

    return {
      success: true,
      message: `Assinatura de ${party.representativeName} registrada com sucesso.`,
      signedAt,
    };
  }
}

export const signatureProvider = new MockSignatureProvider();
