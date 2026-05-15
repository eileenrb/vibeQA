import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: text('role').notNull(), // Admin, Tester
  avatar: text('avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const testCases = sqliteTable('test_cases', {
  id: text('id').primaryKey(),
  module: text('module').notNull(),
  feature: text('feature'),
  title: text('title').notNull(),
  preconditions: text('preconditions'),
  steps: text('steps').notNull(),
  expectedResult: text('expected_result').notNull(),
  priority: text('priority').notNull(), // High, Medium, Low
  severity: text('severity').notNull(), // Critical, Major, Minor, Trivial
  automationStatus: text('automation_status').notNull(),
  tags: text('tags'), // Comma separated
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const regressionCycles = sqliteTable('regression_cycles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version').notNull(),
  status: text('status').notNull(), // Planned, In Progress, Completed, Closed
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const executionResults = sqliteTable('execution_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cycleId: text('cycle_id').notNull().references(() => regressionCycles.id, { onDelete: 'cascade' }),
  testCaseId: text('test_case_id').notNull().references(() => testCases.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  testerId: text('tester_id').references(() => users.id, { onDelete: 'set null' }),
  environment: text('environment'),
  buildVersion: text('build_version'),
  executionDate: integer('execution_date', { mode: 'timestamp' }),
  remarks: text('remarks'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const bugs = sqliteTable('bugs', {
  id: text('id').primaryKey(), // BUG-101
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull(), // Open, In Progress, Fixed, Retest, Reopened, Closed
  priority: text('priority').notNull(),
  severity: text('severity').notNull(),
  environment: text('environment'),
  testCaseId: text('test_case_id').references(() => testCases.id, { onDelete: 'set null' }),
  cycleId: text('cycle_id').references(() => regressionCycles.id, { onDelete: 'cascade' }),
  assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }), // Member assigned to fix
  qaId: text('qa_id').references(() => users.id, { onDelete: 'set null' }), // QA who reported
  reopenCount: integer('reopen_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
});

export const bugHistory = sqliteTable('bug_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bugId: text('bug_id').references(() => bugs.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // Status Change, Assigned, Commented
  fromStatus: text('from_status'),
  toStatus: text('to_status'),
  details: text('details'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  details: text('details'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
