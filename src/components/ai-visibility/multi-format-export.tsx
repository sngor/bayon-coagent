/**
 * Multi-Format Export Component
 * 
 * React component for AI visibility schema export functionality
 * Requirements: 8.1, 8.2, 8.4, 8.5
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  Code, 
  Globe, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  exportSchemaData, 
  exportForPlatform, 
  generateExportSummary,
  validateExportConfiguration,
  downloadExportFile,
} from '@/app/actions/ai-visibility-export';
import type { ExportFormat } from '@/lib/ai-visibility';

/**
 * Export format options with descriptions
 */
const EXPORT_FORMATS = [
  {
    value: 'json-ld' as ExportFormat,
    label: 'JSON-LD',
    description: 'Recommended by Google, easy to implement',
    icon: <Code className="h-4 w-4" />,
    recommended: true,
  },
  {
    value: 'rdf-xml' as ExportFormat,
    label: 'RDF/XML',
    description: 'Semantic web standard with namespaces',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    value: 'turtle' as ExportFormat,
    label: 'Turtle',
    description: 'Human-readable RDF format',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    value: 'microdata' as ExportFormat,
    label: 'Microdata',
    description: 'Embedded HTML attributes',
    icon: <Globe className="h-4 w-4" />,
  },
];

/**
 * Platform options for quick export
 */
const PLATFORMS = [
  { value: 'wordpress', label: 'WordPress', description: 'Most popular CMS' },
  { value: 'squarespace', label: 'Squarespace', description: 'Website builder' },
  { value: 'shopify', label: 'Shopify', description: 'E-commerce platform' },
  { value: 'wix', label: 'Wix', description: 'Website builder' },
  { value: 'webflow', label: 'Webflow', description: 'Design-focused CMS' },
  { value: 'html', label: 'Static HTML', description: 'Custom websites' },
];

/**
 * Export configuration interface
 */
interface ExportConfiguration {
  formats: ExportFormat[];
  includeInstructions: boolean;
  includePlatformGuides: boolean;
  validateRDF: boolean;
  includeMetadata: boolean;
  compressOutput: boolean;
  customNamespaces?: Record<string, string>;
}

/**
 * Multi-Format Export Component
 */
export function MultiFormatExport() {
  const { toast } = useToast();
  
  // State
  const [configuration, setConfiguration] = useState<ExportConfiguration>({
    formats: ['json-ld'],
    includeInstructions: true,
    includePlatformGuides: true,
    validateRDF: true,
    includeMetadata: true,
    compressOutput: false,
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [customNamespaces, setCustomNamespaces] = useState<string>('');
  const [activeTab, setActiveTab] = useState('configure');

  /**
   * Handles format selection change
   */
  const handleFormatChange = useCallback((format: ExportFormat, checked: boolean) => {
    setConfiguration(prev => ({
      ...prev,
      formats: checked 
        ? [...prev.formats, format]
        : prev.formats.filter(f => f !== format),
    }));
  }, []);

  /**
   * Handles configuration option change
   */
  const handleConfigChange = useCallback((key: keyof ExportConfiguration, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Validates export configuration
   */
  const validateConfiguration = useCallback(async () => {
    try {
      // Parse custom namespaces if provided
      let parsedNamespaces: Record<string, string> | undefined;
      if (customNamespaces.trim()) {
        try {
          parsedNamespaces = JSON.parse(customNamespaces);
        } catch (error) {
          toast({
            title: 'Invalid Custom Namespaces',
            description: 'Please provide valid JSON for custom namespaces',
            variant: 'destructive',
          });
          return;
        }
      }

      const configToValidate = {
        ...configuration,
        customNamespaces: parsedNamespaces,
      };

      const result = await validateExportConfiguration(configToValidate);
      
      if (result.success) {
        setValidationResult(result.data);
        toast({
          title: 'Configuration Valid',
          description: 'Your export configuration is ready to use',
        });
      } else {
        toast({
          title: 'Validation Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Validation Error',
        description: 'Failed to validate configuration',
        variant: 'destructive',
      });
    }
  }, [configuration, customNamespaces, toast]);

  /**
   * Handles comprehensive export
   */
  const handleExport = useCallback(async () => {
    if (configuration.formats.length === 0) {
      toast({
        title: 'No Formats Selected',
        description: 'Please select at least one export format',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Parse custom namespaces if provided
      let parsedNamespaces: Record<string, string> | undefined;
      if (customNamespaces.trim()) {
        try {
          parsedNamespaces = JSON.parse(customNamespaces);
        } catch (error) {
          toast({
            title: 'Invalid Custom Namespaces',
            description: 'Please provide valid JSON for custom namespaces',
            variant: 'destructive',
          });
          return;
        }
      }

      const result = await exportSchemaData({
        ...configuration,
        customNamespaces: parsedNamespaces,
      });

      if (result.success) {
        setExportResult(result.data);
        setActiveTab('results');
        toast({
          title: 'Export Successful',
          description: result.message,
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Export Error',
        description: 'An unexpected error occurred during export',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [configuration, customNamespaces, toast]);

  /**
   * Handles platform-specific export
   */
  const handlePlatformExport = useCallback(async () => {
    if (!selectedPlatform) {
      toast({
        title: 'No Platform Selected',
        description: 'Please select a platform for export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const result = await exportForPlatform({
        platform: selectedPlatform as any,
      });

      if (result.success) {
        setExportResult({
          package: result.data?.exportPackage,
          validation: result.data?.validation,
          metadata: {
            exportedAt: new Date(),
            formats: ['json-ld'], // Platform exports typically use JSON-LD
            platform: selectedPlatform,
          },
          integration: result.data?.integration,
        });
        setActiveTab('results');
        toast({
          title: 'Platform Export Successful',
          description: result.message,
        });
      } else {
        toast({
          title: 'Platform Export Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Platform Export Error',
        description: 'An unexpected error occurred during platform export',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [selectedPlatform, toast]);

  /**
   * Handles file download
   */
  const handleDownload = useCallback(async (format: ExportFormat) => {
    if (!exportResult?.metadata?.exportId) {
      toast({
        title: 'No Export Available',
        description: 'Please export schema data first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await downloadExportFile(exportResult.metadata.exportId, format);
      
      if (result.success && result.data) {
        // Create and trigger download
        const blob = new Blob([result.data.content], { type: result.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: 'Download Started',
          description: `Downloading ${result.data.filename}`,
        });
      } else {
        toast({
          title: 'Download Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Download Error',
        description: 'Failed to prepare file for download',
        variant: 'destructive',
      });
    }
  }, [exportResult, toast]);

  /**
   * Copies content to clipboard
   */
  const copyToClipboard = useCallback(async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Copied to Clipboard',
        description: `${label} copied successfully`,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Multi-Format Schema Export</h2>
          <p className="text-muted-foreground">
            Export your AI visibility schema markup in multiple formats with platform-specific guides
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">Configure Export</TabsTrigger>
          <TabsTrigger value="platform">Platform Export</TabsTrigger>
          <TabsTrigger value="results" disabled={!exportResult}>
            Results
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Formats</CardTitle>
              <CardDescription>
                Select the formats you want to include in your export package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPORT_FORMATS.map((format) => (
                  <div
                    key={format.value}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={format.value}
                      checked={configuration.formats.includes(format.value)}
                      onCheckedChange={(checked) => 
                        handleFormatChange(format.value, checked as boolean)
                      }
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        {format.icon}
                        <Label htmlFor={format.value} className="font-medium">
                          {format.label}
                        </Label>
                        {format.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Configure additional options for your export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeInstructions"
                    checked={configuration.includeInstructions}
                    onCheckedChange={(checked) => 
                      handleConfigChange('includeInstructions', checked)
                    }
                  />
                  <Label htmlFor="includeInstructions">
                    Include implementation instructions
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePlatformGuides"
                    checked={configuration.includePlatformGuides}
                    onCheckedChange={(checked) => 
                      handleConfigChange('includePlatformGuides', checked)
                    }
                  />
                  <Label htmlFor="includePlatformGuides">
                    Include platform-specific guides
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="validateRDF"
                    checked={configuration.validateRDF}
                    onCheckedChange={(checked) => 
                      handleConfigChange('validateRDF', checked)
                    }
                  />
                  <Label htmlFor="validateRDF">
                    Validate RDF output
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMetadata"
                    checked={configuration.includeMetadata}
                    onCheckedChange={(checked) => 
                      handleConfigChange('includeMetadata', checked)
                    }
                  />
                  <Label htmlFor="includeMetadata">
                    Include metadata and ontology references
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compressOutput"
                    checked={configuration.compressOutput}
                    onCheckedChange={(checked) => 
                      handleConfigChange('compressOutput', checked)
                    }
                  />
                  <Label htmlFor="compressOutput">
                    Compress output files
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customNamespaces">
                  Custom Namespaces (JSON format)
                </Label>
                <Textarea
                  id="customNamespaces"
                  placeholder='{"custom": "https://example.com/custom#", "local": "https://mysite.com/vocab#"}'
                  value={customNamespaces}
                  onChange={(e) => setCustomNamespaces(e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Add custom namespace prefixes for RDF formats
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Configuration Validation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validationResult.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warnings:</strong>
                      <ul className="mt-2 list-disc list-inside">
                        {validationResult.warnings.map((warning: string, index: number) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.suggestions.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Suggestions:</strong>
                      <ul className="mt-2 list-disc list-inside">
                        {validationResult.suggestions.map((suggestion: string, index: number) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex space-x-4">
            <Button onClick={validateConfiguration} variant="outline">
              Validate Configuration
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || configuration.formats.length === 0}
            >
              {isExporting ? 'Exporting...' : 'Export Schema Data'}
            </Button>
          </div>
        </TabsContent>

        {/* Platform Export Tab */}
        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform-Specific Export</CardTitle>
              <CardDescription>
                Get optimized schema markup and implementation guide for your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Select Platform</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your website platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div>
                          <div className="font-medium">{platform.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {platform.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handlePlatformExport} 
                disabled={isExporting || !selectedPlatform}
                className="w-full"
              >
                {isExporting ? 'Exporting...' : 'Export for Platform'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {exportResult && (
            <>
              {/* Export Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Export Complete</span>
                  </CardTitle>
                  <CardDescription>
                    Your schema markup has been successfully exported
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {exportResult.metadata?.schemaCount || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Schemas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {exportResult.metadata?.formats?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Formats</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {exportResult.metadata?.fileSize 
                          ? `${(exportResult.metadata.fileSize / 1024).toFixed(1)}KB`
                          : 'N/A'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {exportResult.validation?.isValid ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-muted-foreground">Valid</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Results */}
              {exportResult.validation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Validation Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {exportResult.validation.errors?.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Errors:</strong>
                          <ul className="mt-2 list-disc list-inside">
                            {exportResult.validation.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {exportResult.validation.warnings?.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Warnings:</strong>
                          <ul className="mt-2 list-disc list-inside">
                            {exportResult.validation.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {exportResult.validation.suggestions?.length > 0 && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Suggestions:</strong>
                          <ul className="mt-2 list-disc list-inside">
                            {exportResult.validation.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Export Formats */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Formats</CardTitle>
                  <CardDescription>
                    Download or copy your schema markup in different formats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exportResult.package && (
                    <div className="grid gap-4">
                      {exportResult.package.jsonLD && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Code className="h-5 w-5" />
                            <div>
                              <div className="font-medium">JSON-LD</div>
                              <div className="text-sm text-muted-foreground">
                                Recommended format for most platforms
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(exportResult.package.jsonLD, 'JSON-LD')}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload('json-ld')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}

                      {exportResult.package.rdfXML && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5" />
                            <div>
                              <div className="font-medium">RDF/XML</div>
                              <div className="text-sm text-muted-foreground">
                                Semantic web standard with namespaces
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(exportResult.package.rdfXML, 'RDF/XML')}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload('rdf-xml')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}

                      {exportResult.package.turtle && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5" />
                            <div>
                              <div className="font-medium">Turtle</div>
                              <div className="text-sm text-muted-foreground">
                                Human-readable RDF format
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(exportResult.package.turtle, 'Turtle')}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload('turtle')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}

                      {exportResult.package.microdata && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Globe className="h-5 w-5" />
                            <div>
                              <div className="font-medium">Microdata</div>
                              <div className="text-sm text-muted-foreground">
                                Embedded HTML attributes
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(exportResult.package.microdata, 'Microdata')}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload('microdata')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Implementation Instructions */}
              {exportResult.package?.instructions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Implementation Instructions</CardTitle>
                    <CardDescription>
                      Step-by-step guide for implementing your schema markup
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
                        {exportResult.package.instructions}
                      </pre>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(exportResult.package.instructions, 'Instructions')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Instructions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Platform Integration Guide */}
              {exportResult.integration && (
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Integration Guide</CardTitle>
                    <CardDescription>
                      {exportResult.integration.platform} specific implementation guide
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {exportResult.integration.difficulty}
                        </div>
                        <div className="text-sm text-muted-foreground">Difficulty</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {exportResult.integration.estimatedTime}
                        </div>
                        <div className="text-sm text-muted-foreground">Est. Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {exportResult.integration.requirements?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Requirements</div>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
                        {exportResult.integration.guide}
                      </pre>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(exportResult.integration.guide, 'Integration Guide')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Guide
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}