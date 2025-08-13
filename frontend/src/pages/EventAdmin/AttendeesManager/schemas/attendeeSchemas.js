import { z } from 'zod';

// Event User Roles enum matching backend
export const EventUserRole = {
  ADMIN: 'ADMIN',
  ORGANIZER: 'ORGANIZER',
  SPEAKER: 'SPEAKER',
  ATTENDEE: 'ATTENDEE',
};

// Invitation schema for single invite
export const invitationSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  role: z.enum(['ADMIN', 'ORGANIZER', 'SPEAKER', 'ATTENDEE'], {
    required_error: 'Role is required',
  }),
  message: z.string()
    .max(500, 'Message too long')
    .optional(),
});

// Bulk invitation schema
export const bulkInvitationSchema = z.object({
  invitations: z.array(invitationSchema)
    .min(1, 'At least one invitation is required')
    .max(100, 'Maximum 100 invitations at once'),
});

// Role update schema
export const roleUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'ORGANIZER', 'SPEAKER', 'ATTENDEE'], {
    required_error: 'Role is required',
  }),
});

// Bulk role update schema
export const bulkRoleUpdateSchema = z.object({
  userIds: z.array(z.number())
    .min(1, 'Select at least one user'),
  role: z.enum(['ADMIN', 'ORGANIZER', 'SPEAKER', 'ATTENDEE'], {
    required_error: 'Role is required',
  }),
});

// Filter/search schema
export const attendeeFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ALL', 'ADMIN', 'ORGANIZER', 'SPEAKER', 'ATTENDEE']).optional(),
  sortBy: z.enum(['name', 'email', 'company', 'joinDate', 'role']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// CSV import schema
export const csvImportSchema = z.object({
  file: z.instanceof(File, {
    message: 'Please select a CSV file',
  }).refine(
    (file) => file.type === 'text/csv' || file.name.endsWith('.csv'),
    'File must be a CSV'
  ),
  defaultRole: z.enum(['ADMIN', 'ORGANIZER', 'SPEAKER', 'ATTENDEE'])
    .default('ATTENDEE'),
});

// Helper functions
export const getRoleBadgeColor = (role) => {
  switch (role) {
    case 'ADMIN':
      return 'red';
    case 'ORGANIZER':
      return 'orange';
    case 'SPEAKER':
      return 'blue';
    case 'ATTENDEE':
      return 'gray';
    default:
      return 'gray';
  }
};

export const getRoleDisplayName = (role) => {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'ORGANIZER':
      return 'Organizer';
    case 'SPEAKER':
      return 'Speaker';
    case 'ATTENDEE':
      return 'Attendee';
    default:
      return role;
  }
};

// Validate if user can change roles based on their own role
export const canChangeRole = (currentUserRole, targetRole) => {
  // Only admins and organizers can change roles
  if (!['ADMIN', 'ORGANIZER'].includes(currentUserRole)) {
    return false;
  }

  // Admins can change any role
  if (currentUserRole === 'ADMIN') {
    return true;
  }

  // Organizers can only assign ATTENDEE or SPEAKER roles
  if (currentUserRole === 'ORGANIZER') {
    return ['ATTENDEE', 'SPEAKER'].includes(targetRole);
  }

  return false;
};

// Validate if a specific role change is allowed
export const canChangeUserRole = (currentUserRole, currentUserId, targetUserId, targetCurrentRole, targetNewRole, adminCount = 1) => {
  // Cannot change own role
  if (currentUserId === targetUserId) {
    return { allowed: false, reason: "You cannot change your own role" };
  }

  // Only admins and organizers can change roles
  if (!['ADMIN', 'ORGANIZER'].includes(currentUserRole)) {
    return { allowed: false, reason: "You don't have permission to change roles" };
  }

  // Organizers have limited permissions
  if (currentUserRole === 'ORGANIZER') {
    // Can only change between ATTENDEE and SPEAKER
    const allowedRoles = ['ATTENDEE', 'SPEAKER'];
    
    // Cannot change roles of ORGANIZERS or ADMINS
    if (!allowedRoles.includes(targetCurrentRole)) {
      return { allowed: false, reason: "Organizers cannot change roles of other organizers or admins" };
    }
    
    // Can only assign ATTENDEE or SPEAKER roles
    if (!allowedRoles.includes(targetNewRole)) {
      return { allowed: false, reason: "Organizers can only assign attendee or speaker roles" };
    }
    
    return { allowed: true };
  }

  // Admins can change most roles but cannot remove last admin
  if (currentUserRole === 'ADMIN') {
    // Check if trying to demote last admin
    if (targetCurrentRole === 'ADMIN' && targetNewRole !== 'ADMIN' && adminCount <= 1) {
      return { allowed: false, reason: "Cannot remove or change role of last admin" };
    }
    
    return { allowed: true };
  }

  return { allowed: false, reason: "Invalid permission state" };
};