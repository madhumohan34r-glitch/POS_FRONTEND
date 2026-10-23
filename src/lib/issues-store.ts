import { create } from 'zustand';

export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'resolved';
export type IssuePriority = 'low' | 'medium' | 'high';

export interface StoreIssue {
  id: string;
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: Date;
  priority: IssuePriority;
  status: IssueStatus;
  assignedTo?: string;
  assignedAt?: Date;
  resolutionNote?: string;
  resolvedAt?: Date;
}

interface IssuesStore {
  issues: StoreIssue[];
  reportIssue: (data: Pick<StoreIssue, 'title' | 'description' | 'reportedBy' | 'priority'>) => StoreIssue;
  assignIssue: (id: string, assignee: string) => void;
  startIssue: (id: string) => void;
  resolveIssue: (id: string, note: string) => void;
  deleteIssue: (id: string) => void;
}

export const useIssuesStore = create<IssuesStore>((set) => ({
  issues: [
    { id: 'ISS-001', title: 'AC not cooling in main hall', description: 'AC vents are weak; guests complaining', reportedBy: 'Priya Sharma', reportedAt: new Date(Date.now() - 86400000), priority: 'high', status: 'open' },
  ],
  reportIssue: (data) => {
    const issue: StoreIssue = {
      ...data,
      id: `ISS-${String(Date.now()).slice(-6)}`,
      reportedAt: new Date(),
      status: 'open',
    };
    set(s => ({ issues: [issue, ...s.issues] }));
    return issue;
  },
  assignIssue: (id, assignee) => set(s => ({
    issues: s.issues.map(i => i.id === id ? { ...i, assignedTo: assignee, assignedAt: new Date(), status: 'assigned' } : i),
  })),
  startIssue: (id) => set(s => ({
    issues: s.issues.map(i => i.id === id ? { ...i, status: 'in_progress' } : i),
  })),
  resolveIssue: (id, note) => set(s => ({
    issues: s.issues.map(i => i.id === id ? { ...i, status: 'resolved', resolutionNote: note, resolvedAt: new Date() } : i),
  })),
  deleteIssue: (id) => set(s => ({ issues: s.issues.filter(i => i.id !== id) })),
}));
