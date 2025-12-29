## MODIFIED Requirements

### Requirement: Scheduled Trigger
The system SHALL provide a ScheduledTrigger that executes workflows on a time-based schedule with flexible interval options and second-level precision. The schedule SHALL use a structured configuration format supporting minute, hour, day, month, and year intervals with precise time specifications.

#### Scenario: Minute-based schedule configuration
- **WHEN** a ScheduledTrigger is configured with type "minute" and second value (e.g., 11)
- **THEN** it SHALL validate that the second value is between 0 and 59
- **AND** it SHALL execute the workflow every minute at the specified second
- **AND** it SHALL trigger at times like HH:MM:11, HH:MM:11, etc.

#### Scenario: Hour-based schedule configuration
- **WHEN** a ScheduledTrigger is configured with type "hour", minute value (e.g., 10), and second value (e.g., 12)
- **THEN** it SHALL validate that minute is between 0-59 and second is between 0-59
- **AND** it SHALL execute the workflow every hour at the specified minute and second
- **AND** it SHALL trigger at times like 00:10:12, 01:10:12, 02:10:12, etc.

#### Scenario: Day-based schedule configuration
- **WHEN** a ScheduledTrigger is configured with type "day", hour value (e.g., 3), minute value (e.g., 10), and second value (e.g., 31)
- **THEN** it SHALL validate that hour is between 0-23, minute is between 0-59, and second is between 0-59
- **AND** it SHALL execute the workflow every day at the specified time
- **AND** it SHALL trigger at times like 03:10:31 on each day

#### Scenario: Month-based schedule configuration
- **WHEN** a ScheduledTrigger is configured with type "month", day value (e.g., 3), hour value (e.g., 5), minute value (e.g., 20), and second value (e.g., 1)
- **THEN** it SHALL validate that day is between 1-31, hour is between 0-23, minute is between 0-59, and second is between 0-59
- **AND** it SHALL execute the workflow on the specified day of each month at the specified time
- **AND** it SHALL trigger on the 3rd day of each month at 05:20:01
- **AND** it SHALL handle months with fewer days (e.g., if day is 31, it SHALL not trigger in February)

#### Scenario: Year-based schedule configuration
- **WHEN** a ScheduledTrigger is configured with type "year", month value (e.g., 12), day value (e.g., 31), hour value (e.g., 22), minute value (e.g., 10), and second value (e.g., 1)
- **THEN** it SHALL validate that month is between 1-12, day is valid for the month, hour is between 0-23, minute is between 0-59, and second is between 0-59
- **AND** it SHALL execute the workflow on the specified date and time each year
- **AND** it SHALL trigger on December 31st at 22:10:01 each year
- **AND** it SHALL handle leap years correctly (February 29th)

#### Scenario: Schedule activation
- **WHEN** a ScheduledTrigger is activated (setup() is called with valid schedule configuration)
- **THEN** it SHALL start scheduling workflow executions
- **AND** it SHALL calculate the next execution time based on the current time and schedule
- **AND** it SHALL schedule the first execution using the calculated time
- **AND** the trigger SHALL transition to Active state

#### Scenario: Scheduled execution
- **WHEN** the scheduled time arrives
- **THEN** the ScheduledTrigger SHALL automatically execute the workflow
- **AND** it SHALL provide execution data including the execution timestamp
- **AND** it SHALL calculate and schedule the next execution time
- **AND** it SHALL continue scheduling subsequent executions

#### Scenario: Schedule deactivation
- **WHEN** a ScheduledTrigger is deactivated (workflow stopped or trigger removed)
- **THEN** it SHALL stop all scheduled executions
- **AND** it SHALL cancel any pending timers
- **AND** it SHALL clean up scheduling resources
- **AND** the trigger SHALL transition to Inactive state

#### Scenario: Schedule modification
- **WHEN** a ScheduledTrigger's schedule configuration is modified while active
- **THEN** it SHALL cancel the current schedule
- **AND** it SHALL validate the new schedule configuration
- **AND** it SHALL start scheduling with the new configuration
- **AND** it SHALL calculate the next execution time based on the new schedule

#### Scenario: Invalid schedule configuration
- **WHEN** a ScheduledTrigger is configured with invalid time values (e.g., second > 59, hour > 23, invalid day for month)
- **THEN** it SHALL reject the configuration
- **AND** it SHALL throw a validation error with a clear message
- **AND** it SHALL NOT activate the schedule

#### Scenario: Next execution time calculation
- **WHEN** calculating the next execution time for a schedule
- **THEN** it SHALL return a time that is in the future
- **AND** it SHALL account for the current time (if current time has passed the scheduled time today, schedule for next interval)
- **AND** it SHALL handle month-end and year-end boundaries correctly
- **AND** it SHALL handle leap years for February 29th schedules

#### Scenario: Multiple schedule executions
- **WHEN** a ScheduledTrigger executes multiple times
- **THEN** each execution SHALL be independent
- **AND** previous executions SHALL NOT interfere with subsequent executions
- **AND** the trigger SHALL maintain accurate scheduling across multiple executions

#### Scenario: Schedule with execution data
- **WHEN** a ScheduledTrigger executes at the scheduled time
- **THEN** it SHALL provide execution data through output ports
- **AND** the execution data SHALL include the execution timestamp
- **AND** the execution data SHALL include schedule information (type, configured times)
- **AND** the workflow SHALL receive this data as input

