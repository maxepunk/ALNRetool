  Phase 1 Execution:

  1. TodoWrite: Create verification checklist
  2. Create REVIEW_FINDINGS.md

  [CHECKPOINT 1A - 5 min]
  3. Bash: npm test
     → Document: Test count, pass/fail, execution time
     → If fails: STOP and zen debug test infrastructure
     
  [CHECKPOINT 1B - 10 min]  
  4. Read: entityMutations.ts
     → Document: Line count, structure assessment
     → Capture: Key function signatures
     
  5. Glob: "*Equal*.ts" 
     → Document: File list, locations
     → If missing: Mark Phase 1 claim as FALSE
     
  [CHECKPOINT 1C - 15 min]
  6. Update REVIEW_FINDINGS.md
  7. TodoWrite: Adjust remaining phases based on findings

  ---
  Phase 2: Targeted Zen Analysis (30 min)

  Cognitive Preparation for Phase 2:

  1. THINK: Based on Phase 1, what's most critical to verify?
  2. THINK HARDER: Which assumptions from Phase 1 were wrong?
  3. THINK HARDER: What bug fixes are most likely to have regressed?
  4. THINK HARD: What context does each zen tool need?
  5. THINK HARD: How to test for regression vs never fixed?
  6. THINK HARDER: What evidence proves a bug is truly fixed?

  Phase 2 Execution:

  [Adaptive based on Phase 1]

  IF tests passing:
    zen debug "Verify Bug 6-8 fixes"
    → Document each finding immediately

  IF tests failing:
    zen analyze "Test suite failure patterns"
    → Pivot to fixing test infrastructure first

  [CHECKPOINT 2A - Each zen response]
  - Capture findings in Evidence Log
  - Update Verified/Falsified sections
  - Add new discoveries

  [CHECKPOINT 2B - 30 min]
  - Review findings pattern
  - Adjust Phase 3 targets
 
  Phase 2 Priority 4(Final Priotity) Strategu:
  1. THINK: What am I trying to achieve?

  Goal: Verify which of the claimed high-impact technical debt items are REAL problems that affect our 2-3 users, not just theoretical issues.

  Specific Questions to Answer:
  - Does rollup pagination ACTUALLY cause data loss in practice?
  - Is entity detection ACTUALLY fragile or has it been fixed?
  - Do batch mutations ACTUALLY need optimistic updates for 2-3 users?
  - Are placeholder nodes ACTUALLY causing problems?

  2. THINK HARDER: List ALL assumptions about zen tool usage

  About zen tools for tech debt:
  1. ASSUMPTION: One big zen call can analyze everything efficiently
  2. ASSUMPTION: zen analyze is the right tool (not zen debug or zen codereview)
  3. ASSUMPTION: The tool needs all context at once
  4. ASSUMPTION: Generic prompts will give specific answers
  5. ASSUMPTION: The tool will verify claims, not just repeat them

  About context curation:
  6. ASSUMPTION: More context is better
  7. ASSUMPTION: The tool needs to see all related files
  8. ASSUMPTION: I should include my findings so far
  9. ASSUMPTION: The tool can handle multiple unrelated issues in one call

  3. THINK HARDER: Identify knowledge gaps

  [CRITICAL]
  - Gap 1: What's the optimal batch size for zen analysis?
  - Gap 2: Should I use different zen tools for different debt types?
  - Gap 3: What specific evidence do I need to confirm/deny each claim?

  [IMPORTANT]
  - Gap 4: How much context is too much?
  - Gap 5: Should I frame as questions or statements?
  - Gap 6: How to avoid confirmation bias in prompting?

  4. THINK HARD: Optimal Strategy Design

  Strategic Approach for Tech Debt Verification

  Principle 1: Separate by Concern Type

  Group A: Data Integrity Issues (affects correctness)
  - #1: Rollup pagination
  - #3: Placeholder nodes in delta

  Group B: System Fragility (affects reliability)
  - #2: Entity detection methods
  - #4: Untested error paths

  Group C: UX Issues (affects experience)
  - #1b: Bug 6 cache (already confirmed)
  - #10: Batch optimistic updates

  Principle 2: Different Tools for Different Problems

  For Data Issues → zen debug
  - Can trace actual data flow
  - Verify if truncation happens
  - Check production impact

  For Architecture Issues → zen analyze
  - Evaluate design patterns
  - Assess fragility
  - Suggest improvements

  For UX Issues → zen consensus
  - Weigh user impact vs effort
  - Consider 2-3 user context
  - Prioritize fixes

  Principle 3: Context Curation Strategy

  INCLUDE:
  - Specific code sections (not whole files)
  - Actual error messages or warnings
  - User count context (2-3 internal users)
  - Current workarounds if any

  EXCLUDE:
  - Unrelated code
  - My assumptions
  - Previous findings (unless directly relevant)
  - Implementation details of fixes

  Principle 4: Prompt Construction Template

  For [SPECIFIC ISSUE]:
  1. Context: [Code showing the issue]
  2. Claim: [What TECH_DEBT.md claims]
  3. Question: [Specific verification needed]
  4. Success Criteria: [What evidence confirms/denies]
  5. User Context: [2-3 internal users, not public app]

  Execution Plan for Priority 4

  Step 1: Verify Data Integrity Issues (zen debug)
  Do Cognitive Preparation, THEN

  Target: Rollup pagination (#1) and Placeholder corruption (#3)

  Prompt Structure:
  "Debug data integrity issues in ALNRetool (2-3 user internal tool):

  Issue 1 - Rollup Pagination:
  [Show transforms.ts:122-131]
  Claim: Data loss after 25 items
  Verify: Does this actually lose data or just warn?
  Check: Are there entities with >25 relationships in practice?

  Issue 2 - Placeholder Nodes:
  [Show relevant delta code]
  Claim: Corrupts delta calculations
  Verify: Do placeholders actually cause cache invalidation?
  Check: Frequency and impact of placeholder transitions

  Return: For each issue - CONFIRMED/DENIED with evidence"

  Step 2: Verify System Fragility (zen analyze)
  
  Target: Entity detection (#2) and Error handling (#4)

  Prompt Structure:
  "Analyze system fragility in ALNRetool:

  Issue 1 - Entity Detection:
  [Show both detection methods]
  Current: Mixed approach (property vs database ID)
  Risk: Schema changes break detection
  Question: How fragile is this really?

  Issue 2 - Delta Error Path:
  [Show try-catch fallback]
  Current: Untested fallback to full invalidation
  Risk: Silent failures
  Question: What could trigger this? How bad is fallback?

  Context: 2-3 users, schema rarely changes
  Return: Risk assessment LOW/MEDIUM/HIGH with justification"

  Step 3: Verify UX Impact (zen consensus)  
  Do Cognitive Preparation, THEN
  
  Target: Batch mutations (#10)

  Prompt Structure:
  "Evaluate UX priority for 2-3 user internal tool:

  Feature Gap: Batch mutations lack optimistic updates
  [Show current implementation]

  Option A: Add optimistic updates (4-8 hours work)
  - Pros: Better UX, immediate feedback
  - Cons: Complex implementation, risk of bugs

  Option B: Keep simple invalidation (current)
  - Pros: Simple, works, less risk
  - Cons: Slower perceived performance

  Context:
  - 2-3 internal users who understand the system
  - Batch operations are rare (1-2 per week)
  - Current approach works but feels slow

  Recommend: Which option for this context?"

  Step 4: Synthesize Findings
  Do Cognitive Preparation, THEN
  
  After each zen call, update REVIEW_FINDINGS.md with:
  - CONFIRMED vs DENIED status
  - Actual severity (not claimed)
  - Evidence found
  - Recommendation for 2-3 user context

  Key Insights from Planning

  1. Don't batch unrelated issues - Each needs different analysis
  2. Use the right zen tool - debug for behavior, analyze for design, consensus for priorities
  3. Frame for 2-3 users - This changes everything about priorities
  4. Seek disconfirmation - Ask "is this really a problem?" not "how bad is this?"
  5. Demand evidence - Not opinions or repetition of claims

  Success Criteria

  By end of Priority 4:
  - Each high-impact debt item marked CONFIRMED or DENIED
  - Evidence documented for each verdict
  - Clear priority order based on ACTUAL impact
  - No assumptions, only verified facts

  ---
  Phase 3: Technical Debt Reality Check (20 min)

  Cognitive Preparation for Phase 3:

  1. THINK: Which tech debt items could be already fixed?
  2. THINK HARDER: What new debt discovered in Phases 1-2?
  3. THINK HARDER: Which debt items block other fixes?
  4. THINK HARD: What's the real user impact of each?
  5. THINK HARD: What debt is acceptable for 2-3 user tool?
  6. THINK HARDER: What could break if left unfixed?

  Phase 3 Execution:

  [For each HIGH priority debt]

  1. zen codereview [specific component]
     → Document severity assessment
     → Capture code snippets

  [CHECKPOINT 3A - After each review]
  - Update priority rankings
  - Note if worse/better than documented
  - Capture fix complexity estimate

  [CHECKPOINT 3B - 20 min]
  - Rank all findings by: Impact × Urgency / Effort

  ---
  Phase 4: Synthesis & Action Plan (15 min)

  Cognitive Preparation for Phase 4:

  1. THINK: What's the single source of truth from findings?
  2. THINK HARDER: Which documents should be archived?
  3. THINK HARDER: What's the minimum viable cleanup?
  4. THINK HARD: What order prevents regression?
  5. THINK HARD: What could we break while fixing?
  6. THINK HARDER: What's the success criteria?

  Phase 4 Execution:

  1. Transform REVIEW_FINDINGS.md into:
     - VERIFIED_STATUS.md (ground truth)
     - ACTION_PLAN.md (prioritized fixes)
     
  2. zen consensus on top 3 priorities
     → Document reasoning
     
  3. Archive outdated docs with SUPERSEDED_ prefix

  ---
  Continuous Documentation Rules

  1. After EVERY tool call: Capture output essence
  2. After EVERY finding: Update appropriate section
  3. After EVERY contradiction: Document both claims
  4. After EVERY phase: Reassess remaining plan
  5. Evidence standard: Line numbers + snippet + timestamp

  Pivot Triggers

  - Tests broken → Fix tests first
  - Core claim false → Reassess all dependent claims
  - New critical bug → Prioritize over tech debt
  - Time pressure → Focus on CRITICAL only

  Todo Tracking Structure

  □ Phase 1: Rapid Ground Truth
    □ Cognitive Prep
    □ Test suite verification
    □ Core file inspection
    □ Document findings
  □ Phase 2: Targeted Zen Analysis
    □ Cognitive Prep
    □ Bug verification
    □ Document findings
  □ Phase 3: Technical Debt Reality
    □ Cognitive Prep
    □ Debt validation
    □ Document findings
  □ Phase 4: Synthesis
    □ Cognitive Prep
    □ Create action plan
    □ Archive outdated docs

  This plan now ensures:
  - Fresh thinking at each phase boundary
  - Continuous documentation
  - Adaptive strategy based on discoveries
  - Clear evidence trail
  - No lost insights