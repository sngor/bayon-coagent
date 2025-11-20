'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function ResponsiveTableDemoPage() {
    const data = [
        { id: '1', name: 'Luxury Condo Listing', type: 'Blog Post', status: 'Published', date: '2024-11-15' },
        { id: '2', name: 'Market Update Q4', type: 'Social Media', status: 'Draft', date: '2024-11-18' },
        { id: '3', name: 'Neighborhood Guide', type: 'Article', status: 'Published', date: '2024-11-10' },
        { id: '4', name: 'Open House Announcement', type: 'Email', status: 'Scheduled', date: '2024-11-20' },
    ];

    return (
        <StandardPageLayout
            title="Responsive Tables Demo"
            description="Tables that adapt to mobile and desktop views"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Scrollable Table (Default)</CardTitle>
                        <CardDescription>
                            Horizontal scrolling on mobile, full table on desktop
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveTable>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.type}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'Published' ? 'default' : 'secondary'}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{item.date}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ResponsiveTable>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ <strong>Desktop:</strong> Traditional table with all columns visible</li>
                            <li>✓ <strong>Mobile:</strong> Horizontal scroll with scroll indicator</li>
                            <li>✓ <strong>Tablet:</strong> Optimized middle-ground layout</li>
                            <li>✓ Sortable columns</li>
                            <li>✓ Custom cell rendering</li>
                            <li>✓ Loading states</li>
                            <li>✓ Empty states</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<ResponsiveTable>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell>{item.status}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</ResponsiveTable>`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
