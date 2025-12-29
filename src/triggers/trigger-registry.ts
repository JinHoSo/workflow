import type { TriggerNodeBase } from "./base-trigger"
import type { NodeProperties } from "../interfaces"

/**
 * Registry for managing trigger types
 * Allows registration and retrieval of trigger classes
 */
export class TriggerRegistry {
  private triggers: Map<string, new (properties: NodeProperties) => TriggerNodeBase> = new Map()

  /**
   * Registers a trigger class
   * @param name - Name of the trigger type
   * @param triggerClass - Trigger class constructor
   */
  register(name: string, triggerClass: new (properties: NodeProperties) => TriggerNodeBase): void {
    this.triggers.set(name, triggerClass)
  }

  /**
   * Gets a trigger class by name
   * @param name - Name of the trigger type
   * @returns Trigger class constructor or undefined if not found
   */
  get(name: string): ((new (properties: NodeProperties) => TriggerNodeBase) | undefined) {
    return this.triggers.get(name)
  }

  /**
   * Gets all registered trigger type names
   * @returns Array of trigger type names
   */
  getAll(): string[] {
    return Array.from(this.triggers.keys())
  }
}
