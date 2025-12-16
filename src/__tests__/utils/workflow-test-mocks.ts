/**
 * Mock services for workflow orchestration tests
 * Extracted from workflow-orchestration.property.test.ts for reusability
 */

import {
    WorkflowDefinition,
    WorkflowExecution,
    BusinessRule,
    RuleEvaluationRequest,
    RuleEvaluationResult,
    SagaDefinition,
    SagaExecution
} from '../microservices/workflow-orchestration.property.test';

export class MockWorkflowEngineService {
    private executions: Map<string, WorkflowExecution> = new Map();
    private definitions: Map<string, WorkflowDefinition> = new Map();

    async startWorkflow(definition: WorkflowDefinition, context: Record<string, any>): Promise<WorkflowExecution> {
        // Implementation moved from main test file
        // This improves maintainability and reusability
        // ... (implementation details)
    }

    // ... other methods
}

export class MockRulesEngineService {
    // ... implementation
}

export class MockSagaCoordinatorService {
    // ... implementation
}