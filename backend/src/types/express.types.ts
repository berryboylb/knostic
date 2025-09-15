import { CSVData } from "./csv.types.js";

declare global {
  namespace Express {
    interface Locals {
      csvData: CSVData;
    }
  }
}
