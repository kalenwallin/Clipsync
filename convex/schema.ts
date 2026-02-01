import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Pairings table - stores device pairing relationships
  pairings: defineTable({
    // Device identifiers
    androidDeviceId: v.string(),
    androidDeviceName: v.string(),
    macDeviceId: v.string(),
    macDeviceName: v.string(),

    // Metadata
    status: v.string(), // "active" | "inactive"
    createdAt: v.number(), // Unix timestamp (ms)
  })
    .index("by_macId", ["macDeviceId"])
    .index("by_androidId", ["androidDeviceId"])
    .index("by_status", ["status"]),

  // Clipboard items table - stores encrypted clipboard content
  clipboardItems: defineTable({
    // Content (encrypted client-side with AES-256-GCM)
    content: v.string(), // Base64 encoded encrypted data

    // References
    pairingId: v.id("pairings"),
    sourceDeviceId: v.string(),

    // Metadata
    type: v.string(), // "text" | "image" (future)
  })
    .index("by_pairing", ["pairingId"]),
});
