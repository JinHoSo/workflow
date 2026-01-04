/**
 * Plugin package structure validator
 * Validates that plugins follow the standard package structure
 */

import * as fs from "fs"
import * as path from "path"
// import type { PluginManifest } from "./plugin-manifest" // Unused import removed

/**
 * Validation result
 */
export interface StructureValidationResult {
  /** Whether the structure is valid */
  valid: boolean
  /** List of validation errors */
  errors: string[]
  /** List of validation warnings */
  warnings: string[]
}

/**
 * Validates plugin package structure
 */
export class PluginStructureValidator {
  /**
   * Validates plugin directory structure
   * @param pluginDir - Path to plugin directory
   * @returns Validation result
   */
  async validateStructure(pluginDir: string): Promise<StructureValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required directories
    const requiredDirs = ["src"]
    for (const dir of requiredDirs) {
      const dirPath = path.join(pluginDir, dir)
      if (!fs.existsSync(dirPath)) {
        errors.push(`Required directory missing: ${dir}`)
      } else if (!fs.statSync(dirPath).isDirectory()) {
        errors.push(`Required directory is not a directory: ${dir}`)
      }
    }

    // Check required files
    const requiredFiles = ["package.json", "src/index.ts"]
    for (const file of requiredFiles) {
      const filePath = path.join(pluginDir, file)
      if (!fs.existsSync(filePath)) {
        errors.push(`Required file missing: ${file}`)
      } else if (!fs.statSync(filePath).isFile()) {
        errors.push(`Required file is not a file: ${file}`)
      }
    }

    // Check optional but recommended files
    const recommendedFiles = ["README.md", "LICENSE", "tsconfig.json"]
    for (const file of recommendedFiles) {
      const filePath = path.join(pluginDir, file)
      if (!fs.existsSync(filePath)) {
        warnings.push(`Recommended file missing: ${file}`)
      }
    }

    // Check package.json structure
    const packageJsonPath = path.join(pluginDir, "package.json")
    if (fs.existsSync(packageJsonPath)) {
      const packageJsonValidation = await this.validatePackageJson(packageJsonPath)
      errors.push(...packageJsonValidation.errors)
      warnings.push(...packageJsonValidation.warnings)
    }

    // Check entry point exports
    const indexPath = path.join(pluginDir, "src/index.ts")
    if (fs.existsSync(indexPath)) {
      const exportValidation = await this.validateEntryPoint(indexPath)
      errors.push(...exportValidation.errors)
      warnings.push(...exportValidation.warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validates package.json structure
   */
  private async validatePackageJson(packageJsonPath: string): Promise<{
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const content = fs.readFileSync(packageJsonPath, "utf-8")
      const packageJson = JSON.parse(content) as Record<string, unknown>

      // Check required fields
      const requiredFields = ["name", "version", "main"]
      for (const field of requiredFields) {
        if (!(field in packageJson)) {
          errors.push(`package.json missing required field: ${field}`)
        }
      }

      // Check workflow metadata
      const workflow = packageJson.workflow as Record<string, unknown> | undefined
      if (!workflow) {
        errors.push("package.json missing 'workflow' field")
      } else {
        if (workflow.plugin !== true) {
          errors.push("package.json 'workflow.plugin' must be true")
        }

        const nodeTypes = workflow.nodeTypes as unknown
        if (!Array.isArray(nodeTypes)) {
          errors.push("package.json 'workflow.nodeTypes' must be an array")
        } else if (nodeTypes.length === 0) {
          warnings.push("package.json 'workflow.nodeTypes' is empty")
        }
      }

      // Check keywords
      const keywords = packageJson.keywords as string[] | undefined
      if (!keywords || !keywords.includes("workflow-plugin")) {
        warnings.push("package.json 'keywords' should include 'workflow-plugin'")
      }
    } catch (error) {
      errors.push(`Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`)
    }

    return { errors, warnings }
  }

  /**
   * Validates entry point exports
   */
  private async validateEntryPoint(indexPath: string): Promise<{
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const content = fs.readFileSync(indexPath, "utf-8")

      // Check for plugin export
      if (!content.includes("export") || (!content.includes("plugin") && !content.includes("Plugin"))) {
        warnings.push("Entry point should export a 'plugin' object")
      }

      // Check for manifest export
      if (!content.includes("manifest")) {
        warnings.push("Entry point should export a 'manifest' object")
      }
    } catch (error) {
      errors.push(`Failed to read entry point: ${error instanceof Error ? error.message : String(error)}`)
    }

    return { errors, warnings }
  }
}

/**
 * Global structure validator instance
 */
export const pluginStructureValidator = new PluginStructureValidator()

