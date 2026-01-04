# Troubleshooting Guide

Common issues and solutions when developing plugins and nodes.

## Plugin Issues

### Plugin Not Discovered

**Symptoms**: Plugin doesn't appear in plugin list

**Solutions**:
1. Check `package.json` has `workflow.plugin: true`
2. Verify `workflow.nodeTypes` array is populated
3. Ensure plugin is in `node_modules` or watch directories
4. Check plugin directory structure is correct

### Plugin Not Loading

**Symptoms**: Plugin discovered but not loading

**Solutions**:
1. Check `src/index.ts` exports plugin correctly
2. Verify node classes are exported
3. Check for TypeScript compilation errors
4. Ensure all dependencies are installed

### Plugin Registration Fails

**Symptoms**: Error when registering plugin

**Solutions**:
1. Check plugin manifest is valid
2. Verify dependencies are satisfied
3. Check for version conflicts
4. Review error messages

## Node Issues

### Node Not Appearing

**Symptoms**: Node type not available

**Solutions**:
1. Verify node is in plugin's `nodeTypes` array
2. Check node is exported from plugin
3. Ensure plugin is registered
4. Check node type name matches

### Node Execution Fails

**Symptoms**: Node fails during execution

**Solutions**:
1. Check node extends BaseNode
2. Verify process() method is implemented
3. Check configuration is valid
4. Review error messages
5. Validate protocol compliance

### Configuration Validation Fails

**Symptoms**: Configuration not accepted

**Solutions**:
1. Check schema definition
2. Verify configuration matches schema
3. Check required fields
4. Review validation errors

## Build Issues

### TypeScript Compilation Errors

**Solutions**:
1. Check TypeScript version compatibility
2. Verify tsconfig.json settings
3. Check for type errors
4. Ensure all dependencies are installed

### Build Fails

**Solutions**:
1. Check for syntax errors
2. Verify all imports are correct
3. Check for missing dependencies
4. Review build error messages

## Test Issues

### Tests Not Running

**Solutions**:
1. Check Jest configuration
2. Verify test file naming (*.test.ts)
3. Ensure test utilities are installed
4. Check test file location

### Test Failures

**Solutions**:
1. Review test error messages
2. Check mocks are set up correctly
3. Verify test data
4. Check node state management

## Validation Issues

### Protocol Validation Fails

**Symptoms**: `workflow validate` reports issues

**Solutions**:
1. Review validation errors
2. Check protocol compliance
3. Use `--suggest` flag for fix suggestions
4. Review protocol documentation

### Structure Validation Fails

**Solutions**:
1. Check directory structure
2. Verify required files exist
3. Check package.json structure
4. Review validation errors

## Development Issues

### Hot Reloading Not Working

**Solutions**:
1. Check chokidar is installed
2. Verify watch directories
3. Check file permissions
4. Review console for errors

### Changes Not Reflecting

**Solutions**:
1. Rebuild the project
2. Restart development server
3. Clear module cache
4. Check file watching is active

## Common Errors

### "Plugin already registered"

**Solution**: Unregister plugin first or use different version

### "Dependency not found"

**Solution**: Install missing dependencies or check dependency names

### "Node type conflict"

**Solution**: Use conflict resolution strategy or remove conflicting plugins

### "Invalid configuration"

**Solution**: Check schema and configuration match

## Getting Help

1. Check documentation
2. Review error messages
3. Search existing issues
4. Ask in community forums
5. Open a new issue with details

## Debugging Tips

1. **Enable verbose logging**: Set debug environment variables
2. **Use validation**: Run `workflow validate` regularly
3. **Check state**: Inspect node state during execution
4. **Review logs**: Check console output for errors
5. **Test incrementally**: Test small changes at a time

