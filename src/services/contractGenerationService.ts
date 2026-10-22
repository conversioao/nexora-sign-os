import {
  ContractContext,
  ContractDocument,
  ContractSection,
  ContractTemplate,
  IContractGenerator,
} from '../types/contracts';

/**
 * Format currency in AOA
 */
function formatAOA(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDatePT(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-AO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Mock Contract Generator Engine with variable interpolation
 * Structured for seamless replacement with AI Generator in future
 */
export class MockContractGenerator implements IContractGenerator {
  async generate(context: ContractContext, template?: ContractTemplate): Promise<ContractDocument> {
    await new Promise((resolve) => setTimeout(resolve, 60)); // simulate compilation/generation

    const org = context.organization || {};
    const customer = context.customer || {};
    const advertiser = context.advertiser || {};
    const effectiveEntity = customer.legalName ? customer : advertiser.legalName ? advertiser : org;

    const companyName =
      effectiveEntity.legalName || org.legalName || org.name || 'Entidade Contratante Lda.';
    const tradeName =
      effectiveEntity.tradeName || org.tradeName || org.name || companyName;
    const nif = effectiveEntity.nif || org.nif || '5400000000';
    const address =
      effectiveEntity.address || org.address || 'Província de Luanda, República de Angola';
    const representativeName =
      effectiveEntity.representativeName ||
      customer.primaryContact?.name ||
      'Representante Legal';
    const representativeRole =
      effectiveEntity.representativeRole ||
      customer.primaryContact?.role ||
      'Diretor Geral';

    const startDateFormatted = formatDatePT(context.dates?.startDate || new Date().toISOString());
    const endDateFormatted = formatDatePT(
      context.dates?.endDate ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    );

    const totalAmountKz = context.prices?.total || 0;
    const totalAmountFormatted = formatAOA(totalAmountKz);

    const planName = context.plan?.name || context.subscription?.planName || 'Nexora Cloud Pro';
    const displayName =
      context.display?.name ||
      (context.displays && context.displays.length > 0
        ? context.displays.map((d: any) => d.name).join(', ')
        : 'Displays Alocados');

    const variablesMap: Record<string, string> = {
      company_name: companyName,
      trade_name: tradeName,
      nif: nif,
      address: address,
      representative_name: representativeName,
      representative_role: representativeRole,
      start_date: startDateFormatted,
      end_date: endDateFormatted,
      total_amount: totalAmountFormatted,
      plan_name: planName,
      display_name: displayName,
      display_serial: context.display?.code || 'NEX-DS-AUTOGEN',
      subscription_price: formatAOA(context.plan?.basePrice || context.subscription?.price || 0),
      ...(context.customVariables || {}),
    };

    // If template is provided with sections, perform variable replacement
    if (template && template.sections && template.sections.length > 0) {
      const compiledSections: ContractSection[] = template.sections.map((sec) => {
        let content = sec.content;
        for (const [key, value] of Object.entries(variablesMap)) {
          const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
          content = content.replace(pattern, value);
        }
        return {
          id: `sec-${sec.id}`,
          title: sec.title,
          content,
          order: sec.order,
        };
      });

      return {
        contractId: context.customVariables?.contractId || `con-${Date.now().toString(36)}`,
        title: `CONTRATO — ${template.name.toUpperCase()}`,
        generatedAt: new Date().toISOString(),
        version: template.version || '1.0',
        headerMetadata: {
          contractNumber: context.customVariables?.contractNumber || 'NEX-CON-PREVIEW',
          templateCode: template.code,
          organizationName: tradeName,
          nif: nif,
          effectiveDate: startDateFormatted,
          expiryDate: endDateFormatted,
          totalAmountKz: totalAmountKz,
        },
        sections: compiledSections,
      };
    }

    // Default fallback structured clauses if no template is specified
    const itemsList =
      context.items && context.items.length > 0
        ? context.items
            .map(
              (item, idx) =>
                `• **Item ${idx + 1}:** ${item.quantity}x ${item.description} — Preço: ${formatAOA(
                  item.total
                )}`
            )
            .join('\n')
        : `• **Item 1:** Licenciamento e Operação de Software Nexora Signage Cloud — Total: ${totalAmountFormatted}`;

    const defaultSections: ContractSection[] = [
      {
        id: 'sec-def-1',
        title: '1. QUALIFICAÇÃO DAS PARTES CONTRATANTES',
        order: 1,
        content: `Pelo presente instrumento particular, celebram entre si:\n\n**PRIMEIRA OUTORGANTE:** NEXORA DIGITAL SIGNAGE TECHNOLOGIES LDA., com sede em Luanda, NIF 5417892341, representada pelo seu Diretor Executivo;\n\n**SEGUNDA OUTORGANTE:** **${companyName}** (${tradeName}), com sede em ${address}, titular do NIF ${nif}, representada neste ato por **${representativeName}** (${representativeRole}).`,
      },
      {
        id: 'sec-def-2',
        title: '2. OBJETO DO CONTRATO E ATIVOS DISCRIMINADOS',
        order: 2,
        content: `O presente instrumento tem por escopo a contratação de infraestrutura de Digital Signage, locação de hardware e serviços de software conforme especificado no rol a seguir:\n\n${itemsList}`,
      },
      {
        id: 'sec-def-3',
        title: '3. PRAZO DE VIGÊNCIA',
        order: 3,
        content: `O contrato terá vigência de **${startDateFormatted}** a **${endDateFormatted}**, prorrogando-se automaticamente mediante acordo prévio entre as partes.`,
      },
      {
        id: 'sec-def-4',
        title: '4. VALOR, CONDIÇÕES DE FATURAÇÃO E IMPOSTOS',
        order: 4,
        content: `O valor global do presente acordo é fixado em **${totalAmountFormatted}**, sujeito à retenção de IVA (14%) em conformidade com o Código Geral Tributário da República de Angola.`,
      },
      {
        id: 'sec-def-5',
        title: '5. CONFIDENCIALIDADE E PROTEÇÃO DE DADOS',
        order: 5,
        content: `As partes obrigam-se a manter sigilo absoluto sobre todas as informações comerciais, planos de expansão, dados de tráfego de audiência e credenciais tecnológicas obtidas no decorrer da prestação.`,
      },
      {
        id: 'sec-def-6',
        title: '6. FORO DA COMARCA DE LUANDA',
        order: 6,
        content: `Fica eleito o foro da Comarca de Luanda para dirimir quaisquer dúvidas oriundas deste contrato, renunciando a qualquer outro por mais privilegiado que seja.`,
      },
    ];

    return {
      contractId: context.customVariables?.contractId || `con-${Date.now().toString(36)}`,
      title: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS E FORNECIMENTO TECNOLÓGICO',
      generatedAt: new Date().toISOString(),
      version: '1.0',
      headerMetadata: {
        contractNumber: context.customVariables?.contractNumber || 'NEX-CON-PREVIEW',
        organizationName: tradeName,
        nif: nif,
        effectiveDate: startDateFormatted,
        expiryDate: endDateFormatted,
        totalAmountKz: totalAmountKz,
      },
      sections: defaultSections,
    };
  }
}

export const contractGenerator = new MockContractGenerator();
