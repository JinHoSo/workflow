/**
 * Tests for ConnectionUtils
 * Tests link mapping and connection validation utilities
 */

import { mapLinksByTarget } from "../connection-utils"
import type { WorkflowLinks } from "@workflow/interfaces"
import { LinkType } from "@workflow/interfaces"

describe("ConnectionUtils", () => {
  describe("mapLinksByTarget", () => {
    it("should map links from source to target", () => {
      const linksBySource: WorkflowLinks = {
        Node1: {
          input1: [
            {
              targetNode: "Node2",
              linkType: LinkType.Standard,
              outputPortName: "output1",
            },
          ],
        },
      }
      const linksByTarget = mapLinksByTarget(linksBySource)
      expect(linksByTarget["Node2"]).toBeDefined()
      expect(linksByTarget["Node2"]["input1"]).toBeDefined()
      expect(linksByTarget["Node2"]["input1"][0].targetNode).toBe("Node1")
    })

    it("should handle empty links", () => {
      const linksBySource: WorkflowLinks = {}
      const linksByTarget = mapLinksByTarget(linksBySource)
      expect(Object.keys(linksByTarget)).toHaveLength(0)
    })

    it("should handle multiple links to same target", () => {
      const linksBySource: WorkflowLinks = {
        Node1: {
          input1: [
            {
              targetNode: "Node2",
              linkType: LinkType.Standard,
              outputPortName: "output1",
            },
          ],
        },
        Node3: {
          input1: [
            {
              targetNode: "Node2",
              linkType: LinkType.Standard,
              outputPortName: "output1",
            },
          ],
        },
      }
      const linksByTarget = mapLinksByTarget(linksBySource)
      expect(linksByTarget["Node2"]["input1"].length).toBe(2)
    })

    it("should preserve link type", () => {
      const linksBySource: WorkflowLinks = {
        Node1: {
          input1: [
            {
              targetNode: "Node2",
              linkType: LinkType.Standard,
              outputPortName: "output1",
            },
          ],
        },
      }
      const linksByTarget = mapLinksByTarget(linksBySource)
      expect(linksByTarget["Node2"]["input1"][0].linkType).toBe(LinkType.Standard)
    })

    it("should handle multiple input ports", () => {
      const linksBySource: WorkflowLinks = {
        Node1: {
          input1: [
            {
              targetNode: "Node2",
              linkType: LinkType.Standard,
              outputPortName: "output1",
            },
          ],
          input2: [
            {
              targetNode: "Node2",
              linkType: LinkType.Standard,
              outputPortName: "output2",
            },
          ],
        },
      }
      const linksByTarget = mapLinksByTarget(linksBySource)
      expect(linksByTarget["Node2"]["input1"]).toBeDefined()
      expect(linksByTarget["Node2"]["input2"]).toBeDefined()
    })
  })
})

