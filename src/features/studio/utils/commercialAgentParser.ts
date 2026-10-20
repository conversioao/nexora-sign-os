/**
 * NEXORA CREATIVE AI - Commercial Agent Natural Language & Shorthand Parser
 * 
 * Interpreta inteligentemente descrições informais, abreviações e parâmetros
 * fornecidos pelos utilizadores (ex: "Preço>536kzs tênis preto corrida desc 20%")
 * e transforma-os em conceitos publicitários profissionais, títulos refinados,
 * chamadas de impacto e storyboards sem deixar símbolos de sintaxe brutos.
 */

export interface ParsedCommercialBrief {
  productName: string;
  category: string;
  targetAudience: string;
  adType: string;
  keyMessage: string;
  visualDirection: string;
  suggestedFrames: number;
  totalDurationSeconds: number;
  extractedPrice: string | null;
  formattedPriceBadge: string | null;
  extractedDiscount: string | null;
  extractedPromotion: string | null;
  textOverlays: string[];
}

export function interpretCommercialDescription(
  rawInput: string,
  hasImage: boolean = false
): ParsedCommercialBrief {
  const original = (rawInput || '').trim();

  // 1. Extração Inteligente de Preço e Moeda
  let extractedPrice: string | null = null;
  let formattedPriceBadge: string | null = null;

  const priceRegexes = [
    /(?:preço|preco|valor|custo|val|p)\s*[:=>]\s*([\d.,]+\s*(?:kzs?|kz|aoa|akz|\$|usd|eur)?)/i,
    /([\d.,]+)\s*(?:kzs?|kz|aoa|akz)\b/i,
    /\b(?:kz|kzs|aoa|akz)\s*([\d.,]+)/i,
    /\$\s*([\d.,]+)/i,
  ];

  for (const regex of priceRegexes) {
    const match = original.match(regex);
    if (match && match[1]) {
      let rawVal = match[1].trim();
      const digitsOnly = rawVal.replace(/[^\d.,]/g, '');
      const isAOA = /kzs?|kz|aoa|akz/i.test(match[0]) || !rawVal.includes('$');
      
      if (digitsOnly) {
        if (isAOA) {
          extractedPrice = `${digitsOnly} Kz`;
          formattedPriceBadge = `Apenas ${digitsOnly} Kz`;
        } else {
          extractedPrice = `$${digitsOnly}`;
          formattedPriceBadge = `Apenas $${digitsOnly}`;
        }
      }
      break;
    }
  }

  // 2. Extração Inteligente de Descontos e Promoções
  let extractedDiscount: string | null = null;
  const discountMatch = original.match(/(?:desc|desconto|off|-)\s*[:=>]?\s*(\d{1,2}\s*%\s*(?:off)?)/i) ||
                        original.match(/(\d{1,2}\s*%\s*(?:de\s+desconto|off))/i);
  if (discountMatch) {
    const pct = discountMatch[1].replace(/[^\d]/g, '');
    extractedDiscount = `${pct}% de Desconto`;
  }

  let extractedPromotion: string | null = null;
  if (/leve\s*2\s*pague\s*1|compre\s*1\s*leve\s*2/i.test(original)) {
    extractedPromotion = 'Leve 2, Pague 1';
  } else if (/entrega\s*(?:gr[aá]tis|gratuita)/i.test(original)) {
    extractedPromotion = 'Entrega Grátis em Luanda';
  } else if (/promo[cç][aã]o|oferta\s*especial|black\s*friday|super\s*promo/i.test(original)) {
    extractedPromotion = 'Oferta Especial por Tempo Limitado';
  }

  // 3. Limpeza do Nome do Produto — Remove símbolos de sintaxe e operadores
  let cleanedTitle = original
    .replace(/(?:preço|preco|valor|custo|val|p)\s*[:=>]\s*[\d.,]+\s*(?:kzs?|kz|aoa|akz|\$|usd|eur)?/gi, '')
    .replace(/([\d.,]+)\s*(?:kzs?|kz|aoa|akz)\b/gi, '')
    .replace(/(?:desc|desconto|off|-)\s*[:=>]?\s*\d{1,2}\s*%\s*(?:off)?/gi, '')
    .replace(/\b\d{1,2}\s*%\s*(?:de\s+desconto|off)\b/gi, '')
    .replace(/(?:tam|tamanho|ref|cor|categoria|tipo|loja|whats|contacto|contato)\s*[:=>]\s*[\w\d]+/gi, '')
    .replace(/[>><=:#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedTitle || cleanedTitle.length < 2) {
    cleanedTitle = hasImage ? 'Produto Comercial Premium' : 'Produto em Destaque';
  }

  cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);

  // 4. Detecção de Categoria e Tom Visual
  const lowerDesc = original.toLowerCase();
  let category = 'Produto Comercial';
  let targetAudience = 'Consumidores urbanos e público de totens indoor, 18-50 anos';
  let adType = 'Spot Comercial de 10 Segundos para Totens DOOH';
  let keyMessage = '';
  let visualDirection = '';

  if (
    lowerDesc.includes('café') ||
    lowerDesc.includes('nescaf') ||
    lowerDesc.includes('bebida') ||
    lowerDesc.includes('chá') ||
    lowerDesc.includes('suco') ||
    lowerDesc.includes('refrigerante') ||
    lowerDesc.includes('leite')
  ) {
    category = 'Bebidas & Alimentação';
    targetAudience = 'Jovens e profissionais urbanos, 20-45 anos, apreciadores de sabor e energia';
    keyMessage = formattedPriceBadge 
      ? `Sabor Premium e Energia Incomparável — ${formattedPriceBadge}`
      : 'Sabor Premium — A Energia que Transforma o Teu Dia';
    visualDirection = 'Produto em destaque com vapor suave, iluminação dourada dramática e gotas de condensação fresca sobre fundo escuro de estúdio.';
  } else if (
    lowerDesc.includes('batata') ||
    lowerDesc.includes('chips') ||
    lowerDesc.includes('lay') ||
    lowerDesc.includes('snack') ||
    lowerDesc.includes('salgad') ||
    lowerDesc.includes('pipoca')
  ) {
    category = 'Snacks & Salgados';
    targetAudience = 'Jovens, famílias e amantes de aperitivos crocantes e saborosos';
    keyMessage = formattedPriceBadge
      ? `Crocância Incomparável e Sabor Irresistível — ${formattedPriceBadge}`
      : 'Crocância e Sabor Que Explodem a Cada Mordida';
    visualDirection = 'Embalagem do snack flutuando com especiarias e ingredientes suspensos no ar, explosão de sabor, iluminação quente e fundo vermelho escuro.';
  } else if (
    lowerDesc.includes('tênis') ||
    lowerDesc.includes('tenis') ||
    lowerDesc.includes('sapato') ||
    lowerDesc.includes('sapatilha') ||
    lowerDesc.includes('sneaker') ||
    lowerDesc.includes('calçado')
  ) {
    category = 'Calçados & Desporto';
    targetAudience = 'Atletas urbanos, jovens entusiastas de estilo e conforto, 16-38 anos';
    keyMessage = formattedPriceBadge
      ? `Máxima Performance e Estilo — ${formattedPriceBadge}`
      : 'Design Futurista, Leveza e Máxima Performance';
    visualDirection = 'Tênis flutuando em ângulo dinâmico com iluminação neon ciano e roxa, partículas de velocidade e reflexos luminosos de estúdio.';
  } else if (
    lowerDesc.includes('telefone') ||
    lowerDesc.includes('phone') ||
    lowerDesc.includes('smartphone') ||
    lowerDesc.includes('iphone') ||
    lowerDesc.includes('samsung') ||
    lowerDesc.includes('computador') ||
    lowerDesc.includes('fone') ||
    lowerDesc.includes('tech')
  ) {
    category = 'Tecnologia & Eletrónica';
    targetAudience = 'Público tech-savvy, executivos e jovens conectados, 18-40 anos';
    keyMessage = formattedPriceBadge
      ? `Inovação Tecnológica ao Teu Alcance — ${formattedPriceBadge}`
      : 'Inovação de Última Geração — Desempenho Sem Limites';
    visualDirection = 'Dispositivo com acabamento metálico em pedestal moderno, feixes de luz holográfica e reflexos em alta definição.';
  } else if (
    lowerDesc.includes('roupa') ||
    lowerDesc.includes('moda') ||
    lowerDesc.includes('vestido') ||
    lowerDesc.includes('camisa') ||
    lowerDesc.includes('calça') ||
    lowerDesc.includes('fashion')
  ) {
    category = 'Moda & Vestuário';
    targetAudience = 'Homens e mulheres modernos, apreciadores de elegância e tendências';
    keyMessage = formattedPriceBadge
      ? `Elegância e Sofisticação — ${formattedPriceBadge}`
      : 'Estilo Exclusivo Que Define a Tua Presença';
    visualDirection = 'Modelos negros elegantes em atmosfera de editorial de moda internacional, iluminação suave de estúdio e texturas ricas.';
  } else if (
    lowerDesc.includes('perfume') ||
    lowerDesc.includes('fragrância') ||
    lowerDesc.includes('creme') ||
    lowerDesc.includes('cosmético') ||
    lowerDesc.includes('make') ||
    lowerDesc.includes('beleza')
  ) {
    category = 'Beleza & Cosméticos';
    targetAudience = 'Consumidores de produtos de cuidado pessoal e luxo, 20-50 anos';
    keyMessage = formattedPriceBadge
      ? `Fragrância Inesquecível — ${formattedPriceBadge}`
      : 'Essência da Sofisticação — Sinta o Toque do Luxo';
    visualDirection = 'Frasco em pedestal de mármore com iluminação difusa de luxo, pétalas ou névoa aromática suave e reflexos dourados.';
  } else if (
    lowerDesc.includes('hambúrguer') ||
    lowerDesc.includes('burger') ||
    lowerDesc.includes('pizza') ||
    lowerDesc.includes('lanche') ||
    lowerDesc.includes('comida') ||
    lowerDesc.includes('restaurante')
  ) {
    category = 'Fast Food & Restaurantes';
    targetAudience = 'Famílias, jovens e apreciadores de gastronomia saborosa';
    keyMessage = formattedPriceBadge
      ? `O Melhor Sabor da Cidade — ${formattedPriceBadge}`
      : 'Irresistível, Suculento e Feito na Hora';
    visualDirection = 'Alimento em close-up macro apetitoso, queijo derretido, fumaça sutil, iluminação quente e cores vibrantes.';
  } else {
    keyMessage = formattedPriceBadge
      ? `${cleanedTitle} — Qualidade Premium por ${formattedPriceBadge}`
      : `Descubra ${cleanedTitle} — Qualidade e Excelência`;
    visualDirection = 'Produto centralizado em pedestal premium com iluminação volumétrica profissional, composição publicitária de alto impacto para totens.';
  }

  // 5. Montagem de Textos Sobrepostos Inteligentes
  const textOverlays: string[] = [
    cleanedTitle.toUpperCase(),
    keyMessage,
    formattedPriceBadge ? formattedPriceBadge.toUpperCase() : 'QUALIDADE GARANTIDA',
    'DISPONÍVEL AGORA NOS PONTOS DE VENDA',
  ];

  return {
    productName: cleanedTitle,
    category,
    targetAudience,
    adType,
    keyMessage,
    visualDirection,
    suggestedFrames: 8,
    totalDurationSeconds: 10,
    extractedPrice,
    formattedPriceBadge,
    extractedDiscount,
    extractedPromotion,
    textOverlays,
  };
}

export interface SmartStoryboardScene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  imageUrl: string;
  textOverlay: string;
  duration: string; // e.g. "1.25s" (8 frames x 1.25s = 10s)
  transition: string;
  status: 'pending' | 'generating' | 'completed';
}

/**
 * Gera 8 cenas perfeitas para um spot comercial de 10 segundos
 * (8 quadros x 1.25 segundos = 10 segundos)
 */
export function generateSmartStoryboardFrames(brief: ParsedCommercialBrief): SmartStoryboardScene[] {
  const priceText = brief.formattedPriceBadge ? brief.formattedPriceBadge.toUpperCase() : 'OFERTA ESPECIAL';
  const discountText = brief.extractedDiscount ? brief.extractedDiscount.toUpperCase() : (brief.extractedPromotion ? brief.extractedPromotion.toUpperCase() : 'QUALIDADE PREMIUM');

  return [
    {
      id: 'frame-1',
      sceneNumber: 1,
      title: 'Abertura & Packshot',
      description: `Abertura Comercial — Embalagem de "${brief.productName}" em destaque no centro com iluminação dramática.`,
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=600',
      textOverlay: brief.productName.toUpperCase(),
      duration: '1.25s',
      transition: 'fade',
      status: 'completed',
    },
    {
      id: 'frame-2',
      sceneNumber: 2,
      title: 'Macro Textura & Detalhes',
      description: `Close-up Macro — Detalhes finos e textura crocante e apetitosa do produto em ângulo inclinado.`,
      imageUrl: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?q=80&w=600',
      textOverlay: 'CROCANTE & INTENSO',
      duration: '1.25s',
      transition: 'zoom',
      status: 'completed',
    },
    {
      id: 'frame-3',
      sceneNumber: 3,
      title: 'Porção & Ingredientes',
      description: `Apresentação em Tigela — Porção generosa com especiarias e ingredientes frescos iluminados.`,
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600',
      textOverlay: 'SABOR AUTÊNTICO',
      duration: '1.25s',
      transition: 'slide',
      status: 'completed',
    },
    {
      id: 'frame-4',
      sceneNumber: 4,
      title: 'Packshot com Iluminação',
      description: `Packshot Frontal — Produto iluminado com partículas douradas e brilho quente ao redor.`,
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?q=80&w=600',
      textOverlay: brief.keyMessage,
      duration: '1.25s',
      transition: 'fade',
      status: 'completed',
    },
    {
      id: 'frame-5',
      sceneNumber: 5,
      title: 'Ação & Movimento',
      description: `Momento de Pegar — Mão retirando uma porção crocante com foco na textura.`,
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=600',
      textOverlay: discountText,
      duration: '1.25s',
      transition: 'slide',
      status: 'completed',
    },
    {
      id: 'frame-6',
      sceneNumber: 6,
      title: 'Especiarias Flutuantes',
      description: `Câmera Lenta Dinâmica — Produto e especiarias em suspensão no ar com reflexos de luz.`,
      imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=600',
      textOverlay: 'MÁXIMO IMPACTO',
      duration: '1.25s',
      transition: 'zoom',
      status: 'completed',
    },
    {
      id: 'frame-7',
      sceneNumber: 7,
      title: 'Experiência do Consumidor',
      description: `Satisfação do Consumidor — Pessoa desfrutando do sabor com expressão de prazer autêntico.`,
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600',
      textOverlay: 'IRRESISTÍVEL',
      duration: '1.25s',
      transition: 'fade',
      status: 'completed',
    },
    {
      id: 'frame-8',
      sceneNumber: 8,
      title: 'Fechamento & CTA',
      description: `Encerramento com Marca & Preço — Embalagem com logo oficial, selo de preço e slogan.`,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600',
      textOverlay: `${brief.productName.toUpperCase()} • ${priceText}`,
      duration: '1.25s',
      transition: 'fade',
      status: 'completed',
    },
  ];
}
