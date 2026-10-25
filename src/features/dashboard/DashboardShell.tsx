import React from 'react';
import { useSession } from '../../context/SessionContext';
import { Organization, Membership, Permission } from '../../types/auth';
import { AdminDashboardView } from './views/AdminDashboardView';
import { ClientDashboardView } from './views/ClientDashboardView';
import { AdvertiserDashboardView } from './views/AdvertiserDashboardView';
import { TechnicianDashboardView } from './views/TechnicianDashboardView';
import { DisplayOwnerDashboardView } from './views/DisplayOwnerDashboardView';
import { AffiliateDashboardView } from '../affiliates/views/AffiliateDashboardView';

export type DashboardExperienceType = 'ADMIN' | 'CLIENT' | 'ADVERTISER' | 'TECHNICIAN' | 'DISPLAY_OWNER' | 'AFFILIATE';

/**
 * Centralized resolution of the contextual dashboard experience.
 * Avoids scattered if(role === '...') checks across the application.
 */
export function resolveDashboardExperience(
  organization: Organization | null,
  membership: Membership | null,
  permissions: Permission[]
): DashboardExperienceType {
  // If organization or role is AFFILIATE
  if (organization?.type === 'AFFILIATE' || membership?.role === 'AFFILIATE') {
    return 'AFFILIATE';
  }

  // If user has the explicit TECHNICIAN role or is in a tech partner context
  if (membership?.role === 'TECHNICIAN') {
    return 'TECHNICIAN';
  }

  // If organization is the internal platform operator (Nexora Internal)
  if (organization?.type === 'NEXORA' || (organization?.type as string) === 'INTERNAL') {
    return 'ADMIN';
  }

  // If organization is a Display Owner (Client who bought the display)
  if (organization?.type === 'DISPLAY_OWNER' || membership?.role === 'DISPLAY_OWNER') {
    return 'DISPLAY_OWNER';
  }

  // If organization is an Advertiser
  if (organization?.type === 'ADVERTISER') {
    return 'ADVERTISER';
  }

  // If organization is a Client (Store, Shopping, Restaurant, etc. - Space Partner)
  if (organization?.type === 'CLIENT') {
    return 'CLIENT';
  }

  // Role-based fallback if org type is ambiguous
  if (membership?.role === 'NEXORA_ADMIN' || membership?.role === 'NEXORA_OPERATOR') {
    return 'ADMIN';
  }

  return 'CLIENT';
}

export interface DashboardShellProps {
  onOpenShowcase?: () => void;
  onNavigateToDisplay?: (displayId: string) => void;
  onNavigateToDisplaysList?: () => void;
  onNavigateToContent?: () => void;
  onNavigateToPlaylist?: () => void;
  onNavigateToSchedule?: () => void;
  onNavigateToScheduleDetail?: (id: string) => void;
  onNavigateToClients?: () => void;
  onNavigateToAdvertisers?: () => void;
  onNavigateToCampaigns?: () => void;
  onNavigateToNewCampaign?: () => void;
  onNavigateToCampaignDetail?: (id: string) => void;
  onNavigateToAICredits?: () => void;
  onNavigateToStudioAI?: () => void;
  onNavigateToContracts?: () => void;
  onNavigateToBilling?: () => void;
  onNavigateToAlerts?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToOfflineDisplays?: () => void;
  onNavigateToDiagnostics?: (displayId?: string) => void;
  onNavigateToReferrals?: () => void;
  onNavigateToCommissions?: () => void;
  onNavigateToLinks?: () => void;
  onNavigateToPayouts?: () => void;
}

export const DashboardShell: React.FC<DashboardShellProps> = (props) => {
  const { currentOrganization, currentMembership, permissions } = useSession();

  const experience = resolveDashboardExperience(
    currentOrganization,
    currentMembership,
    permissions
  );

  switch (experience) {
    case 'AFFILIATE':
      return (
        <AffiliateDashboardView
          onNavigateToReferrals={props.onNavigateToReferrals}
          onNavigateToCommissions={props.onNavigateToCommissions}
          onNavigateToLinks={props.onNavigateToLinks}
          onNavigateToPayouts={props.onNavigateToPayouts}
        />
      );

    case 'ADMIN':
      return (
        <AdminDashboardView
          onOpenShowcase={props.onOpenShowcase}
          onNavigateToDisplay={props.onNavigateToDisplay}
          onNavigateToDisplaysList={props.onNavigateToDisplaysList}
          onNavigateToClients={props.onNavigateToClients}
          onNavigateToAdvertisers={props.onNavigateToAdvertisers}
          onNavigateToCampaigns={props.onNavigateToCampaigns}
          onNavigateToAlerts={props.onNavigateToAlerts}
          onNavigateToMaintenance={props.onNavigateToMaintenance}
        />
      );

    case 'DISPLAY_OWNER':
      return (
        <DisplayOwnerDashboardView
          onNavigateToDisplay={props.onNavigateToDisplay}
          onNavigateToDisplaysList={props.onNavigateToDisplaysList}
          onNavigateToContent={props.onNavigateToContent}
          onNavigateToPlaylist={props.onNavigateToPlaylist}
          onNavigateToSchedule={props.onNavigateToSchedule}
          onNavigateToScheduleDetail={props.onNavigateToScheduleDetail}
          onNavigateToAICredits={props.onNavigateToAICredits}
          onNavigateToStudioAI={props.onNavigateToStudioAI}
          onNavigateToBilling={props.onNavigateToBilling}
        />
      );

    case 'CLIENT':
      return (
        <ClientDashboardView
          onNavigateToDisplay={props.onNavigateToDisplay}
          onNavigateToDisplaysList={props.onNavigateToDisplaysList}
          onNavigateToContent={props.onNavigateToContent}
          onNavigateToPlaylist={props.onNavigateToPlaylist}
          onNavigateToSchedule={props.onNavigateToSchedule}
          onNavigateToScheduleDetail={props.onNavigateToScheduleDetail}
          onNavigateToAICredits={props.onNavigateToAICredits}
          onNavigateToContracts={props.onNavigateToContracts}
          onNavigateToBilling={props.onNavigateToBilling}
        />
      );

    case 'ADVERTISER':
      return (
        <AdvertiserDashboardView
          onNavigateToCampaigns={props.onNavigateToCampaigns}
          onNavigateToNewCampaign={props.onNavigateToNewCampaign}
          onNavigateToCampaignDetail={props.onNavigateToCampaignDetail}
          onNavigateToExploreDisplays={props.onNavigateToDisplaysList}
          onNavigateToStudioAI={props.onNavigateToStudioAI}
          onNavigateToAICredits={props.onNavigateToAICredits}
          onNavigateToBilling={props.onNavigateToBilling}
        />
      );

    case 'TECHNICIAN':
      return (
        <TechnicianDashboardView
          onNavigateToDisplay={props.onNavigateToDisplay}
          onNavigateToOfflineDisplays={props.onNavigateToOfflineDisplays}
          onNavigateToDiagnostics={props.onNavigateToDiagnostics}
          onNavigateToMaintenance={props.onNavigateToMaintenance}
        />
      );

    default:
      return (
        <AdminDashboardView
          onOpenShowcase={props.onOpenShowcase}
          onNavigateToDisplay={props.onNavigateToDisplay}
          onNavigateToDisplaysList={props.onNavigateToDisplaysList}
          onNavigateToClients={props.onNavigateToClients}
          onNavigateToAdvertisers={props.onNavigateToAdvertisers}
          onNavigateToCampaigns={props.onNavigateToCampaigns}
          onNavigateToAlerts={props.onNavigateToAlerts}
          onNavigateToMaintenance={props.onNavigateToMaintenance}
        />
      );
  }
};
