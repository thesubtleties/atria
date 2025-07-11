// Speaker role constants matching backend enums
export const SPEAKER_ROLES = {
  HOST: 'HOST',
  SPEAKER: 'SPEAKER',
  PANELIST: 'PANELIST',
  MODERATOR: 'MODERATOR',
  KEYNOTE: 'KEYNOTE',
};

// Role display options for select components
export const SPEAKER_ROLE_OPTIONS = [
  { value: SPEAKER_ROLES.SPEAKER, label: 'Speaker' },
  { value: SPEAKER_ROLES.HOST, label: 'Host' },
  { value: SPEAKER_ROLES.KEYNOTE, label: 'Keynote Speaker' },
  { value: SPEAKER_ROLES.MODERATOR, label: 'Moderator' },
  { value: SPEAKER_ROLES.PANELIST, label: 'Panelist' },
];

// Role display order for UI
export const SPEAKER_ROLE_ORDER = [
  SPEAKER_ROLES.HOST,
  SPEAKER_ROLES.KEYNOTE,
  SPEAKER_ROLES.SPEAKER,
  SPEAKER_ROLES.MODERATOR,
  SPEAKER_ROLES.PANELIST,
];

// Format role for display
export const formatSpeakerRole = (role) => {
  if (!role) return '';
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};