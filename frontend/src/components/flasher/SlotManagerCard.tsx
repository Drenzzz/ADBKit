import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RefreshCw, ArrowRightLeft } from "lucide-react";

interface SlotManagerCardProps {
  currentSlot: string | null;
  onRefreshSlot: () => void;
  onSetSlot: (slot: string) => void;
  isChangingSlot: boolean;
  canManage: boolean;
}

export function SlotManagerCard({
  currentSlot,
  onRefreshSlot,
  onSetSlot,
  isChangingSlot,
  canManage
}: SlotManagerCardProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>("a");

  // Sync selected slot with current slot if we fetch it
  React.useEffect(() => {
    if (currentSlot) {
      setSelectedSlot(currentSlot);
    }
  }, [currentSlot]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-md font-medium">A/B Slot Manager</CardTitle>
          <CardDescription>Manage active partition slot for seamless updates.</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onRefreshSlot} disabled={!canManage || isChangingSlot} title="Refresh Current Slot">
          <RefreshCw className={`h-4 w-4 ${isChangingSlot ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {currentSlot === null && canManage ? (
          <div className="text-sm text-muted-foreground flex items-center justify-between">
            <span>Click refresh to detect active slot</span>
            <Button variant="outline" size="sm" onClick={onRefreshSlot}>Detect</Button>
          </div>
        ) : !canManage ? (
          <div className="text-sm text-muted-foreground">Waiting for fastboot device...</div>
        ) : (
          <div className="flex items-end justify-between gap-4">
            <RadioGroup 
              value={selectedSlot} 
              onValueChange={setSelectedSlot} 
              className="flex gap-4"
              disabled={isChangingSlot}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a" id="slot-a" />
                <Label htmlFor="slot-a" className={`font-mono ${currentSlot === 'a' ? 'text-green-500 font-bold' : ''}`}>
                  Slot A {currentSlot === 'a' && "(Active)"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b" id="slot-b" />
                <Label htmlFor="slot-b" className={`font-mono ${currentSlot === 'b' ? 'text-green-500 font-bold' : ''}`}>
                  Slot B {currentSlot === 'b' && "(Active)"}
                </Label>
              </div>
            </RadioGroup>
            
            <Button 
              size="sm" 
              variant="secondary"
              disabled={isChangingSlot || selectedSlot === currentSlot}
              onClick={() => onSetSlot(selectedSlot)}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Set Active
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
