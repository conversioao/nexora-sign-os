import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  Film,
  Video,
  Image as ImageIcon,
  FileText,
  Filter,
  Clock,
  Sparkles,
  User,
  Calendar,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { ContentItem, ContentMediaType, ContentOrientation } from '../../../types/domain';
import { Button } from '../../../components/ui/Button';
import { ContentVisualThumbnail } from '../../content/components/ContentVisualThumbnail';
import { useSession } from '../../../context/SessionContext';

interface ContentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItems: (
    contentIds: string[],
    campaignMeta?: {
      campaignId?: string;
      clientId?: string;
      clientName?: string;
      campaignName?: string;
      duration?: number;
      startDate?: string;
      endDate?: string;
      budgetKz?: number;
    }
  ) => void;
}

export const ContentSelectorModal: React.FC<ContentSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectItems,
}) => {
  const [step, setStep] = useState<'SELECT' | 'BINDING'>('SELECT');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentMediaType | 'ALL'>('ALL');
  const [orientationFilter, setOrientationFilter] = useState<ContentOrientation | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentOrganization, currentMembership } = useSession();
  const isPartner = currentOrganization?.type === 'CLIENT' || currentMembership?.role === 'CLIENT_OWNER' || currentMembership?.role === 'CLIENT_MANAGER';
  const orgId = currentOrganization?.id;

  // Binding Form State for Admin
  const [bindingData, setBindingData] = useState({
    clientId: '',
    clientName: '',
    campaignName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    duration: 15,
    budgetKz: 150000,
  });

  useEffect(() => {
    if (isOpen) {
      setStep('SELECT');
      setSelectedIds(new Set());

      // Fetch Content Items
      const url = orgId ? `/api/content?organizationId=${encodeURIComponent(orgId)}` : '/api/content';
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            let items = data.map((d: any) => ({
              id: d.id,
              name: d.name,
              type: (d.type || 'IMAGE').toUpperCase() as any,
              status: 'READY',
              fileUrl: d.url,
              thumbnailUrl: d.url,
              duration: isPartner ? 10 : (d.duration || 15),
              fileSize: d.file_size || 5000000,
              organizationId: d.organization_id,
              code: 'CNT-' + d.id.substring(0, 5).toUpperCase(),
              mimeType: (d.type || '').toLowerCase() === 'video' ? 'video/mp4' : 'image/png',
              orientation: 'LANDSCAPE',
              tags: ['Campanha', 'Luanda'],
              createdAt: d.created_at || new Date().toISOString(),
              updatedAt: d.created_at || new Date().toISOString(),
            }));
            if (orgId) {
              items = items.filter((item: any) => item.organizationId === orgId);
            }
            setContentList(items);
          }
        })
        .catch(() => {});

      // Fetch Organizations for Client Binding
      fetch('/api/organizations')
        .then((res) => res.json())
        .then((orgs) => {
          if (Array.isArray(orgs)) {
            setOrganizations(orgs);
            if (orgs.length > 0 && !bindingData.clientId) {
              setBindingData((prev) => ({
                ...prev,
                clientId: orgs[0].id,
                clientName: orgs[0].name,
              }));
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, isPartner, orgId]);

  // Filter content items
  const filteredContents = useMemo(() => {
    return contentList.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
      if (orientationFilter !== 'ALL' && item.orientation !== orientationFilter) return false;
      return true;
    });
  }, [contentList, search, typeFilter, orientationFilter]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNextOrFinish = async () => {
    if (selectedIds.size === 0) return;

    // If partner, directly add items
    if (isPartner) {
      onSelectItems(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
      return;
    }

    // If Admin and currently selecting, move to Binding step
    if (step === 'SELECT') {
      const firstSelected = contentList.find((c) => selectedIds.has(c.id));
      setBindingData((prev) => ({
        ...prev,
        campaignName: prev.campaignName || (firstSelected ? `Campanha - ${firstSelected.name}` : 'Nova Campanha Comercial'),
        duration: firstSelected?.duration || 15,
      }));
      setStep('BINDING');
      return;
    }

    // Step BINDING: Submit Campaign to backend and link to playlist
    if (!bindingData.clientName && !bindingData.clientId) {
      alert('Por favor, selecione ou informe o cliente/anunciante.');
      return;
    }

    setIsSubmitting(true);
    try {
      const campaignId = `cmp-${Date.now()}`;
      const selectedItems = contentList.filter((c) => selectedIds.has(c.id));
      const firstMedia = selectedItems[0];

      // Save campaign to database
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaignId,
          name: bindingData.campaignName || `Campanha ${bindingData.clientName}`,
          description: `Veiculação associada à grade Nexora para o cliente ${bindingData.clientName}`,
          objective: 'BRAND_AWARENESS',
          status: 'LIVE',
          advertiser_id: bindingData.clientId || `adv-${Date.now()}`,
          advertiser_name: bindingData.clientName,
          organization_id: bindingData.clientId || 'org-publicidade',
          budget: Number(bindingData.budgetKz) || 150000,
          spent: 0,
          start_date: bindingData.startDate,
          end_date: bindingData.endDate,
          slot_duration: Number(bindingData.duration) || 15,
          media_url: firstMedia?.fileUrl || firstMedia?.thumbnailUrl || '',
          creatives: selectedItems.map((c) => ({
            id: c.id,
            contentId: c.id,
            title: c.name,
            url: c.fileUrl || c.thumbnailUrl,
            fileUrl: c.fileUrl || c.thumbnailUrl,
            type: c.type,
            duration: Number(bindingData.duration) || 15,
          })),
        }),
      });

      // Pass campaign association metadata to playlist
      onSelectItems(Array.from(selectedIds), {
        campaignId,
        clientId: bindingData.clientId,
        clientName: bindingData.clientName,
        campaignName: bindingData.campaignName,
        duration: Number(bindingData.duration) || 15,
        startDate: bindingData.startDate,
        endDate: bindingData.endDate,
        budgetKz: Number(bindingData.budgetKz) || 150000,
      });

      setSelectedIds(new Set());
      setStep('SELECT');
      onClose();
    } catch (err) {
      console.error('Erro ao vincular campanha:', err);
      alert('Ocorreu um erro ao salvar a vinculação da campanha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070B14]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#38BDF8]">
              {step === 'SELECT' ? <Film className="w-5 h-5" /> : <Briefcase className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC] font-display">
                {step === 'SELECT'
                  ? 'Selecionar Conteúdos da Biblioteca'
                  : 'Vinculação Obrigatória: Cliente, Duração & Orçamento'}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                {step === 'SELECT'
                  ? 'Escolha as mídias para compor a sequência da playlist.'
                  : 'Configure os dados da campanha para associar a mídia a um cliente específico.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: SELECT MEDIA */}
        {step === 'SELECT' && (
          <>
            {/* Filters Bar */}
            <div className="p-4 border-b border-white/5 bg-[#0F172A] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar por título, código ou tag..."
                  className="w-full h-9 pl-9 pr-3 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="h-9 px-2.5 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#94A3B8] focus:outline-none"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="VIDEO">Vídeos</option>
                  <option value="IMAGE">Imagens</option>
                </select>

                {/* Orientation Filter */}
                <select
                  value={orientationFilter}
                  onChange={(e) => setOrientationFilter(e.target.value as any)}
                  className="h-9 px-2.5 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#94A3B8] focus:outline-none"
                >
                  <option value="ALL">Todas Orientações</option>
                  <option value="LANDSCAPE">Horizontal (16:9)</option>
                  <option value="PORTRAIT">Vertical (9:16)</option>
                </select>
              </div>
            </div>

            {/* Content Items List */}
            <div className="flex-1 p-4 overflow-y-auto nexora-scrollbar space-y-2">
              {filteredContents.length === 0 ? (
                <div className="py-12 text-center text-[#64748B]">
                  <Film className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum conteúdo encontrado com os filtros atuais.</p>
                </div>
              ) : (
                filteredContents.map((content) => {
                  const isSelected = selectedIds.has(content.id);
                  return (
                    <div
                      key={content.id}
                      onClick={() => toggleSelect(content.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#2563EB]/15 border-[#2563EB] shadow-sm'
                          : 'bg-[#0F172A] border-white/5 hover:border-white/15 hover:bg-[#131D31]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-[#2563EB] text-white' : 'border border-white/20 bg-[#070B14]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>

                        {/* Thumbnail */}
                        <div className="w-14 h-11 rounded-lg flex-shrink-0 overflow-hidden">
                          <ContentVisualThumbnail content={content} showOverlayIcons={false} />
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#F8FAFC] truncate font-display">
                              {content.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#64748B]">{content.code}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B]">
                            <span>{content.resolution}</span>
                            <span>•</span>
                            <span>{content.orientation === 'PORTRAIT' ? 'Vertical' : 'Horizontal'}</span>
                            {content.duration && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[#06B6D4]">{content.duration}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(content.id);
                        }}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-white/5 hover:bg-white/10 text-[#94A3B8] border border-white/10'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{isSelected ? 'Selecionado' : 'Selecionar'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* STEP 2: ADMIN BINDING (CLIENT, DATES, DURATION, BUDGET) */}
        {step === 'BINDING' && (
          <div className="flex-1 p-6 overflow-y-auto nexora-scrollbar space-y-5 bg-[#070B18]">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                <strong>Associação de Campanha:</strong> Esta mídia será vinculada a este cliente com orçamento e datas específicas. O cliente poderá ter múltiplas campanhas, permitindo ao administrador auditar métricas e exportar relatórios individuais.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client / Advertiser */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Cliente / Anunciante Associado *
                </label>
                {organizations.length > 0 ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={bindingData.clientId}
                      onChange={(e) => {
                        const sel = organizations.find((o) => o.id === e.target.value);
                        setBindingData((prev) => ({
                          ...prev,
                          clientId: e.target.value,
                          clientName: sel ? sel.name : prev.clientName,
                        }));
                      }}
                      className="flex-1 h-9 px-3 bg-[#0F172A] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#38BDF8]"
                    >
                      <option value="">-- Selecione um Cliente Cadastrado --</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.type || 'CLIENTE'})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Ou digite o nome do cliente..."
                      value={bindingData.clientName}
                      onChange={(e) => setBindingData((prev) => ({ ...prev, clientName: e.target.value }))}
                      className="flex-1 h-9 px-3 bg-[#0F172A] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Nome da Empresa / Cliente / Anunciante"
                    value={bindingData.clientName}
                    onChange={(e) => setBindingData((prev) => ({ ...prev, clientName: e.target.value }))}
                    className="w-full h-9 px-3 bg-[#0F172A] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                )}
              </div>

              {/* Campaign Title */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  Nome da Campanha / Veiculação *
                </label>
                <input
                  type="text"
                  required
                  value={bindingData.campaignName}
                  onChange={(e) => setBindingData((prev) => ({ ...prev, campaignName: e.target.value }))}
                  placeholder="Ex: Campanha Institucional Outubro 2026"
                  className="w-full h-9 px-3 bg-[#0F172A] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Data de Início da Veiculação
                </label>
                <input
                  type="date"
                  value={bindingData.startDate}
                  onChange={(e) => setBindingData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full h-9 px-3 bg-[#0F172A] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  Data de Término da Veiculação
                </label>
                <input
                  type="date"
                  value={bindingData.endDate}
                  onChange={(e) => setBindingData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full h-9 px-3 bg-[#0F172A] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                  Duração da Mídia no Loop (segundos)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={bindingData.duration}
                  onChange={(e) => setBindingData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 15 }))}
                  className="w-full h-9 px-3 bg-[#0F172A] border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#06B6D4]"
                />
              </div>

              {/* Budget in Kwanzas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Orçamento Contratado (Kz)
                </label>
                <input
                  type="number"
                  step={10000}
                  min={0}
                  value={bindingData.budgetKz}
                  onChange={(e) => setBindingData((prev) => ({ ...prev, budgetKz: parseFloat(e.target.value) || 0 }))}
                  className="w-full h-9 px-3 bg-[#0F172A] border border-white/10 rounded-xl text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#070B14] flex items-center justify-between">
          <div className="text-xs text-[#94A3B8]">
            <span className="font-semibold text-white font-mono">{selectedIds.size}</span> mídias selecionadas
          </div>

          <div className="flex items-center gap-2">
            {step === 'BINDING' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('SELECT')}
                className="flex items-center gap-1 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              disabled={selectedIds.size === 0 || isSubmitting}
              onClick={handleNextOrFinish}
              className="flex items-center gap-1.5 font-semibold text-xs"
            >
              {isSubmitting ? (
                <span>Gravando Vinculação...</span>
              ) : step === 'SELECT' && !isPartner ? (
                <>
                  <span>Configurar Vinculação & Cliente</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar & Adicionar à Playlist ({selectedIds.size})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
