import React, { useState } from 'react';
import { LandingNavbar } from '../components/LandingNavbar';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { EcosystemSection } from '../components/EcosystemSection';
import { ContentShowcaseSection } from '../components/ContentShowcaseSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { AudienceSection } from '../components/AudienceSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { FinalCTASection } from '../components/FinalCTASection';
import { LandingFooter } from '../components/LandingFooter';
import { LandingModals } from '../components/LandingModals';

interface NexoraLandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: (role?: 'partner' | 'advertiser') => void;
}

export const NexoraLandingPage: React.FC<NexoraLandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToSignUp,
}) => {
  const [activeModal, setActiveModal] = useState<'video' | 'partner' | 'advertiser' | 'product' | 'details' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const handleOpenProduct = (productName: string) => {
    setSelectedProduct(productName);
    setActiveModal('product');
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white font-sans selection:bg-[#22D3EE]/30 selection:text-white">
      
      {/* 1. Official Sticky Navbar */}
      <LandingNavbar
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToSignUp={onNavigateToSignUp}
        onOpenPartnerModal={() => setActiveModal('partner')}
        onOpenAdvertiserModal={() => setActiveModal('advertiser')}
      />

      {/* 2. Hero Section — Video Frame Scrubbed by Scroll */}
      <HeroSection
        onOpenPartnerModal={() => setActiveModal('partner')}
        onOpenAdvertiserModal={() => setActiveModal('advertiser')}
        onOpenVideoModal={() => setActiveModal('video')}
      />

      {/* 3. Marketplace #1 em Angola & WhatsApp Realtime Features */}
      <FeaturesSection
        onOpenPartnerModal={() => setActiveModal('partner')}
        onOpenAdvertiserModal={() => setActiveModal('advertiser')}
      />

      {/* 4. Nexora Ecosystem Section */}
      <EcosystemSection onOpenProductModal={handleOpenProduct} />

      {/* 5. Content Showcase Section */}
      <ContentShowcaseSection onOpenContentExamplesModal={() => setActiveModal('details')} />

      {/* 6. How It Works Section */}
      <HowItWorksSection onOpenDetailsModal={() => setActiveModal('details')} />

      {/* 7. Audience Section (Parceiros & Anunciantes) */}
      <AudienceSection
        onOpenPartnerModal={() => setActiveModal('partner')}
        onOpenAdvertiserModal={() => setActiveModal('advertiser')}
      />

      {/* 8. Testimonials Section */}
      <TestimonialsSection onOpenTestimonialsModal={() => setActiveModal('details')} />

      {/* 9. Final Conversion CTA Section */}
      <FinalCTASection
        onOpenPartnerModal={() => setActiveModal('partner')}
        onOpenAdvertiserModal={() => setActiveModal('advertiser')}
      />

      {/* 10. Premium Footer */}
      <LandingFooter
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToSignUp={onNavigateToSignUp}
      />

      {/* 11. Interactive Modals */}
      <LandingModals
        activeModal={activeModal}
        selectedProduct={selectedProduct}
        onClose={() => setActiveModal(null)}
        onNavigateToSignUp={onNavigateToSignUp}
      />

    </div>
  );
};
