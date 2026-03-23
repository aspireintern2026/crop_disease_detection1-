export interface AffectedRegion {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in normalized coordinates (0-1000)
  label: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  diseaseName: string;
  cropType: string;
  confidence: number;
  severity: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  treatment: string[];
  prevention: string[];
  visualMarkers: string[];
  environmentalFactors: string[];
  affectedRegions: AffectedRegion[];
  actionUrgency: string;
  isHealthy: boolean;
  imageUrl?: string;
}

export interface PlantInfo {
  commonName: string;
  scientificName: string;
}
