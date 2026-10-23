import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '../../components/ui';
import { Construction, Sparkles, ArrowLeft, Layers } from 'lucide-react';
import { UserRole } from '../../types/navigation';

export interface PlaceholderModuleProps {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  expectedFeatures: string[];
  currentRole: UserRole;
  onBackToDashboard: () => void;
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({
  title,
  description,
  icon,
  expectedFeatures,
  currentRole,
  onBackToDashboard,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={title}
        description={description}
        badge={
          <Badge variant="purple" dot>
            Fase de Fundação Concluída
          </Badge>
        }
        breadcrumbs={[
          { label: 'Nexora' },
          { label: title, active: true },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={onBackToDashboard}
          >
            Voltar à Visão Geral
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30">
                {icon || <Layers className="w-5 h-5" />}
              </div>
              <div>
                <CardTitle>Módulo Arquitetural Preparado</CardTitle>
                <CardDescription>
                  Este módulo está mapeado no sistema de navegação e tipagem, pronto para receber a lógica na próxima etapa.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] font-display mb-3">
                Funcionalidades previstas para este módulo:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {expectedFeatures.map((feat, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-[#0B1120] border border-white/5 flex items-start gap-2.5 text-xs text-[#F8FAFC]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] mt-1.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-[#2563EB]/10 via-[#06B6D4]/10 to-transparent border border-white/10 text-xs text-[#94A3B8] flex items-center justify-between">
              <span>
                Permissão ativa: <strong className="text-white">{currentRole}</strong>
              </span>
              <span className="text-[11px] font-mono text-[#06B6D4]">Service / Repository Layer Ready</span>
            </div>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card glow="none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="w-4 h-4 text-[#F59E0B]" />
              Diretriz da Etapa 1
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-[#94A3B8] leading-relaxed">
            <p>
              Conforme solicitado, esta primeira etapa estabelece exclusivamente a fundação sólida, Design System, Tokens, AppShell, Repositories e componentes base.
            </p>
            <p>
              Nenhum dado é hardcoded na UI: a camada de repositórios mockados (<code className="text-[#06B6D4] font-mono">src/repositories/</code>) permite conectar Supabase ou APIs reais futuramente sem retrabalho.
            </p>
            <Button variant="cyan" size="sm" className="w-full mt-2" onClick={onBackToDashboard}>
              Explorar Visão Geral & Telemetria
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
