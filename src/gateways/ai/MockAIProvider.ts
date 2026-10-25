import { AIGenerationType, IAIProvider } from '../../types/studio';

export function getNicheSampleImage(styleId?: string, promptText?: string, isVertical = true): string {
  const p = (promptText || '').toLowerCase();
  const s = (styleId || '').toLowerCase();

  if (s.includes('fashion') || s.includes('moda') || p.includes('roupa') || p.includes('vestido') || p.includes('camisa') || p.includes('tênis') || p.includes('calçado') || p.includes('streetwear') || p.includes('fashion')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1080' // High fashion street style
      : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1920';
  }

  if (s.includes('beauty') || s.includes('beleza') || p.includes('cosmético') || p.includes('perfume') || p.includes('skincare') || p.includes('maquiagem')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1080' // Beauty skincare perfume
      : 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1920';
  }

  if (s.includes('beverage') || s.includes('bebida') || p.includes('suco') || p.includes('cerveja') || p.includes('refrigerante') || p.includes('drink') || p.includes('vinho')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1080' // Drink splash
      : 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1920';
  }

  if (s.includes('supermarket') || s.includes('retail') || s.includes('mercado') || p.includes('supermercado') || p.includes('oferta') || p.includes('preço') || p.includes('arroz') || p.includes('leite')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1080' // Supermarket grocery
      : 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1920';
  }

  if (s.includes('tech') || s.includes('tecnologia') || p.includes('celular') || p.includes('smartphone') || p.includes('fone') || p.includes('computador') || p.includes('gadget')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1080' // Tech headphones/phone
      : 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1920';
  }

  if (s.includes('fitness') || s.includes('suplemento') || p.includes('whey') || p.includes('academia') || p.includes('treino') || p.includes('creatina')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1080' // Fitness gym
      : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920';
  }

  if (s.includes('auto') || s.includes('carro') || p.includes('automóvel') || p.includes('veículo') || p.includes('pneu') || p.includes('oficina')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1080' // Automotive car
      : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1920';
  }

  if (s.includes('real_estate') || s.includes('imovel') || p.includes('apartamento') || p.includes('casa') || p.includes('arquitetura') || p.includes('decoração')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1080' // Real estate home
      : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1920';
  }

  if (s.includes('jewelry') || s.includes('joia') || p.includes('ouro') || p.includes('diamante') || p.includes('relógio') || p.includes('anel')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1080' // Luxury jewelry
      : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1920';
  }

  if (s.includes('ugc') || p.includes('ugc') || p.includes('review') || p.includes('criador') || p.includes('influencer')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1080' // UGC creator
      : 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1920';
  }

  if (s.includes('food') || s.includes('aliment') || p.includes('hamburguer') || p.includes('pizza') || p.includes('comida') || p.includes('lanche')) {
    return isVertical
      ? 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1080' // Food burger
      : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1920';
  }

  // Fallback genérico comercial
  return isVertical
    ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1080'
    : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1920';
}

export const AI_MODELS: IAIProvider[] = [
  {
    id: 'mock-image-v1',
    name: 'Nexora Vision Pro',
    type: 'IMAGE',
    provider: 'MockProvider',
    baseCost: 8,
    capabilities: ['16:9', '9:16', '1:1', '4:5', 'Realistic', '3D', 'Illustration'],
    status: 'ACTIVE',
  },
  {
    id: 'mock-video-v1',
    name: 'Nexora Motion Gen',
    type: 'VIDEO',
    provider: 'MockProvider',
    baseCost: 20, // per 5s
    capabilities: ['5s', '10s', '15s', '30s', 'Cinematic', 'Motion Graphics'],
    status: 'ACTIVE',
  },
  {
    id: 'mock-copy-v1',
    name: 'Nexora Writer',
    type: 'COPY',
    provider: 'MockProvider',
    baseCost: 2,
    capabilities: ['Short', 'Medium', 'Long', 'Creative', 'Direct'],
    status: 'ACTIVE',
  }
];

export class MockAIProvider implements Partial<IAIProvider> {
  async generateImage(prompt: string, parameters: Record<string, any>): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2500));
    const isVertical = parameters.aspectRatio === '9:16' || parameters.aspectRatio === '4:5' || parameters.orientation === 'VERTICAL';
    return getNicheSampleImage(parameters.styleId, prompt, isVertical);
  }

  async generateVideo(prompt: string, parameters: Record<string, any>): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 6000));
    return 'https://www.w3schools.com/html/mov_bbb.mp4';
  }

  async generateCopy(prompt: string, parameters: Record<string, any>): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return [
      `Transforme sua rotina com nosso novo lançamento! ${prompt.substring(0, 20)}...`,
      `A inovação que você esperava chegou. Experimente ${prompt.substring(0, 15)} hoje!`,
      `Descubra o poder da tecnologia ao seu favor. Aja agora!`
    ];
  }
}

export const mockAIProvider = new MockAIProvider();
