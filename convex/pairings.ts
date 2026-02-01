import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get pairing by Mac device ID
export const getByMacId = query({
  args: { macDeviceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pairings")
      .withIndex("by_macId", (q) => q.eq("macDeviceId", args.macDeviceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
  },
});

// Query: Get pairing by ID
export const get = query({
  args: { pairingId: v.id("pairings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pairingId);
  },
});

// Query: Get pairing by ID (string version for clients)
export const getByIdString = query({
  args: { pairingId: v.string() },
  handler: async (ctx, args) => {
    try {
      const id = ctx.db.normalizeId("pairings", args.pairingId);
      if (!id) return null;
      return await ctx.db.get(id);
    } catch {
      return null;
    }
  },
});

// Query: Watch for new pairings (for Mac listening after QR display)
export const watchForPairing = query({
  args: {
    macDeviceId: v.string(),
    sinceTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const pairing = await ctx.db
      .query("pairings")
      .withIndex("by_macId", (q) => q.eq("macDeviceId", args.macDeviceId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.gte(q.field("createdAt"), args.sinceTimestamp)
        )
      )
      .order("desc")
      .first();

    return pairing;
  },
});

// Query: Check if pairing exists (for monitoring unpair)
export const exists = query({
  args: { pairingId: v.string() },
  handler: async (ctx, args) => {
    try {
      const id = ctx.db.normalizeId("pairings", args.pairingId);
      if (!id) return false;
      const pairing = await ctx.db.get(id);
      return pairing !== null && pairing.status === "active";
    } catch {
      return false;
    }
  },
});

// Mutation: Create new pairing (called by Android after QR scan)
export const create = mutation({
  args: {
    androidDeviceId: v.string(),
    androidDeviceName: v.string(),
    macDeviceId: v.string(),
    macDeviceName: v.string(),
  },
  handler: async (ctx, args) => {
    // Delete any existing pairing for this Android device
    const existingAndroidPairing = await ctx.db
      .query("pairings")
      .withIndex("by_androidId", (q) =>
        q.eq("androidDeviceId", args.androidDeviceId)
      )
      .first();

    if (existingAndroidPairing) {
      // Delete associated clipboard items
      const clipboardItems = await ctx.db
        .query("clipboardItems")
        .withIndex("by_pairing", (q) =>
          q.eq("pairingId", existingAndroidPairing._id)
        )
        .collect();

      for (const item of clipboardItems) {
        await ctx.db.delete(item._id);
      }

      await ctx.db.delete(existingAndroidPairing._id);
    }

    // Also check for existing Mac pairing and clean up
    const existingMacPairing = await ctx.db
      .query("pairings")
      .withIndex("by_macId", (q) => q.eq("macDeviceId", args.macDeviceId))
      .first();

    if (existingMacPairing) {
      // Delete associated clipboard items
      const clipboardItems = await ctx.db
        .query("clipboardItems")
        .withIndex("by_pairing", (q) =>
          q.eq("pairingId", existingMacPairing._id)
        )
        .collect();

      for (const item of clipboardItems) {
        await ctx.db.delete(item._id);
      }

      await ctx.db.delete(existingMacPairing._id);
    }

    // Create new pairing
    const pairingId = await ctx.db.insert("pairings", {
      androidDeviceId: args.androidDeviceId,
      androidDeviceName: args.androidDeviceName,
      macDeviceId: args.macDeviceId,
      macDeviceName: args.macDeviceName,
      status: "active",
      createdAt: Date.now(),
    });

    return pairingId;
  },
});

// Mutation: Delete pairing (unpair)
export const remove = mutation({
  args: { pairingId: v.string() },
  handler: async (ctx, args) => {
    try {
      const id = ctx.db.normalizeId("pairings", args.pairingId);
      if (!id) return;

      // Delete all clipboard items for this pairing
      const clipboardItems = await ctx.db
        .query("clipboardItems")
        .withIndex("by_pairing", (q) => q.eq("pairingId", id))
        .collect();

      for (const item of clipboardItems) {
        await ctx.db.delete(item._id);
      }

      // Delete the pairing
      await ctx.db.delete(id);
    } catch {
      // Pairing may already be deleted
    }
  },
});
