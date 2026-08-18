import { jsPDF } from "jspdf";
import { PredictResponse } from "../services/api";

export function generateCollisionReport(prediction: PredictResponse): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // 1. Deep Space Header Styling
  doc.setFillColor(3, 7, 18); // matches deep space bg (#030712)
  doc.rect(0, 0, 210, 45, "F");

  // Cyan glowing accent line
  doc.setFillColor(6, 182, 212); // cyan
  doc.rect(0, 44, 210, 1, "F");

  // Brand Name
  doc.setTextColor(6, 182, 212);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("SpaceShield AI", 15, 20);

  // Subtitle
  doc.setTextColor(156, 163, 175);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("SPACE SITUATIONAL AWARENESS & COLLISION RISK REPORT", 15, 30);

  // Generation details
  const generatedTime = new Date(prediction.timestamp).toLocaleString();
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text(`REPORT EPOCH: ${generatedTime}`, 15, 38);

  // 2. Target Satellite Heading
  doc.setTextColor(17, 24, 39); // dark slate/black
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`TARGET ASSET: ${prediction.satellite_name.toUpperCase()}`, 15, 60);

  // Thin separator
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(15, 64, 195, 64);

  // 3. Telemetry Table Block
  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ORBITAL TELEMETRY VECTORS", 15, 73);

  // Telemetry items left column
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.text(`Satellite Altitude: ${prediction.altitude.toFixed(1)} km`, 20, 82);
  doc.text(`Satellite Velocity: ${prediction.velocity.toFixed(2)} km/s`, 20, 90);
  doc.text(`Orbital Inclination: ${prediction.inclination.toFixed(4)} degrees`, 20, 98);
  doc.text(`Orbital Period: ${prediction.orbital_period.toFixed(1)} minutes`, 20, 106);

  // Telemetry items right column
  doc.text(`Debris Proximity (CA): ${prediction.relative_distance.toFixed(2)} km`, 115, 82);
  doc.text(`Debris Crossing Velocity: ${prediction.relative_velocity.toFixed(1)} km/s (or ~${(prediction.relative_velocity * 3600).toLocaleString()} km/h)`, 115, 90);

  // Section Border
  doc.line(15, 112, 195, 112);

  // 4. Collision Assessment Panel
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  doc.text("COLLISION RISK ASSESSMENT RESULTS", 15, 122);

  // Threat Level Output box
  const risk = prediction.prediction;
  let bgR = 240, bgG = 253, bgB = 250; // default green-50
  let strokeR = 16, strokeG = 185, strokeB = 129; // default green-500
  let textR = 6, textG = 95, textB = 70; // dark green-800

  if (risk === "High Risk") {
    bgR = 254; bgG = 242; bgB = 242; // red-50
    strokeR = 239; strokeG = 68; strokeB = 68; // red-500
    textR = 153; textG = 27; textB = 27; // dark red-800
  } else if (risk === "Medium Risk") {
    bgR = 255; bgG = 251; bgB = 235; // amber-50
    strokeR = 245; strokeG = 158; strokeB = 11; // amber-500
    textR = 146; textG = 64; textB = 14; // dark amber-800
  }

  // Draw assessment box
  doc.setFillColor(bgR, bgG, bgB);
  doc.setDrawColor(strokeR, strokeG, strokeB);
  doc.setLineWidth(0.5);
  doc.rect(15, 128, 180, 22, "FD");

  // Write threat level
  doc.setTextColor(textR, textG, textB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(risk.toUpperCase(), 25, 142);

  // Write confidence percentage
  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`ML CLASSIFIER CONFIDENCE: ${(prediction.confidence * 100).toFixed(1)}%`, 110, 141);

  // Section Border
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(15, 158, 195, 158);

  // 5. Physics Diagnosis Explanations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  doc.text("EXPLAINABLE AI DIAGNOSTIC BREAKDOWN", 15, 168);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(55, 65, 81);
  
  let yPosition = 177;
  if (prediction.explanation && prediction.explanation.length > 0) {
    prediction.explanation.forEach((note) => {
      // Split text to ensure it wraps cleanly within PDF boundaries
      const splitNote = doc.splitTextToSize(`•  ${note}`, 175);
      splitNote.forEach((line: string) => {
        doc.text(line, 20, yPosition);
        yPosition += 7;
      });
    });
  } else {
    doc.text("No explanations logged for this prediction.", 20, yPosition);
    yPosition += 7;
  }

  // Section Border
  doc.line(15, 230, 195, 230);

  // 6. Feature Contributions Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  doc.text("TELEMETRY WEIGHT ATTRIBUTIONS", 15, 239);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  
  let barY = 246;
  if (prediction.feature_importance) {
    Object.entries(prediction.feature_importance).forEach(([featName, value]) => {
      doc.setTextColor(55, 65, 81);
      doc.text(`${featName}:`, 20, barY);
      
      const pct = Math.round(value * 100);
      doc.setTextColor(6, 182, 212);
      doc.setFont("helvetica", "bold");
      doc.text(`${pct}%`, 60, barY);
      doc.setFont("helvetica", "normal");
      
      // Draw progress bar
      doc.setFillColor(243, 244, 246);
      doc.rect(75, barY - 3.5, 100, 4, "F");
      doc.setFillColor(6, 182, 212);
      doc.rect(75, barY - 3.5, Math.max(1, pct), 4, "F");

      barY += 7;
    });
  }

  // 7. Footer Notice
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("DISCLAIMER: This report is generated by a Machine Learning classification model for space situational education and planning purposes only.", 15, 285);

  // Save PDF
  const safeName = prediction.satellite_name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  doc.save(`spaceshield_report_${safeName}_${prediction.id || "temp"}.pdf`);
}
