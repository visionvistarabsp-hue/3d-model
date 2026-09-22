#!/usr/bin/env node
/**
 * CLI for authoritative data ingestion
 * Usage: npx tsx scripts/ingest-authoritative.ts <input.dxf|input.pdf> [output-dir]
 */

import { parseDXFFile, parsePDFFloorPlan, ingestFloorPlans, validateIngestionResult } from "@/lib/ingestion/authoritative-pipeline";
import * as fs from "fs/promises";
import * as path from "path";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: ingest-authoritative <input.dxf|input.pdf> [output-dir]");
    process.exit(1);
  }

  const inputFile = args[0];
  const outputDir = args[1] || "data/authoritative";

  console.log(`[ingestion] Reading ${inputFile}...`);

  const buffer = await fs.readFile(inputFile);
  const ext = path.extname(inputFile).toLowerCase();

  let rawPlans;
  if (ext === ".dxf") {
    rawPlans = await parseDXFFile(buffer);
  } else if (ext === ".pdf") {
    rawPlans = await parsePDFFloorPlan(buffer);
  } else {
    console.error(`Unsupported file type: ${ext}`);
    process.exit(1);
  }

  console.log(`[ingestion] Parsed ${rawPlans.length} floors`);

  const result = ingestFloorPlans(rawPlans);

  const validation = validateIngestionResult(result);
  if (!validation.valid) {
    console.error("[ingestion] Validation failed:");
    for (const err of validation.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn("[ingestion] Warnings:");
    for (const warn of result.warnings) {
      console.warn(`  - ${warn}`);
    }
  }

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Write output files
  await fs.writeFile(
    path.join(outputDir, "shops.json"),
    JSON.stringify(result.shops, null, 2)
  );
  await fs.writeFile(
    path.join(outputDir, "floors.json"),
    JSON.stringify(result.floors, null, 2)
  );

  const building = {
    id: result.building.id,
    name: result.building.name,
    floors: result.floors,
    shopCount: result.building.shopCount,
  };
  await fs.writeFile(
    path.join(outputDir, "building.json"),
    JSON.stringify(building, null, 2)
  );

  // Generate model manifest
  const manifest = {
    source: "authoritative",
    isDemo: false,
    modelId: "mall-auth-001",
    label: "Authoritative Mall",
    version: "1.0.0",
    units: "meters",
    layout: "per_floor" as const,
    glbKey: "models/authoritative-mall.glb",
    floors: result.floors.map(f => ({
      floorId: f.id,
      glbKey: `models/authoritative-${f.id.toLowerCase()}.glb`,
    })),
    objectNaming: "SHOP_<FLOOR>_<SEQ> | MALL_/COMMON_/SITE_* structure",
    objectCount: result.shops.length + result.floors.length + 2,
    exportedAt: new Date().toISOString(),
    toolchain: {
      blenderVersion: "5.2.1",
      scriptVersion: "1.0.0",
    },
  };
  await fs.writeFile(
    path.join(outputDir, "model.json"),
    JSON.stringify(manifest, null, 2)
  );

  // Write Blender script
  await fs.writeFile(
    path.join(outputDir, "build_authoritative_mall.py"),
    result.blenderScript
  );

  console.log(`[ingestion] Output written to ${outputDir}/`);
  console.log(`  - ${result.shops.length} shops`);
  console.log(`  - ${result.floors.length} floors`);
  console.log(`  - Blender script: build_authoritative_mall.py`);
}

main().catch((err) => {
  console.error("[ingestion] Fatal error:", err);
  process.exit(1);
});