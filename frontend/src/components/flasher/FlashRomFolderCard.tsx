import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderOpen, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { backend } from "../../../wailsjs/go/models";

interface FlashRomFolderCardProps {
  folderPath: string;
  plan: backend.FlashPlan | null;
  onSelectFolder: (path?: string) => void;
  onScanFolder: () => void;
  onFlash: () => void;
  isScanning: boolean;
  isFlashing: boolean;
  canFlash: boolean;
}

export function FlashRomFolderCard({
  folderPath,
  plan,
  onSelectFolder,
  onScanFolder,
  onFlash,
  isScanning,
  isFlashing,
  canFlash
}: FlashRomFolderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Flasher (ROM Folder)</CardTitle>
        <CardDescription>Select a directory containing extracted firmware (.img) files to flash them in sequence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>ROM Folder Path</Label>
          <div className="flex gap-2">
            <Input 
              value={folderPath} 
              onChange={(e) => onSelectFolder(e.target.value)} 
              placeholder="E.g., C:\Downloads\Pixel_ROM" 
              disabled={isFlashing || isScanning}
            />
            <Button variant="secondary" onClick={onScanFolder} disabled={!folderPath || isScanning || isFlashing}>
              Scan
            </Button>
          </div>
        </div>

        {plan && plan.steps && plan.steps.length > 0 && (
          <div className="rounded-md border p-4 space-y-2">
            <h4 className="text-sm font-semibold mb-2">Flash Plan ({plan.steps.length} partitions)</h4>
            <div className="max-h-40 overflow-y-auto space-y-1 text-sm text-muted-foreground">
              {plan.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="font-mono text-xs">{step.partition}</span>
                  <span className="text-xs truncate opacity-50 ml-auto" title={step.imageFile}>
                    ...{step.imageFile.slice(-30)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {plan && (!plan.steps || plan.steps.length === 0) && (
          <div className="flex items-center gap-2 text-sm text-amber-500 mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>No valid images found in the selected folder.</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onFlash} 
          disabled={!canFlash || !plan || !plan.steps || plan.steps.length === 0 || isFlashing}
        >
          {isFlashing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Flashing ROM...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Batch Flash
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
