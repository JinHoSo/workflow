# Common Issues

Frequently encountered problems and their solutions.

## Node Not Executing

### Symptoms
Node remains in Idle state and doesn't execute.

### Solutions
1. Check node connections are correct
2. Verify execution engine is set up
3. Ensure trigger is activated
4. Check node is not disabled

## Data Not Flowing

### Symptoms
Nodes don't receive expected input data.

### Solutions
1. Verify port names match in `linkNodes()` calls
2. Check source node produces output
3. Ensure data structure matches expected format
4. Verify connections are correct

## Execution Errors

### Symptoms
Workflow execution fails or nodes fail.

### Solutions
1. Check error messages in node.error
2. Verify node configuration is correct
3. Check input data format
4. Review error handling configuration

## Type Errors

### Symptoms
TypeScript compilation errors.

### Solutions
1. Ensure TypeScript version is compatible
2. Check type definitions are imported
3. Verify node properties match interface
4. Review type annotations

## Performance Issues

### Symptoms
Workflows execute slowly.

### Solutions
1. Use parallel execution where possible
2. Optimize node processing logic
3. Check for unnecessary data processing
4. Review workflow structure

## Related Documentation

- [Troubleshooting](../TROUBLESHOOTING.md)
- [FAQ](./faq.md)
- [Error Handling](./error-handling.md)

