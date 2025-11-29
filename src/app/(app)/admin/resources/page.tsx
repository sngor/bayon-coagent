'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Trash2, Search, Download, Loader2, Database, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTeamsAction } from '@/features/admin/actions/admin-actions';
import {
    getDocumentsAction,
    uploadDocumentAction,
    addLinkResourceAction,
    deleteDocumentAction,
    getDownloadUrlAction,
    type Document
} from '@/features/intelligence/actions/knowledge-actions';
import { useUser } from '@/aws/auth';

export default function ResourcesPage() {
    const { user } = useUser();
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');

    useEffect(() => {
        loadTeams();
    }, []);

    useEffect(() => {
        if (selectedTeamId && user) {
            loadDocuments(selectedTeamId);
        }
    }, [selectedTeamId, user]);

    async function loadTeams() {
        try {
            const sessionStr = localStorage.getItem('cognito_session');
            let accessToken: string | undefined;
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                accessToken = session.accessToken;
            }

            const result = await getTeamsAction(accessToken);
            if (result.message === 'success' && result.data.length > 0) {
                setTeams(result.data);
                setSelectedTeamId(result.data[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to load teams:', error);
            setLoading(false);
        }
    }

    async function loadDocuments(teamId: string) {
        if (!user) return;
        setLoading(true);
        try {
            const result = await getDocumentsAction(user.id, {
                scope: 'team',
                teamId: teamId
            });

            if (result.documents) {
                setDocuments(result.documents);
            } else if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
            toast({
                title: "Error",
                description: "Failed to load documents",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleAddLink(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !selectedTeamId || !linkUrl || !linkTitle) return;

        setUploading(true);
        try {
            const result = await addLinkResourceAction(user.id, linkUrl, linkTitle, {
                scope: 'team',
                teamId: selectedTeamId
            });

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Link added successfully",
                });
                setIsUploadDialogOpen(false);
                setLinkUrl('');
                setLinkTitle('');
                loadDocuments(selectedTeamId);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to add link",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Add link failed:', error);
            toast({
                title: "Error",
                description: "Failed to add link",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    }

    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!user || !selectedTeamId || !fileInputRef.current?.files?.length) return;

        const file = fileInputRef.current.files[0];
        setUploading(true);

        try {
            const result = await uploadDocumentAction(user.id, file, {
                scope: 'team',
                teamId: selectedTeamId
            });

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Document uploaded successfully",
                });
                setIsUploadDialogOpen(false);
                loadDocuments(selectedTeamId);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to upload document",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast({
                title: "Error",
                description: "Failed to upload document",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(documentId: string) {
        if (!user || !selectedTeamId || !confirm('Are you sure you want to delete this document?')) return;

        try {
            const result = await deleteDocumentAction(user.id, documentId, {
                scope: 'team',
                teamId: selectedTeamId
            });

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Document deleted successfully",
                });
                // Optimistic update
                setDocuments(docs => docs.filter(d => d.documentId !== documentId));
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete document",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Delete failed:', error);
            toast({
                title: "Error",
                description: "Failed to delete document",
                variant: "destructive"
            });
        }
    }

    async function handleDownload(documentId: string) {
        if (!user || !selectedTeamId) return;

        try {
            // Construct partition key manually for now as per my knowledge-actions change
            const partitionKey = `TEAM#${selectedTeamId}`;

            const result = await getDownloadUrlAction(partitionKey, documentId);

            if (result.url) {
                window.open(result.url, '_blank');
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to get download URL",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Download failed:', error);
        }
    }

    const filteredDocuments = documents.filter(doc =>
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* ... (existing header) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Resources</h2>
                    <p className="text-muted-foreground">
                        Manage documents and knowledge resources available to your team's AI agents.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {teams.length > 1 && (
                        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select Team" />
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map(team => (
                                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Upload className="mr-2 h-4 w-4" />
                                <span>Add Resource</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Resource</DialogTitle>
                                <DialogDescription>
                                    Upload a document or add a link to be indexed for your team's AI.
                                </DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue="file" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="file">Upload File</TabsTrigger>
                                    <TabsTrigger value="link">Add Link</TabsTrigger>
                                </TabsList>
                                <TabsContent value="file">
                                    <form onSubmit={handleUpload} className="space-y-4 mt-4">
                                        <div className="grid w-full max-w-sm items-center gap-1.5">
                                            <Label htmlFor="document">Document</Label>
                                            <Input
                                                ref={fileInputRef}
                                                id="document"
                                                type="file"
                                                accept=".pdf,.docx,.txt,.md"
                                                required
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={uploading}>
                                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Upload
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </TabsContent>
                                <TabsContent value="link">
                                    <form onSubmit={handleAddLink} className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="url">URL</Label>
                                            <Input
                                                id="url"
                                                type="url"
                                                placeholder="https://youtube.com/..."
                                                value={linkUrl}
                                                onChange={(e) => setLinkUrl(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Title</Label>
                                            <Input
                                                id="title"
                                                type="text"
                                                placeholder="Resource Title"
                                                value={linkTitle}
                                                onChange={(e) => setLinkTitle(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={uploading}>
                                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Add Link
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium">Documents</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search resources..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg bg-background/50">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                                    <Database className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No resources found</h3>
                                <p className="text-muted-foreground mb-4">
                                    Upload documents or add links to share knowledge with your team's AI.
                                </p>
                                <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Add First Resource
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Added</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocuments.map((doc) => (
                                        <TableRow key={doc.documentId}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {doc.fileType === 'link' ? (
                                                        <LinkIcon className="h-4 w-4 text-blue-500" />
                                                    ) : (
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    {doc.fileType === 'link' ? (
                                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                            {doc.fileName}
                                                        </a>
                                                    ) : (
                                                        doc.fileName
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="uppercase text-xs">{doc.fileType}</TableCell>
                                            <TableCell className="text-xs">
                                                {doc.fileType === 'link' ? '-' : `${(doc.fileSize / 1024).toFixed(1)} KB`}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(doc.uploadDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${doc.status === 'indexed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    doc.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        doc.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {doc.fileType !== 'link' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDownload(doc.documentId)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {doc.fileType === 'link' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                        >
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                                <LinkIcon className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(doc.documentId)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </CardGradientMesh>
            </Card>
        </div>
    );
}
