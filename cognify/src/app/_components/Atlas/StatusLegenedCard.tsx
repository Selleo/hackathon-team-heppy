import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

export function StatusLegenedCard() {
  return (
    <Card className="mt-4">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium">
        Status Legend
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">🟢</span>
        <span className="font-medium">Mastered</span>
        <span className="text-muted-foreground">- You know this well</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">🟡</span>
        <span className="font-medium">Learning</span>
        <span className="text-muted-foreground">- Currently studying</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">🔴</span>
        <span className="font-medium">Gap</span>
        <span className="text-muted-foreground">- Need to learn</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">⚪</span>
        <span className="font-medium">Latent</span>
        <span className="text-muted-foreground">- Basic awareness</span>
      </div>
    </CardContent>
  </Card>
  )
}