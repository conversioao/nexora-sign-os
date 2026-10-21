import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Play, Pause, Square, AlertCircle, FastForward } from 'lucide-react';
import { advertisingCampaignRepository } from '../../../repositories/advertisingCampaignRepository';
import { deliveryService } from '../../../services/deliveryService';
import { playbackTrackingService } from '../../../services/playbackTrackingService';
import { AdvertisingCampaign } from '../../../types/advertising';

export function CampaignSimulatorPage() {
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    advertisingCampaignRepository.getAll({}).then(setCampaigns);
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      deliveryService.getDeliveryStatus(selectedCampaign).then(setStatus);
    } else {
      setStatus('');
    }
  }, [selectedCampaign]);

  const log = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const handleAction = async (action: 'publish' | 'pause' | 'resume' | 'stop') => {
    if (!selectedCampaign) return;
    try {
      let success = false;
      if (action === 'publish') success = await deliveryService.publishCampaign(selectedCampaign);
      if (action === 'pause') success = await deliveryService.pauseCampaign(selectedCampaign);
      if (action === 'resume') success = await deliveryService.resumeCampaign(selectedCampaign);
      if (action === 'stop') success = await deliveryService.stopCampaign(selectedCampaign);
      
      if (success) {
        log(`Action ${action} successful on ${selectedCampaign}`);
        deliveryService.getDeliveryStatus(selectedCampaign).then(setStatus);
      }
    } catch (e: any) {
      log(`Error: ${e.message}`);
    }
  };

  const simulatePlaybacks = async (count: number) => {
    if (!selectedCampaign) return;
    log(`Simulating ${count} playbacks...`);
    
    for(let i=0; i<count; i++) {
      await playbackTrackingService.recordPlayback({
        campaignId: selectedCampaign,
        displayId: `sim_display_${Math.floor(Math.random() * 5)}`,
        creativeId: `sim_creative_${Math.floor(Math.random() * 2)}`,
        duration: 15,
        completed: Math.random() > 0.05, // 95% completion rate
        source: 'MOCK',
        startedAt: new Date().toISOString()
      });
    }
    
    log(`Successfully simulated ${count} playbacks.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Simulator (Mock)"
        description="Developer tool to simulate campaign lifecycle and playback events."
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <Card className="border-[#1E293B] bg-[#0F172A]">
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Campaign</label>
                <select 
                  value={selectedCampaign} 
                  onChange={e => setSelectedCampaign(e.target.value)}
                  className="w-full bg-[#1E293B] border-gray-700"
                >
                  <option value="">Select a campaign...</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                  ))}
                </select>
              </div>

              {selectedCampaign && (
                <div className="pt-4 border-t border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Delivery Status:</span>
                    <Badge variant="outline">{status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <Button variant="outline" size="sm" onClick={() => handleAction('publish')} className="border-green-500/30 text-green-400 hover:bg-green-500/10">Publish</Button>
                    <Button variant="outline" size="sm" onClick={() => handleAction('pause')} className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">Pause</Button>
                    <Button variant="outline" size="sm" onClick={() => handleAction('resume')} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">Resume</Button>
                    <Button variant="outline" size="sm" onClick={() => handleAction('stop')} className="border-red-500/30 text-red-400 hover:bg-red-500/10">Stop</Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-400">Simulate Traffic</h4>
                    <Button className="w-full bg-[#1E293B] hover:bg-gray-800" onClick={() => simulatePlaybacks(1)}>
                      <Play className="w-4 h-4 mr-2 text-blue-400" />
                      1 Playback
                    </Button>
                    <Button className="w-full bg-[#1E293B] hover:bg-gray-800" onClick={() => simulatePlaybacks(100)}>
                      <FastForward className="w-4 h-4 mr-2 text-purple-400" />
                      100 Playbacks
                    </Button>
                    <Button className="w-full bg-[#1E293B] hover:bg-gray-800" onClick={() => simulatePlaybacks(1000)}>
                      <FastForward className="w-4 h-4 mr-2 text-purple-400" />
                      1000 Playbacks
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2">
          <Card className="border-[#1E293B] bg-[#0F172A] h-full flex flex-col">
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="bg-black/50 border border-gray-800 rounded-lg p-4 font-mono text-sm h-full min-h-[400px] overflow-y-auto">
                {logs.length === 0 ? (
                  <span className="text-gray-600">Waiting for events...</span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="text-gray-400 py-0.5 border-b border-gray-900/50 last:border-0">{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
