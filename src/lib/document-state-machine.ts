import { DocumentStatus } from '@prisma/client';

/**
 * Document Status Transition Machine
 * Defines valid status transitions for documents in NotaryOS
 */

export type DocumentTransition = {
  from: DocumentStatus;
  to: DocumentStatus;
  description: string;
};

// Define all valid status transitions
const TRANSITIONS: Record<DocumentStatus, DocumentTransition[]> = {
  [DocumentStatus.DRAFT]: [
    {
      from: DocumentStatus.DRAFT,
      to: DocumentStatus.REVIEW,
      description: 'Submit draft for review',
    },
  ],
  [DocumentStatus.REVIEW]: [
    {
      from: DocumentStatus.REVIEW,
      to: DocumentStatus.DRAFT,
      description: 'Return to draft for revisions',
    },
    {
      from: DocumentStatus.REVIEW,
      to: DocumentStatus.SIGNING,
      description: 'Approve and send for signing',
    },
  ],
  [DocumentStatus.SIGNING]: [
    {
      from: DocumentStatus.SIGNING,
      to: DocumentStatus.ARCHIVED,
      description: 'Complete and archive',
    },
  ],
  [DocumentStatus.ARCHIVED]: [],
};

/**
 * Get all valid transitions from a given status
 */
export function getValidTransitions(
  fromStatus: DocumentStatus
): DocumentTransition[] {
  return TRANSITIONS[fromStatus] || [];
}

/**
 * Check if a transition is valid
 */
export function isValidTransition(
  from: DocumentStatus,
  to: DocumentStatus
): boolean {
  const validTransitions = getValidTransitions(from);
  return validTransitions.some((t) => t.to === to);
}

/**
 * Get transition details
 */
export function getTransitionDetails(
  from: DocumentStatus,
  to: DocumentStatus
): DocumentTransition | null {
  if (!isValidTransition(from, to)) {
    return null;
  }
  const validTransitions = getValidTransitions(from);
  return validTransitions.find((t) => t.to === to) || null;
}

/**
 * Get all possible next statuses from current status
 */
export function getNextStatuses(fromStatus: DocumentStatus): DocumentStatus[] {
  return getValidTransitions(fromStatus).map((t) => t.to);
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: DocumentStatus): string {
  const labels: Record<DocumentStatus, string> = {
    [DocumentStatus.DRAFT]: 'Draft',
    [DocumentStatus.REVIEW]: 'Under Review',
    [DocumentStatus.SIGNING]: 'Signing',
    [DocumentStatus.ARCHIVED]: 'Archived',
  };
  return labels[status] || status;
}

/**
 * Get status badge color (for UI)
 */
export function getStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    [DocumentStatus.DRAFT]: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    [DocumentStatus.REVIEW]: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    [DocumentStatus.SIGNING]: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    [DocumentStatus.ARCHIVED]: 'bg-green-100 text-green-800 hover:bg-green-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Check if a user can transition a document based on their role
 * ADMIN can transition from any status
 * STAFF can only transition from DRAFT to REVIEW
 * FINANCE can only view documents, not transition
 */
export function canTransitionDocument(
  userRole: string,
  currentStatus: DocumentStatus,
  toStatus: DocumentStatus
): boolean {
  // ADMIN (Notaris) can do any transition
  if (userRole === 'ADMIN') {
    return true;
  }

  // STAFF can only submit drafts for review
  if (userRole === 'STAFF') {
    return (
      currentStatus === DocumentStatus.DRAFT && toStatus === DocumentStatus.REVIEW
    );
  }

  // FINANCE cannot transition documents
  if (userRole === 'FINANCE') {
    return false;
  }

  return false;
}

/**
 * Get allowed transitions for a user based on their role
 */
export function getAllowedTransitionsForUser(
  userRole: string,
  currentStatus: DocumentStatus
): DocumentTransition[] {
  const allTransitions = getValidTransitions(currentStatus);

  if (userRole === 'ADMIN') {
    return allTransitions;
  }

  if (userRole === 'STAFF') {
    return allTransitions.filter(
      (t) => t.from === DocumentStatus.DRAFT && t.to === DocumentStatus.REVIEW
    );
  }

  return [];
}