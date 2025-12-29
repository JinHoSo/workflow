# workflow-triggers Specification

## Purpose
TBD - created by archiving change add-workflow-engine. Update Purpose after archive.
## Requirements
### Requirement: Trigger Base Class
The system SHALL provide a base Trigger class that extends Node and serves as the foundation for all trigger types.

#### Scenario: Trigger as node
- **WHEN** a Trigger is created
- **THEN** it SHALL be a valid Node instance
- **AND** it SHALL have all node capabilities (ports, status, actions)
- **AND** it SHALL have a trigger-specific execution method

#### Scenario: Trigger execution
- **WHEN** a trigger executes
- **THEN** it SHALL initiate workflow execution
- **AND** it SHALL provide initial data to the workflow through its output ports

### Requirement: Manual Trigger
The system SHALL provide a ManualTriggerNode that allows workflows to be executed manually via a programmatic function call.

#### Scenario: Create manual trigger node
- **WHEN** a ManualTriggerNode is created
- **THEN** it SHALL extend BaseNode
- **AND** it SHALL have an output port for initial data
- **AND** it SHALL be in Inactive state
- **AND** it SHALL provide a public execute() method

#### Scenario: Manual execution via function call
- **WHEN** the execute() method is called on a ManualTriggerNode
- **THEN** it SHALL immediately start the workflow execution
- **AND** it SHALL provide any configured or passed data through output ports
- **AND** the trigger node SHALL transition to Executed state

#### Scenario: Manual trigger with initial data
- **WHEN** execute() is called with data parameter
- **THEN** the provided data SHALL be sent through the output port
- **AND** the workflow SHALL receive the data as input

#### Scenario: Manual trigger configuration
- **WHEN** a ManualTriggerNode is configured
- **THEN** it SHALL accept optional initial data parameters
- **AND** the configuration SHALL be stored
- **AND** if initial data is configured, it SHALL be used when execute() is called without parameters

#### Scenario: Manual trigger without configuration
- **WHEN** execute() is called on a ManualTriggerNode without configuration
- **THEN** the workflow SHALL still execute
- **AND** output port SHALL contain empty or default data
- **AND** the trigger SHALL function correctly

#### Scenario: Multiple manual executions
- **WHEN** execute() is called multiple times on a ManualTriggerNode
- **THEN** each call SHALL start a new workflow execution
- **AND** previous executions SHALL NOT interfere with new executions
- **AND** the node SHALL handle concurrent or sequential executions appropriately

### Requirement: Scheduled Trigger
The system SHALL provide a ScheduledTrigger that executes workflows on a schedule (cron-like).

#### Scenario: Schedule configuration
- **WHEN** a ScheduledTrigger is configured
- **THEN** it SHALL accept a schedule expression (cron-like format)
- **AND** the schedule SHALL be validated

#### Scenario: Scheduled execution
- **WHEN** the scheduled time arrives
- **THEN** the ScheduledTrigger SHALL automatically execute
- **AND** it SHALL start the workflow execution

#### Scenario: Schedule modification
- **WHEN** a ScheduledTrigger's schedule is modified
- **THEN** the new schedule SHALL replace the old schedule
- **AND** the trigger SHALL use the new schedule for future executions

### Requirement: Webhook Trigger
The system SHALL provide a WebhookTrigger that executes workflows when an HTTP request is received.

#### Scenario: Webhook registration
- **WHEN** a WebhookTrigger is configured
- **THEN** it SHALL generate a webhook URL endpoint
- **AND** the endpoint SHALL be unique to the trigger instance

#### Scenario: Webhook execution
- **WHEN** an HTTP request is received at the webhook endpoint
- **THEN** the WebhookTrigger SHALL execute
- **AND** it SHALL extract request data (headers, body, query params)
- **AND** it SHALL provide the request data through output ports
- **AND** it SHALL start the workflow execution

#### Scenario: Webhook method filtering
- **WHEN** a WebhookTrigger is configured with specific HTTP methods
- **THEN** only requests matching those methods SHALL trigger execution
- **AND** other methods SHALL be rejected

### Requirement: Socket Trigger
The system SHALL provide a SocketTrigger that executes workflows when data is received through a socket connection (WebSocket or similar).

#### Scenario: Socket connection
- **WHEN** a SocketTrigger is configured
- **THEN** it SHALL establish a socket connection endpoint
- **AND** the endpoint SHALL be unique to the trigger instance

#### Scenario: Socket data reception
- **WHEN** data is received through the socket connection
- **THEN** the SocketTrigger SHALL execute
- **AND** it SHALL provide the received data through output ports
- **AND** it SHALL start the workflow execution

#### Scenario: Socket disconnection
- **WHEN** a socket connection is disconnected
- **THEN** the SocketTrigger SHALL handle the disconnection gracefully
- **AND** it SHALL be able to reconnect when configured

### Requirement: Extensible Trigger System
The system SHALL provide a mechanism for adding new trigger types without modifying core code.

#### Scenario: Register new trigger type
- **WHEN** a new trigger class is created extending the base Trigger class
- **THEN** it SHALL be registerable in the trigger registry
- **AND** it SHALL be usable in workflows like built-in triggers

#### Scenario: Trigger discovery
- **WHEN** available triggers are queried
- **THEN** the system SHALL return all registered trigger types
- **AND** each trigger type SHALL include metadata (name, description, configuration schema)

#### Scenario: Trigger instantiation
- **WHEN** a trigger type is selected for use in a workflow
- **THEN** the system SHALL instantiate the trigger using the registry
- **AND** the instance SHALL be a valid node in the workflow

