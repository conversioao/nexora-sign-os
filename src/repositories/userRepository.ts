import { User, Membership, Role, MembershipStatus, UserStatus } from '../types/auth';
import { mockUsers, mockMemberships, mockOrganizations } from '../data/mockAuthData';

export interface UserMemberRecord {
  membership: Membership;
  user: User;
}

export interface IUserRepository {
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  getMembershipsByUser(userId: string): Promise<Membership[]>;
  getMembersByOrganization(organizationId: string): Promise<UserMemberRecord[]>;
  inviteMember(params: {
    organizationId: string;
    name: string;
    email: string;
    phone?: string;
    role: Role;
  }): Promise<UserMemberRecord>;
  updateMemberRole(membershipId: string, newRole: Role): Promise<Membership>;
  toggleMemberStatus(membershipId: string, newStatus: MembershipStatus): Promise<Membership>;
  removeMember(membershipId: string): Promise<{ success: boolean; message: string }>;
}

class MockUserRepository implements IUserRepository {
  private users: User[] = [...mockUsers];
  private memberships: Membership[] = [...mockMemberships];

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUserById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  async getMembershipsByUser(userId: string): Promise<Membership[]> {
    return this.memberships
      .filter((m) => m.userId === userId)
      .map((m) => ({
        ...m,
        organization: mockOrganizations.find((o) => o.id === m.organizationId),
        user: this.users.find((u) => u.id === m.userId),
      }));
  }

  async getMembersByOrganization(organizationId: string): Promise<UserMemberRecord[]> {
    const orgMemberships = this.memberships.filter((m) => m.organizationId === organizationId);

    return orgMemberships.map((membership) => {
      const user = this.users.find((u) => u.id === membership.userId) || {
        id: membership.userId,
        name: 'Utilizador',
        email: 'utilizador@empresa.ao',
        status: 'ACTIVE' as UserStatus,
        createdAt: membership.joinedAt,
      };

      const resolvedMembership: Membership = {
        ...membership,
        user,
        organization: mockOrganizations.find((o) => o.id === organizationId),
      };

      return {
        membership: resolvedMembership,
        user,
      };
    });
  }

  async inviteMember(params: {
    organizationId: string;
    name: string;
    email: string;
    phone?: string;
    role: Role;
  }): Promise<UserMemberRecord> {
    // Check if user already exists
    let existingUser = this.users.find(
      (u) => u.email.toLowerCase() === params.email.trim().toLowerCase()
    );

    if (!existingUser) {
      existingUser = {
        id: `usr-${Date.now().toString(36)}`,
        name: params.name.trim(),
        email: params.email.trim().toLowerCase(),
        phone: params.phone || '+244 923 000 000',
        status: 'PENDING',
        jobTitle: 'Membro Convidado',
        createdAt: new Date().toISOString(),
      };
      this.users.push(existingUser);
    }

    // Check if already member
    const existingMembership = this.memberships.find(
      (m) => m.userId === existingUser!.id && m.organizationId === params.organizationId
    );

    if (existingMembership) {
      existingMembership.role = params.role;
      existingMembership.status = 'ACTIVE';
      return {
        membership: existingMembership,
        user: existingUser,
      };
    }

    const newMembership: Membership = {
      id: `mem-${Date.now().toString(36)}`,
      userId: existingUser.id,
      organizationId: params.organizationId,
      role: params.role,
      status: 'INVITED',
      joinedAt: new Date().toISOString(),
      user: existingUser,
      organization: mockOrganizations.find((o) => o.id === params.organizationId),
    };

    this.memberships.unshift(newMembership);

    return {
      membership: newMembership,
      user: existingUser,
    };
  }

  async updateMemberRole(membershipId: string, newRole: Role): Promise<Membership> {
    const mem = this.memberships.find((m) => m.id === membershipId);
    if (!mem) {
      throw new Error(`Membership com ID ${membershipId} não encontrada.`);
    }

    mem.role = newRole;
    return { ...mem };
  }

  async toggleMemberStatus(membershipId: string, newStatus: MembershipStatus): Promise<Membership> {
    const mem = this.memberships.find((m) => m.id === membershipId);
    if (!mem) {
      throw new Error(`Membership com ID ${membershipId} não encontrada.`);
    }

    mem.status = newStatus;
    return { ...mem };
  }

  async removeMember(membershipId: string): Promise<{ success: boolean; message: string }> {
    const initialLen = this.memberships.length;
    this.memberships = this.memberships.filter((m) => m.id !== membershipId);
    return {
      success: this.memberships.length < initialLen,
      message: 'Membro removido com sucesso da organização.',
    };
  }
}

export const userRepository = new MockUserRepository();
