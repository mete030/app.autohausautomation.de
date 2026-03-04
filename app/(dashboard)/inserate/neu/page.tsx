'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { priceCategoryConfig } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Sparkles, RefreshCw, Check, Star, Upload, TrendingDown, TrendingUp, Minus, ImagePlus } from 'lucide-react'

export default function NeuesInseratPage() {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    fuelType: '',
    power: '',
    color: '',
    price: '',
    extras: '',
  })

  const mockAiResult = {
    title: 'BMW 320d Touring M Sport - LED, Navi Prof., Panorama, HUD',
    description: 'Sportlicher BMW 320d Touring in der begehrten M Sport-Ausführung. Umfangreiche Ausstattung mit Navigationssystem Professional, LED-Scheinwerfer, Panorama-Glasdach und Head-Up Display. Der kraftvolle 190 PS Dieselmotor bietet souveräne Fahrleistungen bei moderatem Verbrauch. Scheckheftgepflegt beim BMW Partner.\n\n✓ M Sportpaket\n✓ Navigation Professional\n✓ LED-Scheinwerfer\n✓ Panorama-Glasdach\n✓ Head-Up Display\n✓ Sitzheizung vorne\n✓ Park Distance Control',
    confidence: 89,
    priceAnalysis: {
      marketPrice: 36200,
      suggestion: 34900 as number,
      category: 'gut' as const,
      thresholds: [
        { label: 'Sehr gut', max: 32500 },
        { label: 'Gut', max: 35000 },
        { label: 'Zufriedenstellend', max: 37000 },
        { label: 'Erhöht', max: 39000 },
      ],
    },
  }

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inserate">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Neues Inserat</h1>
          <p className="text-muted-foreground">KI-unterstützte Inserat-Erstellung</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fahrzeugdaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marke</Label>
                  <Input
                    placeholder="z.B. BMW"
                    value={formData.make}
                    onChange={e => setFormData(prev => ({ ...prev, make: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modell</Label>
                  <Input
                    placeholder="z.B. 320d Touring"
                    value={formData.model}
                    onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Baujahr</Label>
                  <Input
                    placeholder="2022"
                    value={formData.year}
                    onChange={e => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kilometerstand</Label>
                  <Input
                    placeholder="45.200"
                    value={formData.mileage}
                    onChange={e => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Leistung (PS)</Label>
                  <Input
                    placeholder="190"
                    value={formData.power}
                    onChange={e => setFormData(prev => ({ ...prev, power: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kraftstoff</Label>
                  <Select value={formData.fuelType} onValueChange={v => setFormData(prev => ({ ...prev, fuelType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="benzin">Benzin</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="elektro">Elektro</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Farbe</Label>
                  <Input
                    placeholder="Mineralweiß"
                    value={formData.color}
                    onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preis (€)</Label>
                <Input
                  placeholder="34.900"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ausstattung / Extras</Label>
                <Textarea
                  placeholder="M Sport, Navi, LED, Panorama, HUD, Sitzheizung..."
                  value={formData.extras}
                  onChange={e => setFormData(prev => ({ ...prev, extras: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Bilder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-xl p-8 text-center">
                <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Bilder hierher ziehen oder klicken zum Hochladen</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG bis 10MB, max. 20 Bilder</p>
                <Button variant="outline" size="sm" className="mt-4">
                  <Upload className="h-4 w-4 mr-2" />
                  Bilder auswählen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Copilot */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                KI-Assistent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    KI-Beschreibung generieren
                  </>
                )}
              </Button>

              {generated && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  {/* Confidence */}
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i <= Math.round(mockAiResult.confidence / 20) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Konfidenz {mockAiResult.confidence}%
                    </span>
                  </div>

                  {/* Generated Title */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Generierter Titel</Label>
                    <div className="p-3 bg-card rounded-lg border text-sm font-medium">
                      {mockAiResult.title}
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      <Check className="h-3 w-3 mr-1" />
                      Titel übernehmen
                    </Button>
                  </div>

                  <Separator />

                  {/* Generated Description */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Generierte Beschreibung</Label>
                    <div className="p-3 bg-card rounded-lg border text-sm whitespace-pre-line max-h-48 overflow-y-auto">
                      {mockAiResult.description}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Check className="h-3 w-3 mr-1" />
                        Übernehmen
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1" onClick={handleGenerate}>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Neu generieren
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Price Analysis */}
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">Preisanalyse (mobile.de)</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Ihr Preis</span>
                        <span className="font-bold">{formatCurrency(mockAiResult.priceAnalysis.suggestion)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Marktpreis</span>
                        <span>{formatCurrency(mockAiResult.priceAnalysis.marketPrice)}</span>
                      </div>
                      <Badge
                        className={`${priceCategoryConfig[mockAiResult.priceAnalysis.category].bg} ${priceCategoryConfig[mockAiResult.priceAnalysis.category].color} border-0`}
                        variant="outline"
                      >
                        {priceCategoryConfig[mockAiResult.priceAnalysis.category].label}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {mockAiResult.priceAnalysis.thresholds.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t.label}</span>
                          <span>bis {formatCurrency(t.max)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <Button className="w-full">
                    Inserat erstellen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
