import React, { useState } from 'react';
import {
  Palette,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Mail,
  Send,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { tokens } from '../../theme/tokens';
import { PageHeader } from '../../components/layout/PageHeader';
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Badge,
  Avatar,
  StatusIndicator,
  Tooltip,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Modal,
  Dropdown,
  Tabs,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  Progress,
  Skeleton,
  EmptyState,
  ErrorState,
  LoadingState,
  Logo,
  useToast
} from '../../components/ui';

export const DesignSystemShowcase: React.FC<{ onBackToDashboard: () => void }> = ({
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState('tokens');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [progressVal, setProgressVal] = useState(68);

  const { success, error, warning, info } = useToast();

  const brandSwatches = [
    { name: 'Azul (Tecnologia & Confiança)', hex: '#2563EB', role: 'Ação Principal / Primária', bg: 'bg-[#2563EB]' },
    { name: 'Roxo (Inovação & Criatividade)', hex: '#7C3AED', role: 'IA, Recursos Criativos', bg: 'bg-[#7C3AED]' },
    { name: 'Cíano (Conexão & Modernidade)', hex: '#06B6D4', role: 'Telemetria, Movimento', bg: 'bg-[#06B6D4]' },
    { name: 'Magenta (Energia & Destaque)', hex: '#EC4899', role: 'Notificações, Alertas', bg: 'bg-[#EC4899]' },
    { name: 'Azul Escuro (Força & Profissionalismo)', hex: '#0F172A', role: 'Superfícies, AppShell', bg: 'bg-[#0F172A]' },
    { name: 'Cinza Claro (Equilíbrio & Neutralidade)', hex: '#F8FAFC', role: 'Tipografia Primária', bg: 'bg-[#F8FAFC]', textDark: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Nexora Design System & Tokens Showcase"
        description="Catálogo de validação visual dos 22+ componentes fundamentais, tokens e identidade gráfica da Nexora."
        breadcrumbs={[
          { label: 'Nexora' },
          { label: 'Design Tokens', active: true },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={onBackToDashboard}>
            Voltar ao Dashboard
          </Button>
        }
      />

      {/* Showcase Sub-tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'tokens', label: 'Cores & Tokens da Marca', icon: <Palette className="w-3.5 h-3.5" /> },
          { id: 'buttons-inputs', label: 'Botões & Formulários', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
          { id: 'feedback-badges', label: 'Badges, Toasts & Indicadores', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'surfaces-states', label: 'Superfícies, Tabelas & Estados', icon: <Layers className="w-3.5 h-3.5" /> },
        ]}
      />

      {/* TAB 1: TOKENS & IDENTIDADE */}
      {activeTab === 'tokens' && (
        <div className="space-y-8">
          {/* Logo Showcase Section */}
          <Card>
            <CardHeader>
              <CardTitle>Identidade Visual & Logotipo Nexora</CardTitle>
              <CardDescription>
                Aplicações oficiais do símbolo 'N' (Conexão + Movimento) e tipografia display Exo 2.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl bg-[#070B14] border border-white/10">
                <div className="flex flex-col items-center justify-center p-6 border border-white/5 rounded-xl gap-3">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Versão Completa com Slogan</span>
                  <Logo size="lg" variant="full" showSubtitle />
                </div>
                <div className="flex flex-col items-center justify-center p-6 border border-white/5 rounded-xl gap-3">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Versão Compacta</span>
                  <Logo size="md" variant="compact" />
                </div>
                <div className="flex flex-col items-center justify-center p-6 border border-white/5 rounded-xl gap-3">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Ícone / App Device</span>
                  <Logo size="lg" variant="iconOnly" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Tokens Swatches */}
          <Card>
            <CardHeader>
              <CardTitle>Paleta Oficial de Cores</CardTitle>
              <CardDescription>
                Tokens mapeados estritamente do manual de marca da Nexora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {brandSwatches.map((color) => (
                  <div
                    key={color.hex}
                    className="p-4 rounded-xl bg-[#0B1120] border border-white/10 flex items-center gap-4"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl shadow-md flex-shrink-0 ${color.bg} border border-white/20`}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-white">{color.name}</span>
                      <span className="font-mono text-[11px] text-[#06B6D4] font-bold">{color.hex}</span>
                      <span className="text-[10px] text-[#64748B]">{color.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Typography Tokens */}
          <Card>
            <CardHeader>
              <CardTitle>Tipografia do Design System</CardTitle>
              <CardDescription>
                Exo 2 (Headings/Display) & Plus Jakarta Sans (Interface/Body) & JetBrains Mono (Dados/Telemetria).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0B1120] border border-white/5 space-y-2">
                <span className="text-[10px] text-[#06B6D4] uppercase font-mono">Display Scale — Exo 2 Bold</span>
                <p className="font-display text-2xl font-bold text-white tracking-tight">
                  TECNOLOGIA QUE CONECTA NEGÓCIOS E CLIENTES
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#0B1120] border border-white/5 space-y-2">
                <span className="text-[10px] text-[#2563EB] uppercase font-mono">Body Scale — Plus Jakarta Sans Regular / Medium</span>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  A plataforma Nexora gerencia a distribuição inteligente de conteúdos multimídia para displays de alta definição em centros comerciais, edifícios corporativos e terminais urbanos de Luanda.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: BUTTONS & FORM INPUTS */}
      {activeTab === 'buttons-inputs' && (
        <div className="space-y-8">
          {/* Buttons Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Botões & Ações</CardTitle>
              <CardDescription>
                Variantes: Primary, Secondary, Outline, Ghost, Danger, Cyan, Magenta e estados Loading/Disabled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="cyan">Cyan Accent</Button>
                <Button variant="magenta">Magenta Promo</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost Action</Button>
                <Button variant="danger">Danger</Button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
                <Button variant="primary" size="sm">Small (sm)</Button>
                <Button variant="primary" size="md">Medium (md)</Button>
                <Button variant="primary" size="lg">Large (lg)</Button>
                <Button variant="primary" isLoading>Carregando</Button>
                <Button variant="primary" disabled>Desabilitado</Button>
                <IconButton icon={<Send className="w-4 h-4" />} label="Enviar" variant="primary" />
                <IconButton icon={<Eye className="w-4 h-4" />} label="Visualizar" variant="secondary" />
              </div>
            </CardContent>
          </Card>

          {/* Form Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Controles de Formulário</CardTitle>
              <CardDescription>
                Campos com label, ícones de apoio, máscaras, estados de erro e validação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nome do Display / Painel"
                  placeholder="Ex: Shopping Avennida 4K"
                  leftIcon={<Search className="w-4 h-4" />}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="Código de inventário no padrão NX-MUNICÍPIO-XXX."
                />

                <Input
                  label="Email de Contato do Anunciante"
                  placeholder="marketing@unitel.co.ao"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error="Formato de e-mail corporativo requerido."
                />

                <Select
                  label="Município / Praça de Veiculação"
                  options={[
                    { value: 'TLT', label: 'Talatona (Luanda Sul)' },
                    { value: 'MTB', label: 'Mutamba (Centro Financeiro)' },
                    { value: 'KLM', label: 'Kilamba (Zona Residencial)' },
                    { value: 'MAI', label: 'Maianga (Bairro Nobre)' },
                    { value: 'VIA', label: 'Viana (Terminal de Cargas)' },
                  ]}
                />

                <div className="flex flex-col gap-4 justify-center">
                  <Switch
                    label="Reprodução 24/7 Ativada"
                    description="Habilita looping ininterrupto da grade de anúncios."
                    checked={switchChecked}
                    onChange={setSwitchChecked}
                  />

                  <Checkbox
                    label="Notificar equipe técnica sobre quedas de sinal"
                    description="Dispara alertas prioritários via SMS / Push."
                    checked={checkboxChecked}
                    onChange={(e) => setCheckboxChecked(e.target.checked)}
                  />
                </div>
              </div>

              <Textarea
                label="Observações Técnicas de Instalação"
                placeholder="Detalhes sobre ponto de energia, cabeamento ethernet e suporte estrutural..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: FEEDBACK, BADGES, TOASTS & INDICATORS */}
      {activeTab === 'feedback-badges' && (
        <div className="space-y-8">
          {/* Status Badges & Hardware Indicators (Full 13-state Digital Signage language) */}
          <Card>
            <CardHeader>
              <CardTitle>Linguagem de Estados & Telemetria (13 Estados Oficiais)</CardTitle>
              <CardDescription>
                Sistema semântico completo com ícone, cor, indicador pulsante e texto para monitoramento de Digital Signage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Badges Matrix */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-3">
                  Pills & Badges com Ícones de Apoio:
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant="online" icon dot>Online</Badge>
                  <Badge variant="syncing" icon dot>Sincronizando</Badge>
                  <Badge variant="playing" icon dot>Em Exibição</Badge>
                  <Badge variant="active" icon dot>Ativo</Badge>
                  <Badge variant="scheduled" icon>Programado</Badge>
                  <Badge variant="paused" icon>Pausado</Badge>
                  <Badge variant="maintenance" icon dot>Manutenção</Badge>
                  <Badge variant="warning" icon dot>Alerta</Badge>
                  <Badge variant="error" icon dot>Erro Crítico</Badge>
                  <Badge variant="offline" icon>Offline</Badge>
                  <Badge variant="pending" icon dot>Pendente</Badge>
                  <Badge variant="draft" icon>Rascunho</Badge>
                  <Badge variant="inactive" icon>Inativo</Badge>
                </div>
              </div>

              {/* StatusIndicator Telemetry Row */}
              <div className="pt-4 border-t border-white/5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-3">
                  Indicadores de Hardware / Telemetria em Tempo Real:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0B1120] border border-white/5">
                  <StatusIndicator status="online" label="Online (Luanda-01)" showIcon />
                  <StatusIndicator status="syncing" label="Download Grade 4K" showIcon />
                  <StatusIndicator status="playing" label="Spot Unitel 30s" showIcon />
                  <StatusIndicator status="active" label="Campanha Ativa" showIcon />
                  <StatusIndicator status="scheduled" label="Entrada às 18h" showIcon />
                  <StatusIndicator status="paused" label="Grade Pausada" showIcon />
                  <StatusIndicator status="maintenance" label="Reparo Técnico" showIcon />
                  <StatusIndicator status="warning" label="Aquecimento 68°C" showIcon />
                  <StatusIndicator status="error" label="Falha de HDMI" showIcon />
                  <StatusIndicator status="offline" label="Sem Conexão 4G" showIcon />
                  <StatusIndicator status="pending" label="Aguardando Aprovação" showIcon />
                  <StatusIndicator status="draft" label="Modo Rascunho" showIcon />
                </div>
              </div>

              {/* Brand Accent Badges */}
              <div className="pt-4 border-t border-white/5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-3">
                  Badges de Categoria & Destaque:
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant="blue">Tecnologia Blue</Badge>
                  <Badge variant="purple">Nexora IA Studio</Badge>
                  <Badge variant="cyan">Telemetria Cyan</Badge>
                  <Badge variant="magenta">Prioridade Máxima</Badge>
                  <Badge variant="neutral">Neutro / Standard</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Toast Notification Triggers */}
          <Card>
            <CardHeader>
              <CardTitle>Sistema Global de Notificações (Toast)</CardTitle>
              <CardDescription>
                Alertas automáticos para telemetria, erros e confirmações de ações.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => success('Campanha Aprovada', 'A veiculação começará às 08:00 em Talatona.')}
              >
                Disparar Sucesso
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => error('Queda de Hardware', 'Display NX-VIA-005 perdeu conexão com a central.')}
              >
                Disparar Erro
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => warning('Grade Quase Cheia', 'Ocupação do Shopping Avennida atingiu 94%.')}
              >
                Disparar Aviso
              </Button>
              <Button
                variant="cyan"
                size="sm"
                onClick={() => info('Novo Display Registrado', 'Display adicionado com resolução 4K UHD.')}
              >
                Disparar Informação
              </Button>
            </CardContent>
          </Card>

          {/* Modal / Dialog Trigger */}
          <Card>
            <CardHeader>
              <CardTitle>Modal / Diálogo Acessível</CardTitle>
              <CardDescription>
                Componente de sobreposição com backdrop blur, foco acessível e tecla ESC.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Abrir Modal de Demonstração
              </Button>

              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Cadastrar Novo Display Digital"
                description="Adicione um ponto de mídia à grade de Digital Signage da Nexora."
                footer={
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setIsModalOpen(false);
                        success('Display Cadastrado', 'Novo painel adicionado com sucesso à grade.');
                      }}
                    >
                      Salvar Display
                    </Button>
                  </>
                }
              >
                <div className="space-y-4 text-left">
                  <Input label="Nome do Local" placeholder="Ex: Belas Shopping — Praça Sul" />
                  <Select
                    label="Orientação da Tela"
                    options={[
                      { value: 'LANDSCAPE', label: 'Horizontal (16:9 - 3840x2160)' },
                      { value: 'PORTRAIT', label: 'Vertical (9:16 - 2160x3840)' },
                    ]}
                  />
                  <p className="text-xs text-[#94A3B8]">
                    O display receberá automaticamente o certificado de heartbeat para sincronização com o player da Nexora.
                  </p>
                </div>
              </Modal>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: SURFACES, TABLES & SYSTEM STATES */}
      {activeTab === 'surfaces-states' && (
        <div className="space-y-8">
          {/* Data Table & Pagination Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Dados & Paginação</CardTitle>
              <CardDescription>
                Componente de alta densidade para gestão de inventário de telas, contratos e campanhas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operador / Responsável</TableHead>
                    <TableHead>Ponto de Exibição</TableHead>
                    <TableHead>Resolução</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name="Mário Silva" status="online" size="sm" />
                        <div>
                          <span className="font-semibold text-white block text-xs">Mário Silva</span>
                          <span className="text-[10px] text-[#64748B]">Técnico Sênior</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-display font-medium text-white text-xs block">Shopping Fortaleza — Entrada</span>
                      <span className="font-mono text-[10px] text-[#06B6D4]">NX-LUA-001</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#94A3B8]">4K UHD (3840x2160)</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="online" icon dot size="sm">Online</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Detalhes</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name="Ana Paula" status="busy" size="sm" />
                        <div>
                          <span className="font-semibold text-white block text-xs">Ana Paula</span>
                          <span className="text-[10px] text-[#64748B]">Gestora de Mídia</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-display font-medium text-white text-xs block">Aeroporto 4 de Fevereiro — Desembarque</span>
                      <span className="font-mono text-[10px] text-[#06B6D4]">NX-AER-003</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#94A3B8]">Full HD (1080x1920)</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="syncing" icon dot size="sm">Sincronizando</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Detalhes</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name="Carlos Gomes" status="offline" size="sm" />
                        <div>
                          <span className="font-semibold text-white block text-xs">Carlos Gomes</span>
                          <span className="text-[10px] text-[#64748B]">Suporte de Campo</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-display font-medium text-white text-xs block">Talatona Shopping — Praça de Alimentação</span>
                      <span className="font-mono text-[10px] text-[#06B6D4]">NX-TLT-008</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#94A3B8]">4K UHD (3840x2160)</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="maintenance" icon dot size="sm">Manutenção</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">Detalhes</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Pagination
                currentPage={currentPage}
                totalPages={5}
                onPageChange={setCurrentPage}
                pageSize={3}
                totalItems={15}
              />
            </CardContent>
          </Card>

          {/* Progress & Skeletons */}
          <Card>
            <CardHeader>
              <CardTitle>Barras de Progresso & Skeletons</CardTitle>
              <CardDescription>
                Indicadores dinâmicos para carregamento e sincronização de dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Progress value={progressVal} showLabel variant="gradient" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProgressVal(Math.max(progressVal - 15, 0))}
                  >
                    -15%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProgressVal(Math.min(progressVal + 15, 100))}
                  >
                    +15%
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-2">
                <span className="text-[11px] font-semibold text-[#94A3B8]">Skeleton Loading States:</span>
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                  <Skeleton height={40} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System States Matrix (Empty, Error, Loading) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EmptyState
              title="Sem Conteúdos na Fila"
              description="Nenhum vídeo programado para este display."
              actionLabel="Criar Playlist"
              onAction={() => info('Ação', 'Abrindo criador de playlists.')}
            />

            <ErrorState
              title="Falha na Sincronização"
              message="Não foi possível obter o handshake do player Android."
              onRetry={() => success('Tentativa de reconexão enviada')}
            />

            <div className="bg-[#0B1120]/40 border border-white/10 rounded-2xl flex items-center justify-center p-6">
              <LoadingState label="Sincronizando grade Luanda 4K..." />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
