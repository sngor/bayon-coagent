'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TypographyDemoPage() {
    return (
        <StandardPageLayout
            title="Typography Demo"
            description="Typography system and text styles"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Headings</CardTitle>
                        <CardDescription>Heading hierarchy from H1 to H6</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h1 className="text-4xl font-bold font-headline">Heading 1</h1>
                            <p className="text-sm text-muted-foreground">text-4xl font-bold font-headline</p>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold font-headline">Heading 2</h2>
                            <p className="text-sm text-muted-foreground">text-3xl font-bold font-headline</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold font-headline">Heading 3</h3>
                            <p className="text-sm text-muted-foreground">text-2xl font-semibold font-headline</p>
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold">Heading 4</h4>
                            <p className="text-sm text-muted-foreground">text-xl font-semibold</p>
                        </div>
                        <div>
                            <h5 className="text-lg font-semibold">Heading 5</h5>
                            <p className="text-sm text-muted-foreground">text-lg font-semibold</p>
                        </div>
                        <div>
                            <h6 className="text-base font-semibold">Heading 6</h6>
                            <p className="text-sm text-muted-foreground">text-base font-semibold</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Body Text</CardTitle>
                        <CardDescription>Different text sizes and weights</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-lg">Large body text - text-lg</p>
                            <p className="text-sm text-muted-foreground">Used for emphasis or lead paragraphs</p>
                        </div>
                        <div>
                            <p className="text-base">Base body text - text-base</p>
                            <p className="text-sm text-muted-foreground">Default paragraph text</p>
                        </div>
                        <div>
                            <p className="text-sm">Small body text - text-sm</p>
                            <p className="text-sm text-muted-foreground">Used for secondary information</p>
                        </div>
                        <div>
                            <p className="text-xs">Extra small text - text-xs</p>
                            <p className="text-sm text-muted-foreground">Used for captions and labels</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Font Weights</CardTitle>
                        <CardDescription>Available font weight variations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="font-light">Light - font-light</p>
                        <p className="font-normal">Normal - font-normal</p>
                        <p className="font-medium">Medium - font-medium</p>
                        <p className="font-semibold">Semibold - font-semibold</p>
                        <p className="font-bold">Bold - font-bold</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Text Colors</CardTitle>
                        <CardDescription>Semantic color classes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-foreground">Foreground - text-foreground</p>
                        <p className="text-muted-foreground">Muted - text-muted-foreground</p>
                        <p className="text-primary">Primary - text-primary</p>
                        <p className="text-destructive">Destructive - text-destructive</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Text Styles</CardTitle>
                        <CardDescription>Common text formatting</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="italic">Italic text</p>
                        <p className="underline">Underlined text</p>
                        <p className="line-through">Strikethrough text</p>
                        <p className="uppercase">Uppercase text</p>
                        <p className="lowercase">LOWERCASE TEXT</p>
                        <p className="capitalize">capitalized text</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Lists</CardTitle>
                        <CardDescription>Ordered and unordered lists</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Unordered List</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>First item</li>
                                <li>Second item</li>
                                <li>Third item</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Ordered List</h4>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>First step</li>
                                <li>Second step</li>
                                <li>Third step</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Paragraphs</CardTitle>
                        <CardDescription>Example paragraph formatting</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-base leading-relaxed">
                            This is a standard paragraph with relaxed line height. Lorem ipsum dolor sit amet,
                            consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
                            magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            This is a muted paragraph with smaller text. It's often used for secondary information
                            or descriptions that support the main content without competing for attention.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Code & Monospace</CardTitle>
                        <CardDescription>Code formatting styles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm mb-2">Inline code:</p>
                            <p>Use <code className="bg-muted px-2 py-1 rounded text-sm">const value = 123</code> for variables</p>
                        </div>
                        <div>
                            <p className="text-sm mb-2">Code block:</p>
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{`function example() {
  return "Hello World";
}`}</code>
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Guidelines</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ Use font-headline for headings and titles</li>
                            <li>✓ Maintain consistent hierarchy (H1 → H2 → H3)</li>
                            <li>✓ Use text-muted-foreground for secondary text</li>
                            <li>✓ Keep line-height relaxed for readability</li>
                            <li>✓ Limit line length to 60-80 characters</li>
                            <li>✓ Use semantic color classes</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
