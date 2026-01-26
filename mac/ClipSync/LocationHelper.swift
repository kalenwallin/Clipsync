//
//  LocationHelper.swift
//  ClipSync
//

import Foundation

class LocationHelper {
    static let shared = LocationHelper()
    
    // --- IP Location Detection ---
    func detectRegion(completion: @escaping (String?) -> Void) {
        // Primary: ip-api.com
        let primaryUrl = URL(string: "https://ip-api.com/json/")!
        
        let task = URLSession.shared.dataTask(with: primaryUrl) { [weak self] data, response, error in
            if let data = data, error == nil,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let countryCode = json["countryCode"] as? String {
                print(" Region Detected (Primary): \(countryCode)")
                completion(countryCode)
                return
            }
            
            print(" Primary location check failed. Trying fallback...")
            self?.detectRegionFallback(completion: completion)
        }
        task.resume()
    }
    
    private func detectRegionFallback(completion: @escaping (String?) -> Void) {
        // Fallback: api.country.is (Simple, returns JSON: {"country": "US"})
        guard let url = URL(string: "https://api.country.is") else {
            completion(nil)
            return
        }
        
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let data = data, error == nil,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let countryCode = json["country"] as? String {
                print(" Region Detected (Fallback): \(countryCode)")
                completion(countryCode)
            } else {
                print(" All location checks failed. Defaulting.")
                completion(nil)
            }
        }
        task.resume()
    }
}
