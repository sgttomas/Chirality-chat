# Commit Hooks - Git Workflow Integration

*Automated documentation review cycles triggered by git commits*

## Purpose

This document establishes the git workflow integration for systematic documentation maintenance through commit-triggered agent workflows. When developers include documentation assessment flags in commit messages, automated agents execute comprehensive documentation review and improvement cycles.

## Commit Message Documentation Assessment Format

### Standard Format
```
[TYPE]: Brief commit description

Documentation Assessment: [ASSESSMENT_LEVEL]
Scope: [AFFECTED_AREAS]
Methodology: [IMPROVEMENT_APPROACH]

[Detailed commit description]
```

### Assessment Levels

#### MAJOR_OVERHAUL
**Trigger Conditions**:
- Architectural changes affecting user experience
- New major features requiring documentation updates
- Strategic direction changes
- Quarterly comprehensive reviews

**Example**:
```
feat: implement real-time semantic operation streaming

Documentation Assessment: MAJOR_OVERHAUL
Scope: USER_EXPERIENCE, TECHNICAL_ACCURACY, INTEGRATION_DOCS
Methodology: USER_JOURNEY_OPTIMIZATION

Added WebSocket-based streaming for CF14 semantic operations,
requiring comprehensive documentation updates across user guides,
technical architecture, and integration examples.
```

#### STANDARD_UPDATE
**Trigger Conditions**:
- Feature additions or modifications
- API changes affecting documentation
- Bug fixes with user impact
- Regular maintenance updates

**Example**:
```
fix: resolve chat input validation edge cases

Documentation Assessment: STANDARD_UPDATE
Scope: TROUBLESHOOTING, API_DOCS
Methodology: TECHNICAL_ACCURACY_VERIFICATION

Fixed validation issues that were causing user confusion,
requiring updates to troubleshooting guide and API documentation.
```

#### NO_REVIEW
**Trigger Conditions**:
- Internal refactoring with no user impact
- Documentation-only changes
- Minor bug fixes
- Development workflow improvements

**Example**:
```
refactor: optimize internal state management

Documentation Assessment: NO_REVIEW
Scope: NONE
Methodology: NONE

Internal optimization with no changes to public APIs or user experience.
```

## Agent Workflow Execution

### Triggered Agent Sequence

When a commit with documentation assessment is detected, the following agent workflow executes:

#### 1. Commit Analysis Agent
**Input**: Git commit message and diff analysis
**Processing**:
- Parse documentation assessment parameters
- Analyze code changes for documentation impact
- Identify affected document categories
- Extract improvement methodology requirements

**Output**: Structured analysis for downstream agents

#### 2. Matrix A Extraction Agent
**Input**: Commit analysis results
**Processing**:
- Convert commit context into current state matrix
- Identify specific documentation problems and gaps
- Assess impact scope across user experience, technical accuracy, etc.
- Generate problem formulation matrix

**Output**: Matrix A representing current documentation state/problems

#### 3. Methodology Selection Agent
**Input**: Assessment level and scope parameters
**Processing**:
- Select appropriate improvement methodology as Matrix B
- Choose systematic approach (user journey optimization, technical accuracy, etc.)
- Define improvement framework and constraints
- Establish success criteria and validation approaches

**Output**: Matrix B representing improvement methodology

#### 4. Plan Generation Agent
**Input**: Matrix A (current state) and Matrix B (methodology)
**Processing**:
- Apply semantic operations to generate improvement requirements
- Create specific, actionable improvement tasks
- Establish phased implementation approach
- Generate CONSOLIDATED_IMPROVEMENT_PLAN update

**Output**: Updated CONSOLIDATED_IMPROVEMENT_PLAN with specific improvement strategy

#### 5. Documentation Update Agent
**Input**: Generated improvement plan
**Processing**:
- Execute systematic improvements following generated plan
- Update affected documents according to improvement requirements
- Maintain consistency across document improvements
- Generate reasoning traces for all transformations

**Output**: Updated documentation files with systematic improvements

#### 6. Status Tracking Agent
**Input**: Completed documentation updates
**Processing**:
- Update KEY_PROJECT_FILES.md with new status indicators
- Track completion of improvement phases
- Update document last modified timestamps
- Maintain continuous improvement audit trail

**Output**: Updated KEY_PROJECT_FILES.md with current status

#### 7. Validation Integration Agent
**Input**: All agent outputs and transformations
**Processing**:
- Maintain complete reasoning trace of improvement cycle
- Validate consistency across all updated documents
- Check for broken links and references
- Generate quality assurance report

**Output**: Complete reasoning trace and validation report

#### 8. Commit Revision Agent
**Input**: Complete agent workflow results
**Processing**:
- Generate updated commit message with review completion details
- Include summary of documentation improvements made
- Reference reasoning traces and validation results
- Provide recommendations for human validation

**Output**: Revised commit message and improvement summary

### Human Validation Points

#### Required Human Review
- **Technical Accuracy**: Developer review of agent-generated technical content
- **User Experience**: UX review of user-facing documentation changes
- **Final Approval**: Project lead approval of systematic changes
- **Quality Assurance**: Manual verification of reasoning trace quality

#### Automated Validation
- **Link Checking**: Automated verification of internal and external references
- **Format Validation**: Markdown formatting and structure consistency
- **Code Example Testing**: Automated testing of documentation code examples
- **Cross-Reference Integrity**: Verification of document cross-references

## Workflow Implementation

### Git Hook Integration

#### Pre-Commit Hook
```bash
#!/bin/bash
# Pre-commit hook to validate documentation assessment format

commit_msg_file="$1"
commit_msg=$(cat "$commit_msg_file")

# Check for documentation assessment format
if echo "$commit_msg" | grep -q "Documentation Assessment:"; then
    # Validate assessment format
    assessment_level=$(echo "$commit_msg" | grep "Documentation Assessment:" | cut -d' ' -f3)
    
    if [[ ! "$assessment_level" =~ ^(MAJOR_OVERHAUL|STANDARD_UPDATE|NO_REVIEW)$ ]]; then
        echo "Error: Invalid documentation assessment level"
        echo "Valid options: MAJOR_OVERHAUL, STANDARD_UPDATE, NO_REVIEW"
        exit 1
    fi
    
    echo "Documentation assessment detected: $assessment_level"
fi
```

#### Post-Commit Hook
```bash
#!/bin/bash
# Post-commit hook to trigger documentation agent workflow

commit_hash=$(git rev-parse HEAD)
commit_msg=$(git log -1 --pretty=%B)

# Check for documentation assessment
if echo "$commit_msg" | grep -q "Documentation Assessment:"; then
    echo "Triggering documentation agent workflow for commit $commit_hash"
    
    # Execute agent workflow (placeholder for actual implementation)
    # node scripts/documentation-agent-workflow.js "$commit_hash"
    
    echo "Documentation agent workflow initiated"
fi
```

### Agent Workflow Configuration

#### Workflow Definition
```yaml
# .github/workflows/documentation-agents.yml
name: Documentation Agent Workflow

on:
  push:
    branches: [main, develop]

jobs:
  documentation-review:
    if: contains(github.event.head_commit.message, 'Documentation Assessment:')
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Parse Commit Assessment
        id: parse
        run: |
          assessment=$(echo "${{ github.event.head_commit.message }}" | grep "Documentation Assessment:" | cut -d' ' -f3)
          echo "assessment=$assessment" >> $GITHUB_OUTPUT
      
      - name: Execute Agent Workflow
        if: steps.parse.outputs.assessment != 'NO_REVIEW'
        run: |
          echo "Executing documentation agent workflow"
          echo "Assessment Level: ${{ steps.parse.outputs.assessment }}"
          # Execute actual agent workflow
```

## Quality Assurance and Monitoring

### Workflow Success Metrics
- **Agent Execution Success Rate**: >95% of workflows complete without errors
- **Documentation Quality Improvement**: Measurable improvement in documentation metrics
- **Human Validation Efficiency**: <30 minutes for human review of agent outputs
- **Reasoning Trace Completeness**: 100% of transformations have complete audit trails

### Error Handling and Recovery
- **Agent Failure Recovery**: Graceful degradation when individual agents fail
- **Human Escalation**: Clear escalation path when automated workflow cannot complete
- **Rollback Procedures**: Ability to revert documentation changes if issues are discovered
- **Error Reporting**: Comprehensive logging and reporting of workflow issues

### Monitoring and Analytics
- **Workflow Performance**: Timing and success rate of each agent in the workflow
- **Documentation Health**: Automated monitoring of documentation quality metrics
- **User Impact**: Tracking of user experience improvements following documentation updates
- **Continuous Improvement**: Analysis of workflow effectiveness and optimization opportunities

## Integration with Development Process

### Branch Protection Rules
```yaml
# GitHub branch protection configuration
protection_rules:
  main:
    required_status_checks:
      - documentation-agent-workflow
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
```

### Pull Request Integration
- **Documentation Assessment Required**: All pull requests must include documentation assessment
- **Agent Workflow Preview**: Preview of documentation changes before merge
- **Human Review Requirement**: Documentation changes require human approval
- **Automated Testing**: All documentation examples tested before merge

### Release Process Integration
- **Pre-Release Documentation Validation**: Complete documentation review before release
- **Release Notes Generation**: Automated generation from documentation changes
- **User Communication**: Clear communication of documentation improvements in releases

## Configuration and Customization

### Agent Configuration
```json
{
  "documentation_agents": {
    "commit_analysis": {
      "enabled": true,
      "timeout": 300
    },
    "matrix_extraction": {
      "enabled": true,
      "methodology_templates": ["user_journey", "technical_accuracy", "consistency"]
    },
    "plan_generation": {
      "enabled": true,
      "max_improvement_tasks": 20
    },
    "documentation_update": {
      "enabled": true,
      "validation_required": true
    },
    "status_tracking": {
      "enabled": true,
      "auto_update_timestamps": true
    }
  }
}
```

### Customization Options
- **Assessment Levels**: Add custom assessment levels for specific project needs
- **Agent Workflows**: Customize agent sequence and processing logic
- **Validation Rules**: Configure specific validation requirements
- **Integration Points**: Customize integration with existing development tools

---

*This commit hooks system creates automated documentation maintenance that executes systematic improvement cycles based on development activity, ensuring documentation remains current and high-quality through structured agent workflows.*