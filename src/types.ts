export type Priority = 'High' | 'Medium' | 'Low';
export type Severity = 'Critical' | 'Major' | 'Minor' | 'Trivial';
export type AutomationStatus = 'Automated' | 'Manual' | 'Pending';
export type ExecutionStatus = 'Pass' | 'Fail' | 'Blocked' | 'Retest' | 'Not Run';
export type BugStatus = 'Todo' | 'In Progress' | 'Ready for Build' | 'Reopen' | 'Done';
export type CycleStatus = 'Planned' | 'In Progress' | 'Completed' | 'Closed';
export type UserRole = 'Admin' | 'Tester';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface TestCase {
  id: string;
  module: string;
  feature: string | null;
  title: string;
  preconditions: string | null;
  steps: string;
  expectedResult: string;
  priority: Priority;
  severity: Severity;
  automationStatus: AutomationStatus;
  tags: string | null;
  createdBy: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface RegressionCycle {
  id: string;
  name: string;
  description: string | null;
  version: string;
  status: CycleStatus;
  ownerId: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface ExecutionResult {
  id: number;
  cycleId: string;
  testCaseId: string;
  status: ExecutionStatus;
  testerId: string | null;
  environment: string | null;
  buildVersion: string | null;
  executionDate: string | null;
  remarks: string | null;
  updatedAt: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string | null;
  status: BugStatus;
  priority: Priority;
  severity: Severity;
  environment: string | null;
  testCaseId: string | null;
  cycleId: string | null;
  assigneeId: string | null;
  qaId: string | null;
  reopenCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface Statistics {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  notRun: number;
  passRate: number;
  executionCoverage: number;
  totalBugs: number;
  activeBugs: number;
  reopenedBugs: number;
}
