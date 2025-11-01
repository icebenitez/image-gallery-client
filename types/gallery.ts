export interface Image {
  id: string;
  originalUrl: string | null;
  thumbnailUrl: string | null;
  description: string;
  tags: string[];
  uploadDate: string;
  colors: string[]; // string of hex codes

  // OPTIONALS
  aiProcessingStatus?: "pending" | "completed" | "error";

  // similar
  similarityScore?: number;
  
  // color-matched
  colorMatch?: {
    minDistance: number;
    avgDistance: number;
    threshold: number;
  };

}
