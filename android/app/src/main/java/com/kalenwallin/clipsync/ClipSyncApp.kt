package com.kalenwallin.clipsync

import android.app.Application
import android.util.Log

class ClipSyncApp : Application() {
    override fun onCreate() {
        super.onCreate()

        // Initialize Convex Manager
        try {
            ConvexManager.initialize(this)
            Log.d("ClipSync", "Convex Manager Initialized")
        } catch (e: Exception) {
            Log.e("ClipSync", "Failed to initialize Convex: ${e.message}")
        }
        
        val deviceId = DeviceManager.getDeviceId(this)
        Log.d("ClipSync", "Device ID: $deviceId")
    }
}
