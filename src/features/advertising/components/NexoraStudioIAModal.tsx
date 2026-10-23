import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Tabs, TabItem } from '../../../components/ui/Tabs';
import { Sparkles, Image as ImageIcon, Video, Loader2, Coins } from 'lucide-react';
import { imageGenerationProvider, videoGenerationProvider, AIUsageService } from '../../../services/aiUsageService';

export function NexoraStudioIAModal({ isOpen, onClose, onGenerate }: { isOpen: boolean, onClose: () => void, onGenerate: (url: string, type: string) => void }) {
  const [activeTab, setActiveTab] = useState('image');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (isOpen) {
      AIUsageService.getBalance().then(setCredits);
    }
  }, [isOpen]);

  const cost = activeTab === 'image' ? AIUsageService.getCostForImage() : AIUsageService.getCostForVideo();

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    
    const canConsume = await AIUsageService.consumeCredits(cost);
    if (!canConsume) {
      alert('Créditos insuficientes!');
      setIsGenerating(false);
      return;
    }

    setCredits(await AIUsageService.getBalance());

    try {
      let result = '';
      if (activeTab === 'image') {
        result = await imageGenerationProvider.generateImage(prompt, {});
      } else {
        result = await videoGenerationProvider.generateVideo(prompt, {});
      }
      
      onGenerate(result, activeTab.toUpperCase());
    } catch (e) {
      console.error(e);
      alert('Falha na geração');
    } finally {
      setIsGenerating(false);
      setCredits(await AIUsageService.getBalance());
      onClose();
    }
  };

  const tabs: TabItem[] = [
    { id: 'image', label: 'Imagem IA', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'video', label: 'Vídeo / Motion IA', icon: <Video className="w-4 h-4" /> }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>Nexora Studio - Geração por IA</span>
        </div>
      }
      size="xl"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Saldo Disponível:</span>
          </div>
          <span className="text-lg font-bold text-purple-400">{credits.toLocaleString()} créditos</span>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'image' && (
          <div className="space-y-4">
            <Textarea
              label="Prompt (Descrição da Imagem)"
              placeholder="Descreva detalhadamente a imagem que deseja gerar..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Estilo Visual"
                options={[
                  { value: 'realistic', label: 'Fotorealista / Hyper-realista' },
                  { value: '3d', label: 'Render 3D / Pixar' },
                  { value: 'illustration', label: 'Ilustração Digital' }
                ]}
                value="realistic"
                onChange={() => {}}
              />
              <Select
                label="Proporção"
                options={[
                  { value: '16:9', label: '16:9 (Displays Horizontais)' },
                  { value: '9:16', label: '9:16 (Totens Verticais)' }
                ]}
                value="16:9"
                onChange={() => {}}
              />
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="space-y-4">
            <Textarea
              label="Prompt (Descrição da Animação)"
              placeholder="Descreva o movimento, transições e elementos da cena..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Estilo de Animação"
                options={[
                  { value: 'cinematic', label: 'Cinemático' },
                  { value: 'motion-graphics', label: 'Motion Graphics 2D' }
                ]}
                value="cinematic"
                onChange={() => {}}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancelar</Button>
          <Button 
            variant="primary" 
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Gerar Ativo (-{cost} créditos)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
