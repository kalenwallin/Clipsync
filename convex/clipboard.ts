import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get latest clipboard item for a pairing
export const getLatest = query({
  args: { pairingId: v.string() },
  handler: async (ctx, args) => {
    try {
      const id = ctx.db.normalizeId("pairings", args.pairingId);
      if (!id) return null;

      return await ctx.db
        .query("clipboardItems")
        .withIndex("by_pairing", (q) => q.eq("pairingId", id))
        .order("desc")
        .first();
    } catch {
      return null;
    }
  },
});

// Query: Get clipboard history for a pairing
export const getHistory = query({
  args: {
    pairingId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const id = ctx.db.normalizeId("pairings", args.pairingId);
      if (!id) return [];

      return await ctx.db
        .query("clipboardItems")
        .withIndex("by_pairing", (q) => q.eq("pairingId", id))
        .order("desc")
        .take(args.limit ?? 50);
    } catch {
      return [];
    }
  },
});

// Mutation: Send clipboard item
export const send = mutation({
  args: {
    pairingId: v.string(),
    content: v.string(), // Already encrypted by client
    sourceDeviceId: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize pairing ID
    const id = ctx.db.normalizeId("pairings", args.pairingId);
    if (!id) {
      throw new Error("Invalid pairing ID");
    }

    // Verify pairing exists
    const pairing = await ctx.db.get(id);
    if (!pairing) {
      throw new Error("Pairing not found");
    }

    if (pairing.status !== "active") {
      throw new Error("Pairing is not active");
    }

    // Insert clipboard item
    const itemId = await ctx.db.insert("clipboardItems", {
      pairingId: id,
      content: args.content,
      sourceDeviceId: args.sourceDeviceId,
      type: args.type,
    });

    return itemId;
  },
});

// Mutation: Clear clipboard history for a pairing
export const clear = mutation({
  args: { pairingId: v.string() },
  handler: async (ctx, args) => {
    try {
      const id = ctx.db.normalizeId("pairings", args.pairingId);
      if (!id) return 0;

      const items = await ctx.db
        .query("clipboardItems")
        .withIndex("by_pairing", (q) => q.eq("pairingId", id))
        .collect();

      for (const item of items) {
        await ctx.db.delete(item._id);
      }

      return items.length;
    } catch {
      return 0;
    }
  },
});
