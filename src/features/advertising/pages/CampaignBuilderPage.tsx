import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import {
  Sparkles, ChevronRight, ChevronLeft, CheckCircle2,
  Megaphone, Target, Image as ImageIcon, Video, Monitor,
  CalendarClock, DollarSign, Rocket, Upload, Trash2, Plus,
  ListVideo, Check
} from 'lucide-react';
import { advertisingCampaignRepository } from '../../../repositories/advertisingCampaignRepository';
import { useToast } from '../../../components/ui/Toast';
import { getApiUrl } from '../../../config/api';

const STEPS = [
  { id: 1, label: 'Informacoes', icon: Megaphone },
  { id: 2, label: 'Objetivo', icon: Target },
  { id: 3, label: 'Criativos', icon: ImageIcon },
  { id: 4, label: 'Displays', icon: Monitor },
  { id: 5, label: 'Programacao', icon: CalendarClock },
  { id: 6, label: 'Orcamento', icon: DollarSign },
  { id: 7, label: 'Revisao', icon: CheckCircle2 },
  { id: 8, label: 'Publicacao', icon: Rocket },
];

const OBJECTIVES = [
  { id: 'BRAND_AWARENESS', label: 'Reconhecimento de Marca', desc: 'Aumentar visibilidade da sua marca' },
  { id: 'PROMOTION', label: 'Promocao / Oferta', desc: 'Divulgar descontos e promocoes especiais' },
  { id: 'PRODUCT_LAUNCH', label: 'Lancamento de Produto', desc: 'Apresentar novo produto ou servico' },
  { id: 'EVENT', label: 'Evento', desc: 'Promover um evento especifico' },
  { id: 'STORE_TRAFFIC', label: 'Trafego na Loja', desc: 'Atrair clientes para o estabelecimento' },
  { id: 'INFORMATION', label: 'Informacao', desc: 'Comunicar informacoes importantes' },
];

export function CampaignBuilderPage({ onBack, onSave }: { onBack: () => void; onSave: (campaign: any) => void }) {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [displays, setDisplays] = useState<any[]>([]);
  const [campaign, setCampaign] = useState<any>({
    name: '',
    description: '',
    objective: 'BRAND_AWARENESS',
    creatives: [],
    displays: [],
    schedule: { startTime: '08:00', endTime: '22:00', daysOfWeek: ['MON','TUE','WED','THU','FRI'] },
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    dailyFrequency: 6,
    slotDurationSeconds: 15,
  });

  // Load real displays from API
  useEffect(() => {
    fetch('/api/displays')
      .then(r => r.json())
      .then(data => setDisplays(data))
      .catch(() => {});
  }, []);

  const update = (field: string, value: any) => setCampaign((prev: any) => ({ ...prev, [field]: value }));

  const nextStep = () => setStep(s => Math.min(s + 1, 8));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleUploadCreative = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Upload directly to SeaweedFS Storage
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch(getApiUrl('/api/storage/upload'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: reader.result,
              fileName: file.name,
              folder: 'campanhas',
              mimeType: file.type || 'application/octet-stream',
            }),
          });
          const json = await res.json();
          if (json.success && json.url) {
            const isVideo = file.type.startsWith('video');
            update('creatives', [...campaign.creatives, {
              url: json.url, type: isVideo ? 'video' : 'image', name: file.name,
            }]);
            addToast({ type: 'success', title: 'Criativo gravado no SeaweedFS com sucesso!' });
          } else {
            throw new Error(json.error || 'Falha no storage');
          }
        } catch (err: any) {
          addToast({ type: 'error', title: 'Erro ao fazer upload para o SeaweedFS' });
        }
      };
      reader.readAsDataURL(file);
    } catch {
      addToast({ type: 'error', title: 'Erro ao ler arquivo de mídia' });
    }
  };

  const toggleDisplay = (id: string) => {
    const cur: string[] = campaign.displays;
    update('displays', cur.includes(id) ? cur.filter((d: string) => d !== id) : [...cur, id]);
  };

  const handleSave = async (asDraft = false) => {
    if (!campaign.name.trim()) {
      addToast({ type: 'error', title: 'Informe o nome da campanha' });
      return;
    }
    setIsSaving(true);
    try {
      const created = await advertisingCampaignRepository.create({
        name: campaign.name,
        description: campaign.description,
        objective: campaign.objective,
        status: asDraft ? 'DRAFT' : 'PENDING_REVIEW',
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        budget: campaign.budget,
        dailyFrequency: campaign.dailyFrequency,
        slotDurationSeconds: campaign.slotDurationSeconds,
        estimatedImpressions: campaign.displays.length * campaign.dailyFrequency * 30 * 1000,
        estimatedReach: campaign.displays.length * campaign.dailyFrequency * 20 * 1000,
        creatives: campaign.creatives,
        displays: campaign.displays,
        schedule: campaign.schedule,
      } as any);
      setSavedId(created.id);
      addToast({ type: 'success', title: asDraft ? 'Campanha guardada como rascunho!' : 'Campanha enviada para aprovacao!' });
      onSave(created);
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao guardar campanha' });
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return campaign.name.trim().length > 0;
    if (step === 3) return campaign.creatives.length > 0;
    if (step === 6) return campaign.budget > 0;
    return true;
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-[#0B132B] border border-[#1E293B] hover:border-slate-600 text-slate-300 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Nova Campanha Publicitaria</h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure os detalhes, criativos, displays e programacao</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Steps */}
        <div className="w-52 shrink-0 hidden md:block">
          <div className="sticky top-6 space-y-1">
            {STEPS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => id <= step && setStep(id)}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors text-left
                  ${step === id ? 'bg-blue-600/15 text-blue-400 border border-blue-600/20' :
                    step > id ? 'text-emerald-400' : 'text-gray-600'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0
                  ${step === id ? 'bg-blue-600 text-white' :
                    step > id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}
                >
                  {step > id ? <Check className="w-3.5 h-3.5" /> : id}
                </div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden">
            {/* Step header */}
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">{STEPS[step - 1]?.label}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Passo {step} de {STEPS.length}</p>
              </div>
              <div className="flex gap-1">
                {STEPS.map(({ id }) => (
                  <div key={id} className={`h-1 w-8 rounded-full transition-colors ${id <= step ? 'bg-blue-600' : 'bg-[#1E293B]'}`} />
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* STEP 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Nome da Campanha *</label>
                    <Input
                      value={campaign.name}
                      onChange={e => update('name', e.target.value)}
                      placeholder="Ex: Promocao de Verao 2026"
                      className="bg-[#1E293B] border-[#334155] text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Descricao</label>
                    <Textarea
                      value={campaign.description}
                      onChange={e => update('description', e.target.value)}
                      placeholder="Descreva o proposito e contexto da campanha..."
                      className="bg-[#1E293B] border-[#334155] text-white placeholder:text-slate-500 h-24"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Data Inicio</label>
                      <input type="date" value={campaign.startDate}
                        onChange={e => update('startDate', e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Data Fim</label>
                      <input type="date" value={campaign.endDate}
                        onChange={e => update('endDate', e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Objective */}
              {step === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {OBJECTIVES.map(obj => (
                    <button key={obj.id} onClick={() => update('objective', obj.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        campaign.objective === obj.id
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-[#1E293B] bg-[#0B132B] hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      {campaign.objective === obj.id && <Check className="w-4 h-4 text-blue-400 mb-2" />}
                      <h4 className="font-medium text-sm mb-1">{obj.label}</h4>
                      <p className="text-xs text-slate-500">{obj.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* STEP 3: Creatives */}
              {step === 3 && (
                <div className="space-y-5">
                  <label className="block border-2 border-dashed border-[#334155] rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUploadCreative} />
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                    <p className="text-sm font-medium text-slate-300">Clique ou arraste um ficheiro</p>
                    <p className="text-xs text-slate-500 mt-1">Imagens (JPG, PNG, GIF) ou Videos (MP4) até 32MB</p>
                  </label>

                  {campaign.creatives.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-400">{campaign.creatives.length} criativo(s) adicionado(s)</h4>
                      {campaign.creatives.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-[#0B132B] rounded-lg border border-[#1E293B]">
                          {c.type === 'image'
                            ? <img src={c.url} alt={c.name} className="w-16 h-12 object-cover rounded" />
                            : <div className="w-16 h-12 bg-[#1E293B] rounded flex items-center justify-center"><Video className="w-5 h-5 text-slate-400" /></div>
                          }
                          <div className="flex-1 truncate">
                            <p className="text-sm text-white truncate">{c.name}</p>
                            <span className="text-xs text-slate-500 uppercase">{c.type}</span>
                          </div>
                          <button onClick={() => update('creatives', campaign.creatives.filter((_: any, j: number) => j !== i))}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Displays */}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">Selecione os ecras onde esta campanha sera exibida:</p>
                  {displays.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Monitor className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum display disponivel</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {displays.map((d: any) => {
                        const sel = campaign.displays.includes(d.id);
                        return (
                          <button key={d.id} onClick={() => toggleDisplay(d.id)}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              sel ? 'border-blue-500 bg-blue-500/10' : 'border-[#1E293B] bg-[#0B132B] hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Monitor className={`w-4 h-4 ${sel ? 'text-blue-400' : 'text-slate-500'}`} />
                              {sel && <Check className="w-4 h-4 text-blue-400" />}
                            </div>
                            <p className="text-sm font-medium text-white">{d.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{d.location || d.status || ''}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {campaign.displays.length > 0 && (
                    <p className="text-xs text-blue-400">{campaign.displays.length} display(s) selecionado(s)</p>
                  )}
                </div>
              )}

              {/* STEP 5: Schedule */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Hora de Inicio</label>
                      <input type="time" value={campaign.schedule.startTime}
                        onChange={e => update('schedule', { ...campaign.schedule, startTime: e.target.value })}
                        className="w-full bg-[#1E293B] border border-[#334155] text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Hora de Fim</label>
                      <input type="time" value={campaign.schedule.endTime}
                        onChange={e => update('schedule', { ...campaign.schedule, endTime: e.target.value })}
                        className="w-full bg-[#1E293B] border border-[#334155] text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Dias da Semana</label>
                    <div className="flex gap-2 flex-wrap">
                      {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => {
                        const labels: Record<string,string> = { MON:'Seg', TUE:'Ter', WED:'Qua', THU:'Qui', FRI:'Sex', SAT:'Sab', SUN:'Dom' };
                        const sel = campaign.schedule.daysOfWeek.includes(day);
                        return (
                          <button key={day} onClick={() => {
                            const days: string[] = campaign.schedule.daysOfWeek;
                            update('schedule', { ...campaign.schedule, daysOfWeek: sel ? days.filter(d => d !== day) : [...days, day] });
                          }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              sel ? 'bg-blue-600 text-white' : 'bg-[#1E293B] text-slate-400 hover:bg-[#334155]'
                            }`}
                          >
                            {labels[day]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Frequencia Diaria (vezes/dia)</label>
                      <input type="number" min={1} max={100} value={campaign.dailyFrequency}
                        onChange={e => update('dailyFrequency', parseInt(e.target.value) || 1)}
                        className="w-full bg-[#1E293B] border border-[#334155] text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Duracao do Slot (segundos)</label>
                      <input type="number" min={5} max={300} value={campaign.slotDurationSeconds}
                        onChange={e => update('slotDurationSeconds', parseInt(e.target.value) || 15)}
                        className="w-full bg-[#1E293B] border border-[#334155] text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Budget */}
              {step === 6 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Orcamento Total (AOA) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">Kz</span>
                      <input type="number" min={0} value={campaign.budget}
                        onChange={e => update('budget', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1E293B] border border-[#334155] text-white rounded-lg px-3 py-2 pl-10 text-sm" />
                    </div>
                  </div>
                  <div className="bg-[#0B132B] border border-[#1E293B] rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Estimativas da Campanha</h4>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400 font-mono">
                          {(campaign.displays.length * campaign.dailyFrequency * 30).toLocaleString('pt-AO')}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Reproducoes estimadas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-400 font-mono">
                          {(campaign.displays.length * campaign.dailyFrequency * 20).toLocaleString('pt-AO')}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Alcance estimado</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Review */}
              {step === 7 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: 'Nome', value: campaign.name },
                      { label: 'Objetivo', value: campaign.objective.replace('_', ' ') },
                      { label: 'Periodo', value: `${campaign.startDate} → ${campaign.endDate}` },
                      { label: 'Horario', value: `${campaign.schedule.startTime} - ${campaign.schedule.endTime}` },
                      { label: 'Criativos', value: `${campaign.creatives.length} ficheiro(s)` },
                      { label: 'Displays', value: `${campaign.displays.length} ecra(s) selecionado(s)` },
                      { label: 'Frequencia', value: `${campaign.dailyFrequency}x por dia` },
                      { label: 'Orcamento', value: `Kz ${campaign.budget.toLocaleString('pt-AO')}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#0B132B] rounded-lg p-3 border border-[#1E293B]">
                        <p className="text-xs text-slate-500 mb-1">{label}</p>
                        <p className="text-white font-medium">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving}
                      className="flex-1 border-slate-600 text-slate-300">
                      Guardar como Rascunho
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 8: Publish */}
              {step === 8 && (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  {savedId ? (
                    <>
                      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Campanha Enviada!</h3>
                      <p className="text-slate-400 max-w-md mb-2">
                        A campanha foi guardada e enviada para revisao. ID: <span className="font-mono text-blue-400">{savedId}</span>
                      </p>
                      <Button onClick={onBack} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                        Voltar as Campanhas
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 border border-blue-600/30">
                        <Rocket className="w-10 h-10 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Pronto para Publicar!</h3>
                      <p className="text-slate-400 max-w-md mb-8">
                        A campanha sera enviada para aprovacao e publicada nos displays selecionados assim que aprovada.
                      </p>
                      <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full max-w-xs"
                        onClick={() => handleSave(false)}
                        disabled={isSaving}
                      >
                        {isSaving ? 'A enviar...' : 'Enviar para Aprovacao'}
                        {!isSaving && <ChevronRight className="w-4 h-4 ml-2" />}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            {step < 8 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-[#1E293B]">
                <Button variant="outline" onClick={prevStep} disabled={step === 1}
                  className="border-slate-600 text-slate-300 hover:bg-[#1E293B]">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  {step === 7 ? 'Confirmar e Publicar' : 'Proximo'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}