/**
 * Document Templates
 *
 * Predefined templates for professional documents.
 * Each template provides TipTap JSON content structure.
 */

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'report' | 'proposal' | 'spec' | 'meeting' | 'letter' | 'general';
  icon: string;
  content: object; // TipTap JSON
}

// Helper to create paragraph nodes
const p = (text: string) => ({
  type: 'paragraph',
  content: text ? [{ type: 'text', text }] : undefined,
});

// Helper to create heading nodes
const h = (level: 1 | 2 | 3 | 4 | 5 | 6, text: string) => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});

// Helper to create bullet list
const ul = (items: string[]) => ({
  type: 'bulletList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [p(item)],
  })),
});

// Helper to create numbered list
const ol = (items: string[]) => ({
  type: 'orderedList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [p(item)],
  })),
});

// Helper to create horizontal rule
const hr = () => ({ type: 'horizontalRule' });

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // Blank template
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a clean slate',
    category: 'general',
    icon: 'FileText',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
  },

  // Report Templates
  {
    id: 'project-status',
    name: 'Project Status Report',
    description: 'Weekly or monthly project progress update',
    category: 'report',
    icon: 'BarChart2',
    content: {
      type: 'doc',
      content: [
        h(1, 'Project Status Report'),
        p(''),
        h(2, 'Project Overview'),
        p('Project Name: [Enter project name]'),
        p('Report Date: [Enter date]'),
        p('Report Period: [Start date] - [End date]'),
        p(''),
        h(2, 'Executive Summary'),
        p('[Provide a brief overview of the project status, key achievements, and any critical issues.]'),
        p(''),
        h(2, 'Progress Update'),
        h(3, 'Completed Tasks'),
        ul(['Task 1 - [Description]', 'Task 2 - [Description]', 'Task 3 - [Description]']),
        p(''),
        h(3, 'In Progress'),
        ul(['Task 1 - [Progress %] - [Expected completion]', 'Task 2 - [Progress %] - [Expected completion]']),
        p(''),
        h(3, 'Upcoming Tasks'),
        ul(['Task 1 - [Scheduled start date]', 'Task 2 - [Scheduled start date]']),
        p(''),
        h(2, 'Key Metrics'),
        p('Schedule Status: [On Track / At Risk / Behind]'),
        p('Budget Status: [Under / On / Over Budget]'),
        p('Quality Status: [Good / Acceptable / Needs Improvement]'),
        p(''),
        h(2, 'Risks & Issues'),
        ul(['Risk/Issue 1 - [Mitigation plan]', 'Risk/Issue 2 - [Mitigation plan]']),
        p(''),
        h(2, 'Next Steps'),
        ol(['Action item 1', 'Action item 2', 'Action item 3']),
        p(''),
        hr(),
        p('Prepared by: [Your name]'),
      ],
    },
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Capture meeting discussions and action items',
    category: 'meeting',
    icon: 'Users',
    content: {
      type: 'doc',
      content: [
        h(1, 'Meeting Notes'),
        p(''),
        h(2, 'Meeting Details'),
        p('Date: [Enter date]'),
        p('Time: [Start time] - [End time]'),
        p('Location: [In-person / Virtual meeting link]'),
        p(''),
        h(2, 'Attendees'),
        ul(['[Name 1] - [Role]', '[Name 2] - [Role]', '[Name 3] - [Role]']),
        p(''),
        h(2, 'Agenda'),
        ol(['Topic 1', 'Topic 2', 'Topic 3']),
        p(''),
        h(2, 'Discussion Notes'),
        h(3, 'Topic 1'),
        p('[Key discussion points and decisions]'),
        p(''),
        h(3, 'Topic 2'),
        p('[Key discussion points and decisions]'),
        p(''),
        h(2, 'Action Items'),
        ul([
          '[ ] Action 1 - Assigned to: [Name] - Due: [Date]',
          '[ ] Action 2 - Assigned to: [Name] - Due: [Date]',
          '[ ] Action 3 - Assigned to: [Name] - Due: [Date]',
        ]),
        p(''),
        h(2, 'Next Meeting'),
        p('Date: [Enter next meeting date]'),
        p('Agenda items: [Topics to discuss]'),
      ],
    },
  },

  // Proposal Templates
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    description: 'Formal project proposal with objectives and timeline',
    category: 'proposal',
    icon: 'Target',
    content: {
      type: 'doc',
      content: [
        h(1, 'Project Proposal'),
        p(''),
        h(2, 'Executive Summary'),
        p('[Provide a concise overview of the proposed project, its goals, and expected outcomes.]'),
        p(''),
        h(2, 'Problem Statement'),
        p('[Describe the problem or opportunity this project addresses.]'),
        p(''),
        h(2, 'Proposed Solution'),
        p('[Outline your proposed approach to solving the problem.]'),
        p(''),
        h(3, 'Key Features'),
        ul(['Feature 1 - [Description]', 'Feature 2 - [Description]', 'Feature 3 - [Description]']),
        p(''),
        h(2, 'Objectives'),
        ol([
          'Objective 1: [Specific, measurable goal]',
          'Objective 2: [Specific, measurable goal]',
          'Objective 3: [Specific, measurable goal]',
        ]),
        p(''),
        h(2, 'Scope'),
        h(3, 'In Scope'),
        ul(['Item 1', 'Item 2', 'Item 3']),
        p(''),
        h(3, 'Out of Scope'),
        ul(['Item 1', 'Item 2']),
        p(''),
        h(2, 'Timeline'),
        p('Phase 1: [Start] - [End] - [Deliverables]'),
        p('Phase 2: [Start] - [End] - [Deliverables]'),
        p('Phase 3: [Start] - [End] - [Deliverables]'),
        p(''),
        h(2, 'Budget'),
        p('Total Estimated Cost: $[Amount]'),
        ul(['Personnel: $[Amount]', 'Equipment: $[Amount]', 'Other: $[Amount]']),
        p(''),
        h(2, 'Success Criteria'),
        ul(['Criterion 1', 'Criterion 2', 'Criterion 3']),
        p(''),
        h(2, 'Risks & Mitigation'),
        ul(['Risk 1 - Mitigation: [Strategy]', 'Risk 2 - Mitigation: [Strategy]']),
        p(''),
        hr(),
        p('Prepared by: [Your name]'),
        p('Date: [Enter date]'),
      ],
    },
  },

  // Specification Templates
  {
    id: 'technical-spec',
    name: 'Technical Specification',
    description: 'Detailed technical requirements and architecture',
    category: 'spec',
    icon: 'Code',
    content: {
      type: 'doc',
      content: [
        h(1, 'Technical Specification'),
        p(''),
        h(2, 'Document Info'),
        p('Version: 1.0'),
        p('Author: [Your name]'),
        p('Last Updated: [Date]'),
        p('Status: Draft / In Review / Approved'),
        p(''),
        h(2, 'Overview'),
        p('[Provide a high-level overview of the system or feature being specified.]'),
        p(''),
        h(2, 'Goals'),
        ul(['Goal 1', 'Goal 2', 'Goal 3']),
        p(''),
        h(2, 'Non-Goals'),
        ul(['Non-goal 1', 'Non-goal 2']),
        p(''),
        h(2, 'Technical Design'),
        h(3, 'Architecture'),
        p('[Describe the overall architecture and major components.]'),
        p(''),
        h(3, 'Data Model'),
        p('[Describe the data structures and relationships.]'),
        p(''),
        h(3, 'API Design'),
        p('[Describe the API endpoints and contracts.]'),
        p(''),
        h(3, 'Dependencies'),
        ul(['Dependency 1 - [Purpose]', 'Dependency 2 - [Purpose]']),
        p(''),
        h(2, 'Security Considerations'),
        ul(['Authentication: [Approach]', 'Authorization: [Approach]', 'Data Protection: [Approach]']),
        p(''),
        h(2, 'Performance Requirements'),
        ul(['Latency: [Target]', 'Throughput: [Target]', 'Scalability: [Requirements]']),
        p(''),
        h(2, 'Testing Strategy'),
        ul(['Unit Tests: [Coverage target]', 'Integration Tests: [Scope]', 'E2E Tests: [Critical paths]']),
        p(''),
        h(2, 'Rollout Plan'),
        ol(['Phase 1: [Description]', 'Phase 2: [Description]', 'Phase 3: [Description]']),
        p(''),
        h(2, 'Open Questions'),
        ul(['Question 1', 'Question 2']),
      ],
    },
  },
  {
    id: 'feature-spec',
    name: 'Feature Specification',
    description: 'Product feature requirements and user stories',
    category: 'spec',
    icon: 'Lightbulb',
    content: {
      type: 'doc',
      content: [
        h(1, 'Feature Specification'),
        p(''),
        h(2, 'Feature Overview'),
        p('Feature Name: [Enter feature name]'),
        p('Priority: High / Medium / Low'),
        p('Target Release: [Version or date]'),
        p(''),
        h(2, 'Problem Statement'),
        p('[Describe the user problem or pain point this feature addresses.]'),
        p(''),
        h(2, 'User Stories'),
        p('As a [user type], I want to [action] so that [benefit].'),
        p('As a [user type], I want to [action] so that [benefit].'),
        p(''),
        h(2, 'Acceptance Criteria'),
        ul(['[ ] Criterion 1', '[ ] Criterion 2', '[ ] Criterion 3']),
        p(''),
        h(2, 'Functional Requirements'),
        ol(['Requirement 1', 'Requirement 2', 'Requirement 3']),
        p(''),
        h(2, 'Non-Functional Requirements'),
        ul(['Performance: [Requirement]', 'Accessibility: [Requirement]', 'Security: [Requirement]']),
        p(''),
        h(2, 'UI/UX Considerations'),
        p('[Describe the user interface and experience considerations.]'),
        p(''),
        h(2, 'Edge Cases'),
        ul(['Edge case 1 - [Handling]', 'Edge case 2 - [Handling]']),
        p(''),
        h(2, 'Dependencies'),
        ul(['Dependency 1', 'Dependency 2']),
        p(''),
        h(2, 'Out of Scope'),
        ul(['Item 1', 'Item 2']),
      ],
    },
  },

  // Letter Templates
  {
    id: 'formal-letter',
    name: 'Formal Letter',
    description: 'Professional business letter format',
    category: 'letter',
    icon: 'Mail',
    content: {
      type: 'doc',
      content: [
        p('[Your Name]'),
        p('[Your Address]'),
        p('[City, State ZIP]'),
        p('[Your Email]'),
        p('[Date]'),
        p(''),
        p('[Recipient Name]'),
        p('[Recipient Title]'),
        p('[Company Name]'),
        p('[Address]'),
        p('[City, State ZIP]'),
        p(''),
        p('Dear [Recipient Name],'),
        p(''),
        p('[Opening paragraph: State your purpose for writing.]'),
        p(''),
        p('[Body paragraph 1: Provide details and context.]'),
        p(''),
        p('[Body paragraph 2: Additional information or supporting points.]'),
        p(''),
        p('[Closing paragraph: Summarize and include any call to action.]'),
        p(''),
        p('Sincerely,'),
        p(''),
        p(''),
        p('[Your Signature]'),
        p('[Your Name]'),
        p('[Your Title]'),
      ],
    },
  },

  // General Templates
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Structured daily reflection template',
    category: 'general',
    icon: 'Calendar',
    content: {
      type: 'doc',
      content: [
        h(1, 'Daily Journal'),
        p('[Date]'),
        p(''),
        h(2, 'Morning Intentions'),
        p("Today's Focus:"),
        ul(['Priority 1', 'Priority 2', 'Priority 3']),
        p(''),
        p("I'm grateful for:"),
        ol(['[Gratitude 1]', '[Gratitude 2]', '[Gratitude 3]']),
        p(''),
        h(2, 'Notes & Thoughts'),
        p('[Write your thoughts, ideas, and observations throughout the day.]'),
        p(''),
        h(2, 'Evening Reflection'),
        p('What went well today?'),
        p('[Reflection]'),
        p(''),
        p('What could be improved?'),
        p('[Reflection]'),
        p(''),
        p('Key learnings:'),
        ul(['[Learning 1]', '[Learning 2]']),
        p(''),
        h(2, 'Tomorrow'),
        p("Tomorrow's priorities:"),
        ul(['[Priority 1]', '[Priority 2]', '[Priority 3]']),
      ],
    },
  },
  {
    id: 'research-notes',
    name: 'Research Notes',
    description: 'Structured notes for research and analysis',
    category: 'general',
    icon: 'Search',
    content: {
      type: 'doc',
      content: [
        h(1, 'Research Notes'),
        p(''),
        h(2, 'Research Topic'),
        p('[Enter your research topic or question]'),
        p(''),
        h(2, 'Background'),
        p('[Provide context and background information on the topic.]'),
        p(''),
        h(2, 'Key Sources'),
        ol(['Source 1: [Title, Author, URL]', 'Source 2: [Title, Author, URL]', 'Source 3: [Title, Author, URL]']),
        p(''),
        h(2, 'Findings'),
        h(3, 'Finding 1'),
        p('[Description and evidence]'),
        p(''),
        h(3, 'Finding 2'),
        p('[Description and evidence]'),
        p(''),
        h(3, 'Finding 3'),
        p('[Description and evidence]'),
        p(''),
        h(2, 'Analysis'),
        p('[Your analysis and interpretation of the findings.]'),
        p(''),
        h(2, 'Conclusions'),
        ul(['Conclusion 1', 'Conclusion 2', 'Conclusion 3']),
        p(''),
        h(2, 'Next Steps'),
        ul(['Further research needed on [topic]', 'Follow up with [person/source]']),
        p(''),
        h(2, 'References'),
        p('[Full citations]'),
      ],
    },
  },
];

// Get templates by category
export function getTemplatesByCategory(category: DocumentTemplate['category']): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter((t) => t.category === category);
}

// Get template by ID
export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}

// Get all template categories with counts
export function getTemplateCategories(): { category: DocumentTemplate['category']; count: number; label: string }[] {
  const categories: { category: DocumentTemplate['category']; label: string }[] = [
    { category: 'general', label: 'General' },
    { category: 'report', label: 'Reports' },
    { category: 'proposal', label: 'Proposals' },
    { category: 'spec', label: 'Specifications' },
    { category: 'meeting', label: 'Meetings' },
    { category: 'letter', label: 'Letters' },
  ];

  return categories.map((c) => ({
    ...c,
    count: DOCUMENT_TEMPLATES.filter((t) => t.category === c.category).length,
  }));
}
