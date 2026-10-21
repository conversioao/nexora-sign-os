import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Download, FileText, Share2, MapPin, Film, Tv, BarChart2, Sparkles } from 'lucide-react';
import { campaignAnalyticsService } from '../../../services/campaignAnalyticsService';
import { advertisingCampaignRepository } from '../../../repositories/advertisingCampaignRepository';
import { AdvertisingCampaign } from '../../../types/advertising';

export function CampaignReportPage({ campaignId, onBack }: { campaignId: string, onBack: () => void }) {
  const [campaign, setCampaign] = useState<AdvertisingCampaign | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [geoData, setGeoData] = useState<any[]>([]);
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [creativeData, setCreativeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: any = null;

    const loadData = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const camp = await advertisingCampaignRepository.getById(campaignId);
        setCampaign(camp || null);

        const realReport = await campaignAnalyticsService.getRealtimeReport(campaignId);
        if (realReport) {
          setAnalytics(realReport);
          setGeoData(realReport.geographicPerformance || []);
          setDisplayData(realReport.displayBreakdown || []);
          setCreativeData(realReport.creativePerformance || []);
        } else {
          const [overview, geo, disp, crea] = await Promise.all([
            campaignAnalyticsService.getCampaignOverview(campaignId),
            campaignAnalyticsService.getGeographicPerformance(campaignId),
            campaignAnalyticsService.getDisplayPerformance(campaignId),
            campaignAnalyticsService.getCreativePerformance(campaignId)
          ]);
          setAnalytics(overview);
          setGeoData(geo);
          setDisplayData(disp);
          setCreativeData(crea);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    loadData(true);
    interval = setInterval(() => loadData(false), 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0284C7] border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-6 text-white">Campaign not found</div>;
  }

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(val) + ' Kz';
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!campaign) return;
    const rows = [
      ['RELATORIO DE DESEMPENHO DE CAMPANHA - NEXORA OS'],
      ['Campanha', campaign.name],
      ['ID', campaign.id],
      ['Anunciante', campaign.advertiserName || ''],
      ['Data Inicio', campaign.startDate || ''],
      ['Data Termino', campaign.endDate || ''],
      ['Status', campaign.status || ''],
      ['Orcamento Contratado (Kz)', campaign.budget || '0'],
      [''],
      ['METRICAS CONSOLIDADAS'],
      ['Total de Insercoes (Proof of Play)', analytics?.totalPlays || 0],
      ['Alcance Estimado de Publico', (analytics?.totalPlays || 0) * 18],
      ['Total de Impressoes Projetadas', (analytics?.totalPlays || 0) * 25],
      ['Displays Impactados', analytics?.uniqueDisplays || 0],
      ['Taxa de Conclusao', `${(Number(analytics?.completionRate) || 100).toFixed(1)}%`],
      [''],
      ['DETALHAMENTO GEOGRAFICO'],
      ['Regiao', 'Insercoes', 'Alcance'],
      ...geoData.map((g) => [g.region || 'Luanda', g.plays || 0, g.estimatedReach || 0]),
      [''],
      ['DISPLAYS VINCULADOS'],
      ['Display', 'Insercoes', 'Tempo de Exibicao'],
      ...displayData.map((d) => [d.displayName || d.displayId || 'Display', d.plays || 0, `${d.playTime || 0}s`]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio-campanha-${campaign.name.toLowerCase().replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" onClick={onBack} className="border-gray-700 text-gray-300">
          Voltar para Campanha
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch('/api/ai/campaign-report', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ campaignId }),
                });
                if (res.ok) {
                  const data = await res.json();
                  alert(`🤖 Análise Executiva do Auditor Agent (GPT-4o-mini):\n\n${data.report}`);
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Parecer IA (GPT-4o-mini)
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="border-gray-700 text-gray-300 hover:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF / Imprimir
          </Button>
        </div>
      </div>

      <div className="bg-[#0F172A] border border-gray-800 rounded-2xl p-8 shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-800 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Relatório de Desempenho</h1>
            <p className="text-gray-400 mt-2">{campaign.name}</p>
            <div className="flex gap-4 mt-4 text-sm text-gray-500">
              <span><strong>Anunciante:</strong> {campaign.advertiserName}</span>
              <span><strong>Período:</strong> {campaign.startDate} a {campaign.endDate}</span>
              <span><strong>Status:</strong> {campaign.status}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-blue-400 mb-1">
              {(analytics?.totalPlays || 0).toLocaleString('pt-AO')}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Total de Inserções</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-xs font-semibold mb-1 uppercase">Duração Total</div>
              <div className="text-xl font-bold text-white">{(analytics?.totalDuration || 0).toLocaleString('pt-AO')}s</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-xs font-semibold mb-1 uppercase">Taxa de Conclusão</div>
              <div className="text-xl font-bold text-emerald-400">{(Number(analytics?.completionRate) || 0).toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-xs font-semibold mb-1 uppercase">Displays Únicos</div>
              <div className="text-xl font-bold text-white">{analytics?.uniqueDisplays || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E293B] border-gray-700">
            <CardContent className="p-4">
              <div className="text-gray-400 text-xs font-semibold mb-1 uppercase">Investimento</div>
              <div className="text-xl font-bold text-purple-400">{formatKz(analytics?.spent || 0)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-transparent border-gray-800">
            <CardHeader className="pb-3 border-b border-gray-800">
              <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400" />
                Desempenho por Região
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-800 bg-[#1E293B]/50">
                    <th className="py-3 px-4 font-medium">Região</th>
                    <th className="py-3 px-4 font-medium">Inserções</th>
                    <th className="py-3 px-4 font-medium">Alcance Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {geoData.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-center text-gray-500 text-xs">Sem dados telemétricos registados</td></tr>
                  ) : (
                    geoData.map((geo, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-[#1E293B]/30">
                        <td className="py-3 px-4 text-gray-300 font-medium">{geo.region}</td>
                        <td className="py-3 px-4 text-gray-400">{(geo.plays || 0).toLocaleString('pt-AO')}</td>
                        <td className="py-3 px-4 text-gray-400">{(geo.estimatedReach || 0).toLocaleString('pt-AO')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-gray-800">
            <CardHeader className="pb-3 border-b border-gray-800">
              <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                Desempenho por Criativo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-800 bg-[#1E293B]/50">
                    <th className="py-3 px-4 font-medium">Criativo ID</th>
                    <th className="py-3 px-4 font-medium">Inserções</th>
                    <th className="py-3 px-4 font-medium">Conclusão</th>
                  </tr>
                </thead>
                <tbody>
                  {creativeData.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-center text-gray-500 text-xs">Sem dados de criativos registados</td></tr>
                  ) : (
                    creativeData.map((c, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-[#1E293B]/30">
                        <td className="py-3 px-4 text-gray-300 font-medium truncate max-w-[150px]">{c.title || c.creativeId}</td>
                        <td className="py-3 px-4 text-gray-400">{(c.plays || 0).toLocaleString('pt-AO')}</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">{(Number(c.completionRate) || 100).toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Displays Detailed Breakdown */}
        <Card className="bg-transparent border-gray-800">
          <CardHeader className="pb-3 border-b border-gray-800">
            <CardTitle className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              Inserções em Tempo Real por Display / Local
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800 bg-[#1E293B]/50">
                  <th className="py-3 px-4 font-medium">Display / Localização</th>
                  <th className="py-3 px-4 font-medium">Inserções Reais</th>
                  <th className="py-3 px-4 font-medium">Tempo de Exibição</th>
                  <th className="py-3 px-4 font-medium">Último Play</th>
                </tr>
              </thead>
              <tbody>
                {displayData.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500 text-xs">Nenhum display registou exibição ainda para esta campanha.</td></tr>
                ) : (
                  displayData.map((disp, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-[#1E293B]/30">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-200">{disp.displayName || disp.displayId}</div>
                        <div className="text-xs text-gray-500">{disp.location}</div>
                      </td>
                      <td className="py-3 px-4 text-cyan-400 font-bold font-mono">{(disp.plays || 0).toLocaleString('pt-AO')}x</td>
                      <td className="py-3 px-4 text-gray-300 font-mono">{disp.duration || 0}s</td>
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {disp.lastPlayedAt ? new Date(disp.lastPlayedAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recente'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
