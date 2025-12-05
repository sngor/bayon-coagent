'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Mail,
    Download,
    UserCog,
    AlertCircle,
    CheckCircle,
    XCircle,
    Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    sendBulkEmail,
    exportBulkUserData,
    bulkRoleChange,
} from '@/features/admin/actions/admin-actions';

interface BulkOperationsPanelProps {
    selectedUserIds: string[];
    users: any[];
    onComplete: () => void;
}

export function BulkOperationsPanel({ selectedUserIds, users, onComplete }: BulkOperationsPanelProps) {
    const [operation, setOperation] = useState<'email' | 'export' | 'role' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { toast } = useToast();

    // Email state
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [emailTemplate, setEmailTemplate] = useState<string>('plain');

    // Export state
    const [exportFields, setExportFields] = useState<string[]>([
        'id',
        'email',
        'name',
        'role',
        'teamName',
        'status',
        'createdAt',
    ]);

    // Role change state
    const [newRole, setNewRole] = useState<'agent' | 'admin' | 'super_admin'>('agent');

    const availableFields = [
        { value: 'id', label: 'User ID' },
        { value: 'email', label: 'Email' },
        { value: 'name', label: 'Name' },
        { value: 'role', label: 'Role' },
        { value: 'teamId', label: 'Team ID' },
        { value: 'teamName', label: 'Team Name' },
        { value: 'status', label: 'Status' },
        { value: 'enabled', label: 'Enabled' },
        { value: 'createdAt', label: 'Created At' },
        { value: 'updatedAt', label: 'Updated At' },
    ];

    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));

    const handleOpenOperation = (op: 'email' | 'export' | 'role') => {
        setOperation(op);
        setResult(null);
    };

    const handleCloseOperation = () => {
        setOperation(null);
        setShowConfirmation(false);
        setResult(null);
        setEmailSubject('');
        setEmailBody('');
        setEmailTemplate('plain');
    };

    const handleConfirmOperation = () => {
        setShowConfirmation(true);
    };

    const handleExecuteOperation = async () => {
        setIsProcessing(true);
        setShowConfirmation(false);

        try {
            if (operation === 'email') {
                const response = await sendBulkEmail(
                    selectedUserIds,
                    emailSubject,
                    emailBody,
                    emailTemplate
                );

                if (response.success && response.data) {
                    setResult({
                        success: true,
                        message: `Email sent to ${response.data.sent} users`,
                        details: `${response.data.sent} succeeded, ${response.data.failed} failed`,
                    });
                    toast({
                        title: 'Success',
                        description: `Email sent to ${response.data.sent} users`,
                    });
                } else {
                    throw new Error(response.error || 'Failed to send emails');
                }
            } else if (operation === 'export') {
                const response = await exportBulkUserData(selectedUserIds, exportFields);

                if (response.success && response.data) {
                    // Create download
                    const blob = new Blob([response.data], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);

                    setResult({
                        success: true,
                        message: `Exported ${selectedUserIds.length} users`,
                        details: `CSV file downloaded successfully`,
                    });
                    toast({
                        title: 'Success',
                        description: `Exported ${selectedUserIds.length} users`,
                    });
                } else {
                    throw new Error(response.error || 'Failed to export data');
                }
            } else if (operation === 'role') {
                const response = await bulkRoleChange(selectedUserIds, newRole);

                if (response.success && response.data) {
                    setResult({
                        success: true,
                        message: `Updated ${response.data.updated} users`,
                        details: `${response.data.updated} succeeded, ${response.data.failed} failed`,
                    });
                    toast({
                        title: 'Success',
                        description: `Updated ${response.data.updated} users to ${newRole}`,
                    });
                    onComplete(); // Refresh user list
                } else {
                    throw new Error(response.error || 'Failed to change roles');
                }
            }
        } catch (error: any) {
            console.error('Bulk operation failed:', error);
            setResult({
                success: false,
                message: 'Operation failed',
                details: error.message || 'An error occurred',
            });
            toast({
                title: 'Error',
                description: error.message || 'Operation failed',
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleField = (field: string) => {
        setExportFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    if (selectedUserIds.length === 0) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Select users to perform bulk operations
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
                {selectedUserIds.length} selected
            </Badge>

            <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenOperation('email')}
            >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenOperation('export')}
            >
                <Download className="h-4 w-4 mr-2" />
                Export
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenOperation('role')}
            >
                <UserCog className="h-4 w-4 mr-2" />
                Change Role
            </Button>

            {/* Email Dialog */}
            <Dialog open={operation === 'email'} onOpenChange={(open) => !open && handleCloseOperation()}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Send Bulk Email</DialogTitle>
                        <DialogDescription>
                            Send an email to {selectedUserIds.length} selected users
                        </DialogDescription>
                    </DialogHeader>

                    {!result ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Template</Label>
                                <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="plain">Plain</SelectItem>
                                        <SelectItem value="welcome">Welcome</SelectItem>
                                        <SelectItem value="announcement">Announcement</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Email subject"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="body">Message</Label>
                                <Textarea
                                    id="body"
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    placeholder="Email body (supports {{name}} and {{email}} variables)"
                                    rows={8}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use {'{{name}}'} and {'{{email}}'} to personalize the message
                                </p>
                            </div>

                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm font-medium mb-2">Recipients:</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedUsers.slice(0, 5).map(user => (
                                        <Badge key={user.id} variant="secondary">
                                            {user.email}
                                        </Badge>
                                    ))}
                                    {selectedUsers.length > 5 && (
                                        <Badge variant="secondary">
                                            +{selectedUsers.length - 5} more
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center">
                            {result.success ? (
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            ) : (
                                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            )}
                            <h3 className="text-lg font-semibold mb-2">{result.message}</h3>
                            <p className="text-sm text-muted-foreground">{result.details}</p>
                        </div>
                    )}

                    <DialogFooter>
                        {!result ? (
                            <>
                                <Button variant="outline" onClick={handleCloseOperation}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmOperation}
                                    disabled={!emailSubject || !emailBody || isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Email'
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleCloseOperation}>Close</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Dialog */}
            <Dialog open={operation === 'export'} onOpenChange={(open) => !open && handleCloseOperation()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export User Data</DialogTitle>
                        <DialogDescription>
                            Export data for {selectedUserIds.length} selected users
                        </DialogDescription>
                    </DialogHeader>

                    {!result ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Fields to Export</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableFields.map(field => (
                                        <div key={field.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={field.value}
                                                checked={exportFields.includes(field.value)}
                                                onCheckedChange={() => toggleField(field.value)}
                                            />
                                            <label
                                                htmlFor={field.value}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {field.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm">
                                    <strong>{selectedUserIds.length}</strong> users will be exported with{' '}
                                    <strong>{exportFields.length}</strong> fields
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center">
                            {result.success ? (
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            ) : (
                                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            )}
                            <h3 className="text-lg font-semibold mb-2">{result.message}</h3>
                            <p className="text-sm text-muted-foreground">{result.details}</p>
                        </div>
                    )}

                    <DialogFooter>
                        {!result ? (
                            <>
                                <Button variant="outline" onClick={handleCloseOperation}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleExecuteOperation}
                                    disabled={exportFields.length === 0 || isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Exporting...
                                        </>
                                    ) : (
                                        'Export CSV'
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleCloseOperation}>Close</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Role Change Dialog */}
            <Dialog open={operation === 'role'} onOpenChange={(open) => !open && handleCloseOperation()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Roles</DialogTitle>
                        <DialogDescription>
                            Change role for {selectedUserIds.length} selected users
                        </DialogDescription>
                    </DialogHeader>

                    {!result ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>New Role</Label>
                                <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="agent">Agent</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                                <div className="flex gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-medium text-yellow-500 mb-1">Warning</p>
                                        <p className="text-muted-foreground">
                                            This will change the role for all selected users. This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted p-3 rounded-lg">
                                <p className="text-sm font-medium mb-2">Affected Users:</p>
                                <div className="space-y-1">
                                    {selectedUsers.slice(0, 5).map(user => (
                                        <div key={user.id} className="text-sm flex justify-between">
                                            <span>{user.email}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {user.role} → {newRole}
                                            </Badge>
                                        </div>
                                    ))}
                                    {selectedUsers.length > 5 && (
                                        <p className="text-xs text-muted-foreground">
                                            +{selectedUsers.length - 5} more users
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center">
                            {result.success ? (
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            ) : (
                                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            )}
                            <h3 className="text-lg font-semibold mb-2">{result.message}</h3>
                            <p className="text-sm text-muted-foreground">{result.details}</p>
                        </div>
                    )}

                    <DialogFooter>
                        {!result ? (
                            <>
                                <Button variant="outline" onClick={handleCloseOperation}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleExecuteOperation}
                                    disabled={isProcessing}
                                    variant="destructive"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Confirm Role Change'
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleCloseOperation}>Close</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Operation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to proceed with this bulk operation?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-sm">
                            This will affect <strong>{selectedUserIds.length}</strong> users.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExecuteOperation}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
