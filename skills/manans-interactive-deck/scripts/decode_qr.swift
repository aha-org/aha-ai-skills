import CoreImage
import Foundation
let img = CIImage(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))!
let d = CIDetector(ofType: CIDetectorTypeQRCode, context: nil, options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])!
for f in d.features(in: img) { if let q = f as? CIQRCodeFeature { print(q.messageString ?? "nil") } }
